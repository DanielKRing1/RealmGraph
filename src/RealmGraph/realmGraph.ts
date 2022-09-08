import Realm from 'realm';
import DictUtils from '@asianpersonn/dict-utils';
import MetaRealm, { SaveSchemaParams } from '@asianpersonn/metarealm';
import { pageRank as genericPageRank, getInitialWeights, redistributeNodeWeight, inflateEdgeAttrs } from '@asianpersonn/pagerank';
import CatalystGraph, { CGEdge, CGNode, EDGE_IDS_KEY, genCollectiveAverageName, genCollectiveTallyName, genSingleAverageName, GraphEntity, GRAPH_ENTITY_ID_KEY, RateReturn, RatingMode } from 'catalyst-graph';

import { genEdgeName, genEdgeSchemaName, genNodeSchemaName, getGraphPropertyNameFromKey } from '../constants/naming';
import { genBaseSchema } from '../constants/schemas';

import { Dict } from '../types';
import { RankedNode, RealmGraph, RGCreateParams, RGLoadableParams, RGLoadGraphParams, RGUpdatePropertiesParams } from "./types";

/**
 * Saves RealmGraph Node and Edge schemas to LoadableSchema table
 * Then reloads the MetaRealm LoadableRealm with these new schemas
 * 
 * @param param0 
 * @returns 
 */
export const createRealmGraph = async ({ metaRealmPath, loadableRealmPath, graphName, propertyNames }: RGCreateParams): Promise<RealmGraph> => {
    // 1. Save new Graph Node and Edge schemas
    _saveGraphSchemas(metaRealmPath, loadableRealmPath, graphName, propertyNames);
    
    // 2. Reload LoadableRealm with new schemas, so propertyNames can be accessed from LoadableSchema
    await MetaRealm.LoadableRealmManager.reloadRealm({ metaRealmPath, loadableRealmPath });

    // 3. Setup RealmGraph
    const realmGraph: RealmGraph = await initializeRealmGraph({ metaRealmPath, loadableRealmPath, graphName, propertyNames });

    return realmGraph;
};

export const loadRealmGraph = async ({ metaRealmPath, loadableRealmPath, graphName, shouldReloadRealm=true }: RGLoadGraphParams): Promise<RealmGraph> => {
    // 1. Get propertyNames from saved Node schema
    // Can use Node or Edge schema
    const nodeSchemaName: string = genNodeSchemaName(graphName);
    const graphProperties: Realm.PropertiesTypes = MetaRealm.getProperties(metaRealmPath, nodeSchemaName);

    // 2. Remove unrelated keys
    const KEYS_TO_RM: Set<string> = new Set([ GRAPH_ENTITY_ID_KEY, EDGE_IDS_KEY, genCollectiveTallyName() ]);
    const rawPropertyNames: string [] = Object.keys(graphProperties).filter((key: string) => !KEYS_TO_RM.has(key));

    // 3. Strip remaining keys down to their property names
    const propertyNamesSet: Set<string> = new Set();
    for(let rawPropertyName of rawPropertyNames) {
        const propertyName: string = getGraphPropertyNameFromKey(rawPropertyName);
        propertyNamesSet.add(propertyName);
    }
    const propertyNames: string[] = Array.from(propertyNamesSet);
    
    // 4. Initialize RealmGraph
    const realmGraph: RealmGraph = await initializeRealmGraph({ metaRealmPath, loadableRealmPath, graphName, propertyNames });

    // 5. Reload realm (optional bcus may be loading multiple RealmGraphs)
    if(shouldReloadRealm) await realmGraph.reloadRealm();
    
    return realmGraph;
};

const initializeRealmGraph = async ({ metaRealmPath, loadableRealmPath, graphName, propertyNames }: RGCreateParams): Promise<RealmGraph> => {
    
    // 1. Setup CatalystGraph
    let _catalystGraph: CatalystGraph = _createCatalystGraph(graphName, propertyNames, loadRealmSync);

    // REALM GRAPH METHODS
    function getGraphName(): string { return graphName };
    function getMetaRealmPath(): string { return metaRealmPath };
    function getLoadableRealmPath(): string { return loadableRealmPath };
    function getPropertyNames(): string[] { return _catalystGraph.propertyNames; };

    const getAllNodes =  (): Realm.Results<Realm.Object & CGNode> => {
        const loadedGraphRealm: Realm = loadRealmSync();
        return loadedGraphRealm.objects(genNodeSchemaName(graphName));
    }

    const getAllEdges =  (): Realm.Results<Realm.Object & CGEdge> => {
        const loadedGraphRealm: Realm = loadRealmSync();
        return loadedGraphRealm.objects(genEdgeSchemaName(graphName));
    }

    const getGraphEntity = (ids: string[], entityType: GraphEntity): CGNode | CGEdge => {
        return _catalystGraph.getGraphEntity(ids, entityType);
    }

    const rate = (propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode): RateReturn => {
        let rateResult: RateReturn;

        // TODO Might actually want to do this to avoid so many write transactions with 'updateNode/Edge' methods
        // Wrap in write transaction to apply updates directly to Realm objects during rate
        // this.realm?.write(() => {
        rateResult = _catalystGraph.rate(propertyName, nodeIds, rating, weights, ratingMode);
        // });

        return rateResult!;
    }

    // PAGE RANK

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
        const propertyNames: string[] = getPropertyNames();

        const keysToKeep: string[] = propertyNames.reduce((keysToKeep: string[], propertyName: string) => {
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

    // INTERNAL UTILITY
    async function loadRealm(): Promise<Realm> { return await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath, loadableRealmPath }) };
    async function reloadRealm(): Promise<Realm> { return await MetaRealm.LoadableRealmManager.reloadRealm({ metaRealmPath, loadableRealmPath }) };
    function loadRealmSync(): Realm { return MetaRealm.LoadableRealmManager.loadRealmSync({ metaRealmPath, loadableRealmPath }) };
    function reloadRealmSync(): Realm { return MetaRealm.LoadableRealmManager.reloadRealmSync({ metaRealmPath, loadableRealmPath }) };

    return {
        getGraphName,
        getLoadableRealmPath,
        getMetaRealmPath,
        getPropertyNames,

        loadRealm,
        loadRealmSync,
        reloadRealm,
        reloadRealmSync,

        deleteGraph: () => _deleteGraphSchemas(metaRealmPath, loadableRealmPath, graphName),
        updateGraphProperties: async (newPropertyNames: string[]) => {
            await _updateGraphProperties({ metaRealmPath, loadableRealmPath, graphName, newPropertyNames, reloadRealm })
            _catalystGraph.propertyNames = newPropertyNames;
        },

        getAllNodes,
        getAllEdges,
        getGraphEntity,
        
        rate,
        pageRank,
        recommend,
        recommendRank,
    }
}

// SETUP
const _saveGraphSchemas = (metaRealmPath, loadableRealmPath, graphName: string, propertyNames: string[]): void => {
    // 1. Create node + edge schemas
    const baseSchema: Realm.ObjectSchema = genBaseSchema(graphName, propertyNames);
    const nodeSchema: Realm.ObjectSchema = {
        ...baseSchema,
        name: genNodeSchemaName(graphName),
        properties: {
            ...baseSchema.properties,
            edgeIds: 'string[]',
        },
    };
    const edgeSchema: Realm.ObjectSchema = {
        ...baseSchema,
        name: genEdgeSchemaName(graphName),
        properties: {
            ...baseSchema.properties,
            nodeId1: 'string',
            nodeId2: 'string',
        },
    };
    const saveParams: SaveSchemaParams[] = [nodeSchema, edgeSchema].map((schema: Realm.ObjectSchema) => ({ metaRealmPath, loadableRealmPath, schema }));
    // 2. And save new Graph schemas
    // (If not Realm is not provided, then it is implied that the Graph is new and should be created)
    for(let saveParam of saveParams) {
        MetaRealm.saveSchema(saveParam);
    }
}

const _deleteGraphSchemas = (metaRealmPath, loadableRealmPath, graphName: string): void => {
    // 1. Get node + edge schema names
    const schemaNames: string[] = [ genNodeSchemaName(graphName), genEdgeSchemaName(graphName) ];

    // 2. Delete Graph schemas
    for(let schemaName of schemaNames) {
        MetaRealm.rmSchema({ metaRealmPath, loadableRealmPath, schemaName });
    }
}

async function _updateGraphProperties({ metaRealmPath, loadableRealmPath, graphName, newPropertyNames, reloadRealm }: RGUpdatePropertiesParams): Promise<void> {
    // 1. Create updated graph schemas
    const newBaseSchema: Realm.ObjectSchema = genBaseSchema(graphName, newPropertyNames);
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
    // 2. Save updated RealmGraph schemas
    for(let schema of updatedSchemas) {
        MetaRealm.updateSchema({ metaRealmPath, loadableRealmPath, schema });
    }

    // 3. Reload Realm with updated schemas
    await reloadRealm();
};

const _createCatalystGraph = (graphName: string, propertyNames: string[], loadRealmSync: () => Realm): CatalystGraph => {
    const _getNodeSchemaName = () => genNodeSchemaName(graphName);
    const _getEdgeSchemaName = () => genEdgeSchemaName(graphName);

    return new CatalystGraph({
        propertyNames,
        saveNode: (node: CGNode) => {
            try {
                const loadedGraphRealm: Realm = loadRealmSync();
                loadedGraphRealm.write(() => loadedGraphRealm.create(_getNodeSchemaName(), node, Realm.UpdateMode.Never));
            } catch (err) {
                // Error thrown to prevent writing duplicate; Do nothing
                console.log(err);
            }
        },
        saveEdge: (edge: CGEdge) => {
            try {
                const loadedGraphRealm: Realm = loadRealmSync();
                loadedGraphRealm.write(() => loadedGraphRealm.create(_getEdgeSchemaName(), edge, Realm.UpdateMode.Never));
            } catch (err) {
                // Error thrown to prevent writing duplicate; Do nothing
                console.log(err);
            }
        },
        getNode: (nodeId: string) => {
            const loadedGraphRealm: Realm = loadRealmSync();

            const node: (Realm.Object & CGNode) | undefined = loadedGraphRealm!.objectForPrimaryKey(_getNodeSchemaName(), nodeId);
            return node != undefined ? node.toJSON() : undefined;
        },
        getEdge: (edgeId: string) => {
            const loadedGraphRealm: Realm = loadRealmSync();

            const edge: (Realm.Object & CGEdge) | undefined = loadedGraphRealm!.objectForPrimaryKey(_getEdgeSchemaName(), edgeId);
            return edge != undefined ? edge.toJSON() : undefined;
        },
        genEdgeId: genEdgeName,
        updateNode: (newNode: CGNode) => {
            // Update logic now happens directly in 'rate' method
            // return;
            // 1. Get node to update
            const loadedGraphRealm: Realm = loadRealmSync();

            const realmNode: (Realm.Object & CGNode) | undefined = loadedGraphRealm.objectForPrimaryKey(_getNodeSchemaName(), newNode.id);
            // Does not exist
            if (!realmNode || (!!realmNode && Object.keys(realmNode!.toJSON()).length === 0)) return;

            // 2. Update all properties
            loadedGraphRealm.write(() => {
                DictUtils.updateRecursive(realmNode!, newNode);
            });
        },
        updateEdge: (newEdge: CGEdge) => {
            // Update logic now happens directly in 'rate' method
            // return;
            // 1. Get node to update
            const loadedGraphRealm: Realm = loadRealmSync();

            const realmEdge: (Realm.Object & CGNode) | undefined = loadedGraphRealm.objectForPrimaryKey(_getEdgeSchemaName(), newEdge.id);
            // Does not exist
            if (!realmEdge || (!!realmEdge && Object.keys(realmEdge!.toJSON()).length === 0)) return;

            // 2. Update all properties
            loadedGraphRealm.write(() => {
                DictUtils.updateRecursive(realmEdge!, newEdge);
            });
        },
    });
}
