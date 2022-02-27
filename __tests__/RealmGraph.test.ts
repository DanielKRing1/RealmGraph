import Heap from '@asianpersonn/heap';
import { genSingleAverageName, RatingMode } from 'catalyst-graph';
import RealmGraph from '../src';
import { Dict } from '../src/types/global';
import { RankedNode } from '../src/types/RealmGraph';

// @ts-ignore
jest.mock('realm');

const graphName: string = 'TestGraph';

const graph: RealmGraph = new RealmGraph({
  graphName,
  propertyNames: ['happy', 'sad', 'bored'],
});

// @ts-ignore
describe('RealmGraph', () => {
  // @ts-ignore
  it('Should throw an error and have a null realm before being initialized', async () => {
    await graph.init();

    graph.rate('happy', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['eat', 'run', 'sleep'], 5, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'sleep'], 7, [1, 1], RatingMode.Collective);

    const map: Dict<Dict<number>> = graph.pageRank(50, 1);
    console.log(map);

    console.log(graph.getAllNodes());
    console.log(graph.getAllEdges());
  });

  // @ts-ignore
  it('Should own a DynamicRealm instance after being initialized', async () => {
    const realmPath = 'CustomRealmPath.path';
  });
});

describe('Page Rank', () => {
  it('Should be able to run PageRank', () => {
    const map: Dict<Dict<number>> = graph.pageRank(50);

    console.log(map);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep'], 0.8, 50);

    console.log(map);
  });

  it('Should be able to organize PageRank recommendations into a heap', () => {
    const desiredRankKey: string = genSingleAverageName('happy');
    const heap: Heap<RankedNode> = graph.recommend(desiredRankKey, ['sleep'], 0.8, 50);

    console.log(heap._list);
  });
});

describe('Page Rank more complex graph', () => {
  it('Should be able to run PageRank', () => {
    graph.rate('happy', ['pingpong', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['pingpong', 'eat', 'run', 'sleep'], 9, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['pingpong', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['pingpong', 'eat', 'sleep'], 7.5, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['eat', 'run'], 3, [1, 1], RatingMode.Single);
    graph.rate('happy', ['eat', 'run'], 3, [1, 1], RatingMode.Collective);

    graph.rate('happy', ['basketball', 'pingpong', 'sleep'], 6, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'pingpong', 'sleep'], 6, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['basketball', 'eat', 'sleep'], 8, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['basketball', 'eat', 'sleep'], 8, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['study', 'sleep'], 6, [1, 1], RatingMode.Single);
    graph.rate('happy', ['study', 'sleep'], 6, [1, 1], RatingMode.Collective);

    graph.rate('happy', ['study', 'walk', 'eat', 'sleep'], 7.5, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['study', 'walk', 'eat', 'sleep'], 7.5, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['study', 'walk', 'sleep'], 4, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['study', 'walk', 'sleep'], 4, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['study', 'basketball', 'run', 'eat'], 2, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['study', 'basketball', 'run', 'eat'], 2, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['study', 'run', 'eat'], 3, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['study', 'run', 'eat'], 3, [1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['study', 'basketball', 'run', 'eat', 'sleep'], 9, [1, 1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['study', 'basketball', 'run', 'eat', 'sleep'], 9, [1, 1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['meditate', 'basketball', 'run', 'sleep'], 6, [1, 1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['meditate', 'basketball', 'run', 'sleep'], 6, [1, 1, 1, 1], RatingMode.Collective);

    graph.rate('happy', ['meditate', 'eat', 'sleep'], 9, [1, 1, 1], RatingMode.Single);
    graph.rate('happy', ['meditate', 'eat', 'sleep'], 9, [1, 1, 1], RatingMode.Collective);

    const map: Dict<Dict<number>> = graph.pageRank(50, 1);

    console.log(map);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep', 'study'], 0.8, 0.01, 50, 1);

    console.log(map);
  });

  it('Should be able to organize PageRank recommendations into a heap', () => {
    const desiredRankKey: string = genSingleAverageName('happy');
    const heap: Heap<RankedNode> = graph.recommend(desiredRankKey, ['sleep', 'study'], 0.8, 0.01, 50, 1);

    console.log(heap);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep', 'study'], 0.8, 0, 50, 1);

    console.log('STARTING HERE----');
    console.log(map);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep', 'study'], 0.8, 0.01, 50, 1);

    console.log(map);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep', 'study'], 0.8, 0.1, 50, 1);

    console.log(map);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep', 'study'], 0.8, 0.25, 50, 1);

    console.log(map);
  });

  it('Should be able to run redistributed PageRank recommendations', () => {
    const map: Dict<Dict<number>> = graph.recommendRank(['sleep', 'study'], 0.8, 1, 50, 1);

    console.log(map);
  });
});
