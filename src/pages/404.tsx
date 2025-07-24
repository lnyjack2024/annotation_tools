import { Button, Result } from "antd";
import React from "react";
import { history as router, useIntl } from "@umijs/max";

const NoFoundPage: React.FC = () => {
  const { formatMessage } = useIntl();
  return (
    <Result
      status="404"
      title="404"
      subTitle={formatMessage({ id: "error.404.title" })}
      extra={
        <Button type="primary" onClick={() => router.push("/")}>
          {formatMessage({ id: "common.back-home" })}
        </Button>
      }
    />
  );
};

export default NoFoundPage;
