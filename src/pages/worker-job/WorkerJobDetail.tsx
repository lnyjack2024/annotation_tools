import { useEffect, useState } from "react";
import { Card, Empty, message, Skeleton } from "antd";
import type { Dispatch } from "redux";
import { history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import type { WorkerJob } from "@/types/task";
import { JobActionTypes, WorkerJobStatus } from "@/types/task";
import JobInfoCard from "@/pages/worker-job/components/JobInfoCard";
import type { ConnectState } from "@/models/connect";
import { openWorkerTaskPageV3 } from "@/utils/utils";
import WorkerJobActionButtons from "@/pages/worker-job/components/WorkerJobActionButtons";
import WorkerLifeCycleComponent from "@/pages/worker-job/components/WorkerLifecycle";
import type { WorkerLifecycle } from "@/types/worker";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { base64Decode } from "@/utils/string-util";

type WorkerJobDetailProp = {
  dispatch: Dispatch;
  job: WorkerJob;
  loading: boolean;
  applying: boolean;
  workerLifecycle: WorkerLifecycle;
};

function WorkerJobDetailPage({
  dispatch,
  job,
  loading,
  workerLifecycle,
}: WorkerJobDetailProp) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const { projectId } = location.query;
  const { status = null, jobId, jobStatus, jobType } = job || {};

  const [btnDisabled, setBtnDisabled] = useState(false);

  useEffect(() => {
    return () => {
      dispatch({ type: "workerJob/saveWorkJobDetail", payload: null });
    };
  }, []);

  const getJobInfo = () => {
    dispatch({ type: "workerJob/getWorkerJobDetail", payload: jobId });
    dispatch({ type: "workerJob/getWorkerLifecycle", payload: jobId });
  };

  const handleJobStatusUpdate = (type: JobActionTypes) => {
    setBtnDisabled(true);
    dispatch({
      type: "workerJob/updateWorkerJobs",
      payload: {
        actionType: type,
        data: [jobId],
        onSuccess: () => {
          if (type === JobActionTypes.reject) {
            message.success(
              formatMessage({ id: "task.reject.success.one.title" }),
              3,
              () => router.push("/worker-jobs/tasks/pending")
            );
          } else {
            setBtnDisabled(false);
            message.success(
              formatMessage({ id: "common.message.success.operation" })
            );
            getJobInfo();
          }
        },
        onError: (detail: string) => {
          setBtnDisabled(false);
          if (detail) {
            message.error(
              formatMessage({ id: "common.message.fail.operation" }, { detail })
            );
          }
        },
      },
    });
  };

  const jobAction = () => {
    openWorkerTaskPageV3(
      jobType,
      jobId,
      job.flowId,
      job.jobName,
      job.projectId || (projectId as string)
    );
  };

  const handleBack = () => {
    const targetURL = base64Decode(location.query.from as string);

    router.push(targetURL);
  };

  return (
    <HeaderContentWrapperComponent
      title={formatMessage({ id: "task.detail.title" })}
      backTitle={formatMessage({ id: "task.detail.back" })}
      onBack={handleBack}
    >
      <Skeleton loading={loading}>
        <Card bordered={false} className="with-shadow">
          {job ? (
            <>
              <JobInfoCard job={job} />
              <WorkerLifeCycleComponent
                workerLifecycle={workerLifecycle}
                jobStatus={jobStatus}
                workerStatus={status as WorkerJobStatus}
              />
              <div className="text-right" style={{ marginRight: 50 }}>
                <WorkerJobActionButtons
                  disabled={btnDisabled}
                  handleJobStatusUpdate={handleJobStatusUpdate}
                  launch={jobAction}
                  jobStatus={jobStatus}
                  status={status as WorkerJobStatus}
                />
              </div>
            </>
          ) : (
            <Empty description={formatMessage({ id: "task.job-not-found" })} />
          )}
        </Card>
      </Skeleton>
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ workerJob, loading }: ConnectState) {
  return {
    loading:
      loading.effects["workerJob/getWorkerJobDetail"] ||
      loading.effects["workerJob/getWorkerLifecycle"] ||
      false,
    applying: loading.effects["workerJob/workerApplyPublicJob"],
    job: workerJob.jobDetail,
    workerLifecycle: workerJob.workerLifecycle,
  };
}

export default connect(mapStateToProps)(WorkerJobDetailPage);
