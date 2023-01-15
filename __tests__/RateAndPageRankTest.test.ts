import fs from "fs";

import { RatingMode } from "catalyst-graph";
import MetaRealm from "@asianpersonn/metarealm";
import RealmGraphManager from "../src";

import { createRealmGraph } from "../src/RealmGraph/realmGraph";
import { RealmGraph } from "../src/RealmGraph/types";
import realmGraphManager from "../src/RealmGraphManager/realmGraphManager";
import { Dict } from "../src/types";

const TEST_NAME: string = "RateAndPageRankTest";
const TEST_DIRECTORY: string = `__tests__/${TEST_NAME}`;
const META_REALM_PATH1: string = `${TEST_DIRECTORY}/MetaRealm1.path`;
const LOADABLE_REALM_PATH1: string = `LoadableRealm1.path`;

const GRAPH_NAME1: string = "TestGraph1";
const GRAPH_NAME2: string = "TestGraph2";
const GRAPH_NAME3: string = "TestGraph3";
const GRAPH_NAME4: string = "TestGraph4";
const GRAPH_NAME5: string = "TestGraph5";
const GRAPH_NAME6: string = "TestGraph6";

const PROPERTY_NAMES1: string[] = ["prop1", "prop2"];
const PROPERTY_NAMES2: string[] = ["prop3", "prop4"];
const PROPERTY_NAMES3: string[] = ["prop5", "prop6"];
const PROPERTY_NAMES4: string[] = ["prop7", "prop8"];
const PROPERTY_NAMES5: string[] = ["prop9", "prop10"];
const PROPERTY_NAMES6: string[] = ["prop11", "prop12"];

describe("RealmGraphManager", () => {
  beforeAll(() => {
    if (fs.existsSync(TEST_DIRECTORY))
      fs.rmSync(TEST_DIRECTORY, { recursive: true });

    fs.mkdirSync(TEST_DIRECTORY);
  });

  it("Should load all graphs in same realm", async () => {
    await createRealmGraph({
      metaRealmPath: META_REALM_PATH1,
      loadableRealmPath: LOADABLE_REALM_PATH1,
      graphName: GRAPH_NAME1,
      propertyNames: PROPERTY_NAMES1,
    });
    await createRealmGraph({
      metaRealmPath: META_REALM_PATH1,
      loadableRealmPath: LOADABLE_REALM_PATH1,
      graphName: GRAPH_NAME2,
      propertyNames: PROPERTY_NAMES2,
    });
    await createRealmGraph({
      metaRealmPath: META_REALM_PATH1,
      loadableRealmPath: LOADABLE_REALM_PATH1,
      graphName: GRAPH_NAME3,
      propertyNames: PROPERTY_NAMES3,
    });
    await createRealmGraph({
      metaRealmPath: META_REALM_PATH1,
      loadableRealmPath: LOADABLE_REALM_PATH1,
      graphName: GRAPH_NAME4,
      propertyNames: PROPERTY_NAMES4,
    });
    await createRealmGraph({
      metaRealmPath: META_REALM_PATH1,
      loadableRealmPath: LOADABLE_REALM_PATH1,
      graphName: GRAPH_NAME5,
      propertyNames: PROPERTY_NAMES5,
    });
    await createRealmGraph({
      metaRealmPath: META_REALM_PATH1,
      loadableRealmPath: LOADABLE_REALM_PATH1,
      graphName: GRAPH_NAME6,
      propertyNames: PROPERTY_NAMES6,
    });

    await realmGraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH1);
  });

  it("Should rate Graph1", async () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME1);

    graph.rate(
      "prop1",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Collective
    );

    graph.rate(
      "prop1",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop1",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop1",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Collective
    );

    graph.rate("prop1", ["eat", "sleep"], 4, [0.5, 0.5], RatingMode.Single);
    graph.rate("prop1", ["eat", "sleep"], 4, [0.5, 0.5], RatingMode.Collective);

    graph.rate(
      "prop1",
      ["basketball", "sleep", "skate"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["basketball", "sleep", "skate"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop1",
      ["basketball", "sleep", "skate"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["basketball", "sleep", "skate"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop1",
      ["eat", "run", "sleep", "skate"],
      2,
      [0.01, 0.01, 0.01, 0.01],
      RatingMode.Single
    );
    graph.rate(
      "prop1",
      ["eat", "run", "sleep", "skate"],
      2,
      [0.01, 0.01, 0.01, 0.01],
      RatingMode.Collective
    );

    // // console.log(realmGraphManager);
    // // console.log(realmGraphManager.realmGraphCache[manager1GraphName1].catalystGraph);
    // // console.log(realmGraphManager.realmGraphCache[manager1GraphName1].realm);

    // // console.log(graph.getAllNodes());
    // console.log(graph.getAllEdges().toJSON());
  });

  it("Should rate Graph2", () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME2);

    graph.rate(
      "prop4",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Single
    );
    graph.rate(
      "prop4",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Collective
    );

    graph.rate(
      "prop4",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop4",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop4",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop4",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop4",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Single
    );
    graph.rate(
      "prop4",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Collective
    );
  });

  it("Should rate Graph3", () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME3);

    graph.rate(
      "prop5",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Single
    );
    graph.rate(
      "prop5",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Collective
    );

    graph.rate(
      "prop5",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop5",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop5",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop5",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop5",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Single
    );
    graph.rate(
      "prop5",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Collective
    );
  });

  it("Should rate Graph4", () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME4);

    graph.rate(
      "prop8",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Single
    );
    graph.rate(
      "prop8",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Collective
    );

    graph.rate(
      "prop8",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop8",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop8",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop8",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop8",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Single
    );
    graph.rate(
      "prop8",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Collective
    );
  });

  it("Should rate Graph5", () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME5);

    graph.rate(
      "prop9",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Single
    );
    graph.rate(
      "prop9",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Collective
    );

    graph.rate(
      "prop9",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop9",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop9",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop9",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop9",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Single
    );
    graph.rate(
      "prop9",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Collective
    );
  });

  it("Should give access to Graph6", () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME6);

    graph.rate(
      "prop11",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Single
    );
    graph.rate(
      "prop11",
      ["basketball", "eat", "run", "sleep"],
      9,
      [0.25, 0.25, 0.25, 0.25],
      RatingMode.Collective
    );

    graph.rate(
      "prop11",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop11",
      ["basketball", "eat", "sleep"],
      7.5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop11",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Single
    );
    graph.rate(
      "prop11",
      ["eat", "run", "sleep"],
      5,
      [0.333, 0.333, 0.333],
      RatingMode.Collective
    );

    graph.rate(
      "prop11",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Single
    );
    graph.rate(
      "prop11",
      ["basketball", "sleep"],
      7,
      [0.5, 0.5],
      RatingMode.Collective
    );
  });

  // @ts-ignore
  it("Should perform PageRank on Graphs 1-6", async () => {
    // RealmGraphManager 1
    const graph1: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME1);

    expect(graph1.getAllNodes().toJSON()).toMatchSnapshot();
    expect(graph1.getAllEdges().toJSON()).toMatchSnapshot();
    expect(graph1.pageRank(1, 1)).toMatchSnapshot();
    expect(graph1.pageRank(50, 1)).toMatchSnapshot();

    // console.log(graph1.rankMostInfluentialToCentralSet(['skate'], 1));
    // console.log(graph1.rankMostInfluentialToCentralSet(['skate'], 50));

    console.log(graph1.rankMostInfluentialToCentralSet(["sleep"], 1));
    console.log(graph1.rankMostInfluentialToCentralSet(["skate"], 1));

    const graph2: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME2);
    const expectedPageRankResult2: Dict<Dict<number>> = {
      eat: {
        prop4_SINGLE_AVG: 0.2418584359451662,
        prop4_COLLECTIVE_AVG: 0.2418584359451662,
        prop3_SINGLE_AVG: 0,
        prop3_COLLECTIVE_AVG: 0,
      },
      run: {
        prop4_SINGLE_AVG: 0.24818188738500696,
        prop4_COLLECTIVE_AVG: 0.24818188738500696,
        prop3_SINGLE_AVG: 0,
        prop3_COLLECTIVE_AVG: 0,
      },
      sleep: {
        prop4_SINGLE_AVG: 0.23601861219764136,
        prop4_COLLECTIVE_AVG: 0.23601861219764136,
        prop3_SINGLE_AVG: 0,
        prop3_COLLECTIVE_AVG: 0,
      },
      basketball: {
        prop4_SINGLE_AVG: 0.2739410644721852,
        prop4_COLLECTIVE_AVG: 0.2739410644721852,
        prop3_SINGLE_AVG: 0,
        prop3_COLLECTIVE_AVG: 0,
      },
    };
    expect(graph2.getAllNodes().toJSON()).toMatchSnapshot();
    expect(graph2.getAllEdges().toJSON()).toMatchSnapshot();
    expect(graph2.pageRank(1, 1)).toMatchSnapshot();
    expect(graph2.pageRank(50, 1)).toMatchSnapshot(); // console.log(graph12.pageRank(50, 1));

    const graph3: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME3);
    const expectedPageRankResult3: Dict<Dict<number>> = {
      eat: {
        prop5_SINGLE_AVG: 0.2418584359451662,
        prop5_COLLECTIVE_AVG: 0.2418584359451662,
        prop6_SINGLE_AVG: 0,
        prop6_COLLECTIVE_AVG: 0,
      },
      run: {
        prop5_SINGLE_AVG: 0.24818188738500696,
        prop5_COLLECTIVE_AVG: 0.24818188738500696,
        prop6_SINGLE_AVG: 0,
        prop6_COLLECTIVE_AVG: 0,
      },
      sleep: {
        prop5_SINGLE_AVG: 0.23601861219764136,
        prop5_COLLECTIVE_AVG: 0.23601861219764136,
        prop6_SINGLE_AVG: 0,
        prop6_COLLECTIVE_AVG: 0,
      },
      basketball: {
        prop5_SINGLE_AVG: 0.2739410644721852,
        prop5_COLLECTIVE_AVG: 0.2739410644721852,
        prop6_SINGLE_AVG: 0,
        prop6_COLLECTIVE_AVG: 0,
      },
    };
    expect(graph3.getAllNodes().toJSON()).toMatchSnapshot();
    expect(graph3.getAllEdges().toJSON()).toMatchSnapshot();
    expect(graph3.pageRank(1, 1)).toMatchSnapshot();
    expect(graph3.pageRank(50, 1)).toMatchSnapshot(); // console.log(graph13.pageRank(50, 1));

    // RealmGraphManager 2
    const graph4: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME4);
    const expectedPageRankResult4: Dict<Dict<number>> = {
      eat: {
        prop8_SINGLE_AVG: 0.2418584359451662,
        prop8_COLLECTIVE_AVG: 0.2418584359451662,
        prop7_SINGLE_AVG: 0,
        prop7_COLLECTIVE_AVG: 0,
      },
      run: {
        prop8_SINGLE_AVG: 0.24818188738500696,
        prop8_COLLECTIVE_AVG: 0.24818188738500696,
        prop7_SINGLE_AVG: 0,
        prop7_COLLECTIVE_AVG: 0,
      },
      sleep: {
        prop8_SINGLE_AVG: 0.23601861219764136,
        prop8_COLLECTIVE_AVG: 0.23601861219764136,
        prop7_SINGLE_AVG: 0,
        prop7_COLLECTIVE_AVG: 0,
      },
      basketball: {
        prop8_SINGLE_AVG: 0.2739410644721852,
        prop8_COLLECTIVE_AVG: 0.2739410644721852,
        prop7_SINGLE_AVG: 0,
        prop7_COLLECTIVE_AVG: 0,
      },
    };
    expect(graph4.getAllNodes().toJSON()).toMatchSnapshot();
    expect(graph4.getAllEdges().toJSON()).toMatchSnapshot();
    expect(graph4.pageRank(1, 1)).toMatchSnapshot();
    expect(graph4.pageRank(50, 1)).toMatchSnapshot(); // console.log(graph13.pageRank(50, 1));
    // console.log(graph21.pageRank(50, 1));

    const graph5: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME5);
    const expectedPageRankResult5: Dict<Dict<number>> = {
      eat: {
        prop9_SINGLE_AVG: 0.2418584359451662,
        prop9_COLLECTIVE_AVG: 0.2418584359451662,
        prop10_SINGLE_AVG: 0,
        prop10_COLLECTIVE_AVG: 0,
      },
      run: {
        prop9_SINGLE_AVG: 0.24818188738500696,
        prop9_COLLECTIVE_AVG: 0.24818188738500696,
        prop10_SINGLE_AVG: 0,
        prop10_COLLECTIVE_AVG: 0,
      },
      sleep: {
        prop9_SINGLE_AVG: 0.23601861219764136,
        prop9_COLLECTIVE_AVG: 0.23601861219764136,
        prop10_SINGLE_AVG: 0,
        prop10_COLLECTIVE_AVG: 0,
      },
      basketball: {
        prop9_SINGLE_AVG: 0.2739410644721852,
        prop9_COLLECTIVE_AVG: 0.2739410644721852,
        prop10_SINGLE_AVG: 0,
        prop10_COLLECTIVE_AVG: 0,
      },
    };
    expect(graph5.getAllNodes().toJSON()).toMatchSnapshot();
    expect(graph5.getAllEdges().toJSON()).toMatchSnapshot();
    expect(graph5.pageRank(1, 1)).toMatchSnapshot();
    expect(graph5.pageRank(50, 1)).toMatchSnapshot(); // console.log(graph13.pageRank(50, 1));
    // console.log(graph22.pageRank(50, 1));

    const graph6: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME6);
    const expectedPageRankResult6: Dict<Dict<number>> = {
      eat: {
        prop11_SINGLE_AVG: 0.2418584359451662,
        prop11_COLLECTIVE_AVG: 0.2418584359451662,
        prop12_SINGLE_AVG: 0,
        prop12_COLLECTIVE_AVG: 0,
      },
      run: {
        prop11_SINGLE_AVG: 0.24818188738500696,
        prop11_COLLECTIVE_AVG: 0.24818188738500696,
        prop12_SINGLE_AVG: 0,
        prop12_COLLECTIVE_AVG: 0,
      },
      sleep: {
        prop11_SINGLE_AVG: 0.23601861219764136,
        prop11_COLLECTIVE_AVG: 0.23601861219764136,
        prop12_SINGLE_AVG: 0,
        prop12_COLLECTIVE_AVG: 0,
      },
      basketball: {
        prop11_SINGLE_AVG: 0.2739410644721852,
        prop11_COLLECTIVE_AVG: 0.2739410644721852,
        prop12_SINGLE_AVG: 0,
        prop12_COLLECTIVE_AVG: 0,
      },
    };
    expect(graph6.getAllNodes().toJSON()).toMatchSnapshot();
    expect(graph6.getAllEdges().toJSON()).toMatchSnapshot();
    expect(graph6.pageRank(1, 1)).toMatchSnapshot();
    expect(graph6.pageRank(50, 1)).toMatchSnapshot(); // console.log(graph13.pageRank(50, 1));
    // console.log(graph23.pageRank(50, 1));
  });

  afterAll(async () => {
    await RealmGraphManager.closeAllGraphs();

    if (fs.existsSync(TEST_DIRECTORY))
      fs.rmSync(TEST_DIRECTORY, { recursive: true });
  });
});
