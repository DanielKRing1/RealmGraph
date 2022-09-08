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

export type RGUpdatePropertiesParams = {
    metaRealmPath: string;
    loadableRealmPath: string;
    graphName: string;
    newPropertyNames: string[];

    reloadRealm: () => Promise<Realm>;
};

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
    getAllEdges: () => Realm.Results<Realm.Object & CGEdge>
    getGraphEntity: (ids: string[], entityType: GraphEntity) => CGNode | CGEdge

    rate:(propertyName: string, nodeIds: string[], rating: number, weights: number[], ratingMode: RatingMode) => RateReturn;

    pageRank: (iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    recommendRank: (centralNodeIds: string[], nodeTargetCentralWeight: number, edgeInflationMagnitude: number, iterations?: number, dampingFactor?: number) => Dict<Dict<number>>;
    recommend: (
        desiredAttrKey: string,
        centralNodeIds: string[],
        nodeTargetCentralWeight: number,
        edgeInflationMagnitude: number,
        iterations?: number,
        dampingFactor?: number,
    ) => RankedNode[];
};