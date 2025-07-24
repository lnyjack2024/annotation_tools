import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import EasyForm from '@appen-china/easy-form';
import { Field } from '@appen-china/easy-form/es/types';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';
import { setInitialValues } from '../../utils';
import './AttributesModal.scss';

interface InstanceItemAttributesFormProps {
  instanceItem: InstanceItem;
  onSubmit: (values: { attributes?: any }, fieldFramesMap: { [field: string]: number[] }) => void;
}

const InstanceItemAttributesForm = observer(({ instanceItem, onSubmit }: InstanceItemAttributesFormProps) => {
  // FIXME: use current camera cause multiple cameras not supported yet
  const { currentCamera, currentFrame, isSingleCamera, cameraNames } = store.frame;
  const frameData = instanceItem.cameras[currentCamera].frames[currentFrame];
  const { labelConfig: config } = instanceItem.categoryItemRef;

  // fields
  const [fields, setFields] = useState<Field[]>([]);
  // field -> applied frames mapping
  const fieldFramesMap = useRef<{ [field: string]: number[] }>({});

  // set initial ocr text
  useEffect(() => {
    setFields(setInitialValues(config?.fields || [], frameData?.attributes));
  }, []);

  const handleSubmit = (attributes?: any) => {
    const allValues: { attributes?: any } = { attributes };
    onSubmit(allValues, fieldFramesMap.current);
  };

  if (!store.instance.isInstanceItemAttributesEnabled(instanceItem)) {
    return null;
  }

  return (
    <div className="attributes-form-section">
      <div className="attributes-form-section__title">
        {`${instanceItem.itemLabel}${isSingleCamera ? '' : `-C${cameraNames.indexOf(currentCamera) + 1}`}`}
      </div>
      <div className="attributes-form-section__content">
        {config && (
          <div className="attributes-form-section__item">
            <EasyForm
              theme="dark"
              fields={fields}
              conditions={config.conditions}
              effects={config.effects}
              rules={config.rules}
              onSubmit={(v) => handleSubmit(v)}
            />
          </div>
        )}
      </div>
      {!config && (
        <div style={{ display: 'none' }}>
          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
          <button className="easyform-btn form-btn-submit" onClick={() => handleSubmit()} />
        </div>
      )}
    </div>
  );
});

export default InstanceItemAttributesForm;
