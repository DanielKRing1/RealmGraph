export const ID_KEY: string = 'id';
const DEFAULT_PATH_PREFIX: string = 'REALM_GRAPH';
export const genDefaultMetaRealmPath = () => `${DEFAULT_PATH_PREFIX}-meta.path`;
export const genDefaultLoadableRealmPath = (graphName: string): string => `${DEFAULT_PATH_PREFIX}-${graphName}.path`;

const REALM_GRAPH_MANAGER_NAME: string = 'REALM_GRAPH_MANAGER';
export const DEFAULT_REALM_GRAPH_MANAGER_REALM_PATH: string = genDefaultLoadableRealmPath(REALM_GRAPH_MANAGER_NAME);
