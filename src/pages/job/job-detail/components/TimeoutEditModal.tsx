import { Button, Input, Modal, Form } from "antd";
import { FormattedMessage, useIntl } from "@umijs/max";

import {
  DEFAULT_JOB_TIMEOUT,
  POSITIVE_NUMBER_PATTERN,
} from "@/utils/constants";
import { JobTimeoutValidator } from "@/utils/validator";

interface TimeoutEditModalProps {
  visible: boolean;
  timeout: number;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (timeOut: number) => void;
}

function TimeoutEditModal({
  visible,
  timeout,
  submitting,
  onCancel,
  onSubmit,
}: TimeoutEditModalProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [form] = Form.useForm();
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const t = parseInt(values.timeout, 10) * 60;
      onSubmit(t);
    });
  };

  return (
    <Modal
      destroyOnClose
      visible={visible}
      footer={null}
      maskClosable={false}
      onCancel={onCancel}
    >
      <h3>{formatMessage({ id: "job-detail.timeout.edit" })}</h3>
      <br />
      <Form
        form={form}
        hideRequiredMark
        colon={false}
        onFinish={handleSubmit}
        initialValues={{
          timeout: timeout ? timeout / 60 : DEFAULT_JOB_TIMEOUT,
        }}
      >
        <Form.Item
          name="timeout"
          label={formatMessage({ id: "job-detail.timeout.form.timeout" })}
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "job-detail.timeout.form.timeout.required",
              }),
            },
            {
              pattern: POSITIVE_NUMBER_PATTERN,
              message: formatMessage({
                id: "job-detail.timeout.form.timeout.error",
              }),
            },
            {
              validator: JobTimeoutValidator,
            },
          ]}
        >
          <Input
            addonAfter={
              <div style={{ width: 64 }}>
                <FormattedMessage id="common.unit.minute" />
              </div>
            }
          />
        </Form.Item>
        <div style={{ textAlign: "right", paddingTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            <FormattedMessage id="common.save" />
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default TimeoutEditModal;
