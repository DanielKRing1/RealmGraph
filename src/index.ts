import Realm from 'realm';
import DictUtils from '@asianpersonn/dict-utils';
import DynamicRealm from 'dynamic-realm';
import CatalystGraph, { genPropertiesObj, CGNode, CGEdge } from 'catalyst-graph';

import { Dict } from './types/global';

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
    }
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
const genEdgeName = (node1Id: string, node2Id: string): string => node1Id.toLowerCase() < node2Id.toLowerCase() ? `${node1Id}${EDGE_NAME_DELIM}${node2Id}` : `${node2Id}${EDGE_NAME_DELIM}${node1Id}`;

type RGSetup = {
    realmPath: string;
    graphName: string;
    propertyNames: string[];
};

export class RealmGraph {

    graphName: string;
    realm: Realm;
    catalystGraph: CatalystGraph;

    constructor(args: RGSetup) {
        const { graphName, realmPath = genDefaultGraphRealmPath(graphName), propertyNames } = args;
        this.graphName = graphName;

        // 1. Save node + edge schemas
        const baseSchema: Realm.ObjectSchema = genSchema(this.graphName, propertyNames);
        const nodeSchema: Realm.ObjectSchema = {
            ...baseSchema,
            name: genNodeSchemaName(this.graphName),
            properties: {
                ...baseSchema.properties,
                edgeIds: 'string[]'
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
        await DynamicRealm.init({ realmPath });
        const saveParams: Dict<any>[] = [ nodeSchema, edgeSchema ].map((schema: Realm.ObjectSchema) => ({ realmPath, schema, overwrite: false }));
        DynamicRealm.saveSchemas(saveParams);
        this.realm = await DynamicRealm.loadRealm(realmPath);

        // 3. Create CatalystGraphe
        
        this.catalystGraph = new CatalystGraph({
            propertyNames,
            saveNode: (node: CGNode) => this.realm.write(() => this.realm.create(this._getNodeSchemaName(), node)),
            saveEdge: (edge: CGEdge) => this.realm.write(() => this.realm.create(this._getEdgeSchemaName(), edge)),
            getNode: (nodeId: string) => this.realm.objectForPrimaryKey(this._getNodeSchemaName(), nodeId) as CGNode,
            getEdge: (edgeId: string) => this.realm.objectForPrimaryKey(this._getEdgeSchemaName(), edgeId) as CGEdge,
            genEdgeId: genEdgeName,
            updateNode: (newNode: CGNode) => {
                // 1. Get node to update
                const realmNode: (Realm.Object & CGNode) | undefined = this.realm.objectForPrimaryKey(this._getNodeSchemaName(), newNode.id);
                // Does not exist
                if(!realmNode) return;

                // 2. Update all properties
                this.realm.write(() => {
                    copyRecursive(realmNode, newNode);
                });
            },
            updateEdge: (newEdge: CGEdge) => ,
        });
        
        
    }

    _getNodeSchemaName() {
        return genNodeSchemaName(this.graphName);
    }

    _getEdgeSchemaName() {
        return genEdgeSchemaName(this.graphName);
    }
}
