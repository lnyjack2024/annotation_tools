import { Button, ButtonProps } from 'antd';
import React, { useState } from 'react';

type RenderParam = {
  visible: boolean;
  onCancel: () => void;
};
interface Props extends ButtonProps {
  render: (params: RenderParam) => React.ReactNode;
}

export const ModalButton = ({ render, children, onClick, ...rest }: Props) => {
  const [visible, setVisible] = useState(false);
  const [init, setInit] = useState(false);
  const showModal = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setVisible(true);
    setInit(true);
    if (onClick instanceof Function) {
      onClick(e);
    }
  };
  const onCancel = () => {
    setVisible(false);
  };
  return (
    <>
      <Button onClick={showModal} {...rest}>
        {children}
      </Button>
      {init && render({ visible, onCancel })}
    </>
  );
};
