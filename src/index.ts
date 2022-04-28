import Realm from 'realm';
import DictUtils from '@asianpersonn/dict-utils';
import { pageRank as genericPageRank, getInitialWeights, redistributeNodeWeight, inflateEdgeAttrs } from '@asianpersonn/pagerank';
import DynamicRealm, { SaveSchemaParams } from 'dynamic-realm';
import CatalystGraph, { CGNode, CGEdge, RatingMode, RateReturn, GraphEntity, genCollectiveAverageName, genSingleAverageName } from 'catalyst-graph';

// My imports
import { genNodeSchemaName, genEdgeSchemaName, genEdgeName, getBaseNameFromSchemaName, SUFFIX_DELIMITER } from './utils/naming';
import { genDefaultMetaRealmPath, genDefaultLoadableRealmPath } from './utils/constants';
import { genSchema } from './utils/genSchema';

// Types
import { Dict } from './types/global';
import { RGManagerCreate, RGManagerGetOrCreate, RGManagerRemove, RGManagerUpdate } from './types/RealmGraphManager';
import { RankedNode, RGCreateParams, RGLoadableParams } from './types/RealmGraph';
import { genInitError, genNoGraphError } from './errors/RealmGraphManager';

export { RatingMode } from 'catalyst-graph';

export type RealmGraph = {
    isInitialized: () => boolean;
    
    getGraphName: () => string;
    getLoadableRealmPath: () => string;
    getMetaRealmPath: () => string;
    getGraphProperties: () => string[];

    setRealm: (upTpDateRealm: Realm) => void;
    getRealm: () => Realm;

    getAllNodes: () => Realm.Results<Realm.Object & CGNode>;
    getAllEdges: () => Realm.Results<Realm.Object & CGEdge>
    getGraphEntity: (ids: string[], entityType: GraphEntity) => CGNode | CGEdge

    rate:(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode) => RateReturn;

    pageRank: (iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    recommendRank: (centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    recommend: (
        desiredAttrKey: string,
        centralNodeIds: string[],
        nodeTargetCentralWeight: number,
        edgeInflationMagnitude: number,
        iterations?: number,
        dampingFactor?: number,
    ) => RankedNode[];
};

async function createRealmGraph(args: RGCreateParams): Promise<RealmGraph> {
    const {
        realm = undefined,
        graphName: _graphName,
        propertyNames: _propertyNames,
        metaRealmPath: _metaRealmPath = genDefaultMetaRealmPath(),
        loadableRealmPath: _loadableRealmPath = genDefaultLoadableRealmPath(_graphName),
    } = args;

    let _realm: Realm | undefined = undefined;
    let _catalystGraph: CatalystGraph | undefined = undefined;

    function getGraphName(): string { return _graphName; }
    function getLoadableRealmPath(): string { return _loadableRealmPath; }
    function getMetaRealmPath(): string { return _metaRealmPath; }
    function getGraphProperties(): string[] { return _propertyNames.slice(); }

    function isInitialized(): boolean { return !!_catalystGraph && !!_realm; }
    async function _init (): Promise<void> {
        if (isInitialized()) return;

        // 1. Open meta realm...
        if (!DynamicRealm.isInitialized(_metaRealmPath)) await DynamicRealm.openMetaRealm({ metaRealmPath: _metaRealmPath });

        // 2. Save Graph to DynamicRealm
        _saveGraph();
                
        // 3. If no realm, then open Realm with all Graphs/Schemas in loadableRealmPath
        _realm = realm;
        if(!_realm) _realm = await DynamicRealm.loadRealm(_metaRealmPath, _loadableRealmPath);

        // 4. Create CatalystGraph
        _catalystGraph = new CatalystGraph({
            propertyNames: _propertyNames,
            saveNode: (node: CGNode) => {
                try {
                    getRealm()!.write(() => getRealm()!.create(_getNodeSchemaName(), node, Realm.UpdateMode.Never));
                    console.log(getRealm())
                } catch (err) {
                    // Error thrown to prevent writing duplicate; Do nothing
                    console.log(err);
                }
            },
            saveEdge: (edge: CGEdge) => {
                try {
                    getRealm()!.write(() => getRealm()!.create(_getEdgeSchemaName(), edge, Realm.UpdateMode.Never));
                } catch (err) {
                    // Error thrown to prevent writing duplicate; Do nothing
                    console.log(err);
                }
            },
            getNode: (nodeId: string) => {
                const node: (Realm.Object & CGNode) | undefined = getRealm()!.objectForPrimaryKey(_getNodeSchemaName(), nodeId);
                return node != undefined ? node.toJSON() : undefined;
            },
            getEdge: (edgeId: string) => {
                const edge: (Realm.Object & CGEdge) | undefined = getRealm()!.objectForPrimaryKey(_getEdgeSchemaName(), edgeId);
                return edge != undefined ? edge.toJSON() : undefined;
            },
            genEdgeId: genEdgeName,
            updateNode: (newNode: CGNode) => {
                // Update logic now happens directly in 'rate' method
                // return;
                // 1. Get node to update
                const realmNode: (Realm.Object & CGNode) | undefined = getRealm()!.objectForPrimaryKey(_getNodeSchemaName(), newNode.id);
                // Does not exist
                if (!realmNode || (!!realmNode && Object.keys(realmNode!.toJSON()).length === 0)) return;

                // 2. Update all properties
                getRealm()!.write(() => {
                    DictUtils.updateRecursive(realmNode!, newNode);
                });
            },
            updateEdge: (newEdge: CGEdge) => {
                // Update logic now happens directly in 'rate' method
                // return;
                // 1. Get node to update
                const realmEdge: (Realm.Object & CGNode) | undefined = getRealm()!.objectForPrimaryKey(_getEdgeSchemaName(), newEdge.id);
                // Does not exist
                if (!realmEdge || (!!realmEdge && Object.keys(realmEdge!.toJSON()).length === 0)) return;

                // 2. Update all properties
                getRealm()!.write(() => {
                    DictUtils.updateRecursive(realmEdge!, newEdge);
                });
            },
        });
    };
    // Initialize each RealmGraph
    await _init();

    // REALM

    function getRealm(): Realm {
        _throwInitError('getRealm');

        return _realm!;
    }

    function setRealm(upToDateRealm: Realm): void { _realm = upToDateRealm; }

    // GETTERS

    function getAllNodes (): Realm.Results<Realm.Object & CGNode> {
        _throwInitError('getAllNodes');

        return _realm!.objects(_getNodeSchemaName());
    }

    function getAllEdges (): Realm.Results<Realm.Object & CGEdge> {
        _throwInitError('getAllEdges');

        return _realm!.objects(_getEdgeSchemaName());
    }

    function getGraphEntity(ids: string[], entityType: GraphEntity): CGNode | CGEdge {
        _throwInitError('getGraphEntity');

        return _catalystGraph!.getGraphEntity(ids, entityType);
    }

    function rate(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode): RateReturn {
        _throwInitError('rate');

        let rateResult: RateReturn;

        // Wrap in write transaction to apply updates directly to Realm objects during rate
        // this.realm?.write(() => {
        rateResult = _catalystGraph!.rate(propertyName, nodeIds, rating, weights, ratingMode);
        // });

        return rateResult!;
    }

    // Page Rank

    function _getPageRankNodeMethods() {
        // 1. All nodes copy
        const allNodesRawCopy: CGNode[] = getAllNodes().map((node: Realm.Object & CGNode) => node.toJSON());
        // 2. Get node id
        const getNodeId = (node: CGNode) => node.id;
        // 3. Get node attrs
        //      Get relevant node attributes (weights used for Page Rank)
        const keysToKeep: string[] = _getPageRankWeightKeys();
        const getNodeAttrs = (node: CGNode) => DictUtils.copyDictKeep<number>(node, keysToKeep);

        return {
            allNodes: allNodesRawCopy,
            getNodeId,
            getNodeAttrs,
        };
    }

    function _getPageRankEdgeMethods(allNodesRaw: CGNode[], allEdgesRaw: CGEdge[] = getAllEdges().map((realmEdge: Realm.Object & CGEdge) => realmEdge.toJSON())) {
        // 1. Node map
        const nodeMap: Dict<CGNode> = allNodesRaw.reduce((nodeMap: Dict<CGNode>, node: CGNode) => {
            const id: string = node.id;
            nodeMap[id] = node;

            return nodeMap;
        }, {});

        // 2. All edges copy
        const allEdgesRawCopy: CGEdge[] = allEdgesRaw.map((edge: CGEdge) => edge);
        const edgeMap: Dict<CGEdge> = allEdgesRawCopy.reduce((edgeMap: Dict<CGEdge>, edge: CGEdge) => {
            const id: string = edge.id;
            edgeMap[id] = edge;

            return edgeMap;
        }, {});

        // 3. Get a node's edges
        const getEdges = (node: CGNode): CGEdge[] => node.edgeIds.map((edgeId: string) => edgeMap[edgeId]);

        // 4. Get edge attrs
        const keysToKeep: string[] = _getPageRankWeightKeys();
        const getEdgeAttrs = (edge: CGEdge) => DictUtils.copyDictKeep(edge, keysToKeep);

        // 5. Get destination node, given a node and one of its edges
        const getDestinationNode = (node: CGNode, edge: CGEdge): CGNode => {
            const destinationNodeId: string = edge.nodeId1 == node.id ? edge.nodeId2 : edge.nodeId1;
            const destinationNode: CGNode = nodeMap[destinationNodeId];

            return destinationNode;
        };

        return {
            allEdges: allEdgesRawCopy,
            getEdges,
            getEdgeAttrs,
            getDestinationNode,
        };
    }

    /**
     * 1.2. Get all property-related keys to keep for page rank
     * @returns
     */
    function _getPageRankWeightKeys() {
        const keysToKeep: string[] = _propertyNames.reduce((keysToKeep: string[], propertyName: string) => {
            // 1.2.1. Gen key names to keep
            const singleKey: string = genSingleAverageName(propertyName);
            const collectiveKey: string = genCollectiveAverageName(propertyName);

            // 1.2.2. Record key names to keep
            keysToKeep.push(singleKey, collectiveKey);

            return keysToKeep;
        }, []);

        return keysToKeep;
    }

    function pageRank(iterations: number = 50, dampingFactor: number = 0.85): Dict<Dict<number>> {
        _throwInitError('pageRank');

        // console.log(getRealm().objects(_getNodeSchemaName()));
        // console.log(getRealm().objects(_getEdgeSchemaName()));

        // 1. Get node methods
        const { allNodes, getNodeId, getNodeAttrs } = _getPageRankNodeMethods();

        // 2. Get edge methods
        const { getEdges, getEdgeAttrs, getDestinationNode } = _getPageRankEdgeMethods(allNodes);

        // 3. Get initial weighted node map: Id -> pointing to each Node's weights divided by sum of all nodes' weights
        const initialMap: Dict<Dict<number>> = getInitialWeights(allNodes, getNodeId, getNodeAttrs);

        // 4. Page Rank
        return genericPageRank(initialMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor);
    }

    function recommend(
        desiredAttrKey: string,
        centralNodeIds: string[],
        nodeTargetCentralWeight: number,
        edgeInflationMagnitude: number,
        iterations: number = 50,
        dampingFactor: number = 0.85
    ): RankedNode[] {
        _throwInitError('recommend');

        const recommendationMap: Dict<Dict<number>> = recommendRank(centralNodeIds, nodeTargetCentralWeight, edgeInflationMagnitude, iterations, dampingFactor);

        const sortedRecommendations: RankedNode[] = Object.entries(recommendationMap)
                                                        .map(([ nodeId, nodeRank ]) => ({
                                                            id: nodeId,
                                                            ...nodeRank,
                                                        }))
                                                        .sort((a: RankedNode, b: RankedNode) => a[desiredAttrKey] - b[desiredAttrKey]);

        return sortedRecommendations;
    }

    function recommendRank(centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations: number = 50, dampingFactor: number = 0.85): Dict<Dict<number>> {
        _throwInitError('recommendRank');

        // 1. Get node methods
        const { allNodes: allNodesRawCopy, getNodeId, getNodeAttrs } = _getPageRankNodeMethods();

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
        const { allEdges, getEdges, getEdgeAttrs, getDestinationNode } = _getPageRankEdgeMethods(allNodesBiased);
        const centralNodeIdSet: Set<string> = new Set(centralNodeIds);
        const isConnectedToCentralNode = (edge: CGEdge) => centralNodeIdSet.has(edge.nodeId1) || centralNodeIdSet.has(edge.nodeId2);
        const allEdgesInflated: CGEdge[] = inflateEdgeAttrs(allEdges, getEdgeAttrs, edgeInflationMagnitude, isConnectedToCentralNode);
        const { getEdges: getEdgesInflated } = _getPageRankEdgeMethods(allNodesBiased, allEdgesInflated);

        // 6. Page Rank
        return genericPageRank(initialMapBiased, allNodesBiased, getNodeId, getEdgesInflated, getEdgeAttrs, getDestinationNode, iterations, dampingFactor);
    }
    
    // Internal Methods

    function _getNodeSchemaName() { return genNodeSchemaName(_graphName); }

    function _getEdgeSchemaName() { return genEdgeSchemaName(_graphName); }

    function _saveGraph(): void {
        // 1. Create node + edge schemas
        const baseSchema: Realm.ObjectSchema = genSchema(_graphName, _propertyNames);
        const nodeSchema: Realm.ObjectSchema = {
            ...baseSchema,
            name: genNodeSchemaName(_graphName),
            properties: {
                ...baseSchema.properties,
                edgeIds: 'string[]',
            },
        };
        const edgeSchema: Realm.ObjectSchema = {
            ...baseSchema,
            name: genEdgeSchemaName(_graphName),
            properties: {
                ...baseSchema.properties,
                nodeId1: 'string',
                nodeId2: 'string',
            },
        };
        const saveParams: SaveSchemaParams[] = [nodeSchema, edgeSchema].map((schema: Realm.ObjectSchema) => ({ metaRealmPath: _metaRealmPath, loadableRealmPath: _loadableRealmPath, schema, overwrite: false }));
        // 2. And save new Graph schemas
        // (If not Realm is not provided, then it is implied that the Graph is new and should be created)
        DynamicRealm.saveSchemas(saveParams);
    }

    function _throwInitError(callingMethodName: string): void {
        if (!isInitialized()) throw genInitError(callingMethodName);
    }

    return {
        isInitialized,
        
        getGraphName,
        getLoadableRealmPath,
        getMetaRealmPath,
        getGraphProperties,

        getRealm,
        setRealm,

        getAllNodes,
        getAllEdges,
        getGraphEntity,
        
        rate,
        pageRank,
        recommend,
        recommendRank,
    };
};

async function loadRealmGraph(args: RGLoadableParams): Promise<RealmGraph> {
    const { realm = undefined, metaRealmPath, loadableRealmPath, graphName } = args;

    // 1.2.4.1. Get graph's node schema name
    const cgNodeSchemaName: string = genNodeSchemaName(graphName);
    
    // 1.2.4.2. Get graph's properties
    const cgNodeProperties: Realm.PropertiesTypes = DynamicRealm.getProperties(metaRealmPath, cgNodeSchemaName);
    const propertyNames: string[] = Object.keys(cgNodeProperties);

    const realmGraph: RealmGraph = await createRealmGraph({
        realm,
        metaRealmPath,
        loadableRealmPath,
        graphName,
        propertyNames,
    });

    return realmGraph;
};

type RealmGraphManager = {
    createGraph: ({ metaRealmPath, loadableRealmPath, graphName, propertyNames }: RGManagerCreate) => Promise<RealmGraph>,
    rmGraph: ({ metaRealmPath, loadableRealmPath, graphName }: RGManagerRemove) => void;
    updateGraphProperties: ({ metaRealmPath, loadableRealmPath, graphName, newProperties }: RGManagerUpdate) => void,
    getGraph: (graphName: string) => RealmGraph,
    loadGraphs: (metaRealmPath: string, loadableRealmPath: string) => Promise<RealmGraph[]>,
    getAllLoadedGraphNames: () => string[],
    getAllLoadedGraphs: () => RealmGraph[],
};
function getGraphManager(): RealmGraphManager {
    
/****************************************
 ********** INTERNAL VARIABLES **********
 ****************************************/

    // Graph name -> RealmGraph
    const graphMap: Dict<RealmGraph> = {};
    // Realm path -> open Realm
    const realmMap: Dict<Realm> = {};
    // Loadable realm path -> Graph names
    const loadedGraphsMap: Dict<Set<string>> = {};

/**********************************
 ********** INTERNAL API **********
 **********************************/

/***************
 * MAP CACHING API
 ***************/

     function _cacheGraph(graphName: string, graph: RealmGraph, metaRealmPath: string, loadableRealmPath: string): void {
        // 1. Cache graph by graph name
        graphMap[graphName] = graph;

        // 2. Cache Graph names by realm path
        const loadedGraphsKey: string = _genRealmPathKey(metaRealmPath, loadableRealmPath);
        if(!loadedGraphsMap[loadedGraphsKey]) loadedGraphsMap[loadedGraphsKey] = new Set<string>();
        loadedGraphsMap[loadedGraphsKey].add(graphName);
    };

    function _cacheRealm(metaRealmPath: string, loadableRealmPath: string, realm: Realm): void {
        // 1. Close existing Realm
        const existingRealm: Realm | undefined = _getRealm(metaRealmPath, loadableRealmPath);
        if(!!existingRealm && !existingRealm.isClosed) existingRealm.close();

        // 2. Cache Realm by realm path
        realmMap[_genRealmPathKey(metaRealmPath, loadableRealmPath)] = realm;
    };

/***************
 * REALM MAP API
 ***************/

    function _genRealmPathKey(metaRealmPath: string, loadableRealmPath: string) { return `${metaRealmPath}${SUFFIX_DELIMITER}${loadableRealmPath}`; }
    function _hasRealm(metaRealmPath: string, loadableRealmPath: string) { return !!realmMap[_genRealmPathKey(metaRealmPath, loadableRealmPath)]; }
    function _getRealm(metaRealmPath: string, loadableRealmPath: string): Realm | undefined {
        if(_hasRealm(metaRealmPath, loadableRealmPath)) return realmMap[_genRealmPathKey(metaRealmPath, loadableRealmPath)];
    };
    async function _getOrCreateRealm (metaRealmPath: string, loadableRealmPath: string): Promise<Realm> {
        // 1. Has Loaded Realm
        if(_hasRealm(metaRealmPath, loadableRealmPath)) {
            // 1.1. Loaded Realm is closed
            if(_getRealm(metaRealmPath, loadableRealmPath)!.isClosed) _rmRealm(metaRealmPath, loadableRealmPath);
            // 1.2. Loaded Realm is open
            else return _getRealm(metaRealmPath, loadableRealmPath)!;
        }

        // 2. Does not have Loaded Realm
        await _openMetaRealm(metaRealmPath);
        const realm: Realm = await DynamicRealm.loadRealm(metaRealmPath, loadableRealmPath);

        _cacheRealm(metaRealmPath, loadableRealmPath, realm);

        return realm;
    };
    /**
     * Reloads a given realm by closing it, and then calling '_getOrCreateRealm'
     * 
     * @param metaRealmPath 
     * @param loadableRealmPath 
     * @returns 
     */
    async function _reloadRealm(metaRealmPath: string, loadableRealmPath: string): Promise<Realm> {
        // 1. Get existing Realm
        const existingRealm: Realm | undefined = _getRealm(metaRealmPath, loadableRealmPath);

        // 2. Close existing Realm, if open
        if(!!existingRealm && !existingRealm.isClosed) existingRealm.close();

        // 3. Open a new Realm
        const newRealm: Realm = await _getOrCreateRealm(metaRealmPath, loadableRealmPath);

        return newRealm;
    };
    function _rmRealm(metaRealmPath: string, loadableRealmPath: string) {
        delete realmMap[_genRealmPathKey(metaRealmPath, loadableRealmPath)];
    };
    
/***************
 * GRAPH MAP API
 ***************/

    function _hasGraph(graphName: string) { return !!graphMap[graphName]; }
    function _getGraph(graphName: string): RealmGraph | undefined {
        if(_hasGraph(graphName)) return graphMap[graphName];
    };
    async function _getOrCreateGraph({ existingRealm = undefined, graphName, metaRealmPath, loadableRealmPath, propertyNames }: RGManagerGetOrCreate): Promise<RealmGraph> {
        if(_hasGraph(graphName)) return _getGraph(graphName)!;

        const newRealmGraph: RealmGraph = await createRealmGraph({
            realm: existingRealm,
            graphName,
            metaRealmPath,
            loadableRealmPath,
            propertyNames,
        });

        _cacheGraph(graphName, newRealmGraph, metaRealmPath, loadableRealmPath);
        
        const newRealm = newRealmGraph.getRealm();
        _cacheRealm(metaRealmPath, loadableRealmPath, newRealm);

        return newRealmGraph;
    };
    function _rmGraph(metaRealmPath: string, loadableRealmPath: string, graphName: string) {
        // 1. Remove from map of Realm Graphs
        delete graphMap[graphName];

        // 2. Remove graph name from set of loaded realm graphs
        const loadedGraphsKey: string = _genRealmPathKey(metaRealmPath, loadableRealmPath);
        if(!loadedGraphsMap[loadedGraphsKey]) loadedGraphsMap[loadedGraphsKey].delete(graphName);    
    };

/***************
 * REALM PATH -> GRAPH NAMES MAP API
 ***************/

    function _getLoadedGraphNamesByRealmPath(metaRealmPath: string, loadableRealmPath: string) {
        const loadedGraphsKey: string = _genRealmPathKey(metaRealmPath, loadableRealmPath);
        return loadedGraphsMap[loadedGraphsKey];
    };
    function _getLoadedGraphsByRealmPath(metaRealmPath: string, loadableRealmPath: string): RealmGraph[] {
        // 1. Get Graph names associated with provided loadableRealmPath
        const loadedGraphNames: Set<string> | undefined = _getLoadedGraphNamesByRealmPath(metaRealmPath, loadableRealmPath);

        // 2. No graph names, short circuit
        if(!loadedGraphNames) return [];

        // 3. Map graph names to RealmGraphs
        return Array.from(loadedGraphNames).map((loadedGraphName: string) => _getGraph(loadedGraphName)).filter((realmGraph: RealmGraph | undefined) => !!realmGraph) as RealmGraph[];
    };
    function _setLoadedGraphsRealm(metaRealmPath: string, loadableRealmPath: string): void {
        _throwNoRealmError(metaRealmPath, loadableRealmPath, '_setLoadedGraphsRealm');

        const newRealm: Realm = _getRealm(metaRealmPath, loadableRealmPath)!;

        const realmGraphsToUpdate: RealmGraph[] = _getLoadedGraphsByRealmPath(metaRealmPath, loadableRealmPath);
        for(const realmGraph of realmGraphsToUpdate) {
            realmGraph.setRealm(newRealm);
        }
    };

/***************
 * ERROR API
 ***************/

    function _throwInitError(metaRealmPath: string, callingMethodName: string) {
        if (!DynamicRealm.isInitialized(metaRealmPath)) throw genInitError(callingMethodName);
    };

    function _throwNoGraphError(graphName: string, callingMethodName: string): void {
        if (!_hasGraph(graphName)) throw genNoGraphError(graphName, callingMethodName);
    };

    function _throwNoRealmError(metaRealmPath: string, loadableRealmPath: string, callingMethodName: string) {
        const realm: Realm | undefined = _getRealm(metaRealmPath, loadableRealmPath);

        if(!realm) throw new Error(`"${callingMethodName}" could not get a Realm`);
    };

/***************
 * SETUP API
 ***************/

    async function _openMetaRealm (metaRealmPath: string): Promise<void> {
        // if(!DynamicRealm.isInitialized(metaRealmPath)) 
        const realm = await DynamicRealm.openMetaRealm({ metaRealmPath });
        // console.log(realm);
    };

/********************************
 ********** PUBLIC API **********
 ********************************/

    function getGraphNames(metaRealmPath: string, loadableRealmPath: string): string[] {
        const graphNames: Set<string> = new Set<string>();

        // 1. Get all schema names
        const allSchemaNames: string[] = DynamicRealm.getSchemaNames(metaRealmPath, loadableRealmPath);

        // 2. Remove schema name suffix and add to set
        // (A single Graph creates more than 1 schema; when stripped of their suffixes, they will have identical names)
        allSchemaNames.forEach((schemaName) => {
            // 2.1. Remove suffix
            const graphName: string = getBaseNameFromSchemaName(schemaName);

            // 2.2. Add to set
            graphNames.add(graphName);
        });

        return Array.from(graphNames);
    };

    function getAllLoadedGraphNames(): string[] { return Object.keys(graphMap); }
    function getAllLoadedGraphs(): RealmGraph[] { return Object.values(graphMap); }

    async function loadGraphs(metaRealmPath: string, loadableRealmPath: string): Promise<RealmGraph[]> {
        _throwInitError(metaRealmPath, 'loadRealm');

        // 1. Get realm that this RealmGraphManager will use for this set of RealmGraphs
        let realm: Realm = await _getOrCreateRealm(metaRealmPath, loadableRealmPath) as Realm;

        console.log('LOADED REALM');
        console.log(realm);
        
        // 2. Get graph names of this set of RealmGraphs
        const graphNames: string[] = getGraphNames(metaRealmPath, loadableRealmPath);

        // 3. Create a RealmGraph for each graph name
        const newRealmGraphs: RealmGraph[] = []
        for(const graphName of graphNames) {
            // 3.1. Short circuit
            if(_hasGraph(graphName)) break;

            // 3.2. Load RealmGraph
            const realmGraph: RealmGraph = await loadRealmGraph({
                realm,
                graphName,
                metaRealmPath,
                loadableRealmPath
            });

            // 3.3. Cache RealmGraph
            _cacheGraph(graphName, realmGraph, metaRealmPath, loadableRealmPath);
            newRealmGraphs.push(realmGraph);
        }

        return newRealmGraphs
    };

    async function createGraph({ metaRealmPath, loadableRealmPath, graphName, propertyNames }: RGManagerCreate): Promise<RealmGraph> {
        // 1. Get Realm
        const placeholderRealm: Realm | undefined = _getRealm(metaRealmPath, loadableRealmPath);
        
        // 2. Create new RealmGraph, including a 'placeholder realm', so that a new realm is not created
        //      Instead, reload all new realm with the '_reloadRealm' method
        const newRealmGraph: RealmGraph = await _getOrCreateGraph({
            existingRealm: placeholderRealm,
            graphName,
            metaRealmPath,
            loadableRealmPath,
            propertyNames
        });

        // 3. Reload Realm with new schemas
        const newRealm: Realm = await _reloadRealm(metaRealmPath, loadableRealmPath);

        // 4. Set new realm for all associated Realm Graphs
        _setLoadedGraphsRealm(metaRealmPath, loadableRealmPath);

        return newRealmGraph;
    };

    async function updateGraphProperties({ metaRealmPath, loadableRealmPath, graphName, newProperties }: RGManagerUpdate) {
        // 1. Create new graph schemas
        const newBaseSchema: Realm.ObjectSchema = genSchema(graphName, newProperties);
        const newNodeSchema: Realm.ObjectSchema = {
            ...newBaseSchema,
            name: genNodeSchemaName(graphName),
            properties: {
                ...newBaseSchema.properties,
                edgeIds: 'string[]',
            },
        };
        const newEdgeSchema: Realm.ObjectSchema = {
            ...newBaseSchema,
            name: genEdgeSchemaName(graphName),
            properties: {
                ...newBaseSchema.properties,
                nodeId1: 'string',
                nodeId2: 'string',
            },
        };
        const updatedSchemas: Realm.ObjectSchema[] = [ newNodeSchema, newEdgeSchema ];
        // 2. Then save new Graph schemas
        // (If not Realm is not provided, then it is implied that the Graph is new and should be created)
        DynamicRealm.updateSchemas(metaRealmPath, loadableRealmPath, updatedSchemas);

        // 3. Reload Realm with new schemas
        const newRealm: Realm = await _reloadRealm(metaRealmPath, loadableRealmPath);

        // 4. Set new realm for all associated Realm Graphs
        _setLoadedGraphsRealm(metaRealmPath, loadableRealmPath);
    };

    function rmGraph({ metaRealmPath, loadableRealmPath, graphName }: RGManagerRemove) {
        // 1. Remove graph's schemas from DynamicRealm
        const nodeSchemaName: string = genNodeSchemaName(graphName);
        const edgeSchemaName: string = genEdgeSchemaName(graphName);
        const schemaNamesToRm: string[] = [ nodeSchemaName, edgeSchemaName ];
        DynamicRealm.rmSchemas(metaRealmPath, schemaNamesToRm);

        // 2. Remove graph from cache
        _rmGraph(metaRealmPath, loadableRealmPath, graphName);

        // 3. Reload Realm without this graph's schemas
        _reloadRealm(metaRealmPath, loadableRealmPath);

        // 4. Set new realm for all associated Realm Graphs
        _setLoadedGraphsRealm(metaRealmPath, loadableRealmPath);
    };

    function getGraph(graphName: string): RealmGraph {
        _throwNoGraphError(graphName, 'getGraph');

        return graphMap[graphName];
    };

    return {
        createGraph,
        rmGraph,
        updateGraphProperties,
        getGraph,
        loadGraphs,
        getAllLoadedGraphNames,
        getAllLoadedGraphs,
    }
};

export default getGraphManager();
