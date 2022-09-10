import { RealmGraph, RGCreateParams } from "../RealmGraph/types";

export type RealmGraphManager = {
    getGraph: (graphName: string) => RealmGraph | undefined;
    createGraph: (params: RGCreateParams) => Promise<RealmGraph>;
    rmGraph: (graphName: string) => void;
    loadGraphs: (metaRealmPath: string, loadableRealmPath: string) => Promise<number>;

    getLoadableGraphNames: (metaRealmPath: string, loadableRealmPath: string) => string[];
    getAllLoadedGraphNames: () => string[];
    getAllLoadedGraphs: () => RealmGraph[];
};