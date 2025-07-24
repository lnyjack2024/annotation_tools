import React from "react";
import { history, useIntl } from "@umijs/max";
import styles from "@/pages/project/workflow/components/WorkflowCard.less";
import { ApartmentOutlined, RightOutlined } from "@ant-design/icons";
import TestTag from "@/pages/project/components/TestTag";
import type { Workflow } from "@/types/v3";
import { queryToSearch } from "@/utils";

type Props = {
  workflow: Workflow;
  projectId: string;
  projectDisplayId: string;
};
const WorkflowTitle: React.FC<Props> = ({
  workflow,
  projectId,
  projectDisplayId,
}) => {
  const { formatMessage } = useIntl();
  const { flowName, totalNum } = workflow || {};

  return (
    <div
      className={styles.title}
      onClick={(e) => {
        e.preventDefault();
        history.push({
          pathname: `/workflows/${workflow.id}/detail`,
          search: queryToSearch({
            projectId,
            projectDisplayId,
          }),
        });
      }}
    >
      <div>
        <ApartmentOutlined
          className={styles.text}
          style={{
            marginRight: 20,
          }}
        />
        <span
          className={styles.text}
          style={{
            fontSize: 14,
          }}
        >
          {formatMessage({ id: "project.detail.workflow" })}
        </span>
        {workflow.testFlag && <TestTag style={{ marginLeft: 4 }} />}
        <span
          className={styles["clickable-text"]}
          style={{
            marginLeft: 8,
            color: "#42526e",
            fontWeight: "bold",
          }}
        >
          {flowName}
        </span>
      </div>
      <div>
        <span
          className={styles.text}
          style={{
            fontSize: 14,
          }}
        >
          {formatMessage({ id: "workflow.assigned.num" })}
        </span>
        <span
          className={styles.text}
          style={{
            margin: "0 8px 0 8px",
            color: "#3e5270",
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          {totalNum || 0}
        </span>
        <RightOutlined className={styles.text} />
      </div>
    </div>
  );
};

export default WorkflowTitle;
