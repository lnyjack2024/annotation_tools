import { PictureOutlined } from "@ant-design/icons";
import { Card, Empty, message, Table } from "antd";
import type { ColumnProps } from "antd/es/table";
import { useEffect, useState } from "react";
import { history as router, useIntl } from "@umijs/max";
import { pathToRegexp } from "path-to-regexp";

import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { TaskRecordStatus, WorkerJobResult } from "@/types/task";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { getWorkerJobTaskList } from "@/services/task";
import { HttpStatus } from "@/types/http";
import { mongoDateFormat } from "@/utils/time-util";

import globalStyles from "@/global.less";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { getMashupAPIPrefix } from "@/utils/env";

interface Query {
  pageIndex?: number;
  pageSize?: number;
  jobId: string;
}

function AnnotationResultList() {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const [loading, setLoading] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [total, setTotal] = useState(0);

  const [, , jobId] = pathToRegexp(
    "/:version?/worker-jobs/:jobId/annotation-result-list"
  ).exec(location.pathname);

  const { jobName, projectId } = location.query;

  const [query, setQuery] = useState<Query>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    jobId,
  });

  useEffect(() => {
    setLoading(true);
    getWorkerJobTaskList(query)
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setTaskList(resp.data.results);
          setTotal(resp.data.totalElements);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  const pageChange = (page: number, size: number) => {
    setQuery({
      ...query,
      pageIndex: page - 1,
      pageSize: size,
    });
  };

  const columns: ColumnProps<WorkerJobResult>[] = [
    {
      dataIndex: "recordId",
      title: formatMessage({ id: "common.column.recordId" }),
    },
    {
      dataIndex: "labelingTime",
      title: formatMessage({ id: "error-task.annotationTime" }),
      render: (time) => mongoDateFormat(time),
    },
    {
      dataIndex: "lastModifiedTime",
      title: formatMessage({ id: "task.column.lastModifiedTime" }),
      render: (time) => mongoDateFormat(time),
    },
    {
      dataIndex: "status",
      title: formatMessage({ id: "common.status" }),
      render: (status: TaskRecordStatus) => {
        if (status) {
          return formatMessage({
            id: `task.column.status.${status?.toLowerCase()}`,
          });
        }
        return formatMessage({ id: "common.nothing-symbol" });
      },
    },
    {
      title: formatMessage({ id: "task.column.labelingCompare" }),
      render: (row) => (
        <span style={{ cursor: "pointer" }}>
          <PictureOutlined
            style={{ fontSize: 18 }}
            onClick={() => {
              const q = new URLSearchParams({
                jobId,
                finalDocId: row.finalDocId,
                originDocId: row.originDocId,
                recordId: row.recordId,
                projectId: projectId as string,
              }).toString();
              window.open(
                `${getMashupAPIPrefix()}/ssr/qa-report?${q}`,
                "_blank"
              );
            }}
          />
        </span>
      ),
    },
  ];

  const onBack = () => {
    router.goBack();
  };

  return (
    <HeaderContentWrapperComponent
      title={jobName}
      backTitle={formatMessage({ id: "menu.tasks.history" })}
      onBack={onBack}
    >
      <Card
        bordered={false}
        className="with-shadow"
        title={formatMessage({ id: "task.column.action.labelingResult" })}
      >
        <Table
          scroll={{ x: "max-content" }}
          className={globalStyles.tableStriped}
          columns={columns}
          rowKey="recordId"
          loading={loading}
          dataSource={taskList}
          pagination={{
            onChange: pageChange,
            total,
            pageSize: query.pageSize,
            current: query.pageIndex + 1,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (totalNum: number) =>
              formatMessage({ id: "common.total.items" }, { items: totalNum }),
          }}
          locale={{
            emptyText: (
              <Empty description={formatMessage({ id: "task.table.empty" })} />
            ),
          }}
        />
      </Card>
    </HeaderContentWrapperComponent>
  );
}

export default AnnotationResultList;
