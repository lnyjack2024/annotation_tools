import React from "react";
import { Breadcrumb } from "antd";
import { history, useIntl } from "@umijs/max";

type Props = {
  projectId: string;
  displayId: string;
};
const ProjectDetailBreadcrumb: React.FC<Props> = ({ displayId, projectId }) => {
  const { formatMessage } = useIntl();

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
      <Breadcrumb.Item>{`${formatMessage({
        id: "project-details",
      })} [${displayId}]`}</Breadcrumb.Item>
    </Breadcrumb>
  );
};

export default ProjectDetailBreadcrumb;
