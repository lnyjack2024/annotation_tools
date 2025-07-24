import { Col, message, Row, Spin, Statistic } from "antd";
import { useIntl } from "@umijs/max";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { Job } from "@/types/job";
import { getFlowJobWorkload } from "@/services/workflow";
import { mapStatusToErrorMessage, toPercentage } from "@/utils/utils";
import type { JobWorkload } from "@/types/workflow";

const titleStyle: CSSProperties = {
  color: "#42526e",
  fontSize: 16,
  lineHeight: "16px",
  fontWeight: "bold",
  marginBottom: 8,
};

function FlowJobEfficiency({
  job,
  role = "pm",
}: {
  job: Job;
  role?: "pm" | "bpo";
}) {
  const { formatMessage } = useIntl();
  const [workload, setWorkload] = useState<JobWorkload>(null);
  const [loading, setLoading] = useState(false);
  const { id: jobId, jobType } = job || {};

  const {
    totalWorkerNum = 0,
    avgRecordByWorker = 0,
    nrPassRatio = 0,
    totalWorkHour = 0,
    avgWorkHourByWorker = 0,
    avgNumByWorker = 0,
  } = workload || {};

  const statistics = [
    {
      key: "total-num",
      title: formatMessage({ id: "workflow.detail.job.statistic.total-num" }),
      value: totalWorkerNum,
    },
    {
      key: "average-num",
      title: formatMessage({
        id: `workflow.detail.job.statistic.average-${jobType?.toLowerCase()}-num`,
      }),
      value: (+avgRecordByWorker || +avgNumByWorker || 0).toFixed(3),
    },
    {
      key: "pass-rate",
      title: formatMessage({
        id: "workflow.detail.job.statistic.nr-pass-rate",
      }),
      value: toPercentage(nrPassRatio),
    },
    {
      key: "total-cost",
      title: formatMessage({ id: "workflow.detail.job.statistic.total-cost" }),
      value: (totalWorkHour || 0).toFixed(3),
    },
    {
      key: "average-cost",
      title: formatMessage({
        id: "workflow.detail.job.statistic.average-cost",
      }),
      value: (+avgWorkHourByWorker || 0).toFixed(3),
    },
  ];

  const getData = async () => {
    if (!job) {
      return;
    }
    try {
      setLoading(true);
      const jobWorkload = await getFlowJobWorkload(jobId, jobType, role);
      setWorkload(jobWorkload.data);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [job]);

  useEffect(() => {}, [job]);

  return (
    <Spin spinning={loading}>
      <Statistic
        title={
          <span style={titleStyle}>
            {formatMessage({
              id: `workflow.detail.job.statistic.average-${jobType.toLowerCase()}-effect`,
            })}
          </span>
        }
        value={(
          Number.parseFloat(workload?.avgEfficiency.toString()) || 0
        ).toFixed(3)}
        style={{ marginBottom: 40 }}
        valueStyle={{ color: "#42526e", fontSize: 24, lineHeight: "24px" }}
      />
      <Row gutter={[24, 24]}>
        {statistics.map((item) => (
          <Col key={item.key} span={8}>
            <Statistic
              title={
                <span
                  style={{
                    color: "#7a869a",
                    fontSize: 14,
                    lineHeight: "14px",
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </span>
              }
              value={item.value}
              valueStyle={{
                color: "#3e5270",
                fontSize: 20,
                lineHeight: "20px",
                fontWeight: "bold",
              }}
            />
          </Col>
        ))}
      </Row>
    </Spin>
  );
}

export default FlowJobEfficiency;
