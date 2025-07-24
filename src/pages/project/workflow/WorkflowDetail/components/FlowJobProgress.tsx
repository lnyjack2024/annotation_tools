import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useIntl, useDispatch } from "@umijs/max";
import { message, Spin, Statistic } from "antd";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { mapStatusToErrorMessage, toPercentage } from "@/utils/utils";
import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import { getFlowJobProgress } from "@/services/workflow";
import type { JobProgressV3 } from "@/types/workflow";
import type { FilterParam } from "@/pages/project/models/dataCenter";
import { DataState } from "@/pages/project/data-center/components/DataList";
import { history as router } from "@@/core/history";

const titleStyle: CSSProperties = {
  color: "#42526e",
  fontSize: 16,
  lineHeight: "16px",
  fontWeight: "bold",
  marginBottom: 8,
};

function FlowJobProgress({
  job,
  role = "pm",
  projectId,
  flowId,
}: {
  job: Job;
  role?: "pm" | "bpo";
  projectId?: string;
  flowId?: string;
}) {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [progress, setProgress] = useState<JobProgressV3>();
  const [loading, setLoading] = useState(false);
  const { id: jobId, jobType } = job || {};
  const {
    canGetRows,
    haltRows,
    needReWorkRows,
    processedRows,
    totalRows,
    unCommittedRows,
    finishedRows,
  } = progress || {};
  const finished = processedRows || finishedRows || 0;

  const jump = (filter: Partial<FilterParam>) => {
    if (!projectId || !flowId) {
      return;
    }
    dispatch({ type: "dataCenter/updateProject", payload: { projectId } });
    dispatch({ type: "dataCenter/updateFilters", payload: filter });
    router.push({
      pathname: `/projects/${projectId}/data-center`,
    });
  };

  const jobStatistics = [
    {
      key: "acquirable",
      title: formatMessage({
        id: "project.detail.data-center.data-state.acquirable",
      }),
      render: (
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            jump({
              state:
                jobType === JobType.QA
                  ? [DataState.ACQUIRABLE, DataState.TO_REWORK]
                  : [DataState.ACQUIRABLE],
              flowJob: [[flowId, jobId]],
            })
          }
        >
          {canGetRows}
        </span>
      ),
      value: canGetRows,
      color: "#7a869a",
    },
    {
      key: "failed",
      title: formatMessage({
        id: "project.detail.data-center.data-state.to_rework",
      }),
      render: (
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            jump({ state: [DataState.TO_REWORK], flowJob: [[flowId, jobId]] })
          }
        >
          {needReWorkRows}
        </span>
      ),
      value: needReWorkRows,
      color: "#f56c6c",
    },
    {
      key: "working",
      title: formatMessage({
        id: "project.detail.data-center.data-state.working",
      }),
      render: (
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            jump({ state: [DataState.WORKING], flowJob: [[flowId, jobId]] })
          }
        >
          {unCommittedRows}
        </span>
      ),
      value: unCommittedRows,
      color: "#fdb314",
    },
    {
      key: "halted",
      title: formatMessage({
        id: "project.detail.data-center.data-state.halted",
      }),
      render: (
        <span
          style={{ cursor: "pointer" }}
          onClick={() =>
            jump({ state: [DataState.HALTED], flowJob: [[flowId, jobId]] })
          }
        >
          {haltRows}
        </span>
      ),
      value: haltRows,
      color: "#6b5be5",
    },
    {
      key: "passed",
      title: formatMessage({
        id: "project.detail.data-center.data-state.completed",
      }),
      render: (
        <span
        // style={{ cursor: 'pointer' }}
        // onClick={() => jump({ state: [DataState.COMPLETED], jobId, flowId })}
        >
          {finished}
        </span>
      ),
      value: finished,
      color: "#01b97f",
    },
  ];

  const ratio = toPercentage(totalRows && finished / totalRows);

  if (jobType === JobType.QA) {
    jobStatistics.splice(1, 1);
  }

  const getProgress = async () => {
    if (!job) {
      return;
    }

    try {
      setLoading(true);
      const resp = await getFlowJobProgress(jobId, jobType, role);
      setProgress(resp.data);
      dispatch({
        type: "flowCreation/updateProgressInfo",
        payload: {
          jobType,
          jobId,
          progress: resp.data,
        },
      });
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProgress();
  }, [job]);

  return (
    <Spin spinning={loading}>
      <Statistic
        title={
          <span style={titleStyle}>
            {formatMessage({ id: "workflow.detail.job.statistic.progress" })}
          </span>
        }
        value={ratio}
        suffix={
          <span style={{ marginLeft: 4, fontSize: 14, fontWeight: "normal" }}>
            {formatMessage(
              { id: "workflow.detail.job.statistic.progress.remain" },
              { num: totalRows - finished }
            )}
          </span>
        }
        style={{ marginBottom: 24 }}
        valueStyle={{ color: "#42526e", fontSize: 24, lineHeight: "24px" }}
      />
      <div style={{ width: 150, height: 150, float: "left", marginRight: 40 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              dataKey="value"
              data={jobStatistics}
              innerRadius={40}
              outerRadius={72}
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
              {jobStatistics.map((entry) => (
                <Cell fill={entry.color} key={entry.key} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          paddingTop: 16,
          display: "grid",
          gridGap: 20,
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(3, 24px)",
        }}
      >
        {jobStatistics.map((item) => (
          <p key={item.key} style={{ color: "#7a869a", position: "relative" }}>
            <i
              style={{
                position: "absolute",
                top: 6,
                left: -16,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: item.color,
              }}
            />
            {item.title} <span style={{ color: "#42526e" }}>{item.render}</span>
          </p>
        ))}
      </div>
    </Spin>
  );
}

export default FlowJobProgress;
