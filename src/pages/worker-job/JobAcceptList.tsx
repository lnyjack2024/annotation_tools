import { Button, Card, message, Modal, Popconfirm, Table } from "antd";
import type { ColumnProps } from "antd/es/table";
import React, { useEffect, useState } from "react";
import type { Dispatch } from "redux";
import { history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { ConnectState } from "@/models/connect";
import JobTypeTag from "@/pages/job/components/JobType";
import type { WorkerJob } from "@/types/task";
import { JobActionTypes } from "@/types/task";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { JobNameInputSearchComponent } from "@/pages/worker-job/components/JobNameInputSearchComponent";
import EllipticJobName from "@/pages/worker-job/components/EllipticJobName";
import { dateFormat } from "@/utils/time-util";

import styles from "@/global.less";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { base64Encode } from "@/utils/string-util";
import { queryToSearch } from "@/utils";

interface JobAcceptProps {
  submitting: boolean;
  loading: boolean;
  dispatch: Dispatch;
  assignedJobs: WorkerJob[];
  totalElements: number;
}

function JobAcceptList({
  dispatch,
  assignedJobs,
  totalElements,
  loading,
  submitting,
}: JobAcceptProps) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const { pageIndex: page = 1, jobName: name = "" } = location.query;

  const [jobName, setJobName] = useState(name);
  const [pageIndex, setPageIndex] = useState(+page);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    dispatch({
      type: "workerJob/getAssignedWorkerJobs",
      payload: { pageIndex: pageIndex - 1, pageSize, jobName },
    });
  }, [pageIndex, pageSize, jobName]);

  const goToDetail = (job: WorkerJob) => {
    router.push({
      pathname: `/worker-job/${job.jobId}`,
      state: { origin: "list", jobName, pageIndex },
      search: queryToSearch({
        from: base64Encode(`${location.pathname}${location.search}`),
        projectId: job.projectId,
      }),
    });
  };

  const columns: ColumnProps<WorkerJob>[] = [
    {
      title: formatMessage({ id: "projectName" }),
      dataIndex: "projectName",
    },
    {
      title: formatMessage({ id: "jobName" }),
      dataIndex: "jobName",
      render: (_, record) => (
        <EllipticJobName
          jobName={record.jobName}
          btnStyle={{ padding: 0 }}
          onClick={() => goToDetail(record)}
        />
      ),
    },
    {
      title: formatMessage({ id: "jobDisplayId" }),
      dataIndex: "jobDisplayId",
      render: (jobDisplayId: string) =>
        jobDisplayId || formatMessage({ id: "common.nothing-symbol" }),
    },
    {
      title: formatMessage({ id: "jobType" }),
      dataIndex: "jobType",
      render: (type) => <JobTypeTag type={type} />,
    },
    {
      title: formatMessage({ id: "task.column.assignTime" }),
      dataIndex: "assignTime",
      render: (dt) => <span>{dateFormat(dt)}</span>,
    },
    {
      title: formatMessage({ id: "common.operation" }),
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => goToDetail(record)}
        >
          {formatMessage({ id: "common.view" })}
        </Button>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedJobIds: React.Key[]) => {
      setSelectedKeys(selectedJobIds as string[]);
    },
  };

  const handleJobStatusUpdate = (type: JobActionTypes) => {
    dispatch({
      type: "workerJob/updateWorkerJobs",
      payload: {
        actionType: type,
        data: selectedKeys,
        onSuccess: () => {
          if (type === JobActionTypes.reject) {
            message.success(
              formatMessage(
                { id: "task.reject.success.title" },
                { count: selectedKeys.length }
              ),
              3
            );
          } else {
            Modal.confirm({
              title: formatMessage(
                { id: "task.confirm.success.title" },
                { count: selectedKeys.length }
              ),
              onOk() {
                router.push(`/worker-jobs/tasks/in-progress`);
              },
              okText: formatMessage({ id: "common.yes" }),
              cancelText: formatMessage({ id: "common.no" }),
            });
          }
          setSelectedKeys([]);
          dispatch({
            type: "workerJob/getAssignedWorkerJobs",
            payload: { pageIndex: pageIndex - 1, pageSize, jobName },
          });
          dispatch({
            type: "workerJob/getAssignedJobsNum",
          });
        },
        onError: (detail: string) => {
          if (detail) {
            message.error(
              formatMessage({ id: `task.${type}.fail.title` }, { detail })
            );
          }
        },
      },
    });
  };

  const searchJobs = (val: string) => {
    setPageIndex(1);
    setJobName(val);
  };

  return (
    <Card bordered={false} className={styles["with-shadow"]}>
      <div style={{ textAlign: "right", marginBottom: 15 }}>
        <JobNameInputSearchComponent
          jobName={jobName as string}
          search={searchJobs}
        />
      </div>
      <Table
        scroll={{ x: "max-content" }}
        key={totalElements}
        rowKey="jobId"
        className={styles.tableStriped}
        columns={columns}
        dataSource={assignedJobs}
        loading={loading}
        pagination={{
          total: totalElements,
          pageSize,
          onChange: (current: number, size: number) => {
            setPageIndex(current);
            setPageSize(size);
          },
          current: pageIndex,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total: number) =>
            formatMessage({ id: "common.total.items" }, { items: total }),
        }}
        rowSelection={rowSelection}
      />
      <div style={{ marginTop: assignedJobs?.length > 0 ? -48 : 16 }}>
        <Popconfirm
          disabled={selectedKeys.length <= 0 || submitting}
          title={formatMessage({ id: "task.confirm.button.reject-msg" })}
          onConfirm={() => handleJobStatusUpdate(JobActionTypes.reject)}
        >
          <Button
            style={{ marginRight: 12 }}
            disabled={selectedKeys.length <= 0 || submitting}
          >
            {formatMessage({ id: "task.confirm.button.reject" })}
          </Button>
        </Popconfirm>

        <Button
          type="primary"
          disabled={selectedKeys.length <= 0}
          loading={submitting}
          onClick={() => handleJobStatusUpdate(JobActionTypes.confirm)}
        >
          {formatMessage({ id: "task.confirm.button.ok" })}
        </Button>
        <span style={{ marginLeft: 5 }}>
          {formatMessage(
            { id: "common.selected" },
            { count: selectedKeys.length }
          )}
        </span>
      </div>
    </Card>
  );
}

function mapStateToProps({ workerJob, loading }: ConnectState) {
  return {
    assignedJobs: workerJob.assignedJobs,
    totalElements: workerJob.totalAssignedJobs,
    loading: loading.effects["workerJob/getAssignedWorkerJobs"],
    submitting: loading.effects["workerJob/updateWorkerJobs"],
  };
}

export default connect(mapStateToProps)(JobAcceptList);
