import fs from 'fs';

import { RatingMode } from 'catalyst-graph';
import MetaRealm from '@asianpersonn/metarealm';
import { createRealmGraph } from '../src/RealmGraph/realmGraph';
import { RealmGraph } from '../src/RealmGraph/types';
import realmGraphManager from '../src/RealmGraphManager/realmGraphManager';
import { Dict } from '../src/types';

const TEST_NAME: string = 'UndoRateTest';
const TEST_DIRECTORY: string = `__tests__/${TEST_NAME}`;
const META_REALM_PATH1: string = `${TEST_DIRECTORY}/MetaRealm1.path`;
const LOADABLE_REALM_PATH1: string = `LoadableRealm1.path`;

const GRAPH_NAME1: string = 'TestGraph1';

const PROPERTY_NAMES1: string[] = ['prop1', 'prop2'];

let expectedNodes = [];
let expectedEdges = [];

describe('RealmGraphManager', () => {
    beforeAll(() => {
        if (fs.existsSync(TEST_DIRECTORY)) fs.rmSync(TEST_DIRECTORY, { recursive: true });

        fs.mkdirSync(TEST_DIRECTORY);
    });

    it('Should load all graphs in same realm', async () => {
        await createRealmGraph({
            metaRealmPath: META_REALM_PATH1,
            loadableRealmPath: LOADABLE_REALM_PATH1,
            graphName: GRAPH_NAME1,
            propertyNames: PROPERTY_NAMES1,
        });

        await realmGraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH1);
    });

    it('Should rate Graph1 and save the state of the graph nodes and edges', async () => {
        const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME1);

        graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], 9, [0.25, 0.25, 0.25, 0.25], RatingMode.Single);
        graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], 9, [0.25, 0.25, 0.25, 0.25], RatingMode.Collective);

        graph.rate('prop1', ['basketball', 'eat', 'sleep'], 7.5, [0.333, 0.333, 0.333], RatingMode.Single);
        graph.rate('prop1', ['basketball', 'eat', 'sleep'], 7.5, [0.333, 0.333, 0.333], RatingMode.Collective);

        graph.rate('prop1', ['eat', 'run', 'sleep'], 5, [0.333, 0.333, 0.333], RatingMode.Single);
        graph.rate('prop1', ['eat', 'run', 'sleep'], 5, [0.333, 0.333, 0.333], RatingMode.Collective);

        graph.rate('prop1', ['basketball', 'sleep'], 7, [0.5, 0.5], RatingMode.Single);
        graph.rate('prop1', ['basketball', 'sleep'], 7, [0.5, 0.5], RatingMode.Collective);
        
        graph.rate('prop1', ['eat', 'sleep'], 4, [0.5, 0.5], RatingMode.Single);
        graph.rate('prop1', ['eat', 'sleep'], 4, [0.5, 0.5], RatingMode.Collective);
        
        graph.rate('prop1', ['basketball', 'sleep', 'skate'], 7.5, [0.333, 0.333, 0.333], RatingMode.Single);
        graph.rate('prop1', ['basketball', 'sleep', 'skate'], 7.5, [0.333, 0.333, 0.333], RatingMode.Collective);

        // SAVE NODES AND EDGES
        expectedNodes = graph.getAllNodes().toJSON();
        expectedEdges = graph.getAllEdges().toJSON();
    });

    it('Should perform another rating', async () => {
        const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME1);

        graph.rate('prop1', ['basketball', 'sleep', 'skate'], 7.5, [0.333, 0.333, 0.333], RatingMode.Single);
        graph.rate('prop1', ['basketball', 'sleep', 'skate'], 7.5, [0.333, 0.333, 0.333], RatingMode.Collective);
    });

    it('Should undo the last rating, reverting node and edge weights back', async () => {
        const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME1);

        graph.undoRate('prop1', ['basketball', 'sleep', 'skate'], 7.5, [0.333, 0.333, 0.333], RatingMode.Single);
        graph.undoRate('prop1', ['basketball', 'sleep', 'skate'], 7.5, [0.333, 0.333, 0.333], RatingMode.Collective);

        const actualNodes = graph.getAllNodes().toJSON();
        const actualEdges = graph.getAllEdges().toJSON();

        expect(actualNodes).toEqual(expectedNodes);
        expect(actualEdges).toEqual(expectedEdges);
    });

    afterAll(async () => {
        await MetaRealm.MetaRealmManager.closeAll();
        await MetaRealm.LoadableRealmManager.closeAll();

        if (fs.existsSync(TEST_DIRECTORY)) fs.rmSync(TEST_DIRECTORY, { recursive: true });
    });
});
