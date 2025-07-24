import { pathToRegexp } from "path-to-regexp";
import { useEffect, useState } from "react";
import { Pagination, Card, message, Empty } from "antd";
import { getDataOperationList } from "@/services/project";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { mapStatusToErrorMessage } from "@/utils";
import { HttpStatus } from "@/types";
import { useIntl } from "@umijs/max";
import { DataOperationType } from "@/types/project";
import styles from "./styles.less";
import DataOperationDetailModal from "./DataOperationDetailModal";

export type DataOperationItemType = {
  id: number;
  operationTime: string;
  operationType: DataOperationType;
  operator: string;
};

function RecordFlow() {
  const location = useLocationWithQuery();
  const [, projectId, recordId] =
    pathToRegexp("/projects/:projectId/:recordId/:tabName").exec(
      location.pathname
    ) || [];
  const [query, setQuery] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [activeOperLogId, setActiveOperLogId] = useState<number>(null);
  const [data, setData] = useState<DataOperationItemType[]>([]);
  const { formatMessage } = useIntl();
  const OperationBySystem = [DataOperationType.unsampled];

  useEffect(() => {
    getRecordFlowList();
  }, []);

  const getRecordFlowList = (currentPageNo?: number, pageSize?: number) => {
    setLoading(true);
    getDataOperationList({
      projectId,
      recordId,
      pageIndex: currentPageNo || 0,
      pageSize: pageSize || query.pageSize,
    })
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          const { results, totalElements, pageSize, currentPage } = resp.data;
          setData(results);
          setTotal(totalElements);
          setQuery({ pageSize, pageIndex: currentPage });
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Card loading={loading} bordered={false} bodyStyle={{ padding: "0 0" }}>
      {data.length === 0 && (
        <Empty
          style={{ marginTop: 24 }}
          description={formatMessage(
            { id: "common.empty.with-label" },
            {
              label: formatMessage({
                id: "job-detail.dataset",
              }),
            }
          )}
        />
      )}
      {data.map(({ id, operator, operationType, operationTime }) => (
        <div key={id} className={styles["data-operation-item"]}>
          <span style={{ fontWeight: "bold" }}>
            {formatMessage({
              id: `project.detail.record-detail.data.operation-type.${operationType}`,
            })}
            (
            {OperationBySystem.includes(operationType)
              ? formatMessage({
                  id: "project.detail.record-detail.data.operation-by-system",
                })
              : operator}
            )
          </span>
          <div style={{ float: "right" }}>
            <span style={{ color: "#7A869A" }}>{operationTime}</span>
            <a
              style={{ marginLeft: 8 }}
              onClick={() => {
                setActiveOperLogId(id);
              }}
            >
              {formatMessage({ id: "common.detail" })}
            </a>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <Pagination
          current={+query.pageIndex + 1}
          pageSize={+query.pageSize}
          total={total}
          pageSizeOptions={["10", "20", "50"]}
          showSizeChanger
          onChange={(page, pageSize) => {
            getRecordFlowList(page - 1, pageSize);
          }}
          style={{ float: "right" }}
        />
      </div>
      <DataOperationDetailModal
        visible={!!activeOperLogId}
        dataOperLogId={activeOperLogId}
        projectId={projectId}
        recordId={recordId}
        onClose={() => {
          setActiveOperLogId(null);
        }}
      />
    </Card>
  );
}

export default RecordFlow;
