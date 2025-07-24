import { makeAutoObservable, toJS } from 'mobx';
import RootStore from './RootStore';
import { getShapeTypeByTool, parseLabelConfig } from '../utils';
import { Tool, Payload, Category, CategoryItem, ToolItem } from '../types';
import { ShapeType } from '../../common/shapes/types';

/**
 * store for ontology
 * @class
 */
export default class OntologyStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * categories
   */
  categories: Category[] = [];

  /**
   * selected category name
   */
  selectedCategoryName = '';

  /**
   * selected category item name
   */
  selectedCategoryItemName = '';

  /**
   * selected tool item
   */
  currentToolItem: ToolItem | null = null;

  /**
   * selected category
   * @getter
   */
  get selectedCategory() {
    const currentCategory = this.getCategory(this.selectedCategoryName);
    return currentCategory || this.categories[0];
  }

  /**
   * selected category item
   * @getter
   */
  get selectedCategoryItem() {
    const { children } = this.selectedCategory;
    const index = children.findIndex((c) => c.name === this.selectedCategoryItemName);
    return index >= 0 ? children[index] : children[0];
  }

  /**
   * current tool
   * @getter
   */
  get currentTool() {
    if (this.currentToolItem) {
      return this.currentToolItem.type;
    }
    return Tool.RECTANGLE;
  }

  /**
   * current shapeType by currentTool
   * @getter
   */
  get currentShapeType() {
    return getShapeTypeByTool(this.currentTool) || ShapeType.RECTANGLE;
  }

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * init from paylod
   * @param payload
   */
  init(payload: Payload) {
    const categories: Category[] = [];

    const { ontology = [] } = payload;
    ontology.forEach((o) => {
      const items: CategoryItem[] = [];
      o.children?.forEach((child) => {
        const {
          name,
          display_name,
          display_color,
          count,
          label_config,
          label_config_point,
          type = '',
          tools,
        } = child;

        // parse tools
        let allTools: ToolItem[] = [];
        if (tools) {
          tools.forEach((item) => {
            const itemType: Tool = [Tool.RECTANGLE, Tool.POLYGON, Tool.LINE, Tool.DOT].includes(item.type as Tool) ? item.type as Tool : Tool.RECTANGLE;
            const tool: ToolItem = { type: itemType };
            allTools.push(tool);
          });
        } else {
          // legacy config
          let legacyEdges: number | undefined;
          allTools = type.split(',').map((i) => ({ type: i as Tool || Tool.RECTANGLE, edges: legacyEdges }));
        }

        const item: CategoryItem = {
          name,
          displayName: display_name || name,
          displayColor: display_color || o.display_color || '',
          tools: allTools,
        };
        if (count !== undefined && count !== null) {
          item.count = Number(count);
        }
        if (label_config) {
          item.labelConfig = parseLabelConfig(label_config);
        }
        if (label_config_point) {
          item.pointLabelConfig = parseLabelConfig(label_config_point);
        }
        items.push(item);
      });

      let categoryColor = '';
      if (items.length === 1 && items[0].count === 1) {
        categoryColor = items[0].displayColor;
      }
      categories.push({
        className: o.class_name,
        displayName: o.display_name || o.class_name,
        displayColor: categoryColor,
        labelConfigDynamic: parseLabelConfig(o.label_config_dynamic),
        children: items,
      });
    });
    this.categories = categories;
    this.selectedCategoryName = this.categories[0]?.className;
    this.selectedCategoryItemName = this.categories[0]?.children[0]?.name;
    this.currentToolItem = this.categories[0]?.children[0]?.tools[0];
  }

  /**
   * get category object
   * @param categoryName
   */
  getCategory(categoryName: string) {
    return toJS(this.categories.find((o) => o.className === categoryName));
  }

  /**
   * get category item
   * @param categoryName
   * @param categoryItemName
   */
  getCategoryItem(categoryName: string, categoryItemName: string) {
    const category = this.getCategory(categoryName);
    return toJS((category?.children || []).find((o) => o.name === categoryItemName));
  }

  /**
   * set selected category
   * @param categoryName
   */
  selectCategory(categoryName: string) {
    if (this.selectedCategoryName !== categoryName) {
      // turn off the add mode
      this.rootStore.config.setAddMode(false);
      // category changes
      this.selectedCategoryName = categoryName;
      // update selected category name
      this.selectCategoryItem(this.selectedCategory.children[0].name); // default select the first one
      // unselect selected instance if needed
      if (this.rootStore.instance.selectedInstances.findIndex((i) => i.category === categoryName) < 0) {
        this.rootStore.instance.selectInstance(null);
      }
    }
  }

  /**
   * set selected category item
   * @param categoryItemName
   */
  selectCategoryItem(categoryItemName: string) {
    this.selectedCategoryItemName = categoryItemName;
    this.currentToolItem = this.selectedCategoryItem.tools[0];
  }

  /**
   * activate category item
   * @param categoryItemName
   * @param tool
   */
  activateCategoryItem(categoryItemName: string, tool: ToolItem) {
    if (this.rootStore.shape.isDrawing) {
      return;
    }
    this.selectCategoryItem(categoryItemName);
    this.selectTool(tool);
    this.rootStore.config.setAddMode(true);
  }

  /**
   * activate category item by index
   * @param index
   */
  activateCategoryItemByIndex(index: number) {
    if (this.rootStore.shape.isDrawing) {
      return;
    }
    const child = this.selectedCategory.children[index];
    if (child) {
      const tool = child.name === this.selectedCategoryItemName ? this.currentToolItem! : child.tools[0];
      this.activateCategoryItem(child.name, tool);
    }
  }

  /**
   * set current tool
   * @param tool
   */
  selectTool(tool: ToolItem) {
    if (this.currentToolItem !== tool) {
      this.currentToolItem = tool;
    }
  }

  /**
 * get dynamic label config from category
 * @param categoryName
 */
  getDynamicLabelConfigFromCategory(categoryName: string) {
    const category = this.getCategory(categoryName);
    return category?.labelConfigDynamic;
  }

  /**
   * get label config from category item
   * @param categoryName
   * @param categoryItemName
   */
  getLabelConfigFromCategoryItem(categoryName: string, categoryItemName: string) {
    const categoryItem = this.getCategoryItem(categoryName, categoryItemName);
    return categoryItem?.labelConfig;
  }

  /**
   * get point label config from category item
   * @param categoryName
   * @param categoryItemName
   */
  getPointLabelConfigFromCategoryItem(categoryName: string, categoryItemName: string) {
    const categoryItem = this.getCategoryItem(categoryName, categoryItemName);
    return categoryItem?.pointLabelConfig;
  }
}
