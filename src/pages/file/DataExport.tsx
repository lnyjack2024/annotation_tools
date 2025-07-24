import { useEffect, useState } from "react";
import { Button, Card, message, Table } from "antd";
import { useIntl } from "@umijs/max";
import moment from "moment";
import type { ColumnProps } from "antd/es/table";
import { JobReportStatus } from "@/types/job";
import { downloadFile, mapStatusToErrorMessage } from "@/utils/utils";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import ColorPoint from "@/pages/project/components/ColorPoint";
import { cancelReport, getReportList } from "@/services/report";
import { HttpStatus } from "@/types/http";
import type { ReportType } from "@/types/common";

export type ExportedFileItem = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  operateTime: string;
  projectDisplayId: string;
  projectId: string;
  projectName: string;
  partialReportLink: string;
  finalResultFile: string;
  status: JobReportStatus;
};

const DownloadStatusColors = {
  [JobReportStatus.SUCCESS]: "#01B97F",
  [JobReportStatus.CANCELLED]: "#7a869a",
  [JobReportStatus.POST_SCRIPT_READY]: "#5187F3",
  [JobReportStatus.PROCESSING]: "#5187F3",
  [JobReportStatus.FAILURE]: "#F56C6C",
};

function DataExport() {
  const { formatMessage } = useIntl();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    pageSize: DEFAULT_PAGE_SIZE,
    pageIndex: 1,
  });

  const getList = () => {
    setLoading(true);
    getReportList({
      ...pagination,
      pageIndex: pagination.pageIndex - 1,
    })
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setData(resp.data.results);
          setTotal(resp.data.totalElements);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getList();
  }, [pagination]);

  const cancel = async (projectId: string, reportId: string) => {
    setLoading(true);
    try {
      await cancelReport(projectId, reportId);
      await getList();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const download = (downloadLink: string) => {
    downloadFile({ url: downloadLink, newTab: true });
  };

  const columns: ColumnProps<ExportedFileItem>[] = [
    {
      title: formatMessage({ id: "file.name" }),
      dataIndex: "resultFile",
      render(resultFile: string) {
        return resultFile && resultFile.split("/").pop();
      },
    },
    {
      title: formatMessage({ id: "file.type" }),
      dataIndex: "type",
      render(type: ReportType) {
        return formatMessage({ id: `report.type.${type}` });
      },
    },
    {
      title: formatMessage({ id: "file.size" }),
      dataIndex: "size",
      render(size: number) {
        const fileSize = (size || 0) / 1024 / 1024;
        if (fileSize < 1) {
          return "< 1MB";
        }
        return `${fileSize.toFixed(2)}MB`;
      },
    },
    {
      title: formatMessage({ id: "file.project" }),
      render: (record) => `[${record.projectDisplayId}] ${record.projectName}`,
    },
    {
      title: formatMessage({ id: "common.operateTime" }),
      dataIndex: "updatedTime",
      render: (updatedTime: string) =>
        updatedTime
          ? moment(updatedTime).format("YYYY-MM-DD HH:mm")
          : formatMessage({ id: "common.nothing-symbol" }),
    },
    {
      title: formatMessage({ id: "file.export.state" }),
      dataIndex: "status",
      render(status: JobReportStatus) {
        return (
          <span>
            <ColorPoint color={DownloadStatusColors[status]} />
            {formatMessage({ id: `data.export.status.${status}` })}
          </span>
        );
      },
    },
    {
      title: formatMessage({ id: "common.operation" }),
      dataIndex: "status",
      render: (status: JobReportStatus, record: ExportedFileItem) => {
        switch (status) {
          case JobReportStatus.FAILURE:
          case JobReportStatus.CANCELLED:
            return null;
          case JobReportStatus.SUCCESS:
            return (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => {
                  download(record.finalResultFile);
                }}
              >
                {formatMessage({ id: "common.download" })}
              </Button>
            );
          case JobReportStatus.PROCESSING:
          case JobReportStatus.POST_SCRIPT_READY:
          default:
            return (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => cancel(record.projectId, record.id)}
              >
                {formatMessage({ id: "common.cancel" })}
              </Button>
            );
        }
      },
    },
  ];

  return (
    <Card>
      <div>
        <h2
          style={{
            fontSize: 16,
            color: "#42526e",
            lineHeight: "22px",
          }}
        >
          {formatMessage({ id: "data.export.list" })}
        </h2>
      </div>
      <Table
        className="tableStriped"
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        scroll={{ x: "max-content" }}
        pagination={{
          total,
          pageSize: pagination.pageSize,
          onChange: (page: number, pageSize?: number) =>
            setPagination({
              pageSize,
              pageIndex: page,
            }),
          current: pagination.pageIndex,
          showTotal: (val) =>
            formatMessage({ id: "common.total.items" }, { items: val }),
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
      />
    </Card>
  );
}

export default DataExport;
