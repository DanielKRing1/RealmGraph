import MetaRealm from '@asianpersonn/metarealm';
import { getBaseNameFromSchemaName } from '../constants/naming';

import { createRealmGraph, loadRealmGraph } from "../RealmGraph/realmGraph";
import { RealmGraph, RGCreateParams, RGLoadableParams } from "../RealmGraph/types";
import { Dict } from "../types";
import { RGManagerCreate } from "./types";

type RealmGraphManager = {
    getGraph: (graphName: string) => RealmGraph | undefined;
    createGraph: ({ metaRealmPath, loadableRealmPath, graphName, propertyNames }: RGManagerCreate) => Promise<RealmGraph>,
    rmGraph: (graphName: string) => void;
    loadGraphs: (metaRealmPath: string, loadableRealmPath: string) => Promise<boolean>,

    getLoadableGraphNames: (metaRealmPath: string, loadableRealmPath: string) => string[];
    getAllLoadedGraphNames: () => string[],
    getAllLoadedGraphs: () => RealmGraph[],
};
const createGraphManager = (): RealmGraphManager => {
    const realmGraphMap: Dict<RealmGraph> = {};
    
    const getGraph = (graphName: string) => realmGraphMap[graphName];

    const createGraph = async ({ metaRealmPath, loadableRealmPath, graphName, propertyNames }: RGCreateParams) => {
        // 1. Create new RealmGraph if not exists
        if(!hasRealmGraph(graphName)) {
            const realmGraph: RealmGraph = await createRealmGraph({
                metaRealmPath,
                loadableRealmPath,
                graphName,
                propertyNames,
            });
            realmGraphMap[graphName] = realmGraph;
        }

        return realmGraphMap[graphName];
    }

    const rmGraph = async (graphName: string) => {
        // 1. Try to delete RealmGraph schemas
        if(hasRealmGraph(graphName)) {
            const realmGraph: RealmGraph = realmGraphMap[graphName];
            realmGraph.deleteGraph();
        }

        // 2. Remove RealmGraph from map if present
        delete realmGraphMap[graphName];
    }

    const hasRealmGraph = (graphName: string): boolean => !!realmGraphMap[graphName];
    
    const loadGraphs = async (metaRealmPath: string, loadableRealmPath: string): Promise<boolean> => {
        // 1. Get all Loadable graph names
        const graphNames: string[] = getLoadableGraphNames(metaRealmPath, loadableRealmPath);

        for(let graphName of graphNames) {
            // 2. Setup RealmGraph, It will read its properties from its LoadableRealm schemas
            const realmGraph: RealmGraph = await loadRealmGraph({
                metaRealmPath,
                loadableRealmPath,
                graphName,
                shouldReloadRealm: false,
            });

            // 3. Add to realmGraphMap
            realmGraphMap[graphName] = realmGraph;
        }

        // 4. Reload realms after loading all RealmGraphs
        await MetaRealm.LoadableRealmManager.reloadRealm({ metaRealmPath, loadableRealmPath });

        return true;
    }

    const getLoadableGraphNames = (metaRealmPath: string, loadableRealmPath: string): string[] => {
        const graphNames: Set<string> = new Set<string>();

        // 1. Get all schema names
        const allSchemaNames: string[] = MetaRealm.getSchemaNames(metaRealmPath, loadableRealmPath);

        // 2. Remove schema name suffix and add to set
        // (A single Graph creates more than 1 schema; when stripped of their suffixes, they will have identical names)
        allSchemaNames.forEach((schemaName) => {
            // 2.1. Remove suffix
            const graphName: string = getBaseNameFromSchemaName(schemaName);

            // 2.2. Add to set
            graphNames.add(graphName);
        });

        return Array.from(graphNames);
    };

    const getAllLoadedGraphNames = (): string[] => Object.keys(realmGraphMap);
    const getAllLoadedGraphs = (): RealmGraph[] => Object.values(realmGraphMap);

    return {
        getGraph,
        createGraph,
        rmGraph,
        loadGraphs,

        getLoadableGraphNames,
        getAllLoadedGraphNames,
        getAllLoadedGraphs,
    }
}

export default createGraphManager();
