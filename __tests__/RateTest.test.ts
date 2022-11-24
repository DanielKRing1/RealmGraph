import fs from "fs";

import { RatingMode } from "catalyst-graph";
import RealmGraphManager from "../src";

import { createRealmGraph } from "../src/RealmGraph/realmGraph";
import { RealmGraph } from "../src/RealmGraph/types";
import realmGraphManager from "../src/RealmGraphManager/realmGraphManager";
import { Dict } from "../src/types";

const TEST_NAME: string = "RateTest";
const TEST_DIRECTORY: string = `__tests__/${TEST_NAME}`;
const META_REALM_PATH1: string = `${TEST_DIRECTORY}/MetaRealm1.path`;
const LOADABLE_REALM_PATH1: string = `LoadableRealm1.path`;

const GRAPH_NAME1: string = "TestGraph1";

const PROPERTY_NAMES1: string[] = ["prop1", "prop2"];
const PROPERTY_NAMES2: string[] = ["prop3", "prop4"];

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

    await realmGraphManager.loadGraphs(META_REALM_PATH1, LOADABLE_REALM_PATH1);
  });

  it("Should rate Graph1 with a single input and not throw an error", async () => {
    const graph: RealmGraph = realmGraphManager.getGraph(GRAPH_NAME1);

    graph.rate("prop1", ["basketball"], 8, [1], RatingMode.Single);
    graph.rate("prop1", ["basketball"], 8, [1], RatingMode.Collective);

    console.log(graph.getAllEdges().toJSON());
  });

  afterAll(async () => {
    await RealmGraphManager.closeAllGraphs();

    if (fs.existsSync(TEST_DIRECTORY))
      fs.rmSync(TEST_DIRECTORY, { recursive: true });
  });
});
