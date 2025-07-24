import { Alert } from 'antd';

interface AlertErrorMessageProps {
  message: string;
}

export default function AlertErrorMessage({ message }: AlertErrorMessageProps) {
  return (
    <Alert
      style={{ margin: '24px 0' }}
      message={message}
      type="error"
      showIcon
    />
  );
}
