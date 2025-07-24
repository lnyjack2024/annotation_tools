import type { ModalCommonProp } from "@/types/common";
import { Button, Form, Input, Modal, Table } from "antd";
import React, { useEffect, useState } from "react";
import { getProjectFlowList } from "@/services/project";
import type { ProjectFlowParam } from "@/types/project";
import type { Workflow } from "@/types/v3";
import { useIntl } from "@umijs/max";
import { dateFormat } from "@/utils/time-util";
import TestTag from "@/pages/project/components/TestTag";
import type { ColumnProps } from "antd/es/table";

interface SelectWorkflowModalProp extends ModalCommonProp {
  projectId: string;
  selectWorkflows: (flows: Workflow[]) => void;
  defaultSelectedWorkflows: Workflow[];
}

const pageSize = 10;

export default function SelectWorkflowModal({
  visible,
  onCancel,
  projectId,
  selectWorkflows,
  defaultSelectedWorkflows,
}: SelectWorkflowModalProp) {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();

  const [filterParam, setFilterParam] = useState({
    pageIndex: 0,
    flowName: "",
    flowDisplayId: "",
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ workflows: Workflow[]; total: number }>({
    workflows: [],
    total: 0,
  });
  const [selectedFlows, setSelectedFlows] = useState<Workflow[]>([]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSelectedFlows(defaultSelectedWorkflows);
  }, [defaultSelectedWorkflows, visible]);

  const getData = (params: Partial<ProjectFlowParam> = filterParam) => {
    setLoading(true);
    getProjectFlowList({
      ...params,
      projectId,
      pageSize,
      ignoreDataCollectFlowFlag: true,
    } as ProjectFlowParam)
      .then((resp) => {
        const { results, totalElements } = resp.data || {};
        setData({ workflows: results, total: totalElements });
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (!visible || !projectId) {
      return;
    }
    getData();
  }, [visible, projectId]);

  const search = () => {
    const { flowName, flowDisplayId } = form.getFieldsValue();
    setFilterParam({ ...filterParam, flowName, flowDisplayId });
    getData({ ...filterParam, flowName, flowDisplayId });
  };

  const columns: ColumnProps<Workflow>[] = [
    {
      title: formatMessage({ id: "project.workflow.name" }),
      dataIndex: "flowName",
      render: (name, row) => (
        <span>
          {row.testFlag ? <TestTag /> : null} {name}
        </span>
      ),
    },
    {
      title: formatMessage({ id: "project.workflow.id" }),
      dataIndex: "flowDisplayId",
    },
    {
      title: formatMessage({ id: "common.createdTime" }),
      dataIndex: "createdTime",
      render: (time: string) => dateFormat(time),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedFlows.map((item) => item.id),
    onChange: (selectedRowKeys: React.Key[], selectedRows: Workflow[]) => {
      setSelectedFlows(selectedRows);
    },
  };

  return (
    <Modal
      title={formatMessage({
        id: "project.detail.data-center.assign.workflow",
      })}
      visible={visible}
      onCancel={onCancel}
      width={800}
      onOk={() => selectWorkflows(selectedFlows)}
      okButtonProps={{ disabled: !selectedFlows.length }}
      okText={formatMessage({ id: "common.confirm" })}
    >
      <Form form={form} layout="inline">
        <Form.Item
          name="flowName"
          label={formatMessage({
            id: "project.detail.data-center.assign.workflow.name",
          })}
        >
          <Input allowClear />
        </Form.Item>
        <Form.Item
          name="flowDisplayId"
          label={formatMessage({
            id: "project.detail.data-center.assign.workflow.id",
          })}
        >
          <Input allowClear />
        </Form.Item>
        <Button onClick={search}>
          {formatMessage({ id: "common.search" })}
        </Button>
      </Form>

      <Table
        className="tableStriped margin-top-4"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data.workflows}
        rowSelection={rowSelection}
        pagination={{
          total: data.total,
          pageSize,
          onChange: (page: number) => {
            setFilterParam({ ...filterParam, pageIndex: page - 1 });
            getData({ ...filterParam, pageIndex: page - 1 });
          },
          showTotal: (val) =>
            formatMessage({ id: "common.total.items" }, { items: val }),
        }}
      />
    </Modal>
  );
}
