import DictUtils from '@asianpersonn/dict-utils';
import { pageRank, getInitialWeights, redistributeNodeWeight, inflateEdgeAttrs } from '@asianpersonn/pagerank';
import DynamicRealm, { SaveSchemaParams } from 'dynamic-realm';
import CatalystGraph, { CGNode, CGEdge, RatingMode, RateReturn, GraphEntity, genPropertiesObj, genCollectiveAverageName, genSingleAverageName } from 'catalyst-graph';

// My imports
import { DEFAULT_REALM_GRAPH_MANAGER_REALM_PATH, genDefaultGraphRealmPath } from './utils/constants';
import { genSchema } from './utils/genSchema';

// Types
import Realm from 'realm';
import { RankedNode, RGSetup } from './types/RealmGraph';
import { genNodeSchemaName, genEdgeSchemaName, genEdgeName, getBaseNameFromSchemaName } from './utils/naming';
import { Dict } from './types/global';
import Heap from '@asianpersonn/heap';
import { genInitError } from './errors/RealmGraphManager';
import { RGManagerCreate } from './types/realmGraphManager';

export default class RealmGraph {
    _isInitialized: boolean = false;

    graphName: string;

    _dynamicRealmPath: string | undefined;
    realm: Realm | undefined;
    realmPath: string;

    propertyNames: string[];

    catalystGraph!: CatalystGraph;

    constructor(args: RGSetup) {
        const { realm, graphName, propertyNames, dynamicRealmPath = undefined, graphRealmPath = genDefaultGraphRealmPath(graphName) } = args;

        // Use given Realm or save path for new Realm
        this._dynamicRealmPath = dynamicRealmPath;
        this.realm = realm;
        this.realmPath = !!realm ? realm.path : graphRealmPath;
        
        this.graphName = graphName;
        this.propertyNames = propertyNames;
    }
    
    reloadRealm(upToDateRealm: Realm): void { this.realm = upToDateRealm; }

    /**
     * Init must be called before RealmGraph can be used
     */
    async init() {
        if(this.isInitialized()) return;

        // 1. Open meta realm...
        if(!DynamicRealm.isInitialized()) await DynamicRealm.init({ realmPath: this._dynamicRealmPath });

        // 2. If Graph's Realm is not provided...
        if(!this.realm) {
            // 2.1. Create node + edge schemas
            const baseSchema: Realm.ObjectSchema = genSchema(this.graphName, this.propertyNames);
            const nodeSchema: Realm.ObjectSchema = {
                ...baseSchema,
                name: genNodeSchemaName(this.graphName),
                properties: {
                    ...baseSchema.properties,
                    edgeIds: 'string[]',
                },
            };
            const edgeSchema: Realm.ObjectSchema = {
                ...baseSchema,
                name: genEdgeSchemaName(this.graphName),
                properties: {
                    ...baseSchema.properties,
                    nodeId1: 'string',
                    nodeId2: 'string',
                },
            };
            const saveParams: SaveSchemaParams[] = [nodeSchema, edgeSchema].map((schema: Realm.ObjectSchema) => ({ realmPath: this.realmPath, schema, overwrite: false }));
            // 2.2. And save new Graph schemas
            // (If not Realm is not provided, then it is implied that the Graph is new and should be created)
            DynamicRealm.saveSchemas(saveParams);
            this.realm = await DynamicRealm.loadRealm(this.realmPath);
        }

        // 3. Create CatalystGraph
        this.catalystGraph = new CatalystGraph({
            propertyNames: this.propertyNames,
            saveNode: (node: CGNode) => this.realm!.write(() => this.realm!.create(this._getNodeSchemaName(), node, Realm.UpdateMode.Never)),
            saveEdge: (edge: CGEdge) => this.realm!.write(() => this.realm!.create(this._getEdgeSchemaName(), edge, Realm.UpdateMode.Never)),
            getNode: (nodeId: string) => this.realm!.objectForPrimaryKey(this._getNodeSchemaName(), nodeId) as CGNode,
            getEdge: (edgeId: string) => this.realm!.objectForPrimaryKey(this._getEdgeSchemaName(), edgeId) as CGEdge,
            genEdgeId: genEdgeName,
            updateNode: (newNode: CGNode) => {
                // 1. Get node to update
                const realmNode: (Realm.Object & CGNode) | undefined = this.realm!.objectForPrimaryKey(this._getNodeSchemaName(), newNode.id);
                // Does not exist
                if (!realmNode) return;

                // 2. Update all properties
                this.realm!.write(() => {
                    DictUtils.updateRecursive(realmNode, newNode);
                });
            },
            updateEdge: (newEdge: CGEdge) => {
                // 1. Get node to update
                const realmEdge: (Realm.Object & CGNode) | undefined = this.realm!.objectForPrimaryKey(this._getNodeSchemaName(), newEdge.id);
                // Does not exist
                if (!realmEdge) return;

                // 2. Update all properties
                this.realm!.write(() => {
                    DictUtils.updateRecursive(realmEdge, newEdge);
                });
            },
        });

        this._isInitialized = true;
    }

    getAllNodes(): Realm.Results<Realm.Object & CGNode> {
        this._throwInitError('getAllNodes');

        return this.realm!.objects(this._getNodeSchemaName());
    }

    getAllEdges(): Realm.Results<Realm.Object & CGEdge> {
        this._throwInitError('getAllEdges');

        return this.realm!.objects(this._getEdgeSchemaName());
    }

    getGraphEntity(ids: string[], entityType: GraphEntity): CGNode | CGEdge {
        this._throwInitError('getGraphEntity');

        return this.catalystGraph.getGraphEntity(ids, entityType);
    }

    rate(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode): RateReturn {
        this._throwInitError('rate');

        return this.catalystGraph.rate(propertyName, nodeIds, rating, weights, ratingMode);
    }

    // Page Rank

    _getPageRankNodeMethods() {
        // 1. All nodes copy
        const allNodesRawCopy: CGNode[] = this.getAllNodes().map((node: Realm.Object & CGNode) => ({ ...node }));
        // 2. Get node id
        const getNodeId = (node: CGNode) => node.id;
        // 3. Get node attrs
        //      Get relevant node attributes (weights used for Page Rank)
        const keysToKeep: string[] = this._getPageRankWeightKeys();
        const getNodeAttrs = (node: CGNode) => DictUtils.copyDictKeep<number>(node, keysToKeep);

        return {
            allNodes: allNodesRawCopy,
            getNodeId,
            getNodeAttrs,
        }
    }

    _getPageRankEdgeMethods(allNodesRaw: CGNode[], allEdgesRaw: Realm.Results<Realm.Object & CGEdge> | CGEdge[] = this.getAllEdges()) {
        // 1. Node map
        const nodeMap: Dict<CGNode> = allNodesRaw.reduce((nodeMap: Dict<CGNode>, node: CGNode) => {
            const id: string = node.id;
            nodeMap[id] = node;

            return nodeMap;
        }, {});
        
        // 2. All edges copy
        const allEdgesRawCopy: CGEdge[] = allEdgesRaw.map((edge: CGEdge) => ({ ...edge }));
        const edgeMap: Dict<CGEdge> = allEdgesRawCopy.reduce((edgeMap: Dict<CGEdge>, edge: CGEdge) => {
            const id: string = edge.id;
            edgeMap[id] = edge;

            return edgeMap;
        }, {});

        // 3. Get a node's edges
        const getEdges = (node: CGNode): CGEdge[] => node.edgeIds.map((edgeId: string) => edgeMap[edgeId]);

        // 4. Get edge attrs
        const keysToKeep: string[] = this._getPageRankWeightKeys();
        const getEdgeAttrs = (edge: CGEdge) => DictUtils.copyDictKeep(edge, keysToKeep);

        // 5. Get destination node, given a node and one of its edges
        const getDestinationNode = (node: CGNode, edge: CGEdge): CGNode => {
            const destinationNodeId: string = edge.nodeId1 == node.id ? edge.nodeId2 : edge.nodeId1;
            const destinationNode: CGNode = nodeMap[destinationNodeId];

            return destinationNode;
        }

        return {
            allEdges: allEdgesRawCopy,
            getEdges,
            getEdgeAttrs,
            getDestinationNode,
        }
    }

    /**
     * 1.2. Get all property-related keys to keep for page rank
     * @returns 
     */
    _getPageRankWeightKeys() {
        const keysToKeep: string[] = this.propertyNames.reduce((keysToKeep: string[], propertyName: string) => {
            // 1.2.1. Gen key names to keep
            const singleKey: string = genSingleAverageName(propertyName);
            const collectiveKey: string = genCollectiveAverageName(propertyName);
            
            // 1.2.2. Record key names to keep
            keysToKeep.push(singleKey, collectiveKey);

            return keysToKeep;
        }, []);

        return keysToKeep;
    }

    pageRank(iterations: number = 50, dampingFactor: number = 0.85): Dict<Dict<number>> {
        this._throwInitError('pageRank');

        // 1. Get node methods
        const { allNodes, getNodeId, getNodeAttrs } = this._getPageRankNodeMethods();

        // 2. Get edge methods
        const { getEdges, getEdgeAttrs, getDestinationNode } = this._getPageRankEdgeMethods(allNodes);

        // 3. Get initial weighted node map: Id -> pointing to each Node's weights divided by sum of all nodes' weights
        const initialMap: Dict<Dict<number>> = getInitialWeights(allNodes, getNodeId, getNodeAttrs);

        // 4. Page Rank
        return pageRank(initialMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor);
    }

    recommendRank(centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations: number = 50, dampingFactor: number = 0.85): Dict<Dict<number>> {
        this._throwInitError('recommendRank');

        // 1. Get node methods
        const { allNodes: allNodesRawCopy, getNodeId, getNodeAttrs } = this._getPageRankNodeMethods();

        // 2. Get initial weighted node map: Id -> pointing to each Node's weights divided by sum of all nodes' weights
        const initialMapRaw: Dict<Dict<number>> = getInitialWeights(allNodesRawCopy, getNodeId, getNodeAttrs);

        // 3. Redistribute weights
        const initialMapBiased: Dict<Dict<number>> = redistributeNodeWeight(initialMapRaw, nodeTargetCentralWeight, centralNodeIds);
        // console.log(rawInitialMap);
        // console.log(initialMapBiased);

        // 4. Convert biased initial map -> all nodes list
        const allNodesBiased: CGNode[] = allNodesRawCopy.map((node: CGNode) => ({
            ...node,
            ...initialMapBiased[node.id],
        }));
        // console.log(allNodesBiased);

        // console.log(this.getAllEdges());

        // 5. Get edge methods
        const { allEdges, getEdges, getEdgeAttrs, getDestinationNode } = this._getPageRankEdgeMethods(allNodesBiased);
        const centralNodeIdSet: Set<string> = new Set(centralNodeIds);
        const isConnectedToCentralNode = (edge: CGEdge) => centralNodeIdSet.has(edge.nodeId1) || centralNodeIdSet.has(edge.nodeId2);
        const allEdgesInflated: CGEdge[] = inflateEdgeAttrs(allEdges, getEdgeAttrs, edgeInflationMagnitude, isConnectedToCentralNode);
        const { getEdges: getEdgesInflated } = this._getPageRankEdgeMethods(allNodesBiased, allEdgesInflated);

        // 6. Page Rank
        return pageRank(initialMapBiased, allNodesBiased, getNodeId, getEdgesInflated, getEdgeAttrs, getDestinationNode, iterations, dampingFactor);
    }

    recommend(desiredAttrKey: string, centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations: number = 50, dampingFactor: number = 0.85): Heap<RankedNode> {
        this._throwInitError('recommend');

        const recommendationMap: Dict<Dict<number>> = this.recommendRank(centralNodeIds, nodeTargetCentralWeight, edgeInflationMagnitude, iterations, dampingFactor);

        const maxHeap: Heap<RankedNode> = new Heap<RankedNode>((a: RankedNode, b: RankedNode) => a[desiredAttrKey] - b[desiredAttrKey], centralNodeIds.length, true);
        Object.keys(recommendationMap).forEach((nodeId: string) => {
            const nodeRank: Dict<number> = recommendationMap[nodeId];

            maxHeap.push({
                id: nodeId,
                ...nodeRank,
            });
        });

        return maxHeap;
    }

    // Internal Methods
    
    _getNodeSchemaName() {
        return genNodeSchemaName(this.graphName);
    }

    _getEdgeSchemaName() {
        return genEdgeSchemaName(this.graphName);
    }

    
    isInitialized() { return this._isInitialized; }

    _throwInitError(callingMethodName: string) { if(!this.isInitialized()) throw genInitError(callingMethodName); }
};

export class RealmGraphManager {
    _isInitialized: boolean = false;
    
    _dynamicRealmPath: string | undefined;
    realmPath: string;
    realm!: Realm;

    realmGraphCache: Dict<RealmGraph> = {};

    /**
     * All of this Manager's RealmGraphs will use the same realmPath
     * To avoid this, create other RealmGraphManagers or spawn individual RealmGraphs at other realmPaths
     * 
     * @param realmPath 
     * @param dynamicRealmPath 
     */
    constructor(realmPath: string = DEFAULT_REALM_GRAPH_MANAGER_REALM_PATH, dynamicRealmPath?: string) {
        this._dynamicRealmPath = dynamicRealmPath;
        this.realmPath = realmPath;
    }

    /**
     * Initializes DynamicRealm, then
     * Reads all schemas from DynamicRealm and tries to load them as graphs
     */
    async init() {
        if(this.isInitialized()) return;
        // Open meta realm...
        if(!DynamicRealm.isInitialized()) await DynamicRealm.init({ realmPath: this._dynamicRealmPath });

        // 1. Get realm that this RealmGraphManager uses for all of its RealmGraphs
        this.realm = await DynamicRealm.loadRealm(this.realmPath);

        console.log(this.realm);

        // 2. Initialize a RealmGraph for each graph
        const graphNames: string[] = this.getGraphNames();
        for(let graphName of graphNames) {
            // 2.1. Get graph's node schema name
            const cgNodeSchemaName: string = genNodeSchemaName(graphName);
            // 2.2. Get graph's property names
            const cgNodeProperties: Realm.PropertiesTypes = DynamicRealm.getProperties(cgNodeSchemaName);
            const propertyNames: string[] = Object.keys(cgNodeProperties);

            // 2.3. Now, this graph's RealmGraph can be initialized
            const realmGraph: RealmGraph = new RealmGraph({ realm: this.realm, graphName, propertyNames })
            await realmGraph.init();

            // 2.4. Cache this graph's RealmGraph
            this._addToCache(graphName, realmGraph);
        }

        this._isInitialized = true;
    }

    getGraphNames(): string[] {
        const graphNames: Set<string> = new Set<string>();

        // 1. Get all schema names
        const allSchemaNames: string[] = DynamicRealm.getSchemaNames(this.realmPath);

        // 2. Remove schema name suffix and add to set
        // (A single Graph creates more than 1 schema; when stripped of their suffixes, they will have identical names)
        allSchemaNames.forEach((schemaName) => {
            // 2.1. Remove suffix
            const graphName: string = getBaseNameFromSchemaName(schemaName);

            // 2.2. Add to set
            graphNames.add(graphName);
        });
        
        return Array.from(graphNames);
    }

    _addToCache(graphName: string, realmGraph: RealmGraph) { this.realmGraphCache[graphName] = realmGraph; }

    get(graphName: string): RealmGraph | undefined { return this.realmGraphCache[graphName]; }
    getAllGraphNames() { return Object.keys(this.realmGraphCache); }
    getAllGraphs() { return Object.values(this.realmGraphCache); }

    async create(args: RGManagerCreate) {
        this._throwInitError('Create');

        // 1. Close this manager's realm
        this.realm.close();
        
        // 2. Create new RealmGraph at this manager's realmPath
        const newRealmGraph: RealmGraph = new RealmGraph({
            ...args,
            graphRealmPath: this.realmPath,
        });

        // 3. New RealmGraph will load a new Realm
        await newRealmGraph.init();
        const upToDateRealm: Realm = newRealmGraph.realm!;
        
        // 4. Add new RealmGraph to cache
        const { graphName } = args;
        this._addToCache(graphName, newRealmGraph);
        
        // 5. Update this manager's Realm
        this.realm = upToDateRealm;

        console.log(this.getAllGraphs());
        
        // 6. Reload realm of all RealmGraphs using same realmPath
        const allRealmGraphs: RealmGraph[] = this.getAllGraphs();
        console.log(allRealmGraphs)
        for(let realmGraph of allRealmGraphs) {
            realmGraph.reloadRealm(this.realm);
        }
    }

    isInitialized() { return this._isInitialized; }

    _throwInitError(callingMethodName: string) { if(!this.isInitialized()) throw genInitError(callingMethodName); }
};
