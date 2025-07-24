import { Input, Tag } from "antd";
import { useEffect, useState } from "react";
import cx from "classnames";
import { useIntl } from "umi";
import "./InputTagCom.less";

const formatValue = (val = "") => {
  const newValue = val.trim().replace(/，+/g, ",");
  return newValue;
};

interface InputTagComProps {
  value?: string;
  placeholder?: string;
  onChange?: (val: string | undefined) => void;
}

function InputTagCom({ placeholder, onChange, value }: InputTagComProps) {
  const { formatMessage } = useIntl();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentValue, setCurrentValue] = useState<string | undefined>();
  useEffect(() => {
    if (value !== currentValue) {
      const newVal = formatValue(value);
      setCurrentValue(newVal);
      if (newVal !== value && onChange) {
        onChange(newVal);
      }
    }
  }, [value]);

  const handleClose = (i: number) => {
    const currentValueArr =
      currentValue?.split(/[,+]|[，+]/).filter((i) => i) || [];
    currentValueArr?.splice(i, 1);
    const newVal = currentValueArr ? currentValueArr.join(",") : undefined;
    setCurrentValue(newVal);
    if (onChange) {
      onChange(newVal);
    }
  };
  const tags = () =>
    currentValue
      ?.split(/[,+]|[，+]/)
      .filter((i) => i)
      .map((tag, i) => (
        <Tag
          key={`${tag}-${10 + i}`}
          closable
          onClose={(e) => {
            e.preventDefault();
            handleClose(i);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {tag}
        </Tag>
      ));

  const onChangeValue = (e: any) => {
    const newValue = formatValue(e.target.value);
    setCurrentValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div>
      {isEditing && (
        <Input
          value={currentValue}
          autoFocus
          placeholder={
            placeholder || formatMessage({ id: "COMMON_PLACEHOLDER" })
          }
          style={{ maxWidth: 680 }}
          onChange={onChangeValue}
          onBlur={() => setIsEditing(false)}
          onPressEnter={(e) => {
            setIsEditing(false);
            onChangeValue(e);
          }}
        />
      )}
      {!isEditing && (
        <div
          className={cx("template-config-prefix-input input-tag-wrapper", {
            tags: currentValue,
          })}
          onClick={() => setIsEditing(true)}
        >
          {currentValue && <span>{tags()}</span>}
          {!currentValue && (
            <div className="input-tag-placeholder">
              {placeholder || formatMessage({ id: "COMMON_PLACEHOLDER" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default InputTagCom;
