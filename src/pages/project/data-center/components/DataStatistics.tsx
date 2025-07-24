import type { CSSProperties, ReactNode } from "react";
import React, { useEffect } from "react";
import { Card, Statistic, message } from "antd";
import { Dispatch, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { ConnectState } from "@/models/connect";

type Props = {
  projectId: string;
  style?: CSSProperties;
  extraBtn: ReactNode;
  dataMgmtVisible: boolean;
  dispatch: Dispatch;
  statistics: StatisticData;
  loading: boolean;
};

export type StatisticData = {
  pendingNum: number;
  auditingNum: number;
  assignedNum: number;
  auditedNum: number;
  completedNum: number;
  totalNum: number;
};

export const COMPLETE_COLOR = "#01B97F";
export const FINISHED_COLOR = "#5187F3";
export const UNASSIGNED_COLOR = "#42526E";

const ValueStyle: CSSProperties = {
  color: "#42526e",
  fontWeight: "bold",
};

const DataStatistics: React.FC<Props> = ({
  style = {},
  projectId,
  extraBtn,
  dataMgmtVisible,
  dispatch,
  statistics,
  loading,
}) => {
  const { formatMessage } = useIntl();

  const {
    pendingNum = 0,
    assignedNum = 0,
    totalNum = 0,
    completedNum = 0,
  } = statistics || {};

  const statisticData = [
    {
      key: "assignedNum",
      value: assignedNum,
      color: COMPLETE_COLOR,
      label: formatMessage({
        id: "project.detail.data-center.statistics.in-workflow",
      }),
      fontSize: 20,
    },
    {
      key: "pendingNum",
      value: pendingNum,
      color: UNASSIGNED_COLOR,
      label: formatMessage({
        id: "project.detail.data-center.statistics.out-workflow",
      }),
      fontSize: 16,
    },
    {
      key: "completedNum",
      value: completedNum,
      color: FINISHED_COLOR,
      label: formatMessage({
        id: "project.detail.data-center.statistics.finished",
      }),
      fontSize: 20,
    },
  ];

  const getList = async () => {
    // setLoading(true);
    try {
      // const resp = await getProjectDataStatistics(
      //   { projectId },
      //   { cancelToken: createCancelToken() },
      // );
      // setStatistic(resp.data);
      dispatch({
        type: "dataCenter/getStatistics",
        payload: { projectId },
      });
    } catch (e) {
      // if (isCancel(e)) {
      //   return;
      // }
      message.error(mapStatusToErrorMessage(e));
    }
  };

  useEffect(() => {
    if (dataMgmtVisible) {
      return;
    }
    getList();
  }, [dataMgmtVisible]);

  return (
    <Card
      bordered={false}
      loading={loading}
      className="with-shadow"
      style={style}
      headStyle={{ borderBottom: "none", color: "#42526e" }}
      bodyStyle={{ padding: 0 }}
      title={
        <>
          <span
            style={{
              fontSize: 14,
              fontWeight: "normal",
              verticalAlign: "text-bottom",
            }}
          >
            {formatMessage({ id: "project.detail.data-center.statistics" })}
          </span>
          <Statistic
            style={{
              display: "inline-block",
            }}
            title={null}
            value={totalNum}
            valueStyle={{
              fontSize: 24,
              color: "#42526e",
              marginLeft: 8,
              verticalAlign: "middle",
            }}
          />
        </>
      }
      extra={extraBtn}
    >
      <div style={{ overflow: "hidden", marginTop: 8 }}>
        {statisticData.map((item, index) => (
          <div
            key={item.key}
            style={{
              paddingLeft: 24,
              marginBottom: 24,
              width: 195,
              borderLeft: index ? "1px solid #E5E7ED" : "none",
              float: "left",
            }}
          >
            <Statistic
              title={<span style={{ position: "relative" }}>{item.label}</span>}
              value={item.value}
              valueStyle={ValueStyle}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

function mapStateToProps({ dataCenter, loading }: ConnectState) {
  return {
    statistics: dataCenter.statistics,
    loading: loading.effects["dataCenter/getStatistics"],
  };
}

export default connect(mapStateToProps)(DataStatistics);
