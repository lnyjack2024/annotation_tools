import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Row, Col, Statistic, Radio, Spin } from "antd";
import { ClockCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { useIntl, history as router } from "@umijs/max";
import { connect } from "react-redux";
import type { Dispatch } from "@umijs/max";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import type { Workflow } from "@/types/v3";
import type { Job } from "@/types/job";
import FlowJobStatistics from "@/pages/project/workflow/WorkflowDetail/components/FlowJobStatistics";
import type { ConnectState } from "@/models/connect";
import type { FlowStatistic } from "@/pages/project/workflow/models/flowDetail";
import type { FilterParam } from "@/pages/project/models/dataCenter";
import { DataState } from "@/pages/project/data-center/components/DataList";

interface Props {
  flow: Workflow;
  jobs: Job[];
  projectId: string;
  loading: boolean;
  dispatch: Dispatch;
  flowStatistic: FlowStatistic;
}

const ValueStyle: CSSProperties = {
  color: "#42526e",
  fontWeight: "bold",
};

const IconStyle: CSSProperties = {
  float: "left",
  width: 40,
  height: 40,
  marginTop: 3,
  marginRight: 20,
  background: "#f6f7f9",
  fontSize: 20,
  lineHeight: "40px",
  textAlign: "center",
  color: "#7a869a",
};

function WorkflowStatistics({
  projectId,
  flowStatistic,
  flow,
  loading,
  jobs = [],
  dispatch,
}: Props) {
  const { formatMessage } = useIntl();
  const [currentJob, setCurrentJob] = useState<Job>(jobs?.[0]);
  const { totalWorkHour, totalWorkerNum, finishedRecords, totalRecords } =
    flowStatistic;

  const jump = (filter: Partial<FilterParam>) => {
    dispatch({ type: "dataCenter/updateProject", payload: { projectId } });
    dispatch({ type: "dataCenter/updateFilters", payload: filter });
    router.push({
      pathname: `/projects/${projectId}/data-center`,
    });
  };

  const costStatistic = [
    {
      key: "hour",
      title: formatMessage({ id: "workflow.detail.statistic.hour" }),
      value: totalWorkHour?.toFixed(3),
      icon: <ClockCircleOutlined />,
    },
    {
      key: "worker-num",
      title: formatMessage({ id: "workflow.detail.statistic.worker-num" }),
      value: totalWorkerNum,
      icon: <TeamOutlined />,
    },
  ];

  const dataStatistic = [
    {
      key: "assigned-num",
      title: formatMessage({ id: "workflow.detail.statistic.assigned-num" }),
      value: totalRecords,
      formatter: () => (
        <span
          style={{ cursor: "pointer" }}
          onClick={() => jump({ flowJob: [[flow?.id]] })}
        >
          {totalRecords}
        </span>
      ),
      color: "#f6f7f9",
    },
    {
      key: "finished-num",
      title: formatMessage({ id: "workflow.detail.statistic.finished-num" }),
      value: finishedRecords,
      formatter: () => (
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            jump({ state: [DataState.COMPLETED], flowJob: [[flow?.id]] })
          }
        >
          {finishedRecords}
        </span>
      ),
      color: "#01b97f",
    },
    {
      key: "unknown",
      title: "",
      value: totalRecords - finishedRecords,
      color: "#f6f7f9",
    },
  ];

  const PieStatistic = ({ data }: { data: any[] }) => (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          dataKey="value"
          data={data}
          innerRadius={40}
          outerRadius={48}
          activeShape={(props) => {
            const {
              cx,
              cy,
              innerRadius,
              outerRadius,
              startAngle,
              endAngle,
              fill,
            } = props;
            return (
              <g>
                <Sector
                  cx={cx}
                  cy={cy}
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  startAngle={startAngle}
                  endAngle={endAngle}
                  fill={fill}
                />
              </g>
            );
          }}
          activeIndex={1}
        >
          {data.map((entry) => (
            <Cell fill={entry.color} key={entry.title} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );

  useEffect(() => {
    if (!flow?.id) {
      return;
    }

    dispatch({
      type: "flowDetail/getFlowStatistic",
      payload: {
        flowId: flow.id,
        projectId,
      },
    });
  }, [flow?.id]);

  useEffect(() => {
    if (jobs?.length > 0) {
      setCurrentJob(jobs.find((item) => item.id === currentJob?.id) || jobs[0]);
    }
  }, [jobs]);

  return (
    <Spin spinning={loading}>
      <h2 style={{ color: "#42526e", fontSize: 16 }}>
        {formatMessage({ id: "workflow.detail.title" })}
      </h2>
      <Row gutter={24}>
        <Col span={12} style={{ padding: "0 12px" }}>
          <div style={{ padding: 28, background: "#fff" }}>
            {!!totalRecords && (
              <div
                style={{
                  width: 100,
                  height: 100,
                  float: "left",
                  marginRight: 32,
                }}
              >
                <PieStatistic data={dataStatistic.slice(1)} />
              </div>
            )}
            {dataStatistic.slice(0, 2).map((item, index) => (
              <Statistic
                key={item.key}
                title={
                  <span style={{ lineHeight: "14px", marginBottom: 8 }}>
                    {item.title}
                  </span>
                }
                formatter={item.formatter}
                style={{ marginBottom: !index ? 24 : 0 }}
                valueStyle={{ ...ValueStyle, fontSize: 20, lineHeight: "20px" }}
              />
            ))}
          </div>
        </Col>
        <Col span={12} style={{ padding: "0 12px" }}>
          <div style={{ padding: 28, background: "#fff" }}>
            {costStatistic.map((item, index) => (
              <div key={item.key}>
                <div style={IconStyle}>{item.icon}</div>
                <Statistic
                  title={
                    <span style={{ lineHeight: "14px", marginBottom: 8 }}>
                      {item.title}
                    </span>
                  }
                  value={item.value}
                  style={{ marginBottom: !index ? 24 : 0 }}
                  valueStyle={{
                    ...ValueStyle,
                    fontSize: 20,
                    lineHeight: "20px",
                  }}
                />
              </div>
            ))}
          </div>
        </Col>
      </Row>
      <Radio.Group
        size="large"
        value={currentJob}
        style={{ margin: "24px 0 16px" }}
        onChange={(e) => setCurrentJob(e.target.value)}
      >
        {jobs?.map((item, index) => (
          <Radio.Button
            value={item}
            key={item.id}
            style={
              currentJob?.id === item.id ? undefined : { color: "#7a869a" }
            }
          >
            {formatMessage({ id: `${item.jobType?.toLowerCase()}-job.type` })}
            {index || index + 1}
          </Radio.Button>
        ))}
      </Radio.Group>
      {currentJob && <FlowJobStatistics job={currentJob} flow={flow} />}
    </Spin>
  );
}

function mapStateToProps({ flowDetail, loading }: ConnectState) {
  return {
    flowStatistic: flowDetail.flowStatistic,
    loading: loading.effects["flowDetail/getFlowStatistic"],
  };
}

export default connect(mapStateToProps)(WorkflowStatistics);
