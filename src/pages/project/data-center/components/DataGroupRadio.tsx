import type { CSSProperties } from "react";
import React, { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";
import { Radio, Space } from "antd";
import type { CheckedDataGroup } from "@/hooks/useDataCheck";

const RadioStyles: CSSProperties = {
  height: 48,
  border: "1px solid #E5E7ED",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  fontSize: 14,
  alignItems: "center",
  paddingLeft: 12,
  paddingRight: 12,
};

type Props = {
  dataGroups: CheckedDataGroup[];
  value?: string;
  onChange?: (val: string) => void;
};

const DataGroupRadio: React.FC<Props> = ({ dataGroups, onChange, value }) => {
  const [selected, setSelected] = useState<string>();
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (onChange && selected) {
      onChange(selected);
    }
  }, [onChange, selected]);

  return (
    <Radio.Group value={value || selected} style={{ width: "100%" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {dataGroups.map((group) => (
          <div
            key={group.groupId}
            style={{
              ...RadioStyles,
              background: group.groupId === selected ? "#227A7A" : "#F6F7F9",
              color: group.groupId === selected ? "#fff" : "#42526E",
            }}
            onClick={(e) => {
              e.preventDefault();
              setSelected(group.groupId);
            }}
          >
            <span>
              <span>
                {formatMessage({ id: `data.type.${group.dataType}` })}：
              </span>
              <b>{group.recordNum}</b>
              <span style={{ marginLeft: 5 }}>
                {formatMessage({ id: "common.unit.row" })}
              </span>
            </span>
            <Radio value={group.groupId} />
          </div>
        ))}
      </Space>
    </Radio.Group>
  );
};

export default DataGroupRadio;
