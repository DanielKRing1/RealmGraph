import { RatingMode } from 'catalyst-graph';
import RealmGraph from '../src';

jest.mock('realm');

describe('GlobalRealm', () => {
  it('Should throw an error and have a null realm before being initialized', async () => {
    const graphName: string = 'TestGraph';

    const graph: RealmGraph = new RealmGraph({
      graphName,
      propertyNames: ['happy', 'sad', 'bored'],
    });

    await graph.init();

    graph.rate('happy', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);

    console.log(graph.getAllNodes());
    console.log(graph.getAllEdges());
  });

  it('Should own a DynamicRealm instance after being initialized', async () => {
    const realmPath = 'CustomRealmPath.path';
  });
});
