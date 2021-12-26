import { Dict } from "./global";

export type RGSetup = {
    realm?: Realm;
    dynamicRealmPath?: string;
    graphRealmPath?: string;
    graphName: string;
    propertyNames: string[];
};

export type RankedNode = { id: string; } & Dict<any>;
