import { Input, Button, Form } from "antd";
import { useIntl } from "@umijs/max";

import type { Project } from "@/types/project";
import { NoPureSpaceValidator } from "@/utils/validator";
import AlertErrorMessage from "../../../components/AlertErrorMessage";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 7 },
    md: { span: 7 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 17 },
    md: { span: 17 },
  },
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 20,
      offset: 4,
    },
  },
};

type Props = {
  initialValue?: Project;
  onSubmit: (values: Project) => void;
  submitting: boolean;
  errorMessage: string;
};

function NewProjectForm({
  onSubmit,
  submitting = false,
  errorMessage = "",
  initialValue,
}: Props) {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const handleFinishFailed = ({ errorFields }: any) => {
    form.scrollToField(errorFields[0].name);
  };

  return (
    <Form
      form={form}
      initialValues={initialValue}
      onFinish={onSubmit}
      onFinishFailed={handleFinishFailed}
      {...formItemLayout}
    >
      {errorMessage && <AlertErrorMessage message={errorMessage} />}
      <Form.Item
        label={formatMessage({ id: "project-create.form.project-name" })}
        name="name"
        rules={[
          {
            max: 64,
            message: formatMessage({
              id: "project-create.form.project-name-error.len",
            }),
          },
          {
            required: true,
            message: formatMessage({
              id: "project-create.form.project-name-error",
            }),
          },
          {
            validator: NoPureSpaceValidator,
          },
        ]}
      >
        <Input
          placeholder={formatMessage({
            id: "project-create.form.project-name-error",
          })}
        />
      </Form.Item>
      <Form.Item
        label={formatMessage({ id: "project-create.form.project-description" })}
        name="description"
        rules={[
          {
            validator: NoPureSpaceValidator,
          },
        ]}
      >
        <Input.TextArea
          rows={5}
          placeholder={formatMessage(
            { id: "common.input.placeholder.with-label" },
            {
              label: formatMessage({
                id: "project-create.form.project-description",
              }).toLocaleLowerCase(),
            }
          )}
        />
      </Form.Item>
      <Form.Item {...tailFormItemLayout} className="text-right">
        <Button type="primary" htmlType="submit" loading={submitting}>
          {formatMessage({ id: "common.submit" })}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default NewProjectForm;
