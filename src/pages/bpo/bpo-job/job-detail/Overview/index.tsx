import React, { useEffect, useState } from "react";
import type { Dispatch } from "redux";
import {
  EditOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Divider, Empty, message, Row, Spin } from "antd";
import { FormattedMessage, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { dateFormat } from "@/utils/time-util";
import type { Template } from "@/types/template";
import type { JobInfoItemProp } from "@/components/JobInfoItem";
import JobInfoItem from "@/components/JobInfoItem";
import type { ConnectState } from "@/models/connect";
import type { Job } from "@/types/job";
import { JobStatus, JobType } from "@/types/job";
import { jobTypeInfo } from "@/pages/job/components/JobType";
import TimeoutEditModal from "@/pages/job/job-detail/components/TimeoutEditModal";
import withRound from "@/components/RoundIcon";

import styles from "@/pages/job/job-detail/components/DatasetCard.less";

const cardStyle = {
  marginBottom: 24,
};

interface OverviewProp {
  dispatch: Dispatch;
  job: Job;
  template: Template;
  loading: boolean;
  timeUpdating: boolean;
}

function Overview({
  job,
  template,
  loading = false,
  dispatch,
  timeUpdating,
}: OverviewProp) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const {
    id: jobId,
    jobType,
    createdTime,
    contactEmail,
    testFlag,
    jobDisplayId,
    timeout,
    recordNum,
    workerNum,
    description,
    jobStatus,
    globalSampleRate,
  } = job || {};
  const [jobBasicInfoItems, setJobIBasicInfoItems] = useState<
    (JobInfoItemProp & { Icon: React.FC })[]
  >([]);
  const { type: templateType = "UNKNOWN" } = template || {};
  const [timeVisible, setTimeVisible] = useState(false);

  useEffect(() => {
    if (job) {
      const { Icon, label } =
        jobTypeInfo[jobType] || jobTypeInfo[JobType.LABEL];

      const items = [
        {
          key: "jobType",
          Icon,
          title: formatMessage({ id: label }),
          content: formatMessage({ id: `template.type-list.${templateType}` }),
        },
        {
          key: "jobDisplayId",
          Icon,
          title: formatMessage({ id: "jobId" }),
          content: jobDisplayId,
        },
        {
          key: "creation",
          Icon: ClockCircleOutlined,
          title: formatMessage({ id: "job-detail.creation" }),
          content: dateFormat(createdTime),
        },
        {
          key: "contact",
          Icon: MessageOutlined,
          title: formatMessage({ id: "job-detail.contact" }),
          content: contactEmail,
        },
        {
          key: "isTest",
          Icon: ExperimentOutlined,
          title: formatMessage({ id: "job-list.table.isTest" }),
          content: formatMessage({ id: testFlag ? "common.yes" : "common.no" }),
        },
      ];

      if (jobType === JobType.QA) {
        items.push({
          key: "globalSampleRate",
          Icon: ExperimentOutlined,
          title: formatMessage({ id: "job.qa.worker-sample-rate" }),
          content: globalSampleRate.toString(),
        });
      }

      setJobIBasicInfoItems(items);
    }
  }, [job]);

  const handleTimeSave = (val: number) => {
    const payload = {
      onSuccess: () => {
        setTimeVisible(false);
      },
      onError: (detail: string) => {
        message.error(detail);
      },
    };

    dispatch({
      type: "bpoJob/updateJobTimeout",
      payload: { ...payload, timeout: val, jobId },
    });
  };

  return (
    <Spin spinning={loading}>
      <Card bordered={false} className="with-shadow" style={cardStyle}>
        <Row gutter={[0, 15]}>
          {jobBasicInfoItems.map((item) => {
            const { Icon, title, content, key } = item;
            const RoundIcon = withRound(Icon);
            return (
              <Col xs={24} sm={12} md={6} key={key}>
                <JobInfoItem
                  icon={<RoundIcon />}
                  title={title}
                  content={content}
                />
              </Col>
            );
          })}
        </Row>
      </Card>
      <Card bordered={false} className="with-shadow" style={cardStyle}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <JobInfoItem
              title={
                <div>
                  {formatMessage({ id: "job-detail.timeout" })}
                  {jobStatus !== JobStatus.FINISHED && (
                    <Button
                      type="link"
                      className={styles.edit}
                      onClick={() => setTimeVisible(true)}
                      icon={<EditOutlined />}
                    />
                  )}
                </div>
              }
              content={
                <>
                  <div className={styles.number}>
                    {timeout ? timeout / 60 : "-"}
                  </div>
                  <FormattedMessage id="common.unit.minute" />
                </>
              }
            />
          </Col>
          <Col span={1}>
            <Divider type="vertical" style={{ height: "100%" }} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <JobInfoItem
              title={formatMessage({ id: "job-detail.distribution" })}
              content={
                <Row>
                  {jobType === JobType.LABEL && (
                    <Col xs={24} sm={8} className="text-center">
                      <div className={styles.number}>{recordNum || "-"}</div>
                      <FormattedMessage id="job-detail.record-num" />
                    </Col>
                  )}
                  <Col xs={24} sm={7} className="text-center">
                    <div className={styles.number}>{workerNum || "-"}</div>
                    <FormattedMessage id="job-detail.worker-num" />
                  </Col>
                </Row>
              }
            />
          </Col>
          <Col span={1}>
            <Divider type="vertical" style={{ height: "100%" }} />
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="with-shadow" style={cardStyle}>
        <div style={{ color: "#848899", lineHeight: "32px" }}>
          {formatMessage({
            id: "labeling-job-create.wizard.complete.form.description",
          })}
        </div>
        {description ? (
          <div
            dangerouslySetInnerHTML={{ __html: description }}
            className="ck-editor-content editor-content-img w-e-text"
            style={{ width: "100%" }}
          />
        ) : (
          <Empty
            description={formatMessage(
              { id: "common.empty.with-label" },
              {
                label: formatMessage({
                  id: "labeling-job-create.wizard.complete.form.description",
                }),
              }
            )}
          />
        )}
      </Card>
      <TimeoutEditModal
        visible={timeVisible}
        timeout={timeout}
        submitting={timeUpdating}
        onCancel={() => setTimeVisible(false)}
        onSubmit={handleTimeSave}
      />
    </Spin>
  );
}

function mapStateToProps({ bpoJob, loading }: ConnectState) {
  return {
    job: bpoJob.job,
    template: bpoJob.template,
    timeUpdating: loading.effects["bpoJob/updateJobTimeout"],
  };
}

export default connect(mapStateToProps)(Overview);
