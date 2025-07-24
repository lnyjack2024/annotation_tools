import { useEffect } from "react";
import { Table, Modal } from "antd";
import type { ColumnProps } from "antd/es/table";
import { useIntl } from "@umijs/max";

import type { ModalCommonProp } from "@/types/common";
import { useCommonListPageFetch } from "@/hooks";
import { getProjectDataPoolBatchHistory } from "@/services/project";
import { JobReportStatus } from "@/types";
import ColorPoint from "@/pages/project/components/ColorPoint";
import { dateFormat, simpleProxy } from "@/utils";
import {
  BatchSearchCommonParams,
  ProjectDataPoolBatchHistoryResult,
  ProjectDataPoolBatchHistoryResultItem,
} from "@/types/project";

const UploadStatusColors = {
  [JobReportStatus.SUCCESS]: "#01B97F",
  [JobReportStatus.CANCELLED]: "#7a869a",
  [JobReportStatus.POST_SCRIPT_READY]: "#5187F3",
  [JobReportStatus.PROCESSING]: "#5187F3",
  [JobReportStatus.FAILURE]: "#F56C6C",
};

interface DataUploadLogModalProp extends ModalCommonProp {
  projectId: string;
  batchNum: number;
}

export default function DataUploadLogModal({
  visible,
  projectId,
  batchNum,
  onCancel,
}: DataUploadLogModalProp) {
  const { formatMessage } = useIntl();
  const { data, loading, pagination, onResetSearchParams } =
    useCommonListPageFetch<
      Omit<BatchSearchCommonParams, "batchName">,
      ProjectDataPoolBatchHistoryResult
    >(getProjectDataPoolBatchHistory, { projectId, batchNum }, []);

  // fetch on visible
  useEffect(() => {
    if (visible) {
      onResetSearchParams();
    }
  }, [visible]);

  const columns: ColumnProps<ProjectDataPoolBatchHistoryResultItem>[] = [
    {
      title: formatMessage({
        id: "job-detail.audit.creation.data.column.uploadTime",
      }),
      dataIndex: "uploadTime",
      render: (time) => dateFormat(time, "YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: formatMessage({ id: "common.operator" }),
      dataIndex: "operator",
      render: (operator) => simpleProxy(operator),
    },
    {
      title: formatMessage({ id: "file.name" }),
      dataIndex: "fileName",
      width: 300,
    },
    {
      title: formatMessage({ id: "common.status" }),
      dataIndex: "status",
      render(status) {
        return (
          <span>
            <ColorPoint color={UploadStatusColors[JobReportStatus.SUCCESS]} />
            {formatMessage({ id: `common.upload.status.success` })}
          </span>
        );
      },
    },
    {
      title: formatMessage({ id: "common.column.recordId" }),
      dataIndex: "rangeNote",
      render: simpleProxy,
    },
  ];
  return (
    <Modal
      title={formatMessage({
        id: "data.batch.history",
      })}
      className="custom-modal"
      width={1000}
      visible={visible}
      footer={null}
      maskClosable={false}
      destroyOnClose
      onCancel={onCancel}
    >
      <Table
        className="tableStriped"
        rowKey="uploadTime"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={pagination}
      />
    </Modal>
  );
}
