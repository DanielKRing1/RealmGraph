import { Dict } from "./global";

export type RGCreateParams = {
    realm?: Realm;
    metaRealmPath?: string;
    loadableRealmPath?: string;
    graphName: string;
    propertyNames: string[];
};

export type RGLoadableParams = {
    realm?: Realm;
    metaRealmPath: string;
    loadableRealmPath: string;
    graphName: string;
};

export type RankedNode = { id: string; } & Dict<any>;
