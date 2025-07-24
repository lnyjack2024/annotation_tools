import {
  Button,
  Card,
  Spin,
  Modal,
  Table,
  Col,
  Row,
  Pagination,
  Space,
} from "antd";
import type { ColumnProps } from "antd/es/table";
import { history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import type { Dispatch } from "redux";

import numeral from "@/utils/num";
import useInterval from "@/hooks/useInterval";
import type { ConnectState } from "@/models/connect";
import JobStatusTag from "@/pages/job/components/JobStatusTag";
import JobTypeTag from "@/pages/job/components/JobType";
import type { WorkerJob } from "@/types/task";
import { WorkerJobStatus, WorkerJobStatusFilters } from "@/types/task";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { openWorkerTaskPageV3, queryToSearch } from "@/utils/utils";
import { Job, JobStatusFilter } from "@/types/job";
import { JobNameInputSearchComponent } from "@/pages/worker-job/components/JobNameInputSearchComponent";
import EllipticJobName from "@/pages/worker-job/components/EllipticJobName";
import JobManual from "@/pages/worker-job/components/JobManual";
import { dateFormat, shortHumanizeSeconds } from "@/utils/time-util";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { base64Encode } from "@/utils/string-util";
import JobDescription from "@/pages/project/workflow/JobOverview/JobDescription";

import globalStyles from "@/global.less";
import styles from "./styles.less";

const FIVE_MINUTES = 60 * 1000 * 5;

const UnCommittedInfo = ({ workerJob }: { workerJob: WorkerJob }) => {
  const { formatMessage } = useIntl();
  const { unCommittedTasks, unCommittedTimeout } = workerJob;
  let text = null;

  if (unCommittedTasks > 0) {
    if (unCommittedTimeout > 0) {
      const left = shortHumanizeSeconds(unCommittedTimeout, ["d", "h", "m"]);
      text = formatMessage(
        { id: "task.column.action.unCommittedTimeout" },
        { time: left }
      );
    }
    if (unCommittedTimeout === -1) {
      text = formatMessage({
        id: "task.column.operation.status",
      });
    }
  }

  return (
    <div style={{ paddingTop: 4 }}>
      <span style={{ color: "#F56C6C" }}>{text}</span>
    </div>
  );
};

export interface WorkerJobListProp {
  dispatch: Dispatch;
  jobs: WorkerJob[];
  totalJobs: number;
  initLoading: boolean;
}

function JobTodoList({
  dispatch,
  jobs,
  totalJobs,
  initLoading,
}: WorkerJobListProp) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();

  const {
    pageIndex: page = 1,
    jobName: name = "",
    pageSize: size = DEFAULT_PAGE_SIZE,
  } = location.query || {};

  const [jobName, setJobName] = useState<string>(name as string);
  const [currentPageIdx, setCurrentPageIdx] = useState<number>(+page);
  const [pageSize, setPageSize] = useState<number>(+size);
  const [currentJob, setCurrentJob] = useState<WorkerJob>();

  const [modalVisible, setModalVisible] = useState(false);
  const [instruction, setInstruction] = useState("");

  const isMobileDevice = useMediaQuery({
    query: "(max-device-width: 768px)",
  });

  const queryWorkerJobs = useCallback(() => {
    dispatch({
      type: "workerJob/getWorkerJobs",
      payload: {
        pageQuery: {
          pageIndex: currentPageIdx - 1,
          pageSize,
        },
        jobName,
        statusList: WorkerJobStatusFilters.active,
        jobStatusList: JobStatusFilter.active,
      },
    });
  }, [jobName, currentPageIdx, pageSize]);

  useEffect(() => {
    queryWorkerJobs();
  }, [jobName, currentPageIdx, pageSize]);

  useInterval(() => {
    queryWorkerJobs();
  }, FIVE_MINUTES);

  const operateJob = (job: WorkerJob) => {
    const { jobType } = job;
    openWorkerTaskPageV3(
      jobType,
      job.jobId,
      job.flowId,
      job.jobName,
      job.projectId
    );
  };

  const searchJobs = (val: string) => {
    setCurrentPageIdx(1);
    setJobName(val);
  };

  const columns: ColumnProps<WorkerJob>[] = [
    {
      key: "jobName",
      title: formatMessage({ id: "jobName" }),
      dataIndex: "jobDisplayId",
      render: (jobDisplayId: string, record) => {
        return (
          <>
            <EllipticJobName
              jobName={record.jobName}
              btnStyle={{ padding: 0 }}
              onClick={() => {
                router.push({
                  pathname: `/worker-job/${record.jobId}`,
                  state: {
                    origin: "list",
                    pageIndex: currentPageIdx,
                    jobName,
                    pageSize,
                  },
                  search: queryToSearch({
                    from: base64Encode(
                      `${location.pathname}${location.search}`
                    ),
                    projectId: record.projectId,
                  }),
                });
              }}
            />
            <div style={{ fontSize: 12, paddingLeft: 2 }}>
              {jobDisplayId || formatMessage({ id: "common.nothing-symbol" })}
            </div>
          </>
        );
      },
    },
    {
      key: "jobType",
      title: formatMessage({ id: "jobType" }),
      dataIndex: "jobType",
      render: (jobType) => <JobTypeTag type={jobType} />,
    },
    {
      key: "status",
      title: formatMessage({ id: "common.status" }),
      dataIndex: "status",
      render: (status) => <JobStatusTag status={status as WorkerJobStatus} />,
    },
    {
      key: "assignTime",
      title: formatMessage({ id: "task.column.assignTime" }),
      dataIndex: "assignTime",
      render: (dt) => <span>{dateFormat(dt)}</span>,
    },
    {
      key: "availableTasks",
      title: formatMessage({ id: "task.column.remain-records" }),
      dataIndex: "availableTasks",
      render: (availableTasks) =>
        availableTasks && availableTasks > 50
          ? `${formatMessage({ id: "task.column.large-than" })} 50`
          : availableTasks,
    },
    {
      key: "needReworkTasks",
      title: formatMessage({ id: "task.column.assigned-records" }),
      dataIndex: "needReworkTasks",
    },
    {
      key: "accuracy",
      title: formatMessage({ id: "task.column.correct-rate" }),
      dataIndex: "accuracy",
      render: (accuracy) => numeral(accuracy).format("%"),
    },
    {
      key: "doc",
      title: formatMessage({ id: "task.column.operation-doc" }),
      render: (record) => {
        return (
          <JobManual
            jobId={record.jobId}
            onInstructionClick={(text) => {
              setInstruction(text || "N/A");
              setModalVisible(true);
            }}
          />
        );
      },
    },
    {
      key: "operation",
      title: formatMessage({ id: "common.operation" }),
      fixed: "right",
      dataIndex: "jobType",
      render: (jobType, record) => (
        <Space direction="vertical" size={0}>
          <Button onClick={() => operateJob(record)}>
            {formatMessage({ id: "task.column.action.launch" })}
          </Button>
          <UnCommittedInfo workerJob={record} />
        </Space>
      ),
    },
  ];

  const JobCard = ({ job }: { job: WorkerJob }) => {
    return (
      <Card
        bordered={false}
        className={`${globalStyles["with-shadow"]} ${styles.card}`}
        title={
          <>
            <EllipticJobName
              maxLength={40}
              jobName={job.jobName}
              onClick={() => {
                router.push({
                  pathname: `/worker-job/${job.jobId}`,
                  search: queryToSearch({
                    pageIndex: `${currentPageIdx}`,
                    jobName,
                  }),
                  state: { origin: "list" },
                });
              }}
              btnStyle={{
                textAlign: "left",
                minWidth: 300,
                paddingLeft: 0,
              }}
            />
          </>
        }
      >
        <Row gutter={[16, 16]}>
          {columns
            .filter((item) => item.dataIndex && item.dataIndex !== "jobName")
            .map((item, index) => (
              <Col span={12} key={item.key}>
                <div className={styles.details}>
                  <p className={styles.label}>{item.title}</p>
                  <div className={styles.content}>
                    {item.render
                      ? item.render(job[item.dataIndex as string], job, index)
                      : job[item.dataIndex as string]}
                  </div>
                </div>
              </Col>
            ))}
        </Row>
      </Card>
    );
  };
  return (
    <>
      <Spin spinning={Boolean(initLoading)}>
        <Card bordered={false} className={globalStyles["with-shadow"]}>
          <div style={{ textAlign: "right", marginBottom: 15 }}>
            <JobNameInputSearchComponent
              jobName={jobName}
              search={searchJobs}
            />
          </div>
        </Card>
        {isMobileDevice ? (
          <div style={{ marginTop: 24 }}>
            {jobs.map((item) => (
              <JobCard job={item} key={item.id} />
            ))}
            <Pagination
              style={{ marginTop: 8, textAlign: "right" }}
              pageSize={pageSize}
              total={totalJobs}
              current={currentPageIdx}
              onChange={(currentPage, currentSize) => {
                setCurrentPageIdx(currentPage);
                setPageSize(currentSize);
              }}
              showTotal={(total: number) =>
                formatMessage({ id: "common.total.items" }, { items: total })
              }
              showSizeChanger
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            rowKey="jobId"
            className={globalStyles.tableStriped}
            columns={columns}
            dataSource={jobs}
            pagination={{
              total: totalJobs,
              pageSize,
              onChange: (currentPage, currentSize) => {
                setCurrentPageIdx(currentPage);
                setPageSize(currentSize);
              },
              current: currentPageIdx,
              showTotal: (total: number) =>
                formatMessage({ id: "common.total.items" }, { items: total }),
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
            }}
          />
        )}
      </Spin>
      <Modal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
      >
        <div dangerouslySetInnerHTML={{ __html: instruction }} />
      </Modal>
      <Modal
        visible={!!currentJob}
        title={currentJob?.jobName}
        onCancel={() => setCurrentJob(null)}
        footer={null}
        width={680}
      >
        <JobDescription
          job={currentJob as unknown as Job}
          updating={false}
          readonly={true}
        />
      </Modal>
    </>
  );
}

function mapStateToProps({ workerJob, loading }: ConnectState) {
  return {
    jobs: workerJob.jobs,
    totalJobs: workerJob.totalJobs,
    initLoading: loading.effects["workerJob/getWorkerJobs"],
  };
}

export default connect(mapStateToProps)(JobTodoList);
