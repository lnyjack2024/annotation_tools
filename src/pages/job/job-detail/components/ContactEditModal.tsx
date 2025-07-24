import { EmailValidator } from "@/utils/validator";
import { Button, Input, Modal, Form } from "antd";
import { useIntl } from "@umijs/max";

export interface ContactInfo {
  contactEmail?: string;
}

interface ContactEditModalProps {
  visible: boolean;
  contact: ContactInfo;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (contact: ContactInfo) => void;
}

function ContactEditModal({
  visible,
  contact,
  submitting,
  onCancel,
  onSubmit,
}: ContactEditModalProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
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
      <h3>{formatMessage({ id: "job-detail.contact.edit" })}</h3>
      <br />
      <Form
        form={form}
        hideRequiredMark
        colon={false}
        onFinish={handleSubmit}
        initialValues={{
          contactEmail: contact.contactEmail,
        }}
      >
        <Form.Item
          name="contactEmail"
          label={formatMessage({ id: "job-detail.contact.form.contact-email" })}
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "job-detail.contact.form.contact-email.required",
              }),
            },
            {
              validator: EmailValidator,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <div style={{ textAlign: "right", paddingTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {formatMessage({ id: "common.save" })}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default ContactEditModal;
