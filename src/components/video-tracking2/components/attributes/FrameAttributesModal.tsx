import React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, reaction, IReactionDisposer } from 'mobx';
import { Button, ConfigProvider } from 'antd';
import EasyForm from '@appen-china/easy-form';
import { ConditionType, Field } from '@appen-china/easy-form/es/types';
import Modal from '../../../common/modal/Modal';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { setInitialValues } from '../../utils';
import './AttributesModal.scss';

interface FrameAttributesModalState {
  frameFields: Field[];
}

class FrameAttributesModal extends React.Component {
  state: FrameAttributesModalState = {
    frameFields: [],
  };

  attributes = {};

  /**
   * form container
   */
  ref = React.createRef<HTMLDivElement>();

  /**
   * reaction disposer
   */
  reactionDisposer: IReactionDisposer;

  constructor(props: any) {
    super(props);
    makeObservable(this, {});

    this.reactionDisposer = reaction(
      () => store.config.frameAttributesModalVisible,
      () => {
        if (store.config.frameAttributesModalVisible) {
          this.initFrameFields();
        }
      },
    );
  }

  /**
   * when instance values submit
   * @param values
   */
  onFrameValuesSubmit = (values: any) => {
    const { currentCamera, currentFrame, setFrameAttributesForCamera } = store.frame;
    const applyFrames = [currentFrame];
    setFrameAttributesForCamera(
      currentCamera,
      applyFrames,
      values,
    );
    store.config.setFrameAttributesModalVisible(false);
  };

  /**
   * submit button click
   */
  submit = () => {
    if (store.frame.frameConfig) {
      const buttons = this.ref.current?.querySelectorAll('button.easyform-btn.form-btn-submit');
      buttons?.forEach((btn) => {
        (btn as HTMLButtonElement).click();
      });
    } else {
      this.onFrameValuesSubmit(undefined);
    }
  };

  getEffectedFieldsByConditionIds = (ids: Set<string>) => {
    const { frameConfig } = store.frame;
    const conditions = frameConfig?.conditions || [];
    const effectedConditions = (conditions).filter((c) => ids.has(c.id));
    const effectedAggregationConditions = effectedConditions.filter((c) => c.type === ConditionType.AGGREGATION);
    const effectedField = effectedConditions.filter((c) => c.type === ConditionType.FIELD).map((c) => c.field);
    if (effectedAggregationConditions.length > 0) {
      effectedField.push(...this.getEffectedFieldsByConditionIds(new Set(effectedAggregationConditions.flatMap((c) => c.conditions) as string[])));
    }
    return Array.from(new Set(effectedField));
  };

  getEffectedFields = (fieldNames: string[], _allFieldNames?: string[]): string[] => {
    const { frameConfig } = store.frame;
    const effects = frameConfig?.effects || [];
    const rules = frameConfig?.rules || [];
    let allFieldNames = _allFieldNames;
    if (!allFieldNames) {
      allFieldNames = [...fieldNames];
    }
    const fieldEffectIds = new Set((effects).filter((e) => fieldNames.includes(e.field)).map((e) => e.id));
    if (fieldEffectIds.size > 0) {
      const effectedConditionIds = new Set((rules).filter((r) => r.effects.some((e) => fieldEffectIds.has(e))).map((i) => i.condition));
      const effectedFields = this.getEffectedFieldsByConditionIds(effectedConditionIds).filter((i) => !allFieldNames!.includes(i!)) as string[];
      if (effectedFields.length > 0) {
        return this.getEffectedFields(effectedFields, effectedFields.concat(allFieldNames));
      }
      return allFieldNames;
    }
    return allFieldNames;
  };

  handleChange = (values: any) => {
    const { frameConfig } = store.frame;
    if (frameConfig) {
      this.attributes = { ...this.attributes, ...values };
    }
  };

  initFrameFields = () => {
    const { frameConfig, currentFrameAttributes } = store.frame;
    if (frameConfig) {
      this.attributes = currentFrameAttributes;
      const frameFields = setInitialValues(frameConfig.fields, { ...currentFrameAttributes });
      this.setState({ frameFields });
    }
  };

  render() {
    const { currentFrame, frameConfig, isSingleCamera, cameraNames, currentCamera } = store.frame;
    if (!store.config.frameAttributesModalVisible) {
      return null;
    }

    return (
      <Modal
        visible
        draggable
        closable={false}
        dragId="video-tracking-attributes"
        className="attributes-form"
        title={
          `${i18n.translate('FRAME_ATTRIBUTES')}${isSingleCamera ? '' : `-C${cameraNames.indexOf(currentCamera) + 1}`}-${i18n.translate('FRAME_ATTRIBUTES_FRAME', { values: { frame: currentFrame + 1 } })}`
        }
        onClose={() => store.config.setFrameAttributesModalVisible(false)}
        onMaskClick={this.submit}
      >
        <div ref={this.ref} className="attributes-form-content">
          {frameConfig && this.state.frameFields && (
            <EasyForm
              theme="dark"
              fields={this.state.frameFields}
              conditions={frameConfig.conditions}
              effects={frameConfig.effects}
              rules={frameConfig.rules}
              onChange={this.handleChange}
              onSubmit={this.onFrameValuesSubmit}
            />
          )}
        </div>
        <div className="attributes-form-footer">
          <ConfigProvider prefixCls="easyform">
            <Button type="primary" onClick={this.submit}>
              {i18n.translate('COMMON_SUBMIT')}
            </Button>
          </ConfigProvider>
        </div>
      </Modal>
    );
  }
}

export default observer(FrameAttributesModal);
