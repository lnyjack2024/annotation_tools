import type { CSSProperties } from "react";
import React from "react";
import { useIntl } from "@umijs/max";

type Props = {
  style?: CSSProperties;
};

const TestTag: React.FC<Props> = ({ style }) => {
  const { formatMessage } = useIntl();

  return (
    <span
      style={{
        padding: 2,
        background: "rgba(245, 108, 108, 0.1)",
        borderRadius: 2,
        color: "#F56C6C",
        textAlign: "center",
        fontSize: 14,
        ...style,
      }}
    >
      {formatMessage({ id: "v3.test" })}
    </span>
  );
};

export default TestTag;
