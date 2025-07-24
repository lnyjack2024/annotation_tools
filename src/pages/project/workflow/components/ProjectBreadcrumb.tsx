import React from "react";
import { Breadcrumb } from "antd";
import { useIntl, history, useLocation } from "@umijs/max";
import { pathToRegexp } from "path-to-regexp";
import { queryToSearch } from "@/utils";

type Props = {
  projectId: string;
  projectDisplayId: string;
  flowDisplayId: string;
};

const ProjectBreadcrumb: React.FC<Props> = ({
  projectId,
  projectDisplayId,
  flowDisplayId,
}) => {
  const { formatMessage } = useIntl();
  const { pathname } = useLocation();
  const [, flowId] =
    pathToRegexp("/workflows/:flowId/jobs/workload").exec(pathname) || [];

  return (
    <Breadcrumb>
      <Breadcrumb.Item
        onClick={(e) => {
          e.preventDefault();
          history.push("/projects");
        }}
      >
        {formatMessage({ id: "projectList" })}
      </Breadcrumb.Item>
      <Breadcrumb.Item
        onClick={(e) => {
          e.preventDefault();
          history.push({
            pathname: `/projects/${projectId}/workflow`,
            search: queryToSearch({
              projectDisplayId,
            }),
          });
        }}
      >
        {`${formatMessage({ id: "project-details" })} [${projectDisplayId}]`}
      </Breadcrumb.Item>
      <Breadcrumb.Item
        onClick={(e) => {
          e.preventDefault();

          if (!flowId) {
            return;
          }

          history.push({
            pathname: `/workflows/${flowId}/detail`,
            search: queryToSearch({
              projectId,
              projectDisplayId,
            }),
          });
        }}
      >{`${formatMessage({
        id: "flow-detail",
      })} [${flowDisplayId}]`}</Breadcrumb.Item>
      {flowId && (
        <Breadcrumb.Item>
          {formatMessage({
            id: "job.monitor.label.detail",
          })}
        </Breadcrumb.Item>
      )}
    </Breadcrumb>
  );
};

export default ProjectBreadcrumb;
