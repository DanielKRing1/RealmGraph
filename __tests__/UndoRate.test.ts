import { RatingMode } from 'catalyst-graph';
import realmGraphManager, { RealmGraph } from '../src';
import { Dict } from '../src/types/global';

// @ts-ignore
jest.mock('realm', () => require('@asianpersonn/realm-mock'));

const manager1GraphName1: string = 'Manager1TestGraph1';
const manager1PropertyNames1: string[] = [ 'prop1', 'prop2' ];

const TEST_META_REALM_PATH_1: string = 'TEST_META_REALM_PATH_1.path';

const TEST_LOADABLE_REALM_PATH: string = 'TEST_LOADABLE_REALM_PATH_1';

// @ts-ignore
describe('RealmGraphManager', () => {
  // @ts-ignore
  it('Should load all graphs in same realm', async () => {
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_1,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager1GraphName1,
        propertyNames: manager1PropertyNames1,
    });
  });

  it('Should rate the graph', async () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;

    graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], 9, [0.25, 0.25, 0.25, 0.25], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], 9, [0.25, 0.25, 0.25, 0.25], RatingMode.Collective);

    graph.rate('prop1', ['basketball', 'eat', 'sleep'], 7.5, [0.333, 0.333, 0.333], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'eat', 'sleep'], 7.5, [0.333, 0.333, 0.333], RatingMode.Collective);

    graph.rate('prop1', ['eat', 'run', 'sleep'], 5, [0.333, 0.333, 0.333], RatingMode.Single);
    graph.rate('prop1', ['eat', 'run', 'sleep'], 5, [0.333, 0.333, 0.333], RatingMode.Collective);

    graph.rate('prop1', ['basketball', 'sleep'], 7, [0.5, 0.5], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'sleep'], 7, [0.5, 0.5], RatingMode.Collective);

  });

  // @ts-ignore
  it('Should have rated the graph properly', async () => {
    // RealmGraphManager 1
    const graph11: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;
    const expectedPageRankResult11: Dict<Dict<number>> = {
        eat: {
          prop1_SINGLE_AVG: 0.2418584359451662,
          prop1_COLLECTIVE_AVG: 0.2418584359451662,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        run: {
          prop1_SINGLE_AVG: 0.24818188738500696,
          prop1_COLLECTIVE_AVG: 0.24818188738500696,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop1_SINGLE_AVG: 0.23601861219764136,
          prop1_COLLECTIVE_AVG: 0.23601861219764136,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop1_SINGLE_AVG: 0.2739410644721852,
          prop1_COLLECTIVE_AVG: 0.2739410644721852,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph11.pageRank(50, 1)).toEqual(expectedPageRankResult11);
    // console.log(graph11.pageRank(50, 1));
  });

  it('Should be able to undo the ratings by applying a negative rating', async () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;

    console.log(graph.getAllNodes());
    console.log(graph.getAllEdges());

    graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], -9, [-0.25, -0.25, -0.25, -0.25], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], -9, [-0.25, -0.25, -0.25, -0.25], RatingMode.Collective);

    graph.rate('prop1', ['basketball', 'eat', 'sleep'], -7.5, [-0.333, -0.333, -0.333], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'eat', 'sleep'], -7.5, [-0.333, -0.333, -0.333], RatingMode.Collective);

    graph.rate('prop1', ['eat', 'run', 'sleep'], -5, [-0.333, -0.333, -0.333], RatingMode.Single);
    graph.rate('prop1', ['eat', 'run', 'sleep'], -5, [-0.333, -0.333, -0.333], RatingMode.Collective);

    graph.rate('prop1', ['basketball', 'sleep'], -7, [-0.5, -0.5], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'sleep'], -7, [-0.5, -0.5], RatingMode.Collective);

    console.log(graph.getAllNodes());
    console.log(graph.getAllEdges());
    
  });

  // @ts-ignore
  it('Should have rated the graph properly', async () => {
    // RealmGraphManager 1
    const graph11: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;
    const expectedPageRankResult11: Dict<Dict<number>> = {
        eat: {
          prop1_SINGLE_AVG: 0,
          prop1_COLLECTIVE_AVG: 0,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        run: {
          prop1_SINGLE_AVG: 0,
          prop1_COLLECTIVE_AVG: 0,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop1_SINGLE_AVG: 0,
          prop1_COLLECTIVE_AVG: 0,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop1_SINGLE_AVG: 0,
          prop1_COLLECTIVE_AVG: 0,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph11.pageRank(50, 1)).toEqual(expectedPageRankResult11);
    // console.log(graph11.pageRank(50, 1));
  });
});
