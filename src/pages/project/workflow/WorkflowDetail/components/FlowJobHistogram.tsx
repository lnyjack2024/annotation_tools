import { Card, message, Statistic, Tabs } from "antd";
import DateSelector from "@/components/TrendDateSelector";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mongoDateFormat } from "@/utils/time-util";
import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";
import { getFlowJobHistogram } from "@/services/workflow";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { JobStatistic } from "@/types/workflow";
import { DaysTrendsType } from "@/types/common";

function FlowJobHistogram({
  job,
  role = "pm",
}: {
  job: Job;
  role?: "pm" | "bpo";
}) {
  const { formatMessage } = useIntl();
  const [data, setData] = useState<JobStatistic>(null);
  const [dateType, setDateType] = useState<DaysTrendsType>(
    DaysTrendsType.THIS_WEEK
  );
  const [dateRange, setDateRange] = useState([]);
  const [activeKey, setActiveKey] = useState("0");
  const [loading, setLoading] = useState(false);
  const { jobType = JobType.LABEL } = job || {};
  const isQa = jobType === JobType.QA;
  const histogramData = data?.data || [];

  const qaDetailStatistic = [
    {
      title: formatMessage({ id: "workflow.detail.job.statistic.qaNum" }),
      value: data?.totalSampleNum || 0,
    },
    {
      title: formatMessage({ id: "workflow.detail.job.statistic.passNum" }),
      value: data?.totalPassNum || 0,
    },
    {
      title: formatMessage({ id: "workflow.detail.job.statistic.rejectNum" }),
      value: data?.totalRejectNum || 0,
    },
  ];

  const tabs = [
    {
      label: formatMessage({
        id: !isQa
          ? "workflow.detail.job.statistic.tabs.rows"
          : "workflow.detail.job.statistic.tabs.qa",
      }),
      value: "0",
      dataKey: !isQa ? "labelRecords" : "",
    },
    ...(isQa
      ? [
          {
            label: formatMessage({
              id: "workflow.detail.job.statistic.tabs.qa-statistics",
            }),
            value: "3",
            dataKey: "statistics",
          },
        ]
      : []),
    {
      label: formatMessage({
        id: "workflow.detail.job.statistic.tabs.average-cost",
      }),
      value: "1",
      dataKey: "avgWorkHourByWorker",
    },
    {
      label: formatMessage({ id: "workflow.detail.job.statistic.tabs.num" }),
      value: "2",
      dataKey: "workerNum",
    },
  ];

  const barCustomTooltip = ({ payload, label }: any) => {
    if (!payload?.length) {
      return null;
    }

    const total = payload.reduce((a, b) => a.value + b.value);

    return (
      <div
        style={{
          background: "#fff",
          opacity: 0.7,
          border: "1px solid #f5f7f9",
          padding: 8,
        }}
      >
        {mongoDateFormat(label, "YYYY-MM-DD")}
        {payload.map((item) => (
          <p style={{ margin: 0, color: "#42526e" }}>
            {formatMessage({
              id: `workflow.detail.job.statistic.${item.dataKey}`,
            })}
            :<span style={{ marginLeft: 4 }}>{item.value}</span>
          </p>
        ))}
        <p style={{ margin: 0, color: "#42526e" }}>
          {formatMessage({ id: `workflow.detail.job.statistic.qaNum` })}:
          <span style={{ marginLeft: 4 }}>{total}</span>
        </p>
      </div>
    );
  };

  const lineCustomTooltip = ({ payload, label }: any) => {
    if (!payload?.length) {
      return null;
    }

    return (
      <div
        style={{
          background: "#fff",
          opacity: 0.7,
          border: "1px solid #f5f7f9",
          padding: 8,
        }}
      >
        {mongoDateFormat(label, "YYYY-MM-DD")}
        {payload.map((item) => (
          <p key={item.dataKey} style={{ margin: 0, color: "#42526e" }}>
            {tabs.find((i) => i.value === activeKey)?.label}:
            <span style={{ marginLeft: 4 }}>{item.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  };

  const getHistogram = async () => {
    if (!job) {
      return;
    }
    try {
      setLoading(true);
      const jobHistogram = await getFlowJobHistogram({
        jobId: job.id,
        histogramType: dateType,
        dateStart: dateRange?.[0]
          ?.startOf("day")
          ?.format("YYYY-MM-DD HH:mm:ss"),
        dateTo: dateRange?.[1]?.endOf("day")?.format("YYYY-MM-DD HH:mm:ss"),
        jobType,
        role,
      });
      setData(jobHistogram.data);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getStatisticsCharts = () => {
    if (activeKey === "0" && isQa) {
      return (
        <>
          <div style={{ float: "left", width: 128, marginRight: 32 }}>
            {qaDetailStatistic.map((item) => (
              <Statistic
                key={item.title}
                title={
                  <span style={{ color: "#7a869a", lineHeight: "14px" }}>
                    {item.title}
                  </span>
                }
                value={item.value}
                style={{
                  background: "#F6F7F9",
                  borderRadius: 8,
                  marginBottom: 20,
                  padding: "20px 12px",
                }}
                valueStyle={{
                  color: "#3e5270",
                  fontSize: 20,
                  lineHeight: "20px",
                }}
              />
            ))}
          </div>
          <div style={{ overflow: "hidden", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={histogramData}
                maxBarSize={50}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="collectDate"
                  hide={histogramData.length === 0}
                  tickFormatter={(tick) => mongoDateFormat(tick, "YYYY-MM-DD")}
                />
                <YAxis hide={histogramData.length === 0} />
                <Tooltip content={barCustomTooltip} />
                <Bar dataKey="passNum" stackId="a" fill="#01b97f" />
                <Bar dataKey="rejectNum" stackId="a" fill="#f56c6c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      );
    }

    if (activeKey === "3") {
      return (
        <div>
          {formatMessage(
            { id: "common.empty.with-label" },
            {
              label: formatMessage({
                id: "workflow.detail.job.statistic.tabs.qa-statistics",
              }),
            }
          )}
        </div>
      );
    }

    return (
      <ResponsiveContainer>
        <LineChart
          width={260}
          height={150}
          style={{ marginTop: 12 }}
          data={histogramData}
          margin={{ top: 5, right: 30, left: 45, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            hide={histogramData.length === 0}
            dataKey="collectDate"
            tickFormatter={(tick) => mongoDateFormat(tick, "YYYY-MM-DD")}
            padding={{ left: 40, right: 40 }}
          />
          <YAxis
            hide={histogramData.length === 0}
            allowDecimals={false}
            width={1}
            // domain={[0, 'dataMax + 10']}
          />
          <Tooltip
            key="tooltip-day"
            wrapperStyle={{
              width: "auto",
              backgroundColor: "#fff",
              padding: "4px 8px",
              // border: '1px solid rgb(204, 204, 204)',
            }}
            allowEscapeViewBox={{ x: false, y: false }}
            content={lineCustomTooltip}
          />
          <Legend wrapperStyle={{ bottom: 0 }} align="left" />
          <Line
            name={tabs.find((i) => i.value === activeKey)?.label}
            type="monotone"
            dataKey={tabs.find((i) => i.value === activeKey).dataKey}
            stroke="#01B97F"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  useEffect(() => {
    getHistogram();
  }, [job, dateType, dateRange]);

  return (
    <Card
      title={
        <Tabs
          onChange={(v) => {
            setActiveKey(v);
          }}
          activeKey={activeKey}
          style={{ width: "fit-content" }}
        >
          {tabs.map((item) => (
            <Tabs.TabPane tab={item.label} key={item.value} />
          ))}
        </Tabs>
      }
      extra={
        <DateSelector
          defaultType={dateType}
          onDateChange={(type, range) => {
            setDateType(type);
            setDateRange(range);
          }}
          dateTypes={[
            DaysTrendsType.THIS_WEEK,
            DaysTrendsType.THIS_MONTH,
            DaysTrendsType.THIS_YEAR,
            DaysTrendsType.SO_FAR,
          ]}
        />
      }
      loading={loading}
    >
      <div style={{ width: "100%", height: 300 }}>{getStatisticsCharts()}</div>
    </Card>
  );
}

export default FlowJobHistogram;
