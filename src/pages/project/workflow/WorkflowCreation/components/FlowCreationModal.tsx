import React, { useEffect, useState } from "react";
import { Checkbox, Form, Input, message, Modal, Select } from "antd";
import { useIntl } from "@umijs/max";
import type { ModalFuncProps } from "antd/es";

import type { ProjectTemplate, Workflow } from "@/types/v3";
import { TemplateType } from "@/types/template";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { getProjectTemplates } from "@/services/template-v3";

export type FlowData = {
  projectId: string;
  flowName: string;
  testFlag: boolean;
  templateId: string;
  templateType: TemplateType;
};

type Props = {
  projectId: string;
  initialFlow?: Workflow;
  loading?: boolean;
  visible?: boolean;
  onOk?: (values: FlowData) => void;
  onCancel?: () => void;
} & ModalFuncProps;

const FlowCreationModal: React.FC<Props> = ({
  projectId,
  loading = false,
  visible,
  initialFlow,
  onOk,
  onCancel,
  ...modalProps
}) => {
  const { formatMessage } = useIntl();
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>(
    []
  );
  const [form] = Form.useForm();

  useEffect(() => {
    if (projectId) {
      getProjectTemplates(projectId).then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setProjectTemplates(resp.data);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      });
    }
  }, [projectId]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        const { flowName, testFlag, templateIdType = "" } = values;
        const [templateId, templateType] = templateIdType.split(".");
        onOk?.({
          projectId,
          flowName,
          testFlag,
          templateId,
          templateType,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <Modal
      {...modalProps}
      title={formatMessage({
        id: initialFlow ? "workflow.set" : "workflow.create",
      })}
      className="custom-modal"
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      maskClosable={false}
      confirmLoading={loading}
      okText={formatMessage({ id: "common.confirm" })}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...initialFlow,
          templateIdType: initialFlow
            ? `${initialFlow.templateId}.${initialFlow.templateType}`
            : undefined,
        }}
      >
        <Form.Item
          label={formatMessage({ id: "project.workflow.name" })}
          name="flowName"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item valuePropName="checked" name="testFlag">
          <Checkbox>{formatMessage({ id: "workflow.test" })}</Checkbox>
        </Form.Item>
        <Form.Item
          label={formatMessage({ id: "workflow.template.select" })}
          name="templateIdType"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select showSearch>
            {projectTemplates.map((tmpl) => (
              <Select.Option key={tmpl.id} value={`${tmpl.id}.${tmpl.type}`}>
                {tmpl.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FlowCreationModal;
