import { Button } from "antd";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { Dispatch } from "redux";
import { pathToRegexp } from "path-to-regexp";

import DataStatistics from "@/pages/project/data-center/components/DataStatistics";
import DataList from "@/pages/project/data-center/components/DataList";
import DataMgmtModal from "@/pages/project/data-center/components/data-mgmt/DataMgmtModal";
import type { ConnectState } from "@/models/connect";
import type { Project } from "@/types/project";
import { DataCenterModalVisible } from "@/pages/project/models/dataCenter";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

function ProjectDataCenter({
  project,
  dispatch,
  modalVisible,
  isReadonly,
}: {
  project: Project;
  dispatch: Dispatch;
  modalVisible: DataCenterModalVisible;
  isReadonly: boolean;
}) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();

  const [, projectId] =
    pathToRegexp("/projects/:projectId/:tabName/:type?").exec(
      location.pathname
    ) || [];
  const { projectDisplayId } = project || {};
  const { dataMgmtVisible, assignModalVisible } = modalVisible;

  return (
    <>
      <DataStatistics
        projectId={projectId}
        extraBtn={
          <Button
            type="primary"
            onClick={() =>
              dispatch({
                type: "dataCenter/updateVisible",
                payload: { dataMgmtVisible: true },
              })
            }
          >
            {formatMessage({
              id: "project.detail.data-center.origin-data-management",
            })}
          </Button>
        }
        dataMgmtVisible={dataMgmtVisible || assignModalVisible}
      />
      <DataList projectId={projectId} projectDisplayId={projectDisplayId} />
      <DataMgmtModal
        visible={dataMgmtVisible}
        readonly={isReadonly}
        onCancel={() =>
          dispatch({
            type: "dataCenter/updateVisible",
            payload: { dataMgmtVisible: false },
          })
        }
        onSearchDataBatch={(batchNum) =>
          dispatch({
            type: "dataCenter/updateFilters",
            payload: {
              batchNumList: [batchNum],
            },
          })
        }
        projectId={projectId}
      />
    </>
  );
}

function mapStateToProps({ project, projectAccess, dataCenter }: ConnectState) {
  return {
    project: project.currentProject,
    modalVisible: dataCenter.modalVisible,
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(ProjectDataCenter);
