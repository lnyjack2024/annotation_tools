import { Button } from "antd";
import { useIntl } from "@umijs/max";
import type { Job } from "@/types/job";
import { JobAction, JobStatus } from "@/types/job";

interface Props {
  updating: boolean;
  job: Job;
  handleTakeJobAction: (jobAction: JobAction) => void;
  readonly?: boolean;
}

function JobActions({
  job,
  updating,
  handleTakeJobAction,
  readonly = false,
}: Props) {
  const { formatMessage } = useIntl();
  const { jobStatus } = job || {};

  switch (jobStatus) {
    case JobStatus.READY:
      return (
        <Button
          key="launch"
          type="primary"
          loading={updating}
          onClick={() => handleTakeJobAction(JobAction.LAUNCH_JOB)}
          disabled={readonly}
        >
          {formatMessage({ id: "job-list.table.actions.launch" })}
        </Button>
      );
    case JobStatus.LAUNCH:
      return (
        <Button
          key="start"
          type="primary"
          loading={updating}
          onClick={() => handleTakeJobAction(JobAction.START_JOB)}
          disabled={readonly}
        >
          {formatMessage({ id: "job-list.table.actions.start" })}
        </Button>
      );
    case JobStatus.STARTING_ERROR:
      return (
        <Button
          key="restart"
          type="primary"
          loading={updating}
          onClick={() => handleTakeJobAction(JobAction.START_JOB)}
          disabled={readonly}
        >
          {formatMessage({ id: "job-list.table.actions.start" })}
        </Button>
      );
    case JobStatus.RUNNING:
      return (
        <>
          <Button
            key="pause"
            loading={updating}
            onClick={() => handleTakeJobAction(JobAction.PAUSE_JOB)}
            disabled={readonly}
          >
            {formatMessage({ id: "job-list.table.actions.pause" })}
          </Button>
        </>
      );
    case JobStatus.PAUSE:
      return (
        <Button
          key="resume"
          loading={updating}
          onClick={() => handleTakeJobAction(JobAction.RESUME_JOB)}
          disabled={readonly}
        >
          {formatMessage({ id: "job-list.table.actions.resume" })}
        </Button>
      );
    default:
      return null;
  }
}

export default JobActions;
