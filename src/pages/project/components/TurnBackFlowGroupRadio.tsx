import React, { CSSProperties } from "react";
import { Radio, Space } from "antd";
import { useIntl } from "@umijs/max";

import { TurnBackGroup } from "@/services/turn-back";

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
  value?: string;
  turnBackGroup: TurnBackGroup[];
  onChange?: (selected: string) => void;
};

const TurnBackFlowGroupRadio: React.FC<Props> = ({
  turnBackGroup,
  onChange,
  value,
}) => {
  const { formatMessage } = useIntl();

  // useEffect(() => {
  //   if (onChange && selected) {
  //     onChange(selected);
  //   }
  // }, [selected]);

  return (
    <Radio.Group value={value} style={{ width: "100%" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {turnBackGroup.map((group) => (
          <div
            key={group.flowId}
            style={{
              ...RadioStyles,
              background: group.flowId === value ? "#227A7A" : "#F6F7F9",
              color: group.flowId === value ? "#fff" : "#42526E",
            }}
            onClick={(e) => {
              e.preventDefault();
              // setSelected(group.flowId);
              onChange?.(group.flowId);
            }}
          >
            <span style={{ width: "90%" }}>
              <span
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ display: "inline-block" }}>
                  {group.flowName}
                </span>
                <span>
                  {group.recordList.length}
                  <span style={{ marginLeft: 5 }}>
                    {formatMessage({ id: "common.unit.row" })}
                  </span>
                </span>
              </span>
            </span>
            <Radio value={group.flowId} />
          </div>
        ))}
      </Space>
    </Radio.Group>
  );
};

export default TurnBackFlowGroupRadio;
