import React, { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { useIntl } from "@umijs/max";
import { Button, Col, Popover, Row } from "antd";

import { COLORS } from "@/utils/utils";
import styles from "@/pages/job/job-detail/Monitor/components/CycleDetail.less";
import IssueTypePercent from "@/pages/project/workflow/WorkflowDetail/components/IssueTypePercent";

type Props = {
  issues: { name: string; value: number }[];
  total: number;
};

const QAIssueTypeChart: React.FC<Props> = ({ issues, total }) => {
  const { formatMessage } = useIntl();

  const [allIssueTypeVisible, setAllIssueTypeVisible] = useState(false);

  const getAllLabels = () => (
    <div style={{ maxWidth: 500 }}>
      {issues.map((issue, dataIndex) => (
        <IssueTypePercent
          key={issue.name}
          issue={issues[dataIndex]}
          issueIndex={dataIndex}
          totalNum={total}
        />
      ))}
    </div>
  );

  const getLabel = (dataIndex: number) => {
    if (dataIndex >= issues.length || dataIndex >= 10) {
      return null;
    }

    if (dataIndex === 9 && issues.length > 10) {
      return (
        <Popover
          placement="topRight"
          content={getAllLabels()}
          trigger="click"
          visible={allIssueTypeVisible}
          onVisibleChange={() => setAllIssueTypeVisible(!allIssueTypeVisible)}
        >
          <Button type="link" className={styles["view-all"]}>
            {formatMessage({ id: "job.monitor.question.view-all" })}
          </Button>
        </Popover>
      );
    }

    return (
      <IssueTypePercent
        key={dataIndex}
        issueIndex={dataIndex}
        issue={issues[dataIndex]}
        totalNum={total}
      />
    );
  };

  const getIssueLabels = () => {
    const { length } = issues;
    const columns = Math.min(Math.ceil(length / 5), 2);
    const arr = [];
    const span = Math.floor(24 / columns);

    for (let i = 0; i < columns; i += 1) {
      arr.push(i);
    }

    return arr.map((col, dataIndex) => (
      <Col key={col} span={span}>
        {[0, 1, 2, 3, 4].map((item) => getLabel(dataIndex * 5 + item))}
      </Col>
    ));
  };

  return (
    <div className={styles["question-detail"]}>
      <h3 className={styles["cycle-title"]}>
        {formatMessage({ id: "job.monitor.qa-question-distributed" })}
      </h3>
      <div>
        <div className={styles["bar-chart"]}>
          <PieChart width={150} height={150}>
            <Pie
              data={issues}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={72}
            >
              {issues.map((issue, idx) => (
                <Cell
                  key={`cell-${issue.name}`}
                  fill={COLORS[idx % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className={styles["question-list"]}>
          <Row gutter={8}>{getIssueLabels()}</Row>
        </div>
      </div>
    </div>
  );
};

export default QAIssueTypeChart;
