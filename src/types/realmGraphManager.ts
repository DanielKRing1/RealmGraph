export type RGManagerCreate = {
    metaRealmPath: string;
    loadableRealmPath: string;
    graphName: string;
    propertyNames: string[];
};

export type RGManagerGetOrCreate = {
    existingRealm?: Realm,
    graphName: string;
    metaRealmPath: string;
    loadableRealmPath: string;
    propertyNames: string[];
};

export type RGManagerUpdate = {
    metaRealmPath: string;
    loadableRealmPath: string;
    graphName: string;
    newProperties: string[];
};

export type RGManagerRemove = {
    metaRealmPath: string;
    loadableRealmPath: string;
    graphName: string;
};
