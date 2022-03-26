import { RatingMode } from 'catalyst-graph';
import realmGraphManager, { RealmGraph } from '../src';
import { Dict } from '../src/types/global';

// @ts-ignore
jest.mock('realm', () => require('@asianpersonn/realm-mock'));

const manager1GraphName1: string = 'Manager1TestGraph1';
const manager1PropertyNames1: string[] = [ 'prop1', 'prop2' ];

const manager1GraphName2: string = 'Manager1TestGraph2';
const manager1PropertyNames2: string[] = [ 'prop3', 'prop4' ];


const manager1GraphName3: string = 'Manager1TestGraph3';
const manager1PropertyNames3: string[] = [ 'prop5', 'prop6' ];

const manager2GraphName1: string = 'Manager2TestGraph1';
const manager2PropertyNames1: string[] = [ 'prop7', 'prop8' ];

const manager2GraphName2: string = 'Manager2TestGraph2';
const manager2PropertyNames2: string[] = [ 'prop9', 'prop10' ];

const manager2GraphName3: string = 'Manager2TestGraph3';
const manager2PropertyNames3: string[] = [ 'prop11', 'prop12' ];

const TEST_META_REALM_PATH_1: string = 'TEST_META_REALM_PATH_1.path';
const TEST_META_REALM_PATH_2: string = 'TEST_META_REALM_PATH_2.path';

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
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_1,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager1GraphName2,
        propertyNames: manager1PropertyNames2,
    });
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_1,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager1GraphName3,
        propertyNames: manager1PropertyNames3,
    });

    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_2,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager2GraphName1,
        propertyNames: manager2PropertyNames1,
    });
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_2,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager2GraphName2,
        propertyNames: manager2PropertyNames2,
    });
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_2,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager2GraphName3,
        propertyNames: manager2PropertyNames3,
    });
  });

  it('Should give access to manager1graph1', async () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;

    graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('prop1', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop1', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop1', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop1', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('prop1', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);

    // console.log(realmGraphManager);
    // console.log(realmGraphManager.realmGraphCache[manager1GraphName1].catalystGraph);
    // console.log(realmGraphManager.realmGraphCache[manager1GraphName1].realm);

    console.log(graph.getAllNodes());
  });

  it('Should give access to manager1graph1', () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager1GraphName2)!;
    console.log('heyo')
    console.log(graph)

    graph.rate('prop4', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('prop4', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('prop4', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop4', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop4', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop4', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop4', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('prop4', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);

    console.log(graph.getAllNodes());

    const graph1: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;
    console.log(graph1.getAllNodes());
  });

  it('Should give access to manager1graph1', () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager1GraphName3)!;

    graph.rate('prop5', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('prop5', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('prop5', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop5', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop5', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop5', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop5', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('prop5', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);
  });

  it('Should give access to manager1graph1', () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager2GraphName1)!;

    graph.rate('prop8', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('prop8', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('prop8', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop8', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop8', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop8', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop8', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('prop8', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);
  });

  it('Should give access to manager1graph1', () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager2GraphName2)!;

    graph.rate('prop9', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('prop9', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('prop9', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop9', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop9', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop9', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop9', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('prop9', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);
  });

  it('Should give access to manager1graph1', () => {
    const graph: RealmGraph = realmGraphManager.getGraph(manager2GraphName3)!;

    graph.rate('prop11', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('prop11', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('prop11', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop11', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop11', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('prop11', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('prop11', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('prop11', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);
  });

  // @ts-ignore
  it('Should have rated each graph separately', async () => {
    // RealmGraphManager 1
    const graph11: RealmGraph = realmGraphManager.getGraph(manager1GraphName1)!;
    const expectedPageRankResult11: Dict<Dict<number>> = {
        eat: {
          prop1_SINGLE_AVG: 0.24124809741248143,
          prop1_COLLECTIVE_AVG: 0.24124809741248143,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        run: {
          prop1_SINGLE_AVG: 0.24733637747336423,
          prop1_COLLECTIVE_AVG: 0.24733637747336423,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop1_SINGLE_AVG: 0.2336377473363779,
          prop1_COLLECTIVE_AVG: 0.2336377473363779,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop1_SINGLE_AVG: 0.2777777777777783,
          prop1_COLLECTIVE_AVG: 0.2777777777777783,
          prop2_SINGLE_AVG: 0,
          prop2_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph11.pageRank(50, 1)).toEqual(expectedPageRankResult11);
    console.log(graph11.pageRank(50, 1));

    const graph12: RealmGraph = realmGraphManager.getGraph(manager1GraphName2)!;
    const expectedPageRankResult12: Dict<Dict<number>> = {
        eat: {
          prop4_SINGLE_AVG: 0.24124809741248143,
          prop4_COLLECTIVE_AVG: 0.24124809741248143,
          prop3_SINGLE_AVG: 0,
          prop3_COLLECTIVE_AVG: 0,
        },
        run: {
          prop4_SINGLE_AVG: 0.24733637747336423,
          prop4_COLLECTIVE_AVG: 0.24733637747336423,
          prop3_SINGLE_AVG: 0,
          prop3_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop4_SINGLE_AVG: 0.2336377473363779,
          prop4_COLLECTIVE_AVG: 0.2336377473363779,
          prop3_SINGLE_AVG: 0,
          prop3_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop4_SINGLE_AVG: 0.2777777777777783,
          prop4_COLLECTIVE_AVG: 0.2777777777777783,
          prop3_SINGLE_AVG: 0,
          prop3_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph12.pageRank(50, 1)).toEqual(expectedPageRankResult12);
    console.log(graph12.pageRank(50, 1));

    const graph13: RealmGraph = realmGraphManager.getGraph(manager1GraphName3)!;
    const expectedPageRankResult13: Dict<Dict<number>> = {
        eat: {
          prop5_SINGLE_AVG: 0.24124809741248143,
          prop5_COLLECTIVE_AVG: 0.24124809741248143,
          prop6_SINGLE_AVG: 0,
          prop6_COLLECTIVE_AVG: 0,
        },
        run: {
          prop5_SINGLE_AVG: 0.24733637747336423,
          prop5_COLLECTIVE_AVG: 0.24733637747336423,
          prop6_SINGLE_AVG: 0,
          prop6_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop5_SINGLE_AVG: 0.2336377473363779,
          prop5_COLLECTIVE_AVG: 0.2336377473363779,
          prop6_SINGLE_AVG: 0,
          prop6_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop5_SINGLE_AVG: 0.2777777777777783,
          prop5_COLLECTIVE_AVG: 0.2777777777777783,
          prop6_SINGLE_AVG: 0,
          prop6_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph13.pageRank(50, 1)).toEqual(expectedPageRankResult13);
    console.log(graph13.pageRank(50, 1));

    // RealmGraphManager 2
    const graph21: RealmGraph = realmGraphManager.getGraph(manager2GraphName1)!;
    const expectedPageRankResult21: Dict<Dict<number>> = {
        eat: {
          prop8_SINGLE_AVG: 0.24124809741248143,
          prop8_COLLECTIVE_AVG: 0.24124809741248143,
          prop7_SINGLE_AVG: 0,
          prop7_COLLECTIVE_AVG: 0,
        },
        run: {
          prop8_SINGLE_AVG: 0.24733637747336423,
          prop8_COLLECTIVE_AVG: 0.24733637747336423,
          prop7_SINGLE_AVG: 0,
          prop7_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop8_SINGLE_AVG: 0.2336377473363779,
          prop8_COLLECTIVE_AVG: 0.2336377473363779,
          prop7_SINGLE_AVG: 0,
          prop7_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop8_SINGLE_AVG: 0.2777777777777783,
          prop8_COLLECTIVE_AVG: 0.2777777777777783,
          prop7_SINGLE_AVG: 0,
          prop7_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph21.pageRank(50, 1)).toEqual(expectedPageRankResult21);
    console.log(graph21.pageRank(50, 1));

    const graph22: RealmGraph = realmGraphManager.getGraph(manager2GraphName2)!;
    const expectedPageRankResult22: Dict<Dict<number>> = {
        eat: {
          prop9_SINGLE_AVG: 0.24124809741248143,
          prop9_COLLECTIVE_AVG: 0.24124809741248143,
          prop10_SINGLE_AVG: 0,
          prop10_COLLECTIVE_AVG: 0,
        },
        run: {
          prop9_SINGLE_AVG: 0.24733637747336423,
          prop9_COLLECTIVE_AVG: 0.24733637747336423,
          prop10_SINGLE_AVG: 0,
          prop10_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop9_SINGLE_AVG: 0.2336377473363779,
          prop9_COLLECTIVE_AVG: 0.2336377473363779,
          prop10_SINGLE_AVG: 0,
          prop10_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop9_SINGLE_AVG: 0.2777777777777783,
          prop9_COLLECTIVE_AVG: 0.2777777777777783,
          prop10_SINGLE_AVG: 0,
          prop10_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph22.pageRank(50, 1)).toEqual(expectedPageRankResult22);
    console.log(graph22.pageRank(50, 1));

    const graph23: RealmGraph = realmGraphManager.getGraph(manager2GraphName3)!;
    const expectedPageRankResult23: Dict<Dict<number>> = {
        eat: {
          prop11_SINGLE_AVG: 0.24124809741248143,
          prop11_COLLECTIVE_AVG: 0.24124809741248143,
          prop12_SINGLE_AVG: 0,
          prop12_COLLECTIVE_AVG: 0,
        },
        run: {
          prop11_SINGLE_AVG: 0.24733637747336423,
          prop11_COLLECTIVE_AVG: 0.24733637747336423,
          prop12_SINGLE_AVG: 0,
          prop12_COLLECTIVE_AVG: 0,
        },
        sleep: {
          prop11_SINGLE_AVG: 0.2336377473363779,
          prop11_COLLECTIVE_AVG: 0.2336377473363779,
          prop12_SINGLE_AVG: 0,
          prop12_COLLECTIVE_AVG: 0,
        },
        basketball: {
          prop11_SINGLE_AVG: 0.2777777777777783,
          prop11_COLLECTIVE_AVG: 0.2777777777777783,
          prop12_SINGLE_AVG: 0,
          prop12_COLLECTIVE_AVG: 0,
        }
    }
    expect(graph23.pageRank(50, 1)).toEqual(expectedPageRankResult23);
    console.log(graph23.pageRank(50, 1));
  });
});
