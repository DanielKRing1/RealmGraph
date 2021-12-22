import DictUtils from '@asianpersonn/dict-utils';
import { genPropertiesObj } from "catalyst-graph";

// My imports
import { ID_KEY } from "./constants";

// Types
import { Dict } from '../types/global';

/**
 * Create a base schema for node/edge GraphEntities
 *
 * @param schemaName
 * @param properties
 * @returns
 */
 export const genSchema = (schemaName: string, properties: string[]): Realm.ObjectSchema => {
    // 1. Create dummy graph entity
    const graphProperties: Dict<any> = genPropertiesObj(properties);

    // 2. Replace property values with float data type
    const schemaProperties: Dict<string> = DictUtils.mutateDict(graphProperties, (key: string, value: any) => 'float');

    // 3. Add id to schema properties
    return {
        name: schemaName,
        primaryKey: ID_KEY,
        properties: {
            ...schemaProperties,
            [ID_KEY]: 'string',
        },
    };
};