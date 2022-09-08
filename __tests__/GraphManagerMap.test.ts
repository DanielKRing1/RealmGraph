import fs from 'fs';

import MetaRealm from '@asianpersonn/metarealm';

import GraphManager from '../src/RealmGraphManager/realmGraphManager';
import { RealmGraph } from '../src/RealmGraph/types';
import { genEdgeSchemaName, genNodeSchemaName } from '../src/constants/naming';
import { createRealmGraph } from '../src/RealmGraph/realmGraph';

const TEST_NAME: string = 'GraphManagerMapTest';
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

    it('Should have no graph names loaded but should be able to load 4 RealmGraphs', async () => {
        expect(GraphManager.getAllLoadedGraphNames().sort()).toEqual([]);
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME1, GRAPH_NAME2 ].sort())
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).sort()).toEqual([ GRAPH_NAME3 ].sort())
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME4 ].sort())
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH2).sort()).toEqual([].sort())
    });

    it('Should load all 4 RealmGraphs', async () => {
        await GraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH1);
        await GraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH2);
        await GraphManager.loadGraphs(META_REALM_PATH2, LOADABLE_REALM_PATH1);

        expect(GraphManager.getAllLoadedGraphNames().sort()).toEqual([ GRAPH_NAME1, GRAPH_NAME2, GRAPH_NAME3, GRAPH_NAME4 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME1, GRAPH_NAME2 ].sort())
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).sort()).toEqual([ GRAPH_NAME3 ].sort())
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME4 ].sort())
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH2).sort()).toEqual([].sort())
    });

    it('Should have 4 Graphs cached', async () => {
        expect(GraphManager.getAllLoadedGraphs().length).toEqual(4);
    });

    it('Should get each graph in map', async () => {
        // Verify that each RealmGraph is in the map by checking their property names
        const graph1: RealmGraph = GraphManager.getGraph(GRAPH_NAME1);
        const graph2: RealmGraph = GraphManager.getGraph(GRAPH_NAME2);
        const graph3: RealmGraph = GraphManager.getGraph(GRAPH_NAME3);
        const graph4: RealmGraph = GraphManager.getGraph(GRAPH_NAME4);

        expect(graph1.getPropertyNames().sort()).toEqual(PROPERTY_NAMES1.sort());
        expect(graph2.getPropertyNames().sort()).toEqual(PROPERTY_NAMES2.sort());
        expect(graph3.getPropertyNames().sort()).toEqual(PROPERTY_NAMES3.sort());
        expect(graph4.getPropertyNames().sort()).toEqual(PROPERTY_NAMES4.sort());
    });

    
    it('Should remove Graph1', async () => {
        GraphManager.rmGraph(GRAPH_NAME1);

        expect(GraphManager.getAllLoadedGraphNames().sort()).toEqual([ GRAPH_NAME2, GRAPH_NAME3, GRAPH_NAME4 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME2 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).sort()).toEqual([ GRAPH_NAME3 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME4 ].sort());
    });

    it('Should remove Graph2', async () => {
        GraphManager.rmGraph(GRAPH_NAME2);

        expect(GraphManager.getAllLoadedGraphNames().sort()).toEqual([ GRAPH_NAME3, GRAPH_NAME4 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).sort()).toEqual([].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).sort()).toEqual([ GRAPH_NAME3 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME4 ].sort());
    });

    it('Should remove Graph3', async () => {
        GraphManager.rmGraph(GRAPH_NAME3);

        expect(GraphManager.getAllLoadedGraphNames().sort()).toEqual([ GRAPH_NAME4 ].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).sort()).toEqual([].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).sort()).toEqual([].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).sort()).toEqual([ GRAPH_NAME4 ].sort());
    });

    it('Should remove Graph4', async () => {
        GraphManager.rmGraph(GRAPH_NAME4);

        expect(GraphManager.getAllLoadedGraphNames().sort()).toEqual([].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).sort()).toEqual([].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).sort()).toEqual([].sort());
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).sort()).toEqual([].sort());
    });

    it('Should have deleted all LoadableRealms and now close all Realms', async () => {
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH1).length).toEqual(0);
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH1, LOADABLE_REALM_PATH2).length).toEqual(0);
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH1).length).toEqual(0);
        expect(GraphManager.getLoadableGraphNames(META_REALM_PATH2, LOADABLE_REALM_PATH2).length).toEqual(0);

        MetaRealm.LoadableRealmManager.closeAll();
        MetaRealm.MetaRealmManager.closeAll();
    });

    afterAll(async () => {
        await MetaRealm.MetaRealmManager.closeAll();
        await MetaRealm.LoadableRealmManager.closeAll();

        if (fs.existsSync(TEST_DIRECTORY)) fs.rmSync(TEST_DIRECTORY, { recursive: true });
    });      
});
