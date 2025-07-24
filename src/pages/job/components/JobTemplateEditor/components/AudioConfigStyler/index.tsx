import { base64Encode } from "@/utils/string-util";
import type { Config } from "@appen-china/easy-form-config/dist/types";
import { Button, message, Modal, Radio } from "antd";
import cx from "classnames";
import { nanoid } from "nanoid";
import React, { useEffect, useMemo, useState } from "react";
import { useIntl } from "umi";
import ConfigGroup from "./ConfigGroup";
import styles from "./styles.less";
import type { Group, StyleNames } from "./types";
import { AttrType } from "./types";

interface LabelConfigStylerProps {
  segmentLabelConfig?: string;
  lineLabelConfig?: string;
  stylesMapping: {
    color?: StyleNames;
  };
  styleName: StyleNames;
  styleConfig?: string;
  onChange: (values: string) => void;
}

const LabelConfigStyler: React.FC<LabelConfigStylerProps> = ({
  segmentLabelConfig,
  lineLabelConfig,
  stylesMapping,
  styleName,
  styleConfig,
  onChange,
}) => {
  const { formatMessage } = useIntl();
  const [editing, setEditing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [otherGroups, setOtherGroups] = useState<Group[]>([]);
  const [groupErrors, setGroupErrors] = useState<
    { attr: boolean; attrValue: boolean }[]
  >([]);
  const [mode, setMode] = useState<AttrType>(AttrType.SEGMENT_ATTR);

  const format = (key: string) => {
    return formatMessage({
      id: `labeling-job-create.wizard.configuration.attributes.audio.style.modal.${key}`,
    });
  };

  const fields = useMemo<Config["fields"]>(() => {
    const config =
      mode === AttrType.LINE_ATTR ? lineLabelConfig : segmentLabelConfig;
    if (config) {
      try {
        const configStr = Buffer.from(config || "", "base64").toString("utf-8");
        const parsedConfig: Config = JSON.parse(configStr);
        return parsedConfig.fields;
      } catch (e) {
        // parse error
        message.error(format("fields.error"));
      }
    }
    return [];
  }, [lineLabelConfig, segmentLabelConfig, mode, formatMessage]);

  useEffect(() => {
    if (styleConfig) {
      try {
        const configStr = Buffer.from(styleConfig, "base64").toString("utf-8");
        const parsedConfig: {
          groups: Group[];
          mode: AttrType;
        } = JSON.parse(configStr);
        const list = parsedConfig.groups
          .filter((g) => {
            return !!g[styleName];
          })
          .map((g) => ({
            key: nanoid(),
            ...g,
          }));
        const otherList = parsedConfig.groups.filter((g) => {
          return !g[styleName];
        });
        setGroups(list);
        setOtherGroups(otherList);
        setMode(parsedConfig.mode);
      } catch (e) {
        // parse error
        message.error(format("config.error"));
      }
    }
  }, [styleConfig]);

  useEffect(() => {
    if (
      (mode === AttrType.LINE_ATTR && !lineLabelConfig) ||
      (mode === AttrType.SEGMENT_ATTR && !segmentLabelConfig)
    ) {
      onChange(base64Encode({ mode, groups: [] }));
    }
  }, [lineLabelConfig, segmentLabelConfig]);

  const goSetting = () => {
    if (!segmentLabelConfig && !lineLabelConfig) {
      Modal.warning({
        title: formatMessage({ id: "common.prompt" }),
        content: format("warning"),
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
      onChange(
        base64Encode({
          mode,
          groups: [...otherGroups, ...groups],
        })
      );
      setEditing(false);
    }
  };

  return (
    <>
      <Button onClick={goSetting}>
        {format(groups.length > 0 ? "check-set" : "set")}
      </Button>
      <span style={{ color: "#7A869A", marginRight: 12, marginLeft: 22 }}>
        {format(groups.length > 0 ? "been-set" : "empty")}
      </span>
      <Modal
        open={editing}
        footer={null}
        width={800}
        maskClosable={false}
        bodyStyle={{
          minHeight: 520,
          paddingBottom: 80,
          position: "relative",
          color: "#42526E",
        }}
        title={format("title")}
        onCancel={() => setEditing(false)}
      >
        <Radio.Group
          style={{ marginBottom: 24 }}
          onChange={(e) => {
            setMode(e.target.value);
            setGroups([]);
          }}
          value={mode}
        >
          <Radio value={AttrType.SEGMENT_ATTR}>{format("segment-attr")}</Radio>
          {lineLabelConfig && (
            <Radio value={AttrType.LINE_ATTR}>{format("line-attr")}</Radio>
          )}
        </Radio.Group>
        <div style={{ marginBottom: 16 }}>
          {format(fields.length > 0 ? "desc" : "warning")}
        </div>
        <div>
          {groups.map((g, i) => (
            <ConfigGroup
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
            <a>{format("new")}</a>
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
              {format("reset")}
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
