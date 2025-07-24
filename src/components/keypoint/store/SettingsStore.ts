import { computed, makeAutoObservable } from 'mobx';
import { RootStoreType } from './RootStore';
import { LabelItem, LabelStyle, LabelFormat, PathStyles } from '../types';

export enum AttributesMode {
  HIDE = 'hide',
  HOVER = 'hover',
  ALWAYS = 'always',
}

class SettingStore {
  rootStore: RootStoreType;

  isFullScreen = false;

  isGridVisible = false;

  pointSize = 4;

  lineWidth = 1;

  filters: {[key: string]: number;} = {};

  submitCheck = false;

  /**
   * active attributes mode for point
   */
  activePointAttributesMode = AttributesMode.HIDE;

  /**
   * active attributes mode
   */
  activeAttributesMode = AttributesMode.HIDE;

  /**
   * label mode
   */
  labelMode = true;

  /**
   * label items
   */
  labelItems = [LabelItem.CATEGORY, LabelItem.ATTRIBUTE_KEYS, LabelItem.ATTRIBUTE_VALUES];

  /**
   * label style
   */
  labelStyle = LabelStyle.DEFAULT;

  /**
   * path style
   */
  pathStyle: PathStyles = PathStyles.DEFAULT;

  /**
   * label background color
   */

  labelBgColor = 'rgba(0,0,0,0.6)';

  /**
   * label format
   */
  labelFormat = LabelFormat.DEFAULT;

  /**
   * label items for point
   */
  pointLabelItems = [LabelItem.NUMBER, LabelItem.ATTRIBUTE_KEYS, LabelItem.ATTRIBUTE_VALUES];

  displayPointIndex = true;

  constructor(rootStore: RootStoreType) {
    makeAutoObservable(this, {
      rootStore: false,
      submitCheck: false,
      labelBgColor: false,
      displayPointIndex: false,
      pathStyle: false,
    }, {
      autoBind: true,
    });
    this.rootStore = rootStore;
  }

  setPointSize(size: number) {
    this.pointSize = size;
  }

  setLineWidth(width: number) {
    this.lineWidth = width;
  }

  setFullScreen(full: boolean) {
    this.isFullScreen = full;
  }

  setGridVisible(visible: boolean) {
    this.isGridVisible = visible;
  }

  setLabelMode(mode: boolean) {
    this.labelMode = mode;
  }

  handleFiltersChange(filters: {[key: string]: number}) {
    this.filters = filters;
  }

  @computed get displayCategory() {
    return this.labelItems.includes(LabelItem.CATEGORY);
  }

  /**
   * init by payload
   * @param payload
   */
  initPayload(payload: {[key: string]: any}) {
    return new Promise((resolve) => {
      // parse label mode
      this.activeAttributesMode = Object.values(AttributesMode).includes(payload.label_mode) ? payload.label_mode : AttributesMode.HIDE;
      // parse poiny label mode
      this.activePointAttributesMode = Object.values(AttributesMode).includes(payload.point_label_mode) ? payload.point_label_mode : AttributesMode.ALWAYS;
      // parse label style
      this.labelStyle = Object.values(LabelStyle).includes(payload.label_style) ? payload.label_style : LabelStyle.DEFAULT;
      this.pathStyle = Object.values(PathStyles).includes(payload.path_style as PathStyles) ? payload.path_style as PathStyles : PathStyles.DEFAULT;
      this.labelBgColor = this.labelStyle === LabelStyle.DEFAULT ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.0)';
      // parse label format
      this.labelFormat = Object.values(LabelFormat).includes(payload.label_format) ? payload.label_format : LabelFormat.DEFAULT;
      // parse label items
      if (typeof payload.label_item === 'string' && payload.label_item) {
        this.labelItems = [];
        payload.label_item.split(',').forEach((i) => {
          const item = i.trim();
          if ((Object.values(LabelItem) as string[]).includes(item)) {
            this.labelItems.push(item as LabelItem);
          }
        });
      }
      // parse point label items
      if (typeof payload.point_label_item === 'string' && payload.point_label_item) {
        this.pointLabelItems = [];
        payload.point_label_item.split(',').forEach((i) => {
          const item = i.trim();
          if ((Object.values(LabelItem) as string[]).includes(item)) {
            this.pointLabelItems.push(item as LabelItem);
          }
        });
        this.displayPointIndex = this.pointLabelItems.includes(LabelItem.NUMBER);
      }

      resolve(true);
    });
  }

  /**
   * set active attributes mode
   * @param activeMode
   * @param type point or object
   */
  setActiveAttributesMode(activeMode: AttributesMode, type = 'object') {
    if (type === 'keypoint') {
      this.activePointAttributesMode = activeMode;
    } else {
      this.activeAttributesMode = activeMode;
    }
  };
}

export default SettingStore;
