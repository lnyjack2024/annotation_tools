import { Button, Card, Empty, Radio, Table } from "antd";
import type { ColumnProps } from "antd/es/table";
import type { RadioChangeEvent } from "antd/lib/radio";
import { history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import type { Dispatch } from "redux";

import type { ConnectState } from "@/models/connect";
import JobStatusTag from "@/pages/job/components/JobStatusTag";
import JobTypeTag from "@/pages/job/components/JobType";
import WorkloadModal from "@/pages/worker-job/components/WorkloadModal";
import { JobStatusFilter, JobType } from "@/types/job";
import type { WorkerJob } from "@/types/task";
import { WorkerJobStatus, WorkerJobStatusFilters } from "@/types/task";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { JobNameInputSearchComponent } from "@/pages/worker-job/components/JobNameInputSearchComponent";
import EllipticJobName from "@/pages/worker-job/components/EllipticJobName";
import { dateFormat } from "@/utils/time-util";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

import globalStyles from "@/global.less";
import { base64Encode } from "@/utils/string-util";
import { queryToSearch } from "@/utils";

export interface WorkerHistoryProps {
  dispatch: Dispatch;
  jobs: WorkerJob[];
  totalJobs: number;
  totalAssignedJobs: number;
  loading: boolean;
}

const filters = {
  finished: WorkerJobStatusFilters.finished,
  active: [WorkerJobStatus.CONFIRMED],
  inactive: [
    WorkerJobStatus.REJECT,
    WorkerJobStatus.STOPPED,
    WorkerJobStatus.DECLINED,
  ],
};

function JobHistoryList({
  dispatch,
  jobs,
  loading,
  totalJobs,
}: WorkerHistoryProps) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();

  const { query } = location;

  const [queryParams, setQueryParams] = useState({
    jobName: (query.jobName as string) || "",
    filter: (query.filter as string) || "active",
    pageIndex: +query.pageIndex || 0,
    pageSize: +query.pageSize || DEFAULT_PAGE_SIZE,
  });

  const [currentJob, setCurrentJob] = useState<WorkerJob>(null);

  useEffect(() => {
    const jobStatus =
      queryParams.filter === "inactive"
        ? JobStatusFilter.active
        : JobStatusFilter[queryParams.filter];

    dispatch({
      type: "workerJob/getWorkerJobs",
      payload: {
        pageQuery: {
          pageIndex: queryParams.pageIndex,
          pageSize: queryParams.pageSize,
        },
        jobName: queryParams.jobName,
        statusList: filters[queryParams.filter],
        jobStatusList: jobStatus,
      },
    });
  }, [queryParams]);

  const pageChange = (page: number, size: number) => {
    setQueryParams({
      ...queryParams,
      pageIndex: page - 1,
      pageSize: size,
    });
  };

  const filterChange = (e: RadioChangeEvent) => {
    const { value } = e.target;

    setQueryParams({
      ...queryParams,
      filter: value,
      pageIndex: 0,
      jobName: "",
    });
  };

  const handleTaskListView = (
    jobId: string,
    currentJobName: string,
    projectId: string
  ) => {
    router.push({
      pathname: `/worker-jobs/${jobId}/annotation-result-list`,
      search: queryToSearch({
        jobName: currentJobName,
        projectId,
        ...(queryParams as unknown as Record<string, string>),
      }),
    });
  };

  const showWorkloadModal = (e: MouseEvent, job: WorkerJob) => {
    e.preventDefault();
    setCurrentJob(job);
  };

  const columns: ColumnProps<WorkerJob>[] = [
    {
      key: "jobName",
      title: formatMessage({ id: "jobName" }),
      render: (job: WorkerJob) => (
        <>
          {job.status === WorkerJobStatus.REJECT ? (
            job.jobName
          ) : (
            <EllipticJobName
              jobName={job.jobName}
              onClick={() => {
                router.push({
                  pathname: `/worker-job/${job.jobId}`,
                  state: { origin: "list" },
                  search: queryToSearch({
                    from: base64Encode(
                      `${location.pathname}${location.search}`
                    ),
                    projectId: job.projectId,
                    ...(queryParams as unknown as Record<string, string>),
                  }),
                });
              }}
              btnStyle={{
                padding: 0,
              }}
            />
          )}
        </>
      ),
    },
    {
      title: formatMessage({ id: "jobDisplayId" }),
      dataIndex: "jobDisplayId",
    },
    {
      title: formatMessage({ id: "jobType" }),
      dataIndex: "jobType",
      render: (_, record: WorkerJob) => <JobTypeTag type={record.jobType} />,
    },
    {
      title: formatMessage({ id: "task.detail.workload" }),
      dataIndex: "jobId",
      render: (jobId: string, record: WorkerJob) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={(e) => showWorkloadModal(e, record)}
        >
          {formatMessage({ id: "common.view" })}
        </Button>
      ),
    },
    {
      title: formatMessage({ id: "common.status" }),
      dataIndex: "status",
      render: (status) => <JobStatusTag status={status} />,
    },
    {
      title: formatMessage({ id: "task.column.assignTime" }),
      dataIndex: "assignTime",
      render: (dt) => <span>{dateFormat(dt)}</span>,
    },
    {
      title: formatMessage({ id: "task.column.confirmTime" }),
      dataIndex: "confirmTime",
      render: (dt) => <span>{dateFormat(dt)}</span>,
    },
    {
      title: formatMessage({ id: "task.column.contact" }),
      dataIndex: "contactEmail",
      render: (value: string) => value || "-",
    },
    {
      title: formatMessage({ id: "task.column.action.labelingResult" }),
      render: (record: WorkerJob) => (
        <span style={{ cursor: "pointer" }}>
          {record.jobType === JobType.LABEL && (
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() =>
                handleTaskListView(
                  record.jobId,
                  record.jobName,
                  record.projectId
                )
              }
            >
              {formatMessage({ id: "common.view" })}
            </Button>
          )}
        </span>
      ),
    },
  ];

  const searchJobs = (val: string) => {
    setQueryParams({
      ...queryParams,
      pageIndex: 0,
      jobName: val,
    });
  };

  return (
    <>
      <Card bordered={false} className="with-shadow">
        <div style={{ textAlign: "right", marginBottom: 15 }}>
          <Radio.Group
            buttonStyle="solid"
            value={queryParams.filter}
            onChange={filterChange}
            style={{ margin: "0 13px" }}
          >
            {Object.keys(filters).map((i) => (
              <Radio.Button key={i} value={i}>
                {formatMessage({ id: `task.filter.${i}` })}
              </Radio.Button>
            ))}
          </Radio.Group>
          <JobNameInputSearchComponent
            jobName={queryParams.jobName}
            search={searchJobs}
          />
        </div>
        <Table
          scroll={{ x: "max-content" }}
          className={globalStyles.tableStriped}
          columns={columns}
          rowKey="id"
          loading={loading}
          dataSource={jobs}
          pagination={{
            onChange: pageChange,
            total: totalJobs,
            pageSize: queryParams.pageSize,
            current: queryParams.pageIndex + 1,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (total: number) =>
              formatMessage({ id: "common.total.items" }, { items: total }),
          }}
          locale={{
            emptyText: (
              <Empty description={formatMessage({ id: "task.table.empty" })} />
            ),
          }}
        />
      </Card>
      <WorkloadModal
        jobId={currentJob?.jobId}
        jobType={currentJob?.jobType}
        visible={currentJob !== null}
        onCancel={() => setCurrentJob(null)}
      />
    </>
  );
}

function mapStateToProps({ workerJob, loading }: ConnectState) {
  return {
    jobs: workerJob.jobs,
    totalJobs: workerJob.totalJobs,
    totalAssignedJobs: workerJob.totalAssignedJobs,
    loading: loading.effects["workerJob/getWorkerJobs"],
  };
}

export default connect(mapStateToProps)(JobHistoryList);
