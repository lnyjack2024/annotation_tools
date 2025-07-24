import React from "react";
import { Button } from "antd";
import { CloseOutlined, MonitorOutlined, TagOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";

import type { Job } from "@/types/job";
import { JobStatus, JobType } from "@/types/job";
import type { JobNodeData } from "./LabelJobNode";
import { formatToPercentage } from "@/utils/utils";

import styles from "../../styles.less";

type Props = {
  jobType: JobType;
  data: JobNodeData;
  onJobTitleClick?: (job: Job) => void;
};

const JobNodeBody: React.FC<Props> = ({ jobType, data }) => {
  const { order, isLastJob, job, onJobDelete, onJobTitleClick } = data;
  const { formatMessage } = useIntl();

  const [finished, total] = (job.progressInfo || "").split("/");
  const progress = finished && total ? +finished / +total : 0;

  const renderBodyByStatus = () => {
    if (job.jobStatus === JobStatus.RUNNING) {
      return (
        <div>
          <div
            style={{
              background: "#01B97F",
              height: 4,
              width: `${formatToPercentage(progress)}%`,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 5,
            }}
          >
            <h3>{`${formatToPercentage(progress)}%`}</h3>
            <span style={{ color: "#7A869A", paddingTop: 3 }}>
              {job.progressInfo}
            </span>
          </div>
        </div>
      );
    }

    if (
      job.jobStatus === JobStatus.READY ||
      job.jobStatus === JobStatus.DRAFT
    ) {
      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ padding: 10 }}>
            {formatMessage({ id: "data.process-status.pending" })}
          </div>
        </div>
      );
    }

    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ padding: 10 }}>
          {formatMessage({ id: `job.status.${job.jobStatus}` })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        className={styles["body-container"]}
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 10,
          background: "#F6F7F9",
        }}
      >
        <div>
          <JobTypeIcon jobType={jobType} />
          <Button
            type="link"
            style={{ padding: 0, height: 20 }}
            onClick={(e) => {
              e.preventDefault();
              onJobTitleClick?.(job);
            }}
          >{`${
            jobType === JobType.LABEL
              ? formatMessage({ id: "job-type.labeling" })
              : `${formatMessage({ id: "job-type.qa" })} ${order}`
          }`}</Button>
        </div>
        <div className={styles["action-buttons"]}>
          {isLastJob &&
            (job.jobStatus === JobStatus.DRAFT ||
              job.jobStatus === JobStatus.READY) && (
              <CloseOutlined
                className={styles["delete-icon"]}
                onClick={() => {
                  onJobDelete?.(job);
                }}
              />
            )}
        </div>
      </div>
      {renderBodyByStatus()}
    </div>
  );
};

export function JobTypeIcon({ jobType }: { jobType: JobType }) {
  if (jobType === JobType.LABEL) {
    return (
      <TagOutlined
        style={{
          background: "#7DBC73",
          padding: 3,
          color: "white",
          borderRadius: 2,
          marginRight: 5,
        }}
      />
    );
  }

  if (jobType === JobType.QA) {
    return (
      <MonitorOutlined
        style={{
          background: "#E7A65E",
          padding: 3,
          color: "white",
          borderRadius: 2,
          marginRight: 5,
        }}
      />
    );
  }

  return null;
}

export default JobNodeBody;
