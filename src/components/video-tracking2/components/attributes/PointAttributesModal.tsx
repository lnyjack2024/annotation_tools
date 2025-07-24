import React from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { Button, ConfigProvider } from 'antd';
import EasyForm from '@appen-china/easy-form';
import Modal from '../../../common/modal/Modal';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { setInitialValues } from '../../utils';
import { PolygonData } from '../../../common/shapes/Polygon';
import { LineData } from '../../../common/shapes/Line';
import './AttributesModal.scss';

class PointAttributesModal extends React.Component {
  /**
   * form container
   */
  ref = React.createRef<HTMLDivElement>();

  /**
   * when instance values submit
   * @param values
   */
  onFrameValuesSubmit = (values: any) => {
    const { selectedShapes, selectedPointIndex } = store.shape;
    const selectedShape = selectedShapes[0];
    store.shape.setPointUserData(selectedShape, selectedPointIndex, values);
    store.config.setPointAttributesModalVisible(false);
  };

  /**
   * submit button click
   */
  submit = () => {
    const buttons = this.ref.current?.querySelectorAll('button.easyform-btn.form-btn-submit');
    buttons?.forEach((btn) => {
      (btn as HTMLButtonElement).click();
    });
  };

  render() {
    const { pointAttributesModalVisible } = store.config;
    const { selectedShapes, selectedPointIndex } = store.shape;
    if (!pointAttributesModalVisible || selectedShapes.length !== 1 || selectedPointIndex < 0) {
      // no selected point
      return null;
    }

    const selectedShape = selectedShapes[0];
    const { instanceItem } = store.shape.shapes[selectedShape.uid];
    const frameData = instanceItem.cameras[store.frame.currentCamera].frames[store.frame.currentFrame];
    const { pointLabelConfig } = instanceItem.categoryItemRef;
    if (!frameData || !pointLabelConfig) {
      return null;
    }

    const pointUserData = toJS(frameData.shape as PolygonData | LineData).points[selectedPointIndex]?.userData || {};
    const pointFields = setInitialValues(pointLabelConfig.fields, pointUserData);
    return (
      <Modal
        visible
        draggable
        closable={false}
        dragId="video-tracking-attributes"
        className="attributes-form"
        title={`${instanceItem.label} - ${i18n.translate('POINT_INDEX_LABEL', { values: { index: selectedPointIndex + 1 } })}`}
        onClose={() => store.config.setPointAttributesModalVisible(false)}
        onMaskClick={this.submit}
      >
        <div ref={this.ref} className="attributes-form-content">
          <EasyForm
            theme="dark"
            fields={pointFields}
            conditions={pointLabelConfig.conditions}
            effects={pointLabelConfig.effects}
            rules={pointLabelConfig.rules}
            onSubmit={this.onFrameValuesSubmit}
          />
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

export default observer(PointAttributesModal);
