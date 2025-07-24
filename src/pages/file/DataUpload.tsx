import { Button, Card, Table, Tooltip } from "antd";
import { useDispatch, useIntl, history } from "@umijs/max";
import { connect } from "react-redux";
import moment from "moment";
import type { ColumnProps } from "antd/es/table";
import ColorPoint from "@/pages/project/components/ColorPoint";
import type {
  DataUploadListParams,
  DataUploadListResult,
  OriginalListItem,
} from "@/types/project";
import { OriginalFileUploadStatus } from "@/types/project";
import type { UploadProgressState } from "../project/models/uploadProgress";
import type { ConnectState } from "@/models/connect";
import { useCommonListPageFetch } from "@/hooks";
import { getFileUploadList } from "@/services/project";
import { formatBytes } from "@/utils";
import { message } from "antd/es";
import useInterval from "@/hooks/useInterval";

const UploadStatusColors = {
  [OriginalFileUploadStatus.PUBLISHED]: "#01B97F",
  [OriginalFileUploadStatus.CANCELLED]: "#DDE0E5",
  [OriginalFileUploadStatus.RAW_DATA_UPLOADING]: "#5187F3",
  PROCESSING: "#F5CA4A",
  FAILED: "#F56C6C",
};

const FileUploadStatusWithOnProcessing = [
  OriginalFileUploadStatus.RAW_DATA_UPLOADED,
  OriginalFileUploadStatus.PARSE_RAW_DATAING,
  OriginalFileUploadStatus.PARSE_RAW_DATAED,
  OriginalFileUploadStatus.URL_DATA_GENERATING,
  OriginalFileUploadStatus.URL_DATA_GENERATED,
  OriginalFileUploadStatus.URL_DATA_UPLOADING,
  OriginalFileUploadStatus.URL_DATA_UPLOADED,
  OriginalFileUploadStatus.PUBLISHING,
  OriginalFileUploadStatus.CANCEL_PENDING,
  OriginalFileUploadStatus.CANCELLING,
];
const FileUploadStatusWithOnFailed = [
  OriginalFileUploadStatus.RAW_DATA_UPLOAD_FAILED,
  OriginalFileUploadStatus.URL_DATA_GENERATE_FAILED,
  OriginalFileUploadStatus.URL_DATA_UPLOAD_FAILED,
  OriginalFileUploadStatus.PUBLISH_FAILED,
  OriginalFileUploadStatus.CANCEL_FAILED,
  OriginalFileUploadStatus.INTERNAL_SERVER_ERROR,
  OriginalFileUploadStatus.PARSE_RAW_DATA_FAILED,
  OriginalFileUploadStatus.OSS_UPLOAD_FAILED,
];
const ONE_MINUTE = 60 * 1000;

function DataUpload({
  uploadProgress,
}: {
  uploadProgress: UploadProgressState;
}) {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const { data, pagination, loading, refresh } = useCommonListPageFetch<
    DataUploadListParams,
    DataUploadListResult
  >(getFileUploadList);

  const cancelUpload = (record: OriginalListItem) => {
    dispatch({
      type: "uploadProgress/cancelOriFileUpload",
      payload: {
        projectId: record.projectId,
        prjResourceId: record.id,
        refresh,
        onError: () => {
          message.error(formatMessage({ id: "data.upload.cancel.failed" }));
        },
      },
    });
  };

  useInterval(() => {
    refresh();
  }, ONE_MINUTE);

  const columns: ColumnProps<OriginalListItem>[] = [
    {
      title: formatMessage({ id: "file.name" }),
      dataIndex: "oriName",
    },
    {
      title: formatMessage({ id: "data.upload.to" }),
      render({
        batchNum,
        batchName,
        projectId,
        projectName,
        projectDisplayId,
      }: OriginalListItem) {
        return (
          <>
            <span>
              {formatMessage({ id: "data.upload.batch" })}[{batchNum}]
              {batchName}
            </span>
            <br />
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => {
                history.push(`/projects/${projectId}/data-center`);
              }}
            >
              {formatMessage({ id: "data.upload.project" })}[{projectDisplayId}]
              {projectName}
            </Button>
          </>
        );
      },
    },
    {
      title: formatMessage({ id: "data.upload.data-type" }),
      dataIndex: "dataType",
      render(type) {
        return <>{formatMessage({ id: `data.type.${type}` })}</>;
      },
    },
    {
      title: formatMessage({ id: "file.size" }),
      dataIndex: "oriSize",
      render(size: number) {
        const fileSize = size / 1024 / 1024;
        if (fileSize < 1) {
          return "< 1MB";
        }
        return formatBytes(size);
      },
    },
    {
      title: formatMessage({ id: "common.operateTime" }),
      dataIndex: "createdTime",
      render: (time: string) =>
        time
          ? moment(time).format("YYYY-MM-DD HH:mm")
          : formatMessage({ id: "common.nothing-symbol" }),
    },
    {
      title: formatMessage({ id: "common.status" }),
      width: 200,
      render: ({ status, id }: OriginalListItem) => {
        const uploadInfo = uploadProgress[id];
        let color = UploadStatusColors[status];
        if (FileUploadStatusWithOnProcessing.includes(status)) {
          color = UploadStatusColors.PROCESSING;
        }
        if (FileUploadStatusWithOnFailed.includes(status)) {
          color = UploadStatusColors.FAILED;
        }
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>
              <ColorPoint color={color} />
              {formatMessage({ id: `data.upload.state.${status}` })}
            </span>
            {status === OriginalFileUploadStatus.RAW_DATA_UPLOADING &&
              uploadInfo && (
                <span>
                  {formatBytes(uploadInfo.loaded)} /{" "}
                  {formatBytes(uploadInfo.total)}
                </span>
              )}
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "common.operation" }),
      render: (record: OriginalListItem) => {
        switch (record.status) {
          case OriginalFileUploadStatus.RAW_DATA_UPLOADING:
            return (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => {
                  cancelUpload(record);
                }}
              >
                {formatMessage({ id: "common.cancel" })}
              </Button>
            );
          case OriginalFileUploadStatus.RAW_DATA_UPLOAD_FAILED:
          case OriginalFileUploadStatus.URL_DATA_GENERATE_FAILED:
          case OriginalFileUploadStatus.URL_DATA_UPLOAD_FAILED:
          case OriginalFileUploadStatus.PUBLISH_FAILED:
          case OriginalFileUploadStatus.CANCEL_FAILED:
          case OriginalFileUploadStatus.PARSE_RAW_DATA_FAILED:
          case OriginalFileUploadStatus.INTERNAL_SERVER_ERROR:
            const { rawDataErrorHolders } = record.context;
            if (rawDataErrorHolders?.length > 0) {
              return (
                <Tooltip
                  title={
                    <span>
                      {rawDataErrorHolders.map((rawError) => (
                        <div key={`${record.id}_${rawError.errorType}`}>
                          {formatMessage({
                            id: `data.upload.state.failed.${rawError.errorType}`,
                          })}
                          {rawError.errorNode ? `: ${rawError.errorNode}` : ""}
                          <br />
                        </div>
                      ))}
                    </span>
                  }
                >
                  <span>
                    {formatMessage({ id: "data.upload.state.failed.tip" })}
                  </span>
                </Tooltip>
              );
            }
          default:
            return null;
        }
      },
    },
  ];

  return (
    <Card>
      <>
        <span
          style={{
            fontSize: 16,
            color: "#42526e",
            lineHeight: "22px",
            fontWeight: "bold",
          }}
        >
          {formatMessage({ id: "data.upload.list" })}
        </span>
        <Button style={{ float: "right", marginRight: 12 }} onClick={refresh}>
          {formatMessage({ id: "common.refresh" })}
        </Button>
      </>
      <Table
        className="tableStriped"
        rowKey="id"
        dataSource={data.results}
        columns={columns}
        loading={loading}
        scroll={{ x: "max-content" }}
        pagination={pagination}
      />
    </Card>
  );
}

export default connect(({ uploadProgress }: ConnectState) => ({
  uploadProgress,
}))(DataUpload);
