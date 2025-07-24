import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Input, Form } from "antd";
import { useIntl } from "@umijs/max";
import type { ReactNode } from "react";
import { useEffect } from "react";

interface AccountLoginProps {
  name: string;
  submit: (params: { name: string; password: string }) => void;
  userLoginError: ReactNode;
  submitting: boolean;
  handleValueOnChange: () => void;
}

export default function AccountLogin({
  name,
  submit,
  userLoginError,
  submitting,
  handleValueOnChange,
}: AccountLoginProps) {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!userLoginError) {
      return;
    }
    form.setFieldsValue({ validate: null });
  }, [userLoginError]);

  const handleSubmit = (values: { name: string; password: string }) => {
    Object.assign(values, { name: values.name.trim() });
    submit(values);
  };

  return (
    <div>
      <Form form={form} onFinish={handleSubmit}>
        <Form.Item name="name" initialValue={name}>
          <Input
            readOnly={!!name}
            onChange={handleValueOnChange}
            className="height-ten-4"
            prefix={<MailOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            placeholder={formatMessage({
              id: "user-login.login.name",
            })}
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "user-login.password.required",
              }),
              type: "string",
            },
          ]}
        >
          <Input
            type="password"
            prefix={<LockOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            placeholder={formatMessage({
              id: "user-login.login.password",
            })}
            className="height-ten-4"
          />
        </Form.Item>
        <Button
          loading={submitting}
          className="w-100 height-ten-4 margin-top-2"
          type="primary"
          htmlType="submit"
        >
          {formatMessage({ id: "common.login" })}
        </Button>
        {userLoginError}
      </Form>
    </div>
  );
}
