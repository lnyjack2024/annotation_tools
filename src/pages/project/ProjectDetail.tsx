import type { ReactNode } from "react";
import { useEffect } from "react";
import type { Dispatch } from "@umijs/max";
import { Outlet, history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { pathToRegexp } from "path-to-regexp";

import type { ConnectState } from "@/models/connect";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import type { Project } from "@/types/project";
import ProjectDetailBreadcrumb from "@/components/breadcrumbs/ProjectDetailBreadcrumb";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { queryToSearch } from "@/utils";

interface ProjectDetailProp {
  dispatch: Dispatch;
  children: ReactNode;
  currentProject: Project;
  isReadonly: boolean;
}

enum TabMenu {
  DataCenter = "data-center",
  TemplateCenter = "template-center",
  Workflow = "workflow",
}

function ProjectDetail({
  dispatch,
  children,
  currentProject,
  isReadonly,
}: ProjectDetailProp) {
  const { formatMessage } = useIntl();
  const { pathname } = useLocationWithQuery();

  const [, projectId] =
    pathToRegexp(`/projects/:projectId/(.*)`).exec(pathname) || [];

  const projectDisplayId = currentProject?.projectDisplayId;

  const supportTabMenu = [
    TabMenu.DataCenter,
    TabMenu.Workflow,
    TabMenu.TemplateCenter,
  ];

  useEffect(() => {
    dispatch({ type: "projectAccess/getProjectAccess", payload: projectId });
    dispatch({ type: "project/getProject", payload: { projectId } });
  }, []);

  const menuItems = supportTabMenu
    .filter((tabName) => !(tabName === TabMenu.Workforce))
    .map((tabName) => {
      return {
        key: tabName,
        title: formatMessage({ id: `project.detail.${tabName}` }),
        action: () => {
          const targetPath = `/projects/${projectId}/${tabName}`;
          if (pathname !== targetPath) {
            router.replace({
              pathname: targetPath,
              search: queryToSearch({ projectDisplayId }),
            });
          }
        },
      };
    });

  const activeMenu = supportTabMenu.find((tabName) =>
    pathname.includes(tabName)
  );

  const getProjectId = (displayId: string) => {
    if (!displayId) {
      return "";
    }

    return `[${displayId}]`;
  };

  const Title = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>
        {`${formatMessage({ id: "job-list.title" })}${
          currentProject?.name
        } ${getProjectId(projectDisplayId)}${
          isReadonly
            ? formatMessage({ id: "project-access.job-list.title" })
            : ""
        }
        `}
      </span>
    </div>
  );

  return (
    <HeaderContentWrapperComponent
      title={Title}
      backTitle={
        <ProjectDetailBreadcrumb
          projectId={projectId}
          displayId={projectDisplayId}
        />
      }
      onBack={() => {}}
      menuItems={menuItems}
      defaultSelectedKeys={[activeMenu]}
    >
      <Outlet />
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ project, projectAccess }: ConnectState) {
  return {
    currentProject: project.currentProject,
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(ProjectDetail);
