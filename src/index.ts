import Realm from 'realm';
import DictUtils from '@asianpersonn/dict-utils';
import DynamicRealm from 'dynamic-realm';
import CatalystGraph, { genPropertiesObj, CGNode, CGEdge } from 'catalyst-graph';

import { Dict } from './types/global';

const ID_KEY: string = 'id';

const genSchema = (schemaName: string, properties: string[]): Realm.ObjectSchema => {
    // 1. Create dummy graph entity
    const graphEntity: Dict<any> = genPropertiesObj(properties);
    
    // 2. Replace property values with float data type
    const schemaProperties: Dict<string> = DictUtils.mutateDict(graphEntity, (key: string, value: any) => 'float');

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
const genNodeSchemaName = (graphName: string): string => `${graphName}${NODE_SCHEMA_SUFFIX}`
const genEdgeSchemaName = (graphName: string): string => `${graphName}${EDGE_SCHEMA_SUFFIX}`

const genDefaultGraphRealmPath = (graphName: string): string => `${graphName}.path`;

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
        // TODO Add way to prevent duplicate saves
        DynamicRealm.saveSchemas([ nodeSchema, edgeSchema ]);
        this.realm = await DynamicRealm.loadRealm(realmPath);

        // 3. Create CatalystGraphe
        
        this.catalystGraph = new CatalystGraph({
            propertyNames,
            saveNode: (node: CGNode) => this.realm.create(genNodeSchemaName(this.graphName), node),
            saveEdge: (edge: CGEdge) => this.realm.create(genEdgeSchemaName(this.graphName), edge),
            getNode: (nodeId: string) => this.realm.objectForPrimaryKey(genNodeSchemaName(this.graphName), nodeId) as CGNode,
            getEdge: (edgeId: string) => this.realm.objectForPrimaryKey(genEdgeSchemaName(this.graphName), edgeId) as CGEdge,
            genEdgeId: GenEdgeId;
            updateNode: UpdateNode;
            updateEdge: UpdateEdge;
        });
        
        
    }
}