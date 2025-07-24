import { FormOutlined } from "@ant-design/icons";
import React from "react";
import type { NodeProps } from "react-flow-renderer";
import { useIntl } from "@umijs/max";

import type { Workflow } from "@/types/v3";

const TurnbackNode: React.FC<
  NodeProps<{
    text?: string;
    workflow: Workflow;
    onClick: () => void;
  }>
> = ({ data }) => {
  const { formatMessage } = useIntl();
  const { text, onClick } = data;

  return (
    <div
      style={{
        fontSize: 14,
        color: "#42526E",
      }}
    >
      <div onClick={onClick}>
        <span>{formatMessage({ id: "turnback-config" })}</span>
        <span>{formatMessage({ id: text })}</span>
        <FormOutlined style={{ paddingLeft: 5 }} />
      </div>
    </div>
  );
};

export default TurnbackNode;
