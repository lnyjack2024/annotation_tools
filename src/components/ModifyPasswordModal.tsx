import { Button, Form, Input, Modal } from "antd";
import React from "react";
import { useIntl } from "@umijs/max";
import type { PasswordResetData } from "@/types/user";
import { PasswordValidator } from "@/utils/validator";

interface ResetOldPasswordProps {
  visible: boolean;
  forceModify?: boolean;
  confirmLoading: boolean;
  onCancel?: () => void;
  resetPassword: (params: PasswordResetData) => void;
}

export default function ModifyPasswordModal({
  visible,
  forceModify = false,
  confirmLoading,
  onCancel,
  resetPassword,
}: ResetOldPasswordProps) {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const commit = (e: React.FormEvent) => {
    e.preventDefault();
    form.validateFields().then((value) => {
      const { newPassword, oldPassword } = value;
      resetPassword({ newPassword, oldPassword });
    });
  };

  return (
    <Modal
      title={formatMessage({ id: "profile.security.password.modal.title" })}
      visible={visible}
      width={450}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      maskClosable={false}
      closable={!forceModify}
      footer={null}
      okText={formatMessage({ id: "common.confirm" })}
      afterClose={() => form.resetFields()}
    >
      <Form form={form} style={{ maxWidth: 350, margin: "auto" }}>
        {forceModify ? (
          <p style={{ margin: "0 0 12px", color: "#42526e" }}>
            {formatMessage({ id: "profile.security.password.force.tip" })}
          </p>
        ) : (
          <Form.Item
            name="oldPassword"
            rules={[
              {
                required: true,
                message: formatMessage({
                  id: "profile.reset-old-password.old-password.required",
                }),
                type: "string",
              },
            ]}
          >
            <Input.Password
              placeholder={formatMessage({
                id: "profile.reset-old-password.old-password",
              })}
            />
          </Form.Item>
        )}
        <Form.Item
          name="newPassword"
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "profile.reset-old-password.new-password.required",
              }),
              type: "string",
            },
            {
              validator: PasswordValidator,
            },
          ]}
        >
          <Input.Password
            placeholder={formatMessage({
              id: "profile.reset-old-password.new-password",
            })}
          />
        </Form.Item>
        <Form.Item
          name="newPasswordConfirm"
          dependencies={["newPassword"]}
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "profile.reset-old-password.new-password-confirm.required",
              }),
              type: "string",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    formatMessage({
                      id: "profile.security.confirm-password.error",
                    })
                  )
                );
              },
            }),
          ]}
        >
          <Input.Password
            placeholder={formatMessage({
              id: "profile.reset-old-password.new-password-confirm",
            })}
          />
        </Form.Item>
      </Form>
      <div style={{ marginTop: 12, textAlign: "right" }}>
        <Button type="primary" onClick={commit}>
          {formatMessage({ id: "common.ok" })}
        </Button>
      </div>
    </Modal>
  );
}
