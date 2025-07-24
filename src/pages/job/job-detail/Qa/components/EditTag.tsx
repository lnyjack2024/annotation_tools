import type { ChangeEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Tag, Button, Spin, Input, Form } from 'antd';

type Props = {
  value: number;
  loading: boolean;
  disabled?: boolean;
  onSubmit: (value: number) => void;
};
const EditTag: React.FC<Props> = ({ value, onSubmit, loading, disabled }) => {
  const [inputVisible, setInputVisible] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string | number>();
  const [inputError, setInputError] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value, loading, inputVisible]);

  const saveInput = () => {
    if (inputError) {
      return;
    }

    onSubmit(Number(inputValue));
    setInputVisible(false);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const validate = (v: string) => {
    if (v.indexOf('.') > -1) {
      return false;
    }
    const num = Number(v);
    return Number.isInteger(num) && num >= 0 && num <= 100;
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputError(!validate(e.target.value));
    setInputValue(e.target.value);
  };

  return (
    <Spin spinning={loading}>
      <div style={{ height: 36 }}>
        {inputVisible ? (
          <>
            <Form.Item
              style={{ marginBottom: 0 }}
              validateStatus={inputError ? 'error' : 'success'}
            >
              <Input
                style={{ width: '80px', marginRight: 8 }}
                autoFocus
                value={inputValue}
                onChange={handleNumberChange}
              />
              <span style={{ marginRight: 8 }}>%</span>
              <Button
                style={{ width: '28px', height: '28px' }}
                type="link"
                icon={<CheckOutlined />}
                onClick={saveInput}
              />
              <Button
                style={{ width: '28px', height: '28px' }}
                type="link"
                icon={<CloseOutlined />}
                onClick={() => setInputVisible(false)}
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Tag
              color="geekblue"
              style={{
                borderRadius: 4,
                marginTop: '2px',
                width: '80px',
                height: '32px',
                lineHeight: '32px',
                textAlign: 'center',
              }}
            >
              {inputValue} %
            </Tag>
            <Button
              disabled={disabled}
              style={{ width: '28px', height: '28px' }}
              type="link"
              icon={<EditOutlined />}
              onClick={showInput}
            />
          </>
        )}
      </div>
    </Spin>
  );
};

export default EditTag;
