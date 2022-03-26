import { RatingMode } from 'catalyst-graph';
import realmGraphManager, { RealmGraph } from '../src';
import { Dict } from '../src/types/global';

// @ts-ignore
jest.mock('realm', () => require('@asianpersonn/realm-mock'));

const manager1GraphName1: string = 'Manager1TestGraph1';
const manager1PropertyNames1: string[] = [ 'prop1', 'prop2' ];

const manager1GraphName2: string = 'Manager1TestGraph2';
const manager1PropertyNames2: string[] = [ 'prop3', 'prop4' ];


const manager1GraphName3: string = 'Manager1TestGraph3';
const manager1PropertyNames3: string[] = [ 'prop5', 'prop6' ];

const manager2GraphName1: string = 'Manager2TestGraph1';
const manager2PropertyNames1: string[] = [ 'prop7', 'prop8' ];

const manager2GraphName2: string = 'Manager2TestGraph2';
const manager2PropertyNames2: string[] = [ 'prop9', 'prop10' ];

const manager2GraphName3: string = 'Manager2TestGraph3';
const manager2PropertyNames3: string[] = [ 'prop11', 'prop12' ];

const TEST_META_REALM_PATH_1: string = 'TEST_META_REALM_PATH_1.path';
const TEST_META_REALM_PATH_2: string = 'TEST_META_REALM_PATH_2.path';

const TEST_LOADABLE_REALM_PATH: string = 'TEST_LOADABLE_REALM_PATH_1';

// @ts-ignore
describe('RealmGraphManager', () => {
  // @ts-ignore
  it('Should load all graphs in same realm', async () => {
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_1,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager1GraphName1,
        propertyNames: manager1PropertyNames1,
    });
    let graph11 = realmGraphManager.getGraph(manager1GraphName1);
    console.log(graph11);
    console.log(graph11.getRealm());

    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_1,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager1GraphName2,
        propertyNames: manager1PropertyNames2,
    });
    let graph12 = realmGraphManager.getGraph(manager1GraphName2);
    console.log(graph12);
    console.log(graph12.getRealm());

    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_1,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager1GraphName3,
        propertyNames: manager1PropertyNames3,
    });

    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_2,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager2GraphName1,
        propertyNames: manager2PropertyNames1,
    });
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_2,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager2GraphName2,
        propertyNames: manager2PropertyNames2,
    });
    await realmGraphManager.createGraph({
      metaRealmPath: TEST_META_REALM_PATH_2,
      loadableRealmPath: TEST_LOADABLE_REALM_PATH,
        graphName: manager2GraphName3,
        propertyNames: manager2PropertyNames3,
    });
  });
});
