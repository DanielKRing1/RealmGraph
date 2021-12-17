import Realm from 'realm';
import DictUtils from '@asianpersonn/dict-utils';
import DynamicRealm from 'dynamic-realm';
import CatalystGraph, {
    genPropertiesObj, CGNode, CGEdge, RatingMode, RateReturn, GraphEntity,
} from 'catalyst-graph';

import { Dict } from './types/global';
import { SaveSchemaParams } from 'dynamic-realm/dist/Functions/types/types';

const ID_KEY: string = 'id';

const genDefaultGraphRealmPath = (graphName: string): string => `${graphName}.path`;

/**
 * Create a base schema for node/edge GraphEntities
 *
 * @param schemaName
 * @param properties
 * @returns
 */
const genSchema = (schemaName: string, properties: string[]): Realm.ObjectSchema => {
    // 1. Create dummy graph entity
    const graphProperties: Dict<any> = genPropertiesObj(properties);

    // 2. Replace property values with float data type
    const schemaProperties: Dict<string> = DictUtils.mutateDict(graphProperties, (key: string, value: any) => 'float');

    // 3. Add id to schema properties
    return {
        name: schemaName,
        primaryKey: ID_KEY,
        properties: {
            ...schemaProperties,
            [ID_KEY]: 'string',
        },
    };
};

const NODE_SCHEMA_SUFFIX: string = '_NODE';
const EDGE_SCHEMA_SUFFIX: string = '_EDGE';
const genNodeSchemaName = (graphName: string): string => `${graphName}${NODE_SCHEMA_SUFFIX}`;
const genEdgeSchemaName = (graphName: string): string => `${graphName}${EDGE_SCHEMA_SUFFIX}`;

const EDGE_NAME_DELIM: string = '-';
/**
 * Sort node 1 and 2 id's alphabetically and concat with a delim to create id
 *
 * @param node1Id
 * @param node2Id
 * @returns
 */
const genEdgeName = (node1Id: string, node2Id: string): string => (node1Id.toLowerCase() < node2Id.toLowerCase() ? `${node1Id}${EDGE_NAME_DELIM}${node2Id}` : `${node2Id}${EDGE_NAME_DELIM}${node1Id}`);

type RGSetup = {
    realmPath?: string;
    graphName: string;
    propertyNames: string[];
};

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

    _getNodeSchemaName() {
        return genNodeSchemaName(this.graphName);
    }

    _getEdgeSchemaName() {
        return genEdgeSchemaName(this.graphName);
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
}
