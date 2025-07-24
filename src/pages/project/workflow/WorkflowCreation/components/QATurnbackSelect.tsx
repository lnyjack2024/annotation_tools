import React from "react";
import { Select } from "antd";
import { useIntl } from "@umijs/max";

import { range } from "lodash";

type Props = {
  order: number;
  defaultValue?: number;
  onChange?: (backTo: number) => void;
};

const QATurnbackSelect: React.FC<Props> = ({
  onChange,
  order,
  defaultValue = 0,
}) => {
  const { formatMessage } = useIntl();

  if (order === 1) {
    return (
      <Select
        size="small"
        bordered={false}
        defaultValue={0}
        style={{
          width: 258,
          background: "#F6F7F9",
          marginTop: 8,
          color: "#42526E",
          fontSize: 12,
        }}
      >
        <Select.Option value={0}>
          {formatMessage({ id: "turnback-to-label" })} 1
        </Select.Option>
      </Select>
    );
  }

  return (
    <Select
      size="small"
      bordered={false}
      defaultValue={defaultValue}
      style={{
        width: 258,
        background: "#F6F7F9",
        marginTop: 8,
        color: "#42526E",
        fontSize: 12,
      }}
      onChange={onChange}
    >
      <Select.Option value={0}>
        {formatMessage({ id: "turnback-to-label" })} 1
      </Select.Option>
      {range(1, order).map((qaOrder) => (
        <Select.Option key={qaOrder} value={qaOrder}>
          {formatMessage({ id: "turnback-to-qa" })} {qaOrder}
        </Select.Option>
      ))}
    </Select>
  );
};

export default QATurnbackSelect;
