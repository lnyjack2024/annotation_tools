import { makeAutoObservable, toJS } from 'mobx';
import { xor, findIndex, isEqual } from 'lodash';
import { substr, strlen } from 'fbjs/lib/UnicodeUtils';
import { v4 as uuidv4 } from 'uuid';
import RootStore from './RootStore';
import { ConnectionItem, InsertionItem, LabelItem, MissingItem, Ontologies, OntologiesStatus, OntologyConfigMap, OntologyItem, OntologyItemPayLoad, OntologyItemType, OntologyResult, Payload, ReviewDataItem, ReviewItemResult, ReviewResult, TAG } from '../types';
import { MISSING_LABEL } from './constant';
import { generateConfigKeyByKeys, getConfigByKeys, getNextInLoopList, getTextByInsertion } from '../utils/helper';
import { isConnection, isInsertion, isLabel, isQATag } from './tag_mode';
import localMessage from '../locale';

const missKeys = generateConfigKeyByKeys(MISSING_LABEL.keys);
/**
 * store for config
 * @class
 */
export default class OntologyStore {
  /**
   * root store
   */
  rootStore;

  ontologyConfigMap = new Map();

  ontologiesStatusMap: Map<string, OntologiesStatus> = new Map();

  ontologies: Ontologies | undefined;

  results: OntologyResult = { labels: [], insertions: [], connections: [] };

  text = '';

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  getOntologiesStatusMap() {
    return toJS(this.ontologiesStatusMap);
  }

  /**
   * init from paylod
   * @param payload
   */
  init(payload: Payload) {
    const { labels, insertions, connections, content } = payload;

    this.text = content;
    this.formatOntologies(labels, insertions, connections);
    this.generateConfigMap(labels, insertions, connections);
  }

  formatOntologyItem = (ontologyItem: OntologyItemPayLoad[] | undefined, type: OntologyItemType, keys: string[] = []) => {
    if (!ontologyItem) {
      return [];
    }
    const result: OntologyItem[] = [];
    ontologyItem.forEach((item) => {
      const newKeys = [...keys];
      newKeys.push(item.text);
      const { children, ...restProps } = item;
      const newOntologyItem: OntologyItem = {
        ...restProps,
        type,
        keys: newKeys
      };
      if (item.children && item.children.length > 0) {
        newOntologyItem.children = this.formatOntologyItem(item.children, type, newKeys);
      }
      result.push(newOntologyItem);
    });
    return result;
  };

  formatOntologies(labels: OntologyItemPayLoad[] | undefined, insertions: OntologyItemPayLoad[] | undefined, connections: OntologyItemPayLoad[] | undefined) {
    const formattedLabels = this.formatOntologyItem(labels, TAG.LABEL);
    const formattedInsertions = this.formatOntologyItem(insertions, TAG.INSERTION);
    const formattedConnections = this.formatOntologyItem(connections, TAG.CONNECTION);
    if (this.rootStore.reviewable || this.rootStore.isRework) {
      const missingLabel: OntologyItem[] = [{ ...MISSING_LABEL, type: TAG.LABEL_QA, text: localMessage(MISSING_LABEL.text) }];
      this.ontologies = { labels_qa: missingLabel };
    }
    this.ontologies = {
      ...this.ontologies,
      labels: formattedLabels,
      insertions: formattedInsertions,
      connections: formattedConnections
    };
  };

  generateConfigMap(labels: OntologyItemPayLoad[] | undefined, insertions: OntologyItemPayLoad[] | undefined, connections: OntologyItemPayLoad[] | undefined) {
    if (this.rootStore.reviewable || this.rootStore.isRework) {
      this.ontologyConfigMap.set(generateConfigKeyByKeys(MISSING_LABEL.keys), { ...MISSING_LABEL, type: TAG.LABEL_QA, text: localMessage(MISSING_LABEL.text) });
    }
    if (labels) { this.generateConfigMapItem(labels, TAG.LABEL); }
    if (insertions) { this.generateConfigMapItem(insertions, TAG.INSERTION); }
    if (connections) { this.generateConfigMapItem(connections, TAG.CONNECTION); }
  };

  generateConfigMapItem(tags: OntologyItemPayLoad[], type: OntologyItemType, key: string[] = [], isChild = false, childKeys: string[] = []) {
    tags.forEach((tag) => {
      childKeys.push(tag.text);
      let newKey = [...key];
      newKey.push(tag.text);
      const newTag: OntologyConfigMap = {
        type,
        color: tag.color,
        displayName: tag.displayName,
        text: tag.text,
        isChild,
        keys: newKey,
        childKeys: []
      };

      if (tag.children && tag.children.length > 0) {
        const childKeysArr = this.generateConfigMapItem(tag.children, type, newKey, true);
        newTag.childKeys = childKeysArr;
        this.ontologyConfigMap.set(generateConfigKeyByKeys(newKey), newTag);
      } else {
        this.ontologyConfigMap.set(generateConfigKeyByKeys(newKey), newTag);

        newKey = [];
      }
    });
    return childKeys;
  };

  calcCountItem(ontology: OntologyItem) {
    const { labels, insertions, connections } = this.results;
    const { missing } = this.rootStore.review.reviews;
    const { keys, type, children } = ontology;
    const configKey = generateConfigKeyByKeys(keys);
    const currentStatus = this.ontologiesStatusMap.get(configKey);
    const newItem: OntologiesStatus = {
      isCollapse: true,
      keys,
      tagCount: 0,
      tagCountContainChildren: 0,
      rejectCount: 0,
      rejectCountContainChildren: 0,
      approveCount: 0,
    };
    if (currentStatus) {
      newItem.isCollapse = currentStatus.isCollapse;
      newItem.keys = currentStatus.keys;
    }
    let tagCount = 0;
    let rejectCount = 0;
    let childRejectCount = 0;
    let childTagCount = 0;
    let approveCount = 0;

    if (type === TAG.LABEL_QA) {
      tagCount = missing.length;
      this.ontologiesStatusMap.set(missKeys,
        {
          isCollapse: false, keys: MISSING_LABEL.keys, tagCount
        });
    }
    if (type === TAG.LABEL) {
      labels.forEach((label) => {
        if (isEqual(label.keys, keys)) {
          tagCount += 1;
          const review = this.rootStore.review.getReview(label.id);
          if (review) {
            if (review.result === ReviewItemResult.REJECT) {
              rejectCount += 1;
            } else if (review?.result === ReviewItemResult.PASS) {
              approveCount += 1;
            }
          }
        }
      });
    }
    if (type === TAG.INSERTION) {
      insertions.forEach((insertion) => {
        if (isEqual(insertion.keys, keys)) {
          tagCount += 1;
          const review = this.rootStore.review.getReview(insertion.id);
          if (review) {
            if (review.result === ReviewItemResult.REJECT) {
              rejectCount += 1;
            } else if (review?.result === ReviewItemResult.PASS) {
              approveCount += 1;
            }
          }
        }
      });
    }
    if (type === TAG.CONNECTION) {
      connections.forEach((connection) => {
        if (isEqual(connection.keys, keys)) {
          tagCount += 1;
          const review = this.rootStore.review.getReview(connection.id);
          if (review) {
            if (review.result === ReviewItemResult.REJECT) {
              rejectCount += 1;
            } else if (review?.result === ReviewItemResult.PASS) {
              approveCount += 1;
            }
          }
        }
      });
    }
    if (children && children.length > 0) {
      const childCountInfo = this.calcCount(children);
      childRejectCount = childCountInfo.rejectCount;
      childTagCount = childCountInfo.tagCount;
    }
    newItem.tagCount = tagCount;
    newItem.rejectCount = rejectCount;
    newItem.approveCount = approveCount;
    newItem.rejectCountContainChildren = rejectCount + childRejectCount;
    newItem.tagCountContainChildren = tagCount + childTagCount;
    return { configKey, newItem };
  }

  calcCount(ontologies: OntologyItem[]) {
    const result = {
      rejectCount: 0,
      tagCount: 0,
    };
    ontologies.forEach((ontology: OntologyItem) => {
      const { configKey, newItem } = this.calcCountItem(ontology);
      this.ontologiesStatusMap.set(configKey, newItem);
      result.tagCount += newItem.tagCountContainChildren!;
      result.rejectCount += newItem.rejectCountContainChildren!;
    });
    return result;
  }

  updateOntologiesStatusMap() {
    if (!this.ontologies) {
      return;
    }
    Object.values(this.ontologies).forEach((ontologies) => {
      this.calcCount(ontologies);
    });
  }

  updateOntologiesCollapseStatusAll(collapseStatus: boolean) {
    this.ontologiesStatusMap.forEach((value, key) => {
      if (key !== missKeys) {
        value.isCollapse = collapseStatus;
      }
    });
    this.updateOntologiesStatusMap();
  }

  updateOntologiesCollapseStatus = (keys: string[], collapseStatus: boolean) => {
    const configKey = generateConfigKeyByKeys(keys);
    const currentStatus = this.ontologiesStatusMap.get(configKey);
    if (!currentStatus) {
      return;
    }
    this.ontologiesStatusMap.set(configKey, { ...currentStatus, isCollapse: collapseStatus });
    this.updateOntologiesStatusMap();
  };

  parseResults(newResult: OntologyResult) {
    if (!newResult) return;
    const { results } = this;
    const length = strlen(this.text);
    // parse label
    newResult.labels?.forEach((label) => {
      // invalid start & end
      if (typeof (label) !== 'object') return;
      if (Number.isNaN(label.start) || label.start === null || label.start < 0 || label.start >= length) {
        label.dirty = true;
        return;
      }
      if (Number.isNaN(label.end) || label.end === null || label.end < 0 || label.end >= length + 1) {
        label.dirty = true;
        return;
      }

      if (!label.keys) {
        this.ontologyConfigMap.forEach((value, key) => {
          const keys = value.keys;
          if (keys[keys.length - 1] === label.value) {
            label.keys = value.keys;
          }
        });
      }
      // invalid value
      if (!isLabel(getConfigByKeys(this.ontologyConfigMap, label.keys)?.type)) {
        label.dirty = true;
        return;
      }
      // invalid & missing id
      if (!label.id) {
        label.id = uuidv4();
      }
      if (!label.type) {
        label.type = TAG.LABEL;
      }
      // missing text
      if (!label.text) label.text = substr(this.text, label.start, label.end - label.start);
    });
    if (!results?.labels) {
      results.labels = [];
    }
    results.labels = newResult.labels?.filter((label) => typeof (label) === 'object' && !label.dirty) || [];

    // parse insertion
    newResult.insertions?.forEach((insertion) => {
      // invalid start & end
      if (typeof (insertion) !== 'object') return;
      if (Number.isNaN(insertion.at) || insertion.at === null || insertion.at < 0 || insertion.at >= length) {
        insertion.dirty = true;
        return;
      }
      if (!insertion.keys) {
        this.ontologyConfigMap.forEach((value, key) => {
          const keys = value.keys;
          if (keys[keys.length - 1] === insertion.value) {
            insertion.keys = value.keys;
          }
        });
      }
      // invalid value
      if (!isInsertion(getConfigByKeys(this.ontologyConfigMap, insertion.keys)?.type)) {
        insertion.dirty = true;
        return;
      }
      // invalid & missing id
      if (!insertion.id) {
        insertion.id = uuidv4();
      }
      if (!insertion.type) {
        insertion.type = TAG.INSERTION;
      }
      // missing text
      if (!insertion.text) insertion.text = getTextByInsertion(this.text, insertion);
    });
    if (!results?.insertions) {
      results.insertions = [];
    }
    results.insertions = newResult.insertions?.filter((insertion) => typeof (insertion) === 'object' && !insertion.dirty) || [];
    // parse connection
    newResult.connections?.forEach((connection) => {
      // invalid start & end
      if (typeof (connection) !== 'object') return;

      if (!connection.keys) {
        this.ontologyConfigMap.forEach((value, key) => {
          const keys = value.keys;
          if (keys[keys.length - 1] === connection.value) {
            connection.keys = value.keys;
          }
        });
      }
      if (!connection.fromId && connection.from) {
        connection.fromId = connection.from;
      }
      if (!connection.fromType && connection.from) {
        const target = this.getItemById(connection.from);
        if (target) {
          connection.fromType = target.type;
        }
      }
      if (!connection.toId && connection.to) {
        connection.toId = connection.to;
      }
      if (!connection.toType && connection.to) {
        const target = this.getItemById(connection.to);
        if (target) {
          connection.toType = target.type;
        }
      }
      // invalid value
      if (!isConnection(getConfigByKeys(this.ontologyConfigMap, connection.keys)?.type)) {
        connection.dirty = true;
        return;
      }
      // invalid from & to
      if (findIndex(newResult.labels, { id: connection.fromId }) === -1 && findIndex(newResult.insertions, { id: connection.fromId }) === -1) {
        connection.dirty = true;
        return;
      }
      if (findIndex(newResult.labels, { id: connection.toId }) === -1 && findIndex(newResult.insertions, { id: connection.toId }) === -1) {
        connection.dirty = true;
        return;
      }
      if (!connection.type) {
        connection.type = TAG.CONNECTION;
      }
      // invalid & missing id
      if (!connection.id) {
        connection.id = uuidv4();
      }
    });
    if (!results?.connections) {
      results.connections = [];
    }
    results.connections = newResult.connections?.filter((connection) => typeof (connection) === 'object' && !connection.dirty) || [];
    console.log('results parse', results)
  }

  getResults(withMissing = true) {
    const { labels, insertions, connections } = this.results;
    const { missing } = this.rootStore.review.reviews;
    let allLabels = labels;
    if (withMissing) {
      allLabels = labels.concat(missing);
    }
    return {
      labels: allLabels.map((item) => toJS(item)),
      insertions: insertions.map((item) => toJS(item)),
      connections: connections.map((item) => toJS(item)),
    };
  }

  setResults(newResults = {}) {
    const results = JSON.parse(JSON.stringify(newResults));
    this.results = {
      labels: results.labels || [],
      insertions: results.insertions || [],
      connections: results.connections || [],
    };
  }

  addResultItem(newItem: LabelItem | InsertionItem | ConnectionItem, relatedConnections = []) {
    const { insertions, labels, connections } = this.results;
    const { type } = newItem;
    switch (true) {
      case (isLabel(type)): {
        labels.unshift(newItem as LabelItem);
        labels.sort((a, b) => (a.start - b.start));
        relatedConnections.forEach((connection) => {
          connections.unshift((connection));
        });
        break;
      }
      case (isConnection(type)): {
        connections.unshift(newItem as ConnectionItem);
        break;
      }
      case (isInsertion(type)): {
        insertions.unshift(newItem as InsertionItem);
        insertions.sort((a, b) => a.at - b.at);
        relatedConnections.forEach((connection) => {
          connections.unshift(connection);
        });
        break;
      }
      default: break;
    }
  }

  deleteTag(type: OntologyItemType, id: string) {
    const { connections, labels, insertions } = this.results;

    switch (true) {
      case (isLabel(type)): {
        const index = findIndex(labels, { id });
        const label = labels[index];
        labels.splice(index, 1);
        const nextConnections = connections.filter((connection) => connection.fromId !== id && connection.toId !== id);
        const relatedConnections = xor(connections, nextConnections);
        this.results.connections = nextConnections;
        return { relatedConnections, label };
      }
      case (isConnection(type)): {
        const index = findIndex(connections, { id });
        const connection = connections[index];
        connections.splice(index, 1);
        return { connection };
      }
      case (isInsertion(type)): {
        const index = findIndex(insertions, { id });
        const insertion = insertions[index];
        insertions.splice(index, 1);
        const nextConnections = connections.filter((connection) => connection.fromId !== id && connection.toId !== id);
        const relatedConnections = xor(connections, nextConnections);
        this.results.connections = nextConnections;

        return { relatedConnections, insertion };
      }
      default:
        break;
    }
  }

  getItemById(id: string) {
    const { labels, insertions, connections } = this.results;
    const { missing } = this.rootStore.review.reviews;
    const targetArr: (MissingItem | LabelItem | InsertionItem | ConnectionItem)[] = [];
    return targetArr.concat(missing).concat(labels).concat(insertions).concat(connections)
      .find((item) => item.id === id);
  }

  getItem(type: OntologyItemType, id: string) {
    const { labels, insertions, connections } = this.results;
    const { missing } = this.rootStore.review.reviews;
    switch (true) {
      case (isQATag(type)): {
        const index = findIndex(missing, { id });
        return missing[index];
      }
      case (isLabel(type)): {
        const index = findIndex(labels, { id });
        return labels[index];
      }
      case (isConnection(type)): {
        const index = findIndex(connections, { id });
        return connections[index];
      }
      case (isInsertion(type)): {
        const index = findIndex(insertions, { id });
        return insertions[index];
      }
      default: return null;
    }
  }

  stepToTag(id: string, step: number) {
    const { labels, connections, insertions } = this.results;
    const { missing } = this.rootStore.review.reviews;
    let targetList: (MissingItem | LabelItem | ConnectionItem | InsertionItem)[] | undefined;
    switch (true) {
      case (isQATag(id)): targetList = missing; break;
      case (isLabel(id)): targetList = labels; break;
      case (isConnection(id)): targetList = connections; break;
      case (isInsertion(id)): targetList = insertions; break;
      default: break;
    }
    if (!targetList) {
      return null;
    }
    const index = findIndex(targetList, { id });

    return getNextInLoopList(targetList, index, step);
  }

  getItemPosition = (item: MissingItem | LabelItem | ConnectionItem | InsertionItem | null): number => {
    if (!item) {
      return -1;
    }
    if (isLabel(item.type)) {
      return (item as LabelItem | MissingItem).start;
    }
    if (isInsertion(item.type)) {
      return (item as InsertionItem).at;
    }
    if (isConnection(item.type)) {
      const startTag = this.getItem((item as ConnectionItem).fromType, (item as ConnectionItem).fromId);
      return this.getItemPosition(startTag);
    }
    return -1;
  };

  moveToTagByStep(id: string, step: number, reviewOnly = false) {
    const { labels, connections, insertions } = this.results;
    const { missing, data } = this.rootStore.review.reviews;

    if (reviewOnly) {
      const list = Object.keys(data).map((key) => this.getItem(TAG.LABEL_QA, key))
        .sort((a, b) => this.getItemPosition(a) - this.getItemPosition(b));
      if (!data[id]) { // if id is not reviewed item then start from 0
        return list[0];
      }
      return getNextInLoopList(list, findIndex(list, { id }), step);
    }

    let list: (MissingItem | LabelItem | ConnectionItem | InsertionItem)[] = [];
    list = list.concat(missing).concat(labels).concat(connections).concat(insertions);
    list.sort((a, b) => this.getItemPosition(a) - this.getItemPosition(b));
    return getNextInLoopList(list, findIndex(list, { id }), step);
  }

  tagMove(prevStart: number, prevEnd: number, offset: number) {
    const { text } = this;
    this.results.labels = this.results.labels.map((label) => {
      const newLabel = { ...label };
      // labels overlap & before slice
      if (label.start < prevStart && label.end > prevStart && label.end <= prevEnd) {
        newLabel.end = prevEnd + offset;
        newLabel.text = substr(text, newLabel.start, newLabel.end - newLabel.start);
      } else if (label.start >= prevStart && label.end <= prevEnd) newLabel.dirty = true; // labels contained slice
      else if (label.start >= prevStart && label.start < prevEnd && label.end > prevEnd) { // labels overlap & behind slice
        newLabel.end += offset;
        newLabel.start = prevEnd + offset;
        newLabel.text = substr(text, newLabel.start, newLabel.end - newLabel.start);
      } else if (label.start < prevStart && label.end > prevEnd) { // labels contain slice
        newLabel.end += offset;
        newLabel.text = substr(text, newLabel.start, newLabel.end - newLabel.start);
      } else if (label.start > prevEnd) { // labels behind slice
        newLabel.end += offset;
        newLabel.start += offset;
      }
      // labels before slice
      // nothing happened
      return newLabel;
    });
    this.results.insertions = this.results.insertions.map((insertion) => {
      const newInsertion = { ...insertion };
      // insertions behind slice
      if (insertion.at >= prevEnd) {
        newInsertion.at += offset;
      } else if (insertion.at > prevStart && insertion.at < prevEnd) newInsertion.dirty = true; // insertions contained slice
      // insertions before slice
      // nothing happened
      if (insertion.at > prevStart - 5 && insertion.at < prevEnd + 5) {
        newInsertion.text = getTextByInsertion(text, { at: newInsertion.at, value: newInsertion.value });
      }
      return newInsertion;
    });
    this.rootStore.review.reviews.missing = this.rootStore.review.reviews.missing.map((label) => {
      const newLabel = { ...label };
      // labels overlap & before slice
      if (label.start < prevStart && label.end > prevStart && label.end <= prevEnd) {
        newLabel.end = prevEnd + offset;
        newLabel.text = substr(text, newLabel.start, newLabel.end - newLabel.start);
      } else if (label.start >= prevStart && label.end <= prevEnd) newLabel.dirty = true; // labels contained slice
      else if (label.start >= prevStart && label.start < prevEnd && label.end > prevEnd) { // labels overlap & behind slice
        newLabel.end += offset;
        newLabel.start = prevEnd + offset;
        newLabel.text = substr(text, newLabel.start, newLabel.end - newLabel.start);
      } else if (label.start < prevStart && label.end > prevEnd) { // labels contain slice
        newLabel.end += offset;
        newLabel.text = substr(text, newLabel.start, newLabel.end - newLabel.start);
      } else if (label.start > prevEnd) { // labels behind slice
        newLabel.end += offset;
        newLabel.start += offset;
      }
      // labels before slice
      // nothing happened
      return newLabel;
    });
    this.results.insertions = this.results.insertions.filter((insertion) => !insertion.dirty);
    this.results.labels = this.results.labels.filter((label) => !label.dirty);
    this.rootStore.review.reviews.missing = this.rootStore.review.reviews.missing.filter((label) => !label.dirty);
  }
}
