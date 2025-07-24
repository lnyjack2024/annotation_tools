import React from 'react';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import cx from 'classnames';
import InstanceItemAttributes from './InstanceItemAttributes';
import { Up, Pencil } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { parseFields } from '../../utils';
import { FieldConfig } from '../../types';
import Instance from '../../model/Instance';
import InstanceItem from '../../model/InstanceItem';
import './InstanceAttributes.scss';
import AttributeValueItem from './AttributeValueItem';

interface InstanceAttributesProps {
  instance: Instance;
  instanceItem?: InstanceItem;
}

class InstanceAttributes extends React.Component<InstanceAttributesProps> {
  /**
   * fields map for instance & its items
   */
  fieldsMap: {
    [type: string]: { [fieldName: string]: FieldConfig }
  } = {};

  /**
   * collapsed
   */
  collapsed = false;

  constructor(props: InstanceAttributesProps) {
    super(props);

    makeObservable(this, {
      fieldsMap: observable,
      collapsed: observable,
      updateFieldsMap: action,
      toggleCollapsed: action,
    });

    this.updateFieldsMap();
  }

  componentDidUpdate(prevProps: InstanceAttributesProps) {
    if (prevProps.instance.id !== this.props.instance.id) {
      this.updateFieldsMap();
    }
  }

  updateFieldsMap() {
    const { children = [], labelConfigDynamic } = this.props.instance.categoryRef;
    this.fieldsMap = {
      dynamicInstance: parseFields(labelConfigDynamic)
    };
    // get label config for all items
    children.forEach((child) => {
      this.fieldsMap[child.name] = parseFields(child.labelConfig);
    });
  }

  toggleCollapsed = () => {
    this.collapsed = !this.collapsed;
  };

  render() {
    const { instance, instanceItem } = this.props;
    const { label: labelName } = instance;
    const dynamicAttributes = store.instance.getCurrentDynamicAttributesByInstance(instance);
    const attrKeysDynamic = Object.keys(dynamicAttributes || {});
    const fieldKeysDynamic = Object.keys(this.fieldsMap.dynamicInstance);
    const legacyKeysDynamic = attrKeysDynamic.filter((key) => !fieldKeysDynamic.includes(key));
    return (
      <div
        className={cx('collapse-panel instance-attributes-panel', {
          collapsed: this.collapsed,
        })}
      >
        <div
          className="collapse-panel-title space-between"
          onClick={this.toggleCollapsed}
        >
          <span>
            <div className="collapse-panel-collapse-icon">
              <Up />
            </div>
            {i18n.translate('INSTANCE_ATTRIBUTES_INSTANCE', {
              values: { frame: store.frame.currentFrame + 1 },
            })}
          </span>
          <span>
            {!store.readonly && store.instance.isAttributesEnabled(instance, instanceItem) && (
              <div
                className="collapse-panel-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  store.config.setAttributesModalVisible(true);
                }}
              >
                <Pencil />
              </div>
            )}
          </span>
        </div>
        <div className="collapse-panel-content">
          <div
            className="section"
          >
            <div className="section-title">
              {labelName}
            </div>
            {
              [...fieldKeysDynamic, ...legacyKeysDynamic].map((key) => attrKeysDynamic.includes(key) && (
              <AttributeValueItem
                key={key}
                fieldName={key}
                fieldsMap={this.fieldsMap.dynamicInstance}
                values={dynamicAttributes}
              />
              ))
            }
          </div>
          {instanceItem && (
            <InstanceItemAttributes
              instanceItem={instanceItem}
              fieldsMap={this.fieldsMap[instanceItem.name]}
            />
          )}
          {!instanceItem &&
          Object.values(instance.items)
            .filter((i) => {
              const cameras = Object.keys(i.cameras).filter((c) => !i.cameras[c].isEmpty);
              return cameras.includes(store.frame.currentCamera);
            })
            .map((item) => (
              <InstanceItemAttributes
                key={item.id}
                instanceItem={item}
                fieldsMap={this.fieldsMap[item.name]}
              />
            ))}
        </div>
      </div>
    );
  }
}

export default observer(InstanceAttributes);
