import React, { useState } from 'react';
import type { InputProps } from 'antd';
import { Input } from 'antd';

type Props = {
  message: string;
} & InputProps;

const RequiredInput: React.FC<Props> = ({ message, ...restProps }) => {
  const [showError, setShowError] = useState(false);

  return (
    <div>
      <Input
        {...restProps}
        onChange={e => {
          if (!e.target.value) {
            setShowError(true);
          } else if (showError) {
            setShowError(false);
          }
          restProps.onChange?.(e);
        }}
      />
      {showError && (
        <p style={{ color: '#ff4d4f', paddingTop: 5 }}>{message}</p>
      )}
    </div>
  );
};

export default RequiredInput;
