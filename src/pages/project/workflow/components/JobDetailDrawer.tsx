import { Button, Drawer, Spin, Tabs } from "antd";
import { useEffect, useState } from "react";
import { EditOutlined } from "@ant-design/icons";
import type { Dispatch } from "@umijs/max";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import JobOverview from "@/pages/project/workflow/JobOverview";
import JobWorkforce from "@/pages/project/workflow/JobWorkforce";
import type { Job, JobAction } from "@/types/job";
import JobStatusTag from "@/pages/job/components/JobStatusTag";
import JobActions from "@/pages/project/workflow/JobActions";
import type { ConnectState } from "@/models/connect";
import JobNameModal from "@/pages/project/workflow/components/JobNameModal";

import styles from "./JobDetailDrawer.less";

interface Props {
  jobId: string;
  workerNum: number;
  job: Job;
  dispatch: Dispatch;
  visible: boolean;
  updating: boolean;
  actionLoading: boolean;
  loading: boolean;
  isReadonly: boolean;
  onClose: () => void;
  initialTab: JobDetailTabs;
}

export enum JobDetailTabs {
  OVERVIEW = "overview",
  WORKFORCE = "WORKFORCE",
}

function JobDetailDrawer({
  workerNum,
  dispatch,
  jobId,
  job,
  visible,
  isReadonly,
  updating,
  actionLoading,
  loading,
  onClose,
  initialTab,
}: Props) {
  const { formatMessage } = useIntl();
  const [jobNameVisible, setJobNameVisible] = useState(false);

  const updateJob = (params: any, callback: () => void = () => {}) => {
    dispatch({
      type: "jobDetailDrawer/updateJob",
      payload: {
        job: { ...job, ...params },
        callback,
      },
    });
  };

  const handleExecuteJobAction = (jobAction: JobAction) => {
    dispatch({
      type: "jobDetailDrawer/executeJobAction",
      payload: {
        jobId,
        jobAction,
      },
    });
  };

  useEffect(() => {
    if (!jobId) {
      return;
    }
    dispatch({
      type: "jobDetailDrawer/getJob",
      payload: {
        jobId,
      },
    });
    dispatch({
      type: "jobDetailDrawer/getJobWorkerNum",
      payload: {
        jobId,
      },
    });
  }, [jobId]);

  return (
    <Drawer
      className={styles["job-detail-drawer"]}
      bodyStyle={{ padding: 0 }}
      title={
        <Spin spinning={loading} style={{ height: "100%" }}>
          <div className={styles.title}>
            <div>
              <span>{job?.jobName}</span>
              <Button
                type="link"
                style={{ padding: 0, fontSize: 20 }}
                onClick={() => setJobNameVisible(true)}
                disabled={isReadonly}
                icon={<EditOutlined />}
              />
            </div>
            <div>
              <JobStatusTag status={job?.jobStatus} />
              <JobActions
                job={job}
                readonly={isReadonly}
                updating={actionLoading}
                handleTakeJobAction={handleExecuteJobAction}
              />
            </div>
          </div>
        </Spin>
      }
      width={600}
      visible={visible}
      closable={false}
      onClose={onClose}
      destroyOnClose
    >
      <Tabs centered defaultActiveKey={initialTab}>
        <Tabs.TabPane
          tab={formatMessage({ id: "menu.job-detail" })}
          key={JobDetailTabs.OVERVIEW}
        >
          <JobOverview
            job={job}
            readonly={isReadonly}
            onUpdateJob={updateJob}
            updating={updating}
          />
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={`${formatMessage({
            id: "menu.workers-management",
          })}(${workerNum})`}
          key={JobDetailTabs.WORKFORCE}
        >
          <JobWorkforce readonly={isReadonly} />
        </Tabs.TabPane>
      </Tabs>
      <JobNameModal
        visible={jobNameVisible}
        defaultJobName={job?.jobName}
        onSave={(jobName: string) =>
          updateJob({ jobName }, () => setJobNameVisible(false))
        }
        onClose={() => setJobNameVisible(false)}
        submitting={updating}
      />
    </Drawer>
  );
}

function mapStateToProps({
  projectAccess,
  loading,
  jobDetailDrawer,
}: ConnectState) {
  return {
    loading: loading.effects["jobDetailDrawer/getJob"],
    updating: loading.effects["jobDetailDrawer/updateJob"],
    actionLoading: loading.effects["jobDetailDrawer/executeJobAction"],
    job: jobDetailDrawer.job,
    workerNum: jobDetailDrawer.workerNum,
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(JobDetailDrawer);
