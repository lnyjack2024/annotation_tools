import { useEffect, useState } from "react";
import { Button, Card, Col, Row } from "antd";
import {
  EyeOutlined,
  BlockOutlined,
  HddOutlined,
  IdcardOutlined,
  MessageOutlined,
  MonitorOutlined,
  SolutionOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { FormattedMessage, useIntl } from "@umijs/max";

import { jobTypeInfo } from "@/pages/job/components/JobType";
import type { WorkerJob } from "@/types/task";
import { WorkerJobStatus } from "@/types/task";
import JobStatusTag from "@/pages/job/components/JobStatusTag";
import { JobType } from "@/types/job";
import JobInfoItem from "@/components/JobInfoItem";
import { openTemplatePreviewPageV3 } from "@/utils/utils";
import Truncate from "@/components/Truncate";
import withRound from "@/components/RoundIcon";
import { getTemplateIdByJobId } from "@/services/template-v3";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

interface JobInfoCardProps {
  job: WorkerJob;
}

const RoundBlockOutlined = withRound(BlockOutlined);
const RoundHddOutlined = withRound(HddOutlined);
const RoundIdCardOutlined = withRound(IdcardOutlined);
const RoundMessageOutlined = withRound(MessageOutlined);
const RoundMonitorOutlined = withRound(MonitorOutlined);
const RoundSolutionOutlined = withRound(SolutionOutlined);
const RoundTagOutlined = withRound(TagOutlined);

export default function JobInfoCard({ job }: JobInfoCardProps) {
  const { formatMessage } = useIntl();
  const [templateId, setTemplateId] = useState("");
  const { query } = useLocationWithQuery();
  const {
    jobName,
    jobType,
    contactEmail,
    status,
    jobId,
    description,
    jobDisplayId,
  } = job || {};

  const label = jobTypeInfo[jobType]?.label;

  useEffect(() => {
    if (jobId) {
      getTemplateIdByJobId(jobId).then((resp) => {
        setTemplateId(resp.data);
      });
    }
  }, [jobId]);

  const handlePreview = () => {
    openTemplatePreviewPageV3({
      templateId,
      projectId: job.projectId || (query.projectId as string),
    });
  };

  return (
    <Card bordered={false} style={{ marginBottom: 20 }}>
      <Row gutter={[10, 15]}>
        <Col xs={24} sm={12} md={6}>
          <JobInfoItem
            icon={<RoundMonitorOutlined isColorful />}
            content={jobName}
            title={formatMessage({ id: "task.detail.name" })}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <JobInfoItem
            icon={<RoundIdCardOutlined isColorful />}
            content={jobDisplayId}
            title={formatMessage({ id: "jobDisplayId" })}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <JobInfoItem
            icon={<RoundTagOutlined isColorful />}
            content={<>{label && <FormattedMessage id={label} />}</>}
            title={formatMessage({ id: "jobType" })}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <JobInfoItem
            icon={<RoundMessageOutlined isColorful />}
            content={
              <span>
                {contactEmail || formatMessage({ id: "common.nothing" })}
              </span>
            }
            title={formatMessage({ id: "job-detail.contact" })}
          />
        </Col>
        {jobType === JobType.LABEL && (
          <Col xs={24} sm={12} md={6}>
            <JobInfoItem
              icon={<RoundBlockOutlined isColorful />}
              content={
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  style={{ marginLeft: 8, verticalAlign: "middle" }}
                  onClick={handlePreview}
                />
              }
              title={formatMessage({ id: "task.detail.template" })}
            />
          </Col>
        )}

        {status === WorkerJobStatus.REJECT ||
          (status === WorkerJobStatus.DECLINED && (
            <Col xs={24} sm={12} md={6}>
              <JobInfoItem
                icon={<RoundHddOutlined isColorful />}
                content={<JobStatusTag status={status} />}
                title={formatMessage({ id: "task.detail.status" })}
              />
            </Col>
          ))}

        <Col xs={24} sm={12} md={6}>
          <JobInfoItem
            icon={<RoundSolutionOutlined isColorful />}
            content={
              <Truncate
                html={description || "<span>N/A</span>"}
                className="w-e-text"
              />
            }
            title={formatMessage({ id: "task.detail.description" })}
          />
        </Col>
      </Row>
    </Card>
  );
}
