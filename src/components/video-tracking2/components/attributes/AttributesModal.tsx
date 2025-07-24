import React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable, action, reaction, IReactionDisposer } from 'mobx';
import { Button, ConfigProvider } from 'antd';
import EasyForm from '@appen-china/easy-form';
import { cloneDeep } from 'lodash';
import Modal from '../../../common/modal/Modal';
import InstanceItemAttributesForm from './InstanceItemAttributesForm';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { setInitialValues } from '../../utils';

import { Instance as IInstance, InstanceItem as IInstanceItem, DynamicAttributes } from '../../types';
import './AttributesModal.scss';

class AttributesModal extends React.Component {
  /**
   * form container
   */
  ref = React.createRef<HTMLDivElement>();

  /**
 * reaction disposer
 */
  reactionDisposer: IReactionDisposer;

  /**
   * forms count that to be submitted
   */
  submitCount = 0;

  dynamicInstanceFields: any = [];

  /**
   * instance state
   */
  instanceState?: {
    prevState: IInstance;
    currState: IInstance;
  };

  /**
   * items state
   */
  itemStates: {
    prevState?: IInstanceItem;
    currState?: IInstanceItem;
  }[] = [];

  constructor(props: any) {
    super(props);
    makeObservable(this, {
      dynamicInstanceFields: observable,

    });

    this.reactionDisposer = reaction(
      () => store.config.attributesModalVisible,
      () => {
        if (store.config.attributesModalVisible) {
          // init instance fields
          const selectedInstance = store.instance.selectedInstances[0];
          if (selectedInstance) {
            const { labelConfigDynamic: dynamicInstanceConfig } = selectedInstance.categoryRef;

            if (dynamicInstanceConfig) {
              const attrs = store.instance.getCurrentDynamicAttributesByInstance(selectedInstance);

              this.dynamicInstanceFields = setInitialValues(dynamicInstanceConfig.fields, attrs);
            }
          }
        }
      },
    );
  }

  /**
   * when instance item values submit (with OCR text)
   * @param instanceItem
   * @param values
   * @param fieldFramesMap
   */
  onItemValuesSubmit = (instanceItem: InstanceItem, values: { attributes?: any }, fieldFramesMap: { [field: string]: number[] }) => {
    const { currentCamera, currentFrame } = store.frame;
    const frames = Object.values(fieldFramesMap)[0] || [currentFrame];
    const { prevState, currState } = instanceItem.setAttributes(currentCamera, frames, values);
    this.itemStates.push({ prevState, currState });
    this.checkFinished();
  };

  /**
   * when instance values submit
   * @param values
   */
  onInstanceValuesSubmit = (values: any, type: string) => {
    const { selectedInstances } = store.instance;
    if (selectedInstances.length === 1) {
      const selectedInstance = selectedInstances[0];
      const prevBasicInfo = selectedInstance.getBasicInfo();
      let prevDynamicAttributes;
      switch (type) {
        case 'dynamic': {
          prevDynamicAttributes = cloneDeep(prevBasicInfo.dynamicAttributes);
          const { currentFrame, currentCamera } = store.frame;
          const updatedFrameAttributes: DynamicAttributes[] = [];
          const { dynamicAttributes = {} } = selectedInstance;
          const attributesCurrentCamera = dynamicAttributes[currentCamera];

          updatedFrameAttributes.push({
            frameIndex: currentFrame,
            attributes: { ...attributesCurrentCamera?.[currentFrame]?.attributes, ...values },
          });
          selectedInstance.setDynamicAttributesByCamera(currentCamera, updatedFrameAttributes);
          break;
        }
        default:
          break;
      }
      if (!this.instanceState) {
        this.instanceState = {
          prevState: { ...prevBasicInfo, children: [] },
          currState: { ...selectedInstance.getBasicInfo(), children: [] },
        };
      } else {
        this.instanceState = {
          prevState: {
            ...this.instanceState.prevState,
            ...prevDynamicAttributes && { dynamicAttributes: prevDynamicAttributes }
          },
          currState: { ...selectedInstance.getBasicInfo(), children: [] },
        };
      }
    }
    this.checkFinished();
  };

  /**
   * check if all forms has been submitted
   */
  checkFinished() {
    this.submitCount -= 1;
    if (this.submitCount === 0) {
      // finish
      const basicInfo = store.instance.selectedInstances[0]!.getBasicInfo();
      const prevInstance: IInstance = {
        ...basicInfo,
        children: [],
      };
      const currInstance: IInstance = {
        ...basicInfo,
        children: [],
      };
      this.itemStates.forEach(({ prevState, currState }) => {
        if (prevState) {
          prevInstance.children.push(prevState);
        }
        if (currState) {
          currInstance.children.push(currState);
        }
      });
      store.undo.push({ instances: [prevInstance] }, { instances: [currInstance] });
      store.config.setAttributesModalVisible(false);
    }
  }

  /**
   * submit button click
   */
  submit = () => {
    this.submitCount = 0;
    this.itemStates = [];

    const buttons = this.ref.current?.querySelectorAll('button.easyform-btn.form-btn-submit');
    buttons?.forEach((btn) => {
      this.submitCount += 1;
      (btn as HTMLButtonElement).click();
    });
  };

  render() {
    const { attributesModalVisible } = store.config;

    const { isMultiSelected, selectedInstances, selectedInstanceItems } = store.instance;
    if (!attributesModalVisible || isMultiSelected || selectedInstances.length <= 0) {
      return null;
    }

    const selectedInstance = selectedInstances[0];

    const { labelConfigDynamic: dynamicInstanceConfig } = selectedInstance.categoryRef;
    const displayItems = selectedInstanceItems.length === 1 ? [selectedInstanceItems[0]] : Object.values(selectedInstance.items);

    const hasInstanceDynamicAttrCfg = dynamicInstanceConfig && this.dynamicInstanceFields;
    return (
      <Modal
        visible
        draggable
        closable={false}
        dragId="video-tracking-attributes"
        className="attributes-form"
        title={i18n.translate('INSTANCE_ATTRIBUTES')}
        onClose={() => store.config.setAttributesModalVisible(false)}
      >
        <div ref={this.ref} className="attributes-form-content">
          {hasInstanceDynamicAttrCfg && (
            <div className="attributes-form-section">
              <div className="attributes-form-section__title">
                {selectedInstance?.label && i18n.translate('ATTRIBUTES_MODE_INSPECT_LABEL_DYNAMIC', { values: { prefix: selectedInstance.label } })}
              </div>
              <EasyForm
                autoFocus
                theme="dark"
                fields={this.dynamicInstanceFields}
                conditions={dynamicInstanceConfig.conditions}
                effects={dynamicInstanceConfig.effects}
                rules={dynamicInstanceConfig.rules}
                onSubmit={(val) => this.onInstanceValuesSubmit(val, 'dynamic')}
                renderLabel={(label, field) => (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {label}
                  </div>
                )}
              />
            </div>
          )}
          {displayItems.map((item) => (
            <InstanceItemAttributesForm
              key={item.id}
              instanceItem={item}
              onSubmit={(values, fieldFramesMap) => this.onItemValuesSubmit(item, values, fieldFramesMap)}
            />
          ))}
        </div>
        <div className="attributes-form-footer">
          <ConfigProvider prefixCls="easyform">
            <Button type="primary" onClick={this.submit} style={{ marginRight: 16 }}>
              {i18n.translate('COMMON_SUBMIT')}
            </Button>
          </ConfigProvider>
        </div>
      </Modal>
    );
  }
}

export default observer(AttributesModal);
