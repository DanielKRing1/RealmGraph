import fs from 'fs';

import MetaRealm from '@asianpersonn/metarealm';
import RealmGraphManager from '../src';

import { createRealmGraph } from '../src/RealmGraph/realmGraph';
import { RealmGraph } from '../src/RealmGraph/types';
import { genEdgeSchemaName, genNodeSchemaName } from '../src/constants/naming';

const TEST_NAME: string = 'SaveGraphTest';
const TEST_DIRECTORY: string = `__tests__/${TEST_NAME}`;
const META_REALM_PATH1: string = `${TEST_DIRECTORY}/MetaRealm1.path`;
const META_REALM_PATH2: string = `${TEST_DIRECTORY}/MetaRealm2.path`;
const LOADABLE_REALM_PATH1: string = `LoadableRealm1.path`;
const LOADABLE_REALM_PATH2: string = `LoadableRealm2.path`;

const GRAPH_NAME1: string = 'TestGraph1';
const GRAPH_NAME2: string = 'TestGraph2';
const GRAPH_NAME3: string = 'TestGraph3';
const GRAPH_NAME4: string = 'TestGraph4';
const PROPERTY_NAMES1: string[] = [ 'prop1', 'prop2' ];
const PROPERTY_NAMES2: string[] = [ 'prop3', 'prop4' ];
const PROPERTY_NAMES3: string[] = [ 'prop5', 'prop6' ];
const PROPERTY_NAMES4: string[] = [ 'prop7', 'prop8' ];

describe('createRealmGraph', () => {
    beforeAll(() => {
        if (fs.existsSync(TEST_DIRECTORY)) fs.rmSync(TEST_DIRECTORY, { recursive: true });

        fs.mkdirSync(TEST_DIRECTORY);
    });

    it('Should save Graph1 Node and Edge Schemas to the LoadableRealm1 LoadableSchemas table', async () => {
        const realmGraph: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME1,
            propertyNames: PROPERTY_NAMES1,
        });

        const nodeSchemaName: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName: string = genEdgeSchemaName(GRAPH_NAME1);
        const schemaNames: string[] = MetaRealm.getSchemaNames(META_REALM_PATH1, LOADABLE_REALM_PATH1);

        expect(schemaNames.sort()).toEqual([ nodeSchemaName, edgeSchemaName ].sort());
        expect(realmGraph.getPropertyNames().sort()).toEqual(PROPERTY_NAMES1.sort());
    });

    it('Should load the LoadableRealm with Graph1 schemas', async () => {
        const loadableRealm: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH1 });

        const nodeSchemaName: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName: string = genEdgeSchemaName(GRAPH_NAME1);
        
        const loadedSchemaNames: string[] = loadableRealm.schema.map((schema) => schema.name);
        expect(loadedSchemaNames.sort()).toEqual([ nodeSchemaName, edgeSchemaName ].sort());
    });

    it('Should save Graph2 to LoadableRealm1 without affecting Graph1', async () => {
        // GRAPH 1 and 2
        const realmGraph: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME2,
            propertyNames: PROPERTY_NAMES2,
        });

        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        const schemaNames: string[] = MetaRealm.getSchemaNames(META_REALM_PATH1, LOADABLE_REALM_PATH1);

        expect(schemaNames.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
        expect(realmGraph.getPropertyNames().sort()).toEqual(PROPERTY_NAMES2.sort());
    });

    it('Should load LoadableRealm1 with Graph1 AND Graph2 schemas', async () => {
        // GRAPH 1 and 2
        const loadableRealm: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH1 });

        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        
        const loadedSchemaNames: string[] = loadableRealm.schema.map((schema) => schema.name);
        expect(loadedSchemaNames.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
    });

    it('Should save Graph3 to LoadableRealm2 without affecting Graph1 or Graph2', async () => {
        // GRAPH 3
        const realmGraph3: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH2,
            graphName: GRAPH_NAME3,
            propertyNames: PROPERTY_NAMES3,
        });

        const nodeSchemaName3: string = genNodeSchemaName(GRAPH_NAME3);
        const edgeSchemaName3: string = genEdgeSchemaName(GRAPH_NAME3);
        const schemaNames3: string[] = MetaRealm.getSchemaNames(META_REALM_PATH1, LOADABLE_REALM_PATH2);

        expect(schemaNames3.sort()).toEqual([ nodeSchemaName3, edgeSchemaName3 ].sort());
        expect(realmGraph3.getPropertyNames().sort()).toEqual(PROPERTY_NAMES3.sort());

        // GRAPH 1 and 2
        const realmGraph1: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME2,
            propertyNames: PROPERTY_NAMES2,
        });

        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        const schemaNames1: string[] = MetaRealm.getSchemaNames(META_REALM_PATH1, LOADABLE_REALM_PATH1);

        expect(schemaNames1.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
    });

    it('Should load LoadableRealm2 with Graph3 schemas without affecting Graph 1 or 2', async () => {
        // GRAPH 3
        const loadableRealm3: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH2 });

        const nodeSchemaName3: string = genNodeSchemaName(GRAPH_NAME3);
        const edgeSchemaName3: string = genEdgeSchemaName(GRAPH_NAME3);
        
        const loadedSchemaNames2: string[] = loadableRealm3.schema.map((schema) => schema.name);
        expect(loadedSchemaNames2.sort()).toEqual([ nodeSchemaName3, edgeSchemaName3 ].sort());

        // GRAPH 1 and 2
        const loadableRealm1: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH1 });

        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        
        const loadedSchemaNames1: string[] = loadableRealm1.schema.map((schema) => schema.name);
        expect(loadedSchemaNames1.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
    });

    it('Should save Graph4 to MetaRealm2.LoadableRealm1 without affecting Graph 1-3', async () => {
        // GRAPH 4
        const realmGraph4: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH2,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME4,
            propertyNames: PROPERTY_NAMES4,
        });

        const nodeSchemaName4: string = genNodeSchemaName(GRAPH_NAME4);
        const edgeSchemaName4: string = genEdgeSchemaName(GRAPH_NAME4);
        const schemaNames4: string[] = MetaRealm.getSchemaNames(META_REALM_PATH2, LOADABLE_REALM_PATH1);

        expect(schemaNames4.sort()).toEqual([ nodeSchemaName4, edgeSchemaName4 ].sort());
        expect(realmGraph4.getPropertyNames().sort()).toEqual(PROPERTY_NAMES4.sort());

        // GRAPH 3
        const realmGraph3: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH2,
            graphName: GRAPH_NAME3,
            propertyNames: PROPERTY_NAMES3,
        });

        const nodeSchemaName3: string = genNodeSchemaName(GRAPH_NAME3);
        const edgeSchemaName3: string = genEdgeSchemaName(GRAPH_NAME3);
        const schemaNames3: string[] = MetaRealm.getSchemaNames(META_REALM_PATH1, LOADABLE_REALM_PATH2);

        expect(schemaNames3.sort()).toEqual([ nodeSchemaName3, edgeSchemaName3 ].sort());

        // GRAPH 1 and 2
        const realmGraph1: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME2,
            propertyNames: PROPERTY_NAMES2,
        });

        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        const schemaNames1: string[] = MetaRealm.getSchemaNames(META_REALM_PATH1, LOADABLE_REALM_PATH1);

        expect(schemaNames1.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
    });

    it('Should load MetaRealm2.LoadableRealm1 with Graph3 schemas without affecting Graph 1-3', async () => {
        // GRAPH 4
        const loadableRealm4: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH2, loadableRealmPath: LOADABLE_REALM_PATH1 });

        const nodeSchemaName4: string = genNodeSchemaName(GRAPH_NAME4);
        const edgeSchemaName4: string = genEdgeSchemaName(GRAPH_NAME4);
        
        const loadedSchemaNames4: string[] = loadableRealm4.schema.map((schema) => schema.name);
        expect(loadedSchemaNames4.sort()).toEqual([ nodeSchemaName4, edgeSchemaName4 ].sort());

        // GRAPH 3
        const loadableRealm3: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH2 });

        const nodeSchemaName3: string = genNodeSchemaName(GRAPH_NAME3);
        const edgeSchemaName3: string = genEdgeSchemaName(GRAPH_NAME3);
        
        const loadedSchemaNames2: string[] = loadableRealm3.schema.map((schema) => schema.name);
        expect(loadedSchemaNames2.sort()).toEqual([ nodeSchemaName3, edgeSchemaName3 ].sort());

        // GRAPH 1 and 2
        const loadableRealm1: Realm = await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH1 });

        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        
        const loadedSchemaNames1: string[] = loadableRealm1.schema.map((schema) => schema.name);
        expect(loadedSchemaNames1.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
    });

    afterAll(async () => {
await RealmGraphManager.closeAllGraphs();

        if (fs.existsSync(TEST_DIRECTORY)) fs.rmSync(TEST_DIRECTORY, { recursive: true });
    });      
});
