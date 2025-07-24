import { observable, action, makeObservable, computed } from 'mobx';
import { initOntology } from '../utils';
import { RootStoreType } from './RootStore';
import { LandmarkEditType, CategoryItem, Line, FormConfig } from '../types';

export interface OntologyItem {
  key?: string;
  class_name: string;
  display_name?: string;
  display_color?: string;
  description?: string;
  children: OntologyChild[];
};

export interface OntologyChild {
  key?: string;
  name: string;
  display_name?: string;
  class_display_name?: string;
  count: number;
  type: LandmarkEditType;
  categories?: CategoryItem[] | null;
  lines?: Line[];
  reference?: string | null;
  label_config: FormConfig | null;
  point_label_config: FormConfig | null;
}

export interface InstanceCountMap {
  count?: number,
  children: {
    [groupName: string]: number
  }
}
export interface OntologyCountMap {
  [category: string]: InstanceCountMap;
}

class OntologyStore {
  rootStore: RootStoreType;

  selectedOntologyGroup = '';

  ontology: OntologyItem[] = [];

  constructor(rootStore: RootStoreType) {
    makeObservable(this, {
      selectedOntologyGroup: observable,
      ontology: observable,
      setOntology: action
    });
    this.rootStore = rootStore;
  }

  @computed get ontologyMap() {
    const map: OntologyCountMap = {};
    this.ontology.forEach((item) => {
      map[item.class_name] = {
        count: 0,
        children: {}
      };
      item.children.forEach(({ count, name }) => {
        map[item.class_name].count! += count;
        map[item.class_name].children[name] = count;
      });
    });
    return map;
  }

  getOntologyInfo(ontologyName: string) {
    return this.ontology && this.ontology.find((ontology) => ontology.class_name === ontologyName);
  }

  getGroupData(ontologyName: string, groupName: string) {
    const ontologyItem = this.getOntologyInfo(ontologyName);
    const groupItem = ontologyItem && ontologyItem.children && ontologyItem.children.find((group) => group.name === groupName);
    return groupItem && { ...groupItem, class_display_name: ontologyItem?.display_name || ontologyItem?.class_name };
  }

  getCategoryData(ontologyName: string, groupName: string, categoryName: string) {
    const groupData = this.getGroupData(ontologyName, groupName);
    return (groupData && groupData.categories && groupData.categories.find((v) => v.name === categoryName)) || undefined;
  }

  setOntology(list: OntologyItem[] | CategoryItem[]) {
    this.ontology = Array.isArray(list) ? initOntology(list) : [];
  }
}

export default OntologyStore;
