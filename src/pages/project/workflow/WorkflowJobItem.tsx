import React, { useMemo, useState } from "react";
import { useIntl } from "@umijs/max";
import { Col, message, Progress, Row } from "antd";

import { JobDetailTabs } from "@/pages/project/workflow/components/JobDetailDrawer";
import { mapStatusToErrorMessage, toPercentage } from "@/utils/utils";
import JobStatusTag from "@/pages/job/components/JobStatusTag";
import JobActions from "@/pages/project/workflow/JobActions";
import { getJobType } from "@/pages/project/workflow/components/WorkflowCard";
import type { Job, JobAction } from "@/types/job";
import { executeJobAction } from "@/services/job";

import styles from "@/pages/project/workflow/components/WorkflowCard.less";

type Props = {
  job: Job;
  afterJobAction: (action: JobAction) => void;
  onClick: (column: JobDetailTabs) => void;
  readonly?: boolean;
};

const WorkflowJobItem: React.FC<Props> = ({
  job,
  onClick,
  afterJobAction,
  readonly,
}) => {
  const { formatMessage } = useIntl();

  const [updating, setUpdating] = useState(false);

  const progress = useMemo(() => {
    const { progressInfo } = job;
    const progressArr = (progressInfo || "")
      .split("/")
      .map((i) => parseInt(i, 10));
    return progressArr[1] && progressArr[0] / progressArr[1];
  }, [job]);

  const handleJobAction = async (targetJob: Job, action: JobAction) => {
    setUpdating(true);
    try {
      await executeJobAction(targetJob.id, action);
      afterJobAction(action);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Row>
      <Col
        span={6}
        className={`${styles["list-item-column"]} ${styles["clickable-text"]}`}
        onClick={() => {
          onClick(JobDetailTabs.OVERVIEW);
        }}
      >
        <p className={styles.header}>{job.jobName}</p>
        <span className={styles.content}>[{job.jobDisplayId}]</span>
      </Col>
      <Col
        span={6}
        className={`${styles["list-item-column"]} ${styles["clickable-text"]}`}
        onClick={() => {
          onClick(JobDetailTabs.WORKFORCE);
        }}
      >
        <div style={{ height: 44 }}>
          <p className={styles.header}>
            {formatMessage({
              id: `workflow.job-type.team.${getJobType(job)?.toLowerCase()}`,
            })}
          </p>
          <span className={styles.content}>{job.bpoName}</span>
        </div>
      </Col>
      <Col span={6} className={styles["list-item-column"]}>
        <p className={styles.header}>
          {toPercentage(progress)}
          <span style={{ float: "right", color: "#7a869a", fontSize: 14 }}>
            {job.progressInfo}
          </span>
        </p>
        <Progress
          showInfo={false}
          percent={progress * 100}
          strokeColor="#01b97f"
        />
      </Col>
      <Col
        span={6}
        className={styles["list-item-column"]}
        style={{ textAlign: "right", lineHeight: "45px" }}
      >
        <JobStatusTag status={job?.jobStatus} />
        <JobActions
          readonly={readonly}
          job={job}
          updating={updating}
          handleTakeJobAction={(jobAction) => handleJobAction(job, jobAction)}
        />
      </Col>
    </Row>
  );
};

export default WorkflowJobItem;
