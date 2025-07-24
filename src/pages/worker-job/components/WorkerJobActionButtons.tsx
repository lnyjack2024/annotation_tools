import {
  JobActionTypes,
  WorkerJobStatus,
  WorkerJobStatusFilters,
} from "@/types/task";
import { useIntl } from "@umijs/max";
import { Button, Popconfirm } from "antd";
import { JobStatus } from "@/types/job";

interface WorkerJobActionButtonsProps {
  disabled: boolean;
  status: WorkerJobStatus;
  jobStatus: JobStatus;
  handleJobStatusUpdate: (status: JobActionTypes) => void;
  launch: () => void;
}

export default function WorkerJobActionButtons({
  jobStatus,
  status,
  disabled,
  launch,
  handleJobStatusUpdate,
}: WorkerJobActionButtonsProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const launchJobStatus =
    WorkerJobStatusFilters.active.indexOf(status) !== -1 &&
    jobStatus === JobStatus.RUNNING;

  return (
    <>
      {status === WorkerJobStatus.ASSIGNED && (
        <>
          <Popconfirm
            disabled={disabled}
            title={formatMessage({ id: "task.confirm.button.reject-msg" })}
            onConfirm={() => handleJobStatusUpdate(JobActionTypes.reject)}
          >
            <Button style={{ marginRight: 12 }} disabled={disabled}>
              {formatMessage({ id: "task.confirm.button.reject" })}
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            disabled={disabled}
            onClick={() => handleJobStatusUpdate(JobActionTypes.confirm)}
          >
            {formatMessage({ id: "task.confirm.button.ok" })}
          </Button>
        </>
      )}

      {status === WorkerJobStatus.CONFIRMED &&
        jobStatus === JobStatus.LAUNCH && (
          <Button disabled type="primary">
            {formatMessage({ id: "task.detail.pending" })}
          </Button>
        )}

      {launchJobStatus && (
        <Button disabled={disabled} onClick={launch} type="primary">
          {formatMessage({ id: "task.column.action.launch" })}
        </Button>
      )}
    </>
  );
}
