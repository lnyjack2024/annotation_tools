import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { message, Table } from "antd";
import MaterialModal from "@/components/MaterialModal";
import { dateFormat } from "@/utils/time-util";
import { EyeOutlined } from "@ant-design/icons";
import { ConnectState } from "@/models/connect";
import type { Dispatch } from "redux";
import { useEffect, useState } from "react";
import { Job } from "@/types/job";
import { WorkflowDataRecord } from "@/types/v3";
import { getBPODataPhases } from "@/services/bpo";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { User } from "@/types/user";
import { getLocale } from "@@/plugin-locale/localeExports";
import { DataState } from "@/pages/project/data-center/components/DataList";
import { ColumnProps } from "antd/lib/table";
import { TaskRecordStatus } from "@/types/task";
import { getMashupAPIPrefix } from "@/utils/env";

type Props = {
  job: Job;
  visible: boolean;
  selectedData: WorkflowDataRecord[];
  dispatch: Dispatch;
};

type RecordPhase = {
  assignedTime: string;
  submitTime: string;
  recordId: number;
  phaseId: string;
  contributor: Partial<User>;
  elements: Record<string, any>;
  qaStatus: Partial<DataState>;
};

function WorkCountDetailModal({ job, selectedData, visible, dispatch }: Props) {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecordPhase[]>([]);
  const { projectId, id: jobId, flowId } = job || {};

  const open = (record: RecordPhase) => {
    window.open(
      `${getMashupAPIPrefix()}/ssr/data-preview?${new URLSearchParams({
        recordId: record.recordId?.toString(),
        projectId,
        jobId,
        phaseId: record.phaseId,
        flowId: flowId,
        locale: getLocale(),
        role: "bpo",
      })}`,
      "_blank"
    );
  };

  const columns: ColumnProps<RecordPhase>[] = [
    {
      title: formatMessage({ id: "work-count.column.inspected-time" }),
      dataIndex: "assignedTime",
      render: (assignedTime: string) => <>{dateFormat(assignedTime)}</>,
    },
    {
      title: formatMessage({ id: "job-detail.audit.columns.submitTime" }),
      dataIndex: "submitTime",
      render: (submitTime: string) => <>{dateFormat(submitTime)}</>,
    },
    {
      title: formatMessage({ id: "common.worker" }),
      dataIndex: "contributor",
      render: (contributor: Partial<User>) => contributor?.name,
    },
    {
      title: formatMessage({ id: "work-count.column.qa-result" }),
      dataIndex: "qaStatus",
      render: (qaStatus: TaskRecordStatus) =>
        qaStatus
          ? formatMessage({
              id: `task.column.status.${qaStatus?.toLowerCase()}`,
            })
          : formatMessage({ id: "common.nothing-symbol" }),
    },
    {
      title: formatMessage({ id: "common.operation" }),
      render: (record: RecordPhase) => (
        <EyeOutlined
          style={{
            fontSize: 20,
            marginRight: 12,
            color: "#227a7a",
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.preventDefault();
            open(record);
          }}
        />
      ),
    },
  ];
  const close = () => {
    dispatch({
      type: "bpoJob/toggleVisible",
      payload: { detailVisible: false },
    });
  };

  const getPhases = async () => {
    setLoading(true);
    try {
      const resp = await getBPODataPhases({
        projectId,
        jobId,
        flowId,
        recordId: selectedData[0].recordId,
      });
      setData(resp.data);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedData.length !== 1 || !job) {
      return;
    }
    getPhases();
  }, [job, selectedData]);

  return (
    <MaterialModal
      visible={visible}
      title={formatMessage({ id: "common.detail" })}
      width={1080}
      onClose={close}
    >
      <Table
        className="tableStriped"
        rowKey="phaseId"
        style={{ borderTop: "1px solid #F0F0F0" }}
        scroll={{ x: "max-content" }}
        dataSource={data}
        columns={columns}
        loading={loading}
      />
    </MaterialModal>
  );
}

function mapStateToProps({ bpoJob }: ConnectState) {
  return {
    job: bpoJob.job,
    selectedData: bpoJob.selectedData,
    visible: bpoJob.visible.detailVisible,
  };
}

export default connect(mapStateToProps)(WorkCountDetailModal);
