import React, { useMemo, useState, useImperativeHandle } from 'react';
import EasyForm from '@appen-china/easy-form';
import { Field, Condition, Effect, Rule } from '@appen-china/easy-form/es/types';
import Modal from '../../common/modal/Modal';

interface AttributesProps {
  readonly: boolean;
  config: {
    fields: Field[];
    conditions?: Condition[];
    effects?: Effect[];
    rules?: Rule[];
  } | null;
  values: any;
  onValuesChange: (values: any) => void;
}

export interface AttributesHandle {
  modalVisible: boolean;
  showModal: (title: string) => void;
}

const Attributes = React.forwardRef<AttributesHandle, AttributesProps>(({
  readonly,
  config,
  values,
  onValuesChange,
}, ref) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');

  // fields with initial value
  const fieldsWithInitialValue = useMemo(() => (config?.fields || []).map((field) => ({
    ...field,
    readonly: readonly || field.readonly,
    ...values && values[field.name] !== undefined && {
      defaultValue: values[field.name],
    }
  })), [config, values]);

  useImperativeHandle(ref, () => ({
    modalVisible: visible,
    showModal: (tit: string) => {
      setVisible(true);
      setTitle(tit);
    },
  }));

  const handleValuesChange = (v: any) => {
    setVisible(false);
    onValuesChange({ ...v });
  };

  return (
    <Modal
      className="attributes-form"
      visible={visible}
      draggable={false}
      closable={false}
      dragId="keypoint-attributes"
      onClose={() => {
        handleValuesChange({});
      }}
      title={title}
    >
      <EasyForm
        theme="dark"
        fields={fieldsWithInitialValue}
        conditions={config?.conditions}
        effects={config?.effects}
        rules={config?.rules}
        onSubmit={handleValuesChange}
      />
    </Modal>
  );
});

export default Attributes;
