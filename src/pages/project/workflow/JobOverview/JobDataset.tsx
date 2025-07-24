import { EditOutlined } from "@ant-design/icons";
import { Button, Col, Row } from "antd";
import { useState } from "react";
import { FormattedMessage } from "@umijs/max";

import type { DistributionInfo } from "@/pages/job/job-detail/components/DistributionEditModal";
import DistributionEditModal from "@/pages/job/job-detail/components/DistributionEditModal";
import TimeoutEditModal from "@/pages/job/job-detail/components/TimeoutEditModal";
import type { Job } from "@/types/job";
import { JobStatus, JobType } from "@/types/job";
import { TemplateType } from "@/types/template";

import styles from "../../../job/job-detail/components/DatasetCard.less";

interface DatasetCardProps {
  job: Job;
  readonly: boolean;
  updating: boolean;
  onUpdateJob: (params: any, callback: () => void) => void;
}

export function isEditableBeforeRunning(jobStatus: JobStatus, ro = false) {
  if (ro) {
    return false;
  }

  return (
    jobStatus === JobStatus.DRAFT ||
    jobStatus === JobStatus.READY ||
    jobStatus === JobStatus.LAUNCH ||
    jobStatus === JobStatus.STARTING_ERROR
  );
}

function JobDataset({
  job,
  updating,
  readonly,
  onUpdateJob,
}: DatasetCardProps) {
  const [dataVisible, setDataVisible] = useState(false);
  const [timeVisible, setTimeVisible] = useState(false);
  const {
    recordNum,
    workerNum,
    jobStatus,
    jobType,
    timeout: time,
    templateType,
  } = job || {};

  const timeout = time;
  const multipleRecords =
    templateType !== TemplateType.LIDAR &&
    templateType !== TemplateType.LIDAR_SSE;

  const handleDataSave = (distribution: DistributionInfo) => {
    onUpdateJob(distribution, () => {
      setDataVisible(false);
    });
  };

  const handleTimeSave = (val: number) => {
    onUpdateJob({ timeout: val }, () => {
      setTimeVisible(false);
    });
  };

  return (
    <div style={{ padding: 24, borderBottom: "1px solid #dcdfe3" }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <span className={styles.title}>
            <FormattedMessage id="job-detail.timeout" />
            {jobStatus !== JobStatus.FINISHED && (
              <Button
                type="link"
                className={styles.edit}
                onClick={() => setTimeVisible(true)}
                disabled={readonly}
                icon={<EditOutlined />}
              />
            )}
          </span>
          <div className={styles.number}>
            {timeout ? timeout / 60 : "-"}
            <span className={styles.unit}>
              <FormattedMessage id="common.unit.minute" />
            </span>
          </div>
        </Col>
        <Col span={12}>
          <span className={styles.title}>
            <FormattedMessage id="job-detail.distribution" />
            {isEditableBeforeRunning(jobStatus) && (
              <Button
                type="link"
                className={styles.edit}
                onClick={() => setDataVisible(true)}
                disabled={readonly}
                icon={<EditOutlined />}
              />
            )}
          </span>
          <Row>
            <Col xs={24} sm={8}>
              <div className={styles.number}>
                {recordNum || "-"}
                <span className={styles.unit}>
                  <FormattedMessage id="job-detail.record-num" />
                </span>
              </div>
            </Col>
            <Col xs={24} sm={7}>
              <div className={styles.number}>
                {workerNum || "-"}
                <span className={styles.unit}>
                  <FormattedMessage id="job-detail.worker-num" />
                </span>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
      <DistributionEditModal
        visible={dataVisible}
        multipleRecords={multipleRecords}
        distribution={{ recordNum, workerNum }}
        submitting={updating}
        showDataSelection={jobType === JobType.QA}
        showRecordNum={true}
        showWorkerNum={false}
        onCancel={() => setDataVisible(false)}
        onSubmit={handleDataSave}
      />
      <TimeoutEditModal
        visible={timeVisible}
        timeout={timeout}
        submitting={updating}
        onCancel={() => setTimeVisible(false)}
        onSubmit={handleTimeSave}
      />
    </div>
  );
}

export default JobDataset;
