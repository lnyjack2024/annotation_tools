import { Button, Space } from "antd";
import { useIntl, history } from "@umijs/max";
import { TurnBackStatus } from "@/pages/project/data-center/components/DataList";
import { openDataPreviewPage, queryToSearch } from "@/utils";
import { ProjectDataDetail } from "@/services/project";
import type { Dispatch } from "redux";
import DataTurnBackModal from "@/pages/project/components/DataTurnBackModal";
import DataReleaseModal from "@/pages/project/data-center/components/data-release/DataReleaseModal";
import DataDeleteModal from "@/pages/project/data-center/components/DataDeleteModal";
import { useState } from "react";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import DataActionProgress from "@/pages/project/data-center/components/DataActionProgress";

type RecordDetailHeaderProps = {
  recordData: ProjectDataDetail;
  projectId: string;
  dispatch: Dispatch;
  onRefresh: () => void;
};

function RecordDetailHeader({
  recordData,
  projectId,
  dispatch,
  onRefresh,
}: RecordDetailHeaderProps) {
  const { formatMessage } = useIntl();
  const defaultModalVisible = {
    turnBackNewModalVisible: false,
    releaseModalVisible: false,
    deleteModalVisible: false,
  };
  const [modalVisible, setModalVisible] = useState(defaultModalVisible);
  const { recordId, state, flowId } = recordData || {};

  const location = useLocationWithQuery();
  const hasMatchedTurnBackStatus =
    recordId && TurnBackStatus.find((item) => item === state);

  const renderActionButton = (
    text: string,
    isActive: boolean,
    action: () => void
  ) => {
    return (
      <Button
        type="link"
        style={{ padding: 0, color: isActive ? "#227A7A" : "#B2B8C2" }}
        disabled={!isActive}
        onClick={action}
      >
        {text}
      </Button>
    );
  };

  const handleTurnback = () => {
    setModalVisible({ ...defaultModalVisible, turnBackNewModalVisible: true });
  };

  const handleDelete = () => {
    setModalVisible({ ...defaultModalVisible, deleteModalVisible: true });
  };

  const goBack = () => {
    history.replace({
      pathname: `/projects/${projectId}/data-center`,
      search: queryToSearch(location.query),
    });
  };

  return (
    <div>
      <Button
        onClick={(e) => {
          e.preventDefault();
          goBack();
        }}
      >
        {formatMessage({ id: "common.back" })}
      </Button>
      <span style={{ marginLeft: 24, fontWeight: "bold", fontSize: 16 }}>
        {formatMessage({ id: "project.detail.record-detail.detail" })}
        {formatMessage(
          { id: "project.detail.record-detail.record.id" },
          { num: recordId }
        )}
      </span>
      <div style={{ float: "right" }}>
        <Space size="middle">
          {renderActionButton(
            formatMessage({
              id: "project.detail.data-center.big-data.turnback",
            }),
            !!hasMatchedTurnBackStatus,
            handleTurnback
          )}
          {renderActionButton(
            formatMessage({ id: "common.delete" }),
            true,
            handleDelete
          )}
          <Button
            type="primary"
            onClick={(e) => {
              e.preventDefault();
              if (!flowId) {
                return;
              }
              openDataPreviewPage(projectId, recordData);
            }}
          >
            {formatMessage({ id: "common.preview" })}
            {formatMessage({
              id: "project.detail.record-detail.latest.submit",
            })}
          </Button>
        </Space>
      </div>
      <DataActionProgress projectId={projectId} onRefresh={onRefresh} />
      <DataTurnBackModal
        visible={modalVisible.turnBackNewModalVisible}
        projectId={projectId}
        recordList={[recordId]}
        onCancel={() => setModalVisible(defaultModalVisible)}
        onRefresh={onRefresh}
      />
      <DataReleaseModal
        visible={modalVisible.releaseModalVisible}
        selectedRecordIds={[recordId]}
        projectId={projectId}
        onRefresh={onRefresh}
        onClose={() => setModalVisible(defaultModalVisible)}
      />
      <DataDeleteModal
        visible={modalVisible.deleteModalVisible}
        recordIds={[recordId]}
        projectId={projectId}
        dispatch={dispatch}
        onClose={() => setModalVisible(defaultModalVisible)}
        onComplete={goBack}
      />
    </div>
  );
}

export default RecordDetailHeader;
