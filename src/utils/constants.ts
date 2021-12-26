export const ID_KEY: string = 'id';
export const genDefaultGraphRealmPath = (graphName: string): string => `${graphName}.path`;

const REALM_GRAPH_MANAGER_NAME: string = 'REALM_GRAPH_MANAGER';
export const DEFAULT_REALM_GRAPH_MANAGER_REALM_PATH: string = genDefaultGraphRealmPath(REALM_GRAPH_MANAGER_NAME);
