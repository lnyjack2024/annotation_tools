import { CloseOutlined } from "@ant-design/icons";
import type { Config } from "@appen-china/easy-form-config/dist/types";
import { Form, Select } from "antd";
import randomColor from "randomcolor";
import React, { useEffect, useRef, useState } from "react";
import { useIntl } from "umi";
import ColorPicker from "../../tool-config/general-image/ColorPicker";
import styles from "./styles.less";
import type { Group } from "./types";

interface LabelConfigGroupStylerProps {
  group: Group;
  fields: Config["fields"];
  stylesMapping: {
    color?: string;
  };
  errors?: {
    attr: boolean;
    attrValue: boolean;
  };
  onChange: (group: Group) => void;
  onDelete: (groupKey: string) => void;
}

const { Option } = Select;

const LabelConfigGroupStyler: React.FC<LabelConfigGroupStylerProps> = ({
  group,
  fields,
  stylesMapping,
  errors,
  onChange,
  onDelete,
}) => {
  const { formatMessage } = useIntl();
  const [color, setColor] = useState("");
  const [attr, setAttr] = useState<string | undefined>(undefined);
  const [attrValue, setAttrValue] = useState<string | string[] | undefined>(
    undefined
  );
  const updated = useRef(false);
  const colorFieldName = stylesMapping.color;

  useEffect(() => {
    updated.current = false;
    setColor(group[colorFieldName as keyof Group] || randomColor());
    const attrKeys = Object.keys(group.attributes);
    setAttr(attrKeys[0]);
    setAttrValue(group.attributes[attrKeys[0]]);
  }, [group]);

  useEffect(() => {
    if (updated.current) {
      const newGroup: Group = {
        ...group,
        ...(colorFieldName && {
          [colorFieldName]: color,
        }),
        attributes: {},
      };
      if (attr) {
        newGroup.attributes[attr] =
          Array.isArray(attrValue) && attrValue.length === 0
            ? undefined
            : attrValue;
      }
      onChange(newGroup);
    }
  }, [color, attr, attrValue]);

  const field = fields.find((f) => f.name === attr);
  return (
    <div className={styles["attr-item"]}>
      <div>
        {colorFieldName && (
          <ColorPicker
            width={32}
            value={color}
            onChange={(c) => {
              updated.current = true;
              setColor(c);
            }}
          />
        )}
        <Form.Item
          {...(errors?.attr && {
            validateStatus: "error",
          })}
        >
          <Select
            style={{ width: 220, marginLeft: 12 }}
            value={attr}
            onChange={(a) => {
              updated.current = true;
              setAttr(a);
              setAttrValue(undefined);
            }}
          >
            {fields.map((f) => (
              <Option
                key={f.name}
                value={f.name}
                disabled={!["CHECKBOX", "RADIO", "SELECT"].includes(f.type)}
              >
                {`[${formatMessage({
                  id: `tool.general-image.field-type.${f.type}`,
                })}] ${f.label || f.name}`}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          {...(errors?.attrValue && {
            validateStatus: "error",
          })}
        >
          <Select
            style={{ width: 220, marginLeft: 12 }}
            value={attrValue}
            onChange={(v) => {
              updated.current = true;
              setAttrValue(v);
            }}
            {...(field?.type === "CHECKBOX" && {
              mode: "multiple",
            })}
          >
            {field?.options &&
              field.options.map((o) => (
                <Option key={o.value.toString()} value={o.value}>
                  {o.label || o.value}
                </Option>
              ))}
          </Select>
        </Form.Item>
      </div>
      <CloseOutlined
        style={{ cursor: "pointer" }}
        onClick={() => onDelete(group.key)}
      />
    </div>
  );
};

export default LabelConfigGroupStyler;
