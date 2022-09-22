import { CGNode, CGEdge, GraphEntity, RatingMode, RateReturn } from "catalyst-graph";
import { Dict } from "../types";

export type RGCreateParams = {
    propertyNames: string[];
} & RGLoadableParams;

export type RGLoadGraphParams = {
    shouldReloadRealm?: boolean;
} & RGLoadableParams;

export type RGLoadableParams = {
    metaRealmPath: string;
    loadableRealmPath: string;
    graphName: string;
};

export type RGDeletePropertiesParams = {
    reloadRealm: () => Promise<Realm>;
} & RGLoadGraphParams;

export type RGUpdatePropertiesParams = {
    newPropertyNames: string[];

    reloadRealm: () => Promise<Realm>;
} & RGLoadGraphParams;

export type RankedNode = { id: string; } & Dict<any>;

export type RealmGraph = {
    getGraphName: () => string;
    getLoadableRealmPath: () => string;
    getMetaRealmPath: () => string;
    getPropertyNames: () => string[];

    loadRealm: () => Promise<Realm>;
    loadRealmSync: () => Realm;
    reloadRealm: () => Promise<Realm>;
    reloadRealmSync: () => Realm;

    deleteGraph: () => void;
    updateGraphProperties: (newPropertyNames: string[]) => Promise<void>

    getAllNodes: () => Realm.Results<Realm.Object & CGNode>;
    getNode:  (nodeId: string) => Realm.Object & CGNode | undefined;
    getAllEdges: () => Realm.Results<Realm.Object & CGEdge>;
    getEdge:  (edgeId: string) => Realm.Object & CGEdge | undefined;
    getGraphEntity: (ids: string[], entityType: GraphEntity) => CGNode | CGEdge;

    rate:(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode) => RateReturn;
    undoRate:(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode) => RateReturn;

    pageRank: (iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    // recommendRank: (centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    // recommend: (
    //     desiredAttrKey: string,
    //     centralNodeIds: string[],
    //     nodeTargetCentralWeight: number,
    //     edgeInflationMagnitude: number,
    //     iterations?: number,
    //     dampingFactor?: number,
    // ) => RankedNode[];

    commonlyDoneWith: (targetNodeId: string) => Promise<CGEdge[]>;
    commonlyDoneByOutput: (nodeId: string, output: string) => Promise<CGEdge[]>;
    highlyRatedByOutput: (nodeId: string, output: string) => Promise<CGEdge[]>;

    rankMostInfluentialToCentralSet: (centralNodeIds: string[], iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    // getMostInfluentialToCentralSet: (targetAttr: string, centralNodeIds: string[], iterations?: number, dampingFactor?: number) => RankedNode[];
};