import * as serialijse from 'serialijse';
import Player, {TilesSeenLog} from '../player';
import Container from '../container';

// Name is required because minimization can break things.
export function registerClass(klass: any, name: string, serializeFn?: Function, deserializeFn?: Function) {
  // @ts-ignore
  serialijse.declarePersistable(klass, name, serializeFn, deserializeFn);
}

export function serialize(object: any) {
  return serialijse.serialize(object);
}

export function deserialize<T>(json: string) {
  const result: T = serialijse.deserialize(json);
  return result;
}

function mapToData(context: any, map: Map<any, any>, rawData: any) {
  rawData.e = serialize([...map.entries()]);
}
function dataToMap(context: any, object_id: any, data: { e: string }) {
  const map = new Map();
  const entries: Array<[any, any]> = deserialize(data.e) || [];
  for (const [key, value] of entries) {
    map.set(key, value);
  }

  context.cache[object_id] = map;
  return map;
}
registerClass(Map, 'Map', mapToData, dataToMap);

registerClass(Player, 'Player');
registerClass(TilesSeenLog, 'TilesSeenLog');
registerClass(Container, 'Container');
