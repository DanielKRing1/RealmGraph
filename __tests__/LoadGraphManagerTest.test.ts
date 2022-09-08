import fs from 'fs';

import MetaRealm from '@asianpersonn/metarealm';

import GraphManager from '../src/RealmGraphManager/realmGraphManager';
import { RealmGraph } from '../src/RealmGraph/types';
import { genEdgeSchemaName, genNodeSchemaName } from '../src/constants/naming';
import { createRealmGraph } from '../src/RealmGraph/realmGraph';

const TEST_NAME: string = 'LoadGraphManagerTest';
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

    it('Should save Graphs 1-4 and then close them', async () => {
        // GRAPH 1
        const realmGraph1: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME1,
            propertyNames: PROPERTY_NAMES1,
        });
        // GRAPH 2
        const realmGraph2: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME2,
            propertyNames: PROPERTY_NAMES2,
        });
        // GRAPH 3
        const realmGraph3: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH2,
            graphName: GRAPH_NAME3,
            propertyNames: PROPERTY_NAMES3,
        });
        // GRAPH 4
        const realmGraph4: RealmGraph = await createRealmGraph({
            metaRealmPath: META_REALM_PATH2,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME4,
            propertyNames: PROPERTY_NAMES4,
        });

        MetaRealm.LoadableRealmManager.closeAll();
        MetaRealm.MetaRealmManager.closeAll();
    });

    it('Should load Graphs 1-2', async () => {
        await GraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH1);

        const schemaNames: string [] = (await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH1 })).schema.map((schema) => schema.name);
        const nodeSchemaName1: string = genNodeSchemaName(GRAPH_NAME1);
        const edgeSchemaName1: string = genEdgeSchemaName(GRAPH_NAME1);
        const nodeSchemaName2: string = genNodeSchemaName(GRAPH_NAME2);
        const edgeSchemaName2: string = genEdgeSchemaName(GRAPH_NAME2);
        expect(schemaNames.sort()).toEqual([ nodeSchemaName1, edgeSchemaName1, nodeSchemaName2, edgeSchemaName2 ].sort());
    });

    it('Should load Graph 3', async () => {
        await GraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH2);

        const schemaNames: string [] = (await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH1, loadableRealmPath: LOADABLE_REALM_PATH2 })).schema.map((schema) => schema.name);
        const nodeSchemaName3: string = genNodeSchemaName(GRAPH_NAME3);
        const edgeSchemaName3: string = genEdgeSchemaName(GRAPH_NAME3);
        expect(schemaNames.sort()).toEqual([ nodeSchemaName3, edgeSchemaName3 ].sort());
    });

    it('Should load Graph 4', async () => {
        await GraphManager.loadGraphs(META_REALM_PATH2, LOADABLE_REALM_PATH1);

        const schemaNames: string [] = (await MetaRealm.LoadableRealmManager.loadRealm({ metaRealmPath: META_REALM_PATH2, loadableRealmPath: LOADABLE_REALM_PATH1 })).schema.map((schema) => schema.name);
        const nodeSchemaName4: string = genNodeSchemaName(GRAPH_NAME4);
        const edgeSchemaName4: string = genEdgeSchemaName(GRAPH_NAME4);
        expect(schemaNames.sort()).toEqual([ nodeSchemaName4, edgeSchemaName4 ].sort());
    });

    afterAll(async () => {
        await MetaRealm.MetaRealmManager.closeAll();
        await MetaRealm.LoadableRealmManager.closeAll();
        
        if (fs.existsSync(TEST_DIRECTORY)) fs.rmSync(TEST_DIRECTORY, { recursive: true });
    });      
});
