import { RatingMode } from 'catalyst-graph';
import realmGraphManager, { RealmGraph } from '../src';
import { Dict } from '../src/types/global';

// @ts-ignore
jest.mock('realm', () => require('@asianpersonn/realm-mock'));

const manager1GraphName1: string = 'Manager1TestGraph1';
const manager1PropertyNames1: string[] = [ 'prop1', 'prop2' ];

const TEST_META_REALM_PATH_1: string = 'TEST_META_REALM_PATH_1.path';

const TEST_LOADABLE_REALM_PATH: string = 'TEST_LOADABLE_REALM_PATH_1';

// @ts-ignore
describe('RealmGraphManager', () => {
  // @ts-ignore
  it('Should load all graphs in same realm', async () => {
    try {
      const loadMethod = async () => await realmGraphManager.loadGraphs(TEST_META_REALM_PATH_1, TEST_LOADABLE_REALM_PATH);
      expect(await loadMethod).not.toThrowError();
    }
    catch(err) {}
  });
});
