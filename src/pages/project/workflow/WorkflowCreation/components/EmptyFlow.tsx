import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import { useIntl } from "@umijs/max";

type Props = {
  visible?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const EmptyFlow: React.FC<Props> = ({ onClick }) => {
  const { formatMessage } = useIntl();

  return (
    <Popover
      defaultVisible
      overlayStyle={{ zIndex: 1 }}
      placement="right"
      content={
        <div style={{ color: "#42526E" }}>
          <h4 style={{ color: "#42526E" }}>
            {formatMessage({ id: "v3.job-create.tip" })}
          </h4>
          <p style={{ marginBottom: 4 }}>
            {formatMessage({ id: "v3.job-create.notice" })}
          </p>
          <p>{formatMessage({ id: "v3.job-create.notice-tip" })}</p>
        </div>
      }
    >
      <div style={{ width: 60 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            background: "#A0AABC",
            width: 40,
            height: 40,
            borderRadius: "50%",
            cursor: "pointer",
          }}
          onClick={onClick}
        >
          <PlusOutlined style={{ color: "white", fontSize: 18 }} />
        </div>
      </div>
    </Popover>
  );
};

export default EmptyFlow;
