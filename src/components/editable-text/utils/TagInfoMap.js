import { isConnection, isInsertion, isLabel } from '../store/tag_mode';

class TagInfoMap {
  constructor() {
    this.labels = {};
    this.insertions = {};
    this.connections = {};
  }

  reciveInfo(json) {
    this.labels = JSON.parse(json.labels);
    this.insertions = JSON.parse(json.insertions);
    this.connections = JSON.parse(json.connections);
    return this;
  }

  getItem(id, type) {
    const { labels, connections, insertions } = this;
    if (isLabel(type)) return labels[id];
    if (isConnection(type)) return connections[id];
    if (isInsertion(type)) return insertions[id];
    return undefined;
  }

  setItem(id, item) {
    const { labels, connections, insertions } = this;
    if (isLabel(item.type)) {
      labels[id] = item;
    }
    if (isConnection(item.type)) {
      connections[id] = item;
    }
    if (isInsertion(item.type)) {
      insertions[id] = item;
    }
  }

  getMap() {
    return {
      labels: JSON.stringify(this.labels),
      connections: JSON.stringify(this.connections),
      insertions: JSON.stringify(this.insertions),
    };
  }

  clone() {
    return new TagInfoMap().reciveInfo(this.getMap());
  }
}

export default TagInfoMap;
