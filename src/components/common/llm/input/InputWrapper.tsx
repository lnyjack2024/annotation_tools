import React, { useEffect, useRef, useState } from 'react';
import Input, { InputHandle } from './Input';
import { Content, ContentItemType } from '../types';
import './Input.scss';

export enum InputType {
  DEFAULT = 'default',
}

interface InputWrapperProps {
  types?: InputType[];
  defaultValue?: Content;
  onSubmit: (value: Content) => void;
  onCancel: () => void;
  onError: (msg?: string) => void;
}

const InputWrapper: React.FC<InputWrapperProps> = ({
  types = [InputType.DEFAULT],
  defaultValue,
  onSubmit,
  onCancel,
  onError,
}) => {
  const textRef = useRef<InputHandle>(null);
  const cachedText = useRef('');
  const [type, setType] = useState<InputType>();

  useEffect(() => {
    setType(InputType.DEFAULT);
  }, []);

  useEffect(() => {
    const newContent: Content = [];
    if (cachedText.current) {
      newContent.push({
        type: ContentItemType.UNSTYLED,
        content: cachedText.current,
      });
    };
    if (newContent.length > 0) {
      if (type === InputType.DEFAULT) {
        textRef.current?.setValue(newContent);
      }
    }
  }, [type]);

  return type === InputType.DEFAULT ? (
    <Input
      ref={textRef}
      defaultValue={defaultValue}
      onSubmit={onSubmit}
      onCancel={onCancel}
      onError={onError}
    />
  ) : null;
};

export default InputWrapper;
