import DictUtils from '@asianpersonn/dict-utils';
import { pageRank, getInitialWeights, redistributeNodeWeight, inflateEdgeAttrs } from '@asianpersonn/pagerank';
import DynamicRealm, { SaveSchemaParams } from 'dynamic-realm';
import CatalystGraph, { CGNode, CGEdge, RatingMode, RateReturn, GraphEntity, genPropertiesObj, genCollectiveAverageName, genSingleAverageName } from 'catalyst-graph';

// My imports
import { genDefaultGraphRealmPath, ID_KEY } from './utils/constants';
import { genSchema } from './utils/genSchema';

// Types
import Realm from 'realm';
import { RGSetup } from './types/RealmGraph';
import { genNodeSchemaName, genEdgeSchemaName, genEdgeName } from './utils/naming';
import { Dict } from './types/global';

export default class RealmGraph {
    graphName: string;

    realmPath: string;

    propertyNames: string[];

    realm!: Realm;

    catalystGraph!: CatalystGraph;

    constructor(args: RGSetup) {
        const { graphName, propertyNames, realmPath = genDefaultGraphRealmPath(graphName) } = args;

        this.graphName = graphName;
        this.realmPath = realmPath;
        this.propertyNames = propertyNames;
    }

    /**
     * Init must be called before RealmGraph can be used
     */
    async init() {
        // 1. Save node + edge schemas
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

        // 2. Open realm
        await DynamicRealm.init({ realmPath: this.realmPath });
        const saveParams: SaveSchemaParams[] = [nodeSchema, edgeSchema].map((schema: Realm.ObjectSchema) => ({ realmPath: this.realmPath, schema, overwrite: false }));
        DynamicRealm.saveSchemas(saveParams);
        this.realm = await DynamicRealm.loadRealm(this.realmPath);

        // 3. Create CatalystGraphe

        this.catalystGraph = new CatalystGraph({
            propertyNames: this.propertyNames,
            saveNode: (node: CGNode) => this.realm.write(() => this.realm.create(this._getNodeSchemaName(), node, Realm.UpdateMode.Never)),
            saveEdge: (edge: CGEdge) => this.realm.write(() => this.realm.create(this._getEdgeSchemaName(), edge, Realm.UpdateMode.Never)),
            getNode: (nodeId: string) => this.realm.objectForPrimaryKey(this._getNodeSchemaName(), nodeId) as CGNode,
            getEdge: (edgeId: string) => this.realm.objectForPrimaryKey(this._getEdgeSchemaName(), edgeId) as CGEdge,
            genEdgeId: genEdgeName,
            updateNode: (newNode: CGNode) => {
                // 1. Get node to update
                const realmNode: (Realm.Object & CGNode) | undefined = this.realm.objectForPrimaryKey(this._getNodeSchemaName(), newNode.id);
                // Does not exist
                if (!realmNode) return;

                // 2. Update all properties
                this.realm.write(() => {
                    DictUtils.updateRecursive(realmNode, newNode);
                });
            },
            updateEdge: (newEdge: CGEdge) => {
                // 1. Get node to update
                const realmEdge: (Realm.Object & CGNode) | undefined = this.realm.objectForPrimaryKey(this._getNodeSchemaName(), newEdge.id);
                // Does not exist
                if (!realmEdge) return;

                // 2. Update all properties
                this.realm.write(() => {
                    DictUtils.updateRecursive(realmEdge, newEdge);
                });
            },
        });
    }

    getAllNodes(): Realm.Results<Realm.Object & CGNode> {
        return this.realm.objects(this._getNodeSchemaName());
    }

    getAllEdges(): Realm.Results<Realm.Object & CGEdge> {
        return this.realm.objects(this._getEdgeSchemaName());
    }

    getGraphEntity(ids: string[], entityType: GraphEntity): CGNode | CGEdge {
        return this.catalystGraph.getGraphEntity(ids, entityType);
    }

    rate(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode): RateReturn {
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

    pageRank(iterations: number = 50, dampingFactor: number = 0.85) {
        // 1. Get node methods
        const { allNodes, getNodeId, getNodeAttrs } = this._getPageRankNodeMethods();

        // 2. Get edge methods
        const { getEdges, getEdgeAttrs, getDestinationNode } = this._getPageRankEdgeMethods(allNodes);

        // 3. Get initial weighted node map: Id -> pointing to each Node's weights divided by sum of all nodes' weights
        const initialMap: Dict<Dict<number>> = getInitialWeights(allNodes, getNodeId, getNodeAttrs);

        // 4. Page Rank
        return pageRank(initialMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor);
    }

    recommend(centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations: number = 50, dampingFactor: number = 0.85) {
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

    // Internal Methods
    
    _getNodeSchemaName() {
        return genNodeSchemaName(this.graphName);
    }

    _getEdgeSchemaName() {
        return genEdgeSchemaName(this.graphName);
    }
}
