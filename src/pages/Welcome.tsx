import { Card, Typography } from "antd";
import { useIntl } from "@umijs/max";

const { Title } = Typography;

function Welcome() {
  const intl = useIntl();
  const { formatMessage } = intl;

  return (
    <Card bordered={false} className="with-shadow">
      <Typography.Text strong>
        <Title level={3} style={{ color: "#42526e" }}>
          {formatMessage({ id: "app.welcome.message" })}
        </Title>
      </Typography.Text>
    </Card>
  );
}

export default Welcome;
