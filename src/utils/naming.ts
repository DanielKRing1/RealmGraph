const NODE_SCHEMA_SUFFIX: string = 'NODE';
const EDGE_SCHEMA_SUFFIX: string = 'EDGE';
export const SUFFIX_DELIMITER: string = '_';
export const genNodeSchemaName = (graphName: string): string => `${graphName}${SUFFIX_DELIMITER}${NODE_SCHEMA_SUFFIX}`;
export const genEdgeSchemaName = (graphName: string): string => `${graphName}${SUFFIX_DELIMITER}${EDGE_SCHEMA_SUFFIX}`;
export const getBaseNameFromSchemaName = (schemaName: string) => {
    const index: number = schemaName.lastIndexOf(SUFFIX_DELIMITER);
    const baseName: string = schemaName.slice(0, index);

    return baseName;
};

export const EDGE_NAME_DELIM: string = '-';
/**
 * Sort node 1 and 2 id's alphabetically and concat with a delim to create id
 *
 * @param node1Id
 * @param node2Id
 * @returns
 */
export const genEdgeName = (node1Id: string, node2Id: string): string => (node1Id.toLowerCase() < node2Id.toLowerCase() ? `${node1Id}${EDGE_NAME_DELIM}${node2Id}` : `${node2Id}${EDGE_NAME_DELIM}${node1Id}`);
