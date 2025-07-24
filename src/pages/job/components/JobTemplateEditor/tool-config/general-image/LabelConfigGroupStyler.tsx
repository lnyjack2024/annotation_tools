import { Select, Form, Switch } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { useEffect, useRef, useState } from "react";
import randomColor from "randomcolor";
import type { Config } from "@appen-china/easy-form-config/dist/types";
import ColorPicker from "./ColorPicker";
import PointSelector from "./PointSelector";
import EdgeSelector from "./EdgeSelector";
import type { Group } from "./types";
import styles from "./styles.less";

interface LabelConfigGroupStylerProps {
  group: Group;
  fields: Config["fields"];
  stylesMapping: {
    color?: string;
    pointType?: string;
    edgeType?: string;
    edgeBold?: string;
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
  const [pointType, setPointType] = useState("");
  const [edgeType, setEdgeType] = useState("");
  const [edgeBold, setEdgeBold] = useState(false);
  const [attr, setAttr] = useState<string | undefined>(undefined);
  const [attrValue, setAttrValue] = useState<string | string[] | undefined>(
    undefined
  );
  const updated = useRef(false);
  const colorFieldName = stylesMapping.color;
  const pointTypeFieldName = stylesMapping.pointType;
  const edgeTypeFieldName = stylesMapping.edgeType;
  const edgeBoldFieldName = stylesMapping.edgeBold;

  useEffect(() => {
    updated.current = false;
    setColor(group[colorFieldName] || randomColor());
    setPointType(group[pointTypeFieldName] || "dot");
    setEdgeType(group[edgeTypeFieldName] || "straight");
    setEdgeBold(group[edgeBoldFieldName] || false);
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
        ...(pointTypeFieldName && {
          [pointTypeFieldName]: pointType,
        }),
        ...(edgeTypeFieldName && {
          [edgeTypeFieldName]: edgeType,
        }),
        ...(edgeBoldFieldName && {
          [edgeBoldFieldName]: edgeBold,
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
  }, [color, pointType, edgeType, edgeBold, attr, attrValue]);

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
        {pointTypeFieldName && (
          <PointSelector
            style={{
              ...(colorFieldName && { marginLeft: 8 }),
            }}
            value={pointType}
            onChange={(p) => {
              updated.current = true;
              setPointType(p);
            }}
          />
        )}
        {edgeTypeFieldName && (
          <EdgeSelector
            value={edgeType}
            onChange={(t) => {
              updated.current = true;
              setEdgeType(t);
            }}
          />
        )}
        {edgeBoldFieldName && (
          <>
            <div style={{ marginLeft: 12 }}>
              {formatMessage({
                id: "tool.general-image.child.custom.edge-bold",
              })}
            </div>
            <Switch
              checked={edgeBold}
              style={{ marginLeft: 12 }}
              onChange={(b) => {
                updated.current = true;
                setEdgeBold(b);
              }}
            />
          </>
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
