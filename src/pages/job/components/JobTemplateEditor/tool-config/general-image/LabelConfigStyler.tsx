import { useEffect, useMemo, useState } from "react";
import { Button, message, Modal, Radio } from "antd";
import { useIntl } from "@umijs/max";
import { nanoid } from "nanoid";
import cx from "classnames";
import type { Config } from "@appen-china/easy-form-config/dist/types";
import LabelConfigGroupStyler from "./LabelConfigGroupStyler";
import type { Group } from "./types";
import { StyleNames } from "./types";
import styles from "./styles.less";

interface LabelConfigStylerProps {
  title: string;
  desc: string;
  warningDesc: string;
  mode?: "point-attr" | "item-attr";
  labelConfig?: string;
  labelConfigPoint?: string;
  stylesMapping: {
    color?: StyleNames;
    pointType?: StyleNames;
    edgeType?: StyleNames;
    edgeBold?: StyleNames;
  };
  styleName: StyleNames;
  pointLabelConfigGroups?: Group[];
  labelConfigGroups?: Group[];
  onChange: (groups: Group[], mode: "point-attr" | "item-attr") => void;
}

const LabelConfigStyler: React.FC<LabelConfigStylerProps> = ({
  title,
  desc,
  warningDesc,
  mode: defaultMode,
  labelConfig,
  labelConfigPoint,
  stylesMapping,
  styleName,
  pointLabelConfigGroups: defaultPointLabelConfigGroups,
  labelConfigGroups: defaultLabelConfigGroups,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  const [otherGroups, setOtherGroups] = useState<Group[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupErrors, setGroupErrors] = useState<
    { attr: boolean; attrValue: boolean }[]
  >([]);
  const [mode, setMode] = useState<"point-attr" | "item-attr">("point-attr");
  const fields = useMemo<Config["fields"]>(() => {
    const config = mode === "item-attr" ? labelConfig : labelConfigPoint;
    if (config) {
      try {
        const configStr = Buffer.from(config || "", "base64").toString("utf-8");
        const parsedConfig: Config = JSON.parse(configStr);
        return parsedConfig.fields;
      } catch (e) {
        // parse error
        message.error(
          formatMessage({ id: "tool.general-image.config.fields.error" })
        );
      }
    }
    return [];
  }, [labelConfigPoint, labelConfig, mode, formatMessage]);

  useEffect(() => {
    const defaultConfigGroups =
      (mode === "item-attr"
        ? defaultLabelConfigGroups
        : defaultPointLabelConfigGroups) || [];
    const list = defaultConfigGroups
      .filter((g) => {
        return !!g[styleName];
      })
      .map((g) => ({
        key: nanoid(),
        ...g,
      }));
    const otherList = defaultConfigGroups.filter((g) => {
      return !g[styleName];
    });
    setGroups(list);
    setOtherGroups(otherList);
  }, [editing, defaultPointLabelConfigGroups, defaultLabelConfigGroups, mode]);

  useEffect(() => {
    setMode(defaultMode || "item-attr");
  }, [defaultMode]);

  const goSetting = () => {
    if (!labelConfig && !labelConfigPoint) {
      Modal.warning({
        title: formatMessage({ id: "common.prompt" }),
        content: warningDesc,
        okText: formatMessage({ id: "common.ok" }),
      });
    } else {
      setEditing(true);
    }
  };

  /**
   * on add click
   */
  const add = () => {
    if (fields.length > 0) {
      const newGroup: Group = {
        key: nanoid(),
        attributes: {},
      };
      setGroups([...groups, newGroup]);
    }
  };

  const update = (group: Group) => {
    const newGroups = [...groups];
    const newErrors = [...groupErrors];
    const index = groups.findIndex((i) => i.key === group.key);
    if (index >= 0) {
      newGroups.splice(index, 1, group);
      newErrors.splice(index, 1, { attr: false, attrValue: false });
      setGroups(newGroups);
      setGroupErrors(newErrors);
    }
  };

  const del = (groupKey: string) => {
    const newGroups = [...groups];
    const newErrors = [...groupErrors];
    const index = groups.findIndex((i) => i.key === groupKey);
    if (index >= 0) {
      newGroups.splice(index, 1);
      newErrors.splice(index, 1);
      setGroups(newGroups);
      setGroupErrors(newErrors);
    }
  };

  const handleClear = () => {
    setGroups([]);
  };

  const handleSave = () => {
    const gErrors = groups.map((g) => {
      const errors = {
        attr: false,
        attrValue: false,
      };
      if (Object.keys(g.attributes).length !== 1) {
        // no field
        errors.attr = true;
      }
      if (Object.values(g.attributes)[0] === undefined) {
        // no field value
        errors.attrValue = true;
      }
      return errors;
    });
    if (gErrors.some((g) => g.attr || g.attrValue)) {
      setGroupErrors(gErrors);
    } else {
      onChange([...otherGroups, ...groups], mode);
      setEditing(false);
    }
  };

  return (
    <>
      <span style={{ color: "#7A869A", marginRight: 12, marginLeft: 22 }}>
        {formatMessage({
          id:
            groups.length > 0
              ? "tool.general-image.config.been-set"
              : "tool.general-image.config.empty",
        })}
      </span>
      <Button onClick={goSetting}>
        {formatMessage({
          id:
            groups.length > 0
              ? "tool.general-image.config.check-set"
              : "tool.general-image.config.set",
        })}
      </Button>
      <Modal
        visible={editing}
        footer={null}
        width={800}
        bodyStyle={{
          minHeight: 520,
          paddingBottom: 80,
          position: "relative",
          color: "#42526E",
        }}
        title={title}
        onCancel={() => setEditing(false)}
      >
        <Radio.Group
          style={{ marginBottom: 24 }}
          onChange={(e) => {
            setMode(e.target.value);
          }}
          value={mode}
        >
          {defaultMode && (
            <Radio value="point-attr">
              {formatMessage({
                id: "tool.general-image.child.custom.point-attr",
              })}
            </Radio>
          )}
          <Radio value="item-attr">
            {formatMessage({ id: "tool.general-image.child.custom.item-attr" })}
          </Radio>
        </Radio.Group>
        <div style={{ marginBottom: 16 }}>
          {defaultMode
            ? formatMessage({
                id: `tool.general-image.child.custom.${styleName}.${mode}.${
                  fields.length ? "desc" : "warning"
                }`,
              })
            : fields.length
            ? desc
            : warningDesc}
        </div>
        <div>
          {groups.map((g, i) => (
            <LabelConfigGroupStyler
              key={g.key}
              group={g}
              fields={fields}
              errors={groupErrors[i]}
              stylesMapping={stylesMapping}
              onChange={update}
              onDelete={del}
            />
          ))}
          <div
            className={cx(styles["attr-item-add"], {
              [styles.disabled]: fields.length === 0,
            })}
            onClick={add}
          >
            <a>{formatMessage({ id: "tool.general-image.config.new" })}</a>
          </div>
        </div>
        <div className={styles["styler-btns"]}>
          <div>
            <Button
              type="link"
              danger
              style={{ padding: 0 }}
              onClick={handleClear}
            >
              {formatMessage({ id: "tool.general-image.config.reset" })}
            </Button>
          </div>
          <div>
            <Button
              style={{ marginRight: 12 }}
              onClick={() => setEditing(false)}
            >
              {formatMessage({ id: "common.cancel" })}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {formatMessage({ id: "common.save" })}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LabelConfigStyler;
