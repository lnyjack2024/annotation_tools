import { Button, Col, Form, Input, Row } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { useEffect, useState } from "react";
import SelectWorkflowModal from "@/pages/project/data-center/components/data-assign/SelectWorkflowModal";
import type { FormInstance } from "antd/es";
import type { Workflow } from "@/types/v3";
import { POSITIVE_NUMBER_PATTERN } from "@/utils/constants";

interface AssignFormProp {
  projectId: string;
  form: FormInstance;
  onWorkflowsChange: (flows: Workflow[]) => void;
}

export default function AssignForm({
  projectId,
  form,
  onWorkflowsChange,
}: AssignFormProp) {
  const { formatMessage } = useIntl();
  const [selectedWorkflows, setSelectedWorkflows] = useState<Workflow[]>([]);
  const [selectWorkflowModalVisible, setSelectWorkflowModalVisible] =
    useState(false);

  const selectWorkflows = (flows: Workflow[]) => {
    setSelectedWorkflows(flows);
    setSelectWorkflowModalVisible(false);
    onWorkflowsChange(flows);
  };

  const remove = (flow: Workflow) => {
    const newWorkFlows = selectedWorkflows.filter(
      (item) => item.id !== flow.id
    );
    setSelectedWorkflows(newWorkFlows);
    onWorkflowsChange(newWorkFlows);
  };

  useEffect(
    () => () => {
      setSelectedWorkflows([]);
    },
    []
  );

  return (
    <div>
      {selectedWorkflows.length > 0 && (
        <>
          <div className="flex-between">
            <span />
            <Button
              type="primary"
              ghost
              onClick={() => {
                setSelectWorkflowModalVisible(true);
              }}
            >
              {formatMessage({
                id: "project.detail.data-center.assign.workflow",
              })}
            </Button>
          </div>
          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 12 }} form={form}>
            {selectedWorkflows.map((item) => (
              <Row key={item.id} gutter={10}>
                <Col
                  span={10}
                  className="text-right"
                  title={item.flowName}
                  style={{ lineHeight: 2.2 }}
                >
                  【{item.flowDisplayId}】{item.flowName}
                </Col>
                <Col span={8}>
                  <Form.Item
                    id={item.id}
                    name={item.id}
                    rules={[
                      {
                        required: true,
                        message: formatMessage({
                          id: "common.input.placeholder",
                        }),
                      },
                      {
                        pattern: POSITIVE_NUMBER_PATTERN,
                        message: "条目数量为正整数",
                      },
                    ]}
                  >
                    <Input placeholder="条目数量" />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <MinusCircleOutlined onClick={() => remove(item)} />
                </Col>
              </Row>
            ))}
          </Form>
        </>
      )}
      {selectedWorkflows.length === 0 && (
        <div style={{ height: 200, lineHeight: 12, textAlign: "center" }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setSelectWorkflowModalVisible(true)}
          >
            {formatMessage({
              id: "project.detail.data-center.assign.workflow",
            })}
          </Button>
        </div>
      )}

      <SelectWorkflowModal
        visible={selectWorkflowModalVisible}
        defaultSelectedWorkflows={selectedWorkflows}
        onCancel={() => setSelectWorkflowModalVisible(false)}
        projectId={projectId}
        selectWorkflows={selectWorkflows}
      />
    </div>
  );
}
