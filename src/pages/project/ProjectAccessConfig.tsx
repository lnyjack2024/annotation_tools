import type { MouseEvent } from "react";
import React, { useState } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Popconfirm, Result, Table } from "antd";
import type { Dispatch } from "redux";
import { history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import type { ConnectState } from "@/models/connect";
import type { ProjectUser, TenantPM } from "@/types/project";
import { ProjectAccessLevel } from "@/types/project";
import AccessConfigModal from "@/pages/project/components/AccessConfigModal";
import AdminChangeModal from "@/pages/project/components/AdminChangeModal";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { ColumnProps } from "antd/es/table";

type Props = {
  loading: boolean;
  submitting: boolean;
  projectUsers: ProjectUser[];
  pms: TenantPM[];
  projectAccess: string | null;
  dispatch: Dispatch;
};

const defaultModalVisible = {
  accessVisible: false,
  adminVisible: false,
};

const ProjectAccessConfig: React.FC<Props> = ({
  loading,
  submitting,
  projectUsers,
  pms,
  projectAccess,
  dispatch,
}) => {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const [modalVisible, setModalVisible] = useState(defaultModalVisible);
  const {
    query: { projectId: currentProjectId },
  } = location;

  const handleUserDelete = (
    event: MouseEvent,
    projectId: string,
    userUniqueName: string
  ) => {
    event.preventDefault();
    dispatch({
      type: "projectAccess/deleteProjectUser",
      payload: { projectId, userUniqueName },
    });
  };

  const showAdminModal = (e: MouseEvent) => {
    e.preventDefault();
    setModalVisible({ ...modalVisible, adminVisible: true });
  };

  const columns: ColumnProps<ProjectUser>[] = [
    {
      title: formatMessage({ id: "common.user.nickname" }),
      dataIndex: "userUniqueName",
    },
    {
      title: formatMessage({ id: "project-access.col.status" }),
      dataIndex: "status",
      render: (status: string) => (
        <span>{formatMessage({ id: `access.${status}` })}</span>
      ),
    },
    {
      title: formatMessage({ id: "project-access.col.action" }),
      render: (data: ProjectUser) =>
        data.status !== ProjectAccessLevel.ADMIN ? (
          <Popconfirm
            title={formatMessage({ id: "project-access.delete-confirm" })}
            onConfirm={(e) =>
              handleUserDelete(e, data.projectId, data.userUniqueName)
            }
            okText={formatMessage({ id: "common.yes" })}
            cancelText={formatMessage({ id: "common.no" })}
          >
            <DeleteOutlined className="color-red" />
          </Popconfirm>
        ) : (
          <EditOutlined
            style={{ color: "#227a7a", cursor: "pointer" }}
            onClick={showAdminModal}
          />
        ),
    },
  ];

  const showAccessModal = (e: MouseEvent) => {
    e.preventDefault();
    setModalVisible({ ...modalVisible, accessVisible: true });
  };

  const handleModalOk = (userUniqueName: string, access: string) => {
    dispatch({
      type: "projectAccess/addProjectUser",
      payload: {
        projectId: currentProjectId,
        userUniqueName,
        status: access,
      },
    });
    setModalVisible(defaultModalVisible);
  };

  return (
    <HeaderContentWrapperComponent
      title={formatMessage({ id: "project-access.title" })}
      backTitle={formatMessage({ id: "menu.project" })}
      onBack={() => {
        router.goBack();
      }}
    >
      <Card bordered={false} loading={loading}>
        {projectAccess === ProjectAccessLevel.ADMIN && !loading ? (
          <>
            <div
              style={{
                height: 60,
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button type="primary" onClick={showAccessModal}>
                {formatMessage({ id: "project-access.add" })}
              </Button>
            </div>
            <Table
              rowKey="id"
              dataSource={projectUsers}
              columns={columns}
              loading={submitting}
            />
            <AccessConfigModal
              visible={modalVisible.accessVisible}
              pms={pms}
              onCancel={() => setModalVisible(defaultModalVisible)}
              onOk={handleModalOk}
            />
            <AdminChangeModal
              visible={modalVisible.adminVisible}
              users={pms}
              onCancel={() => setModalVisible(defaultModalVisible)}
              onOk={(name: string) => handleModalOk(name, "ADMIN")}
            />
          </>
        ) : (
          <Result
            status="403"
            subTitle={formatMessage({ id: "project-access.no-access" })}
            extra={
              <Button onClick={() => window.history.back()}>
                {formatMessage({ id: "project-access.back" })}
              </Button>
            }
          />
        )}
      </Card>
    </HeaderContentWrapperComponent>
  );
};

function mapStateToProps({ projectAccess, loading }: ConnectState) {
  return {
    loading:
      loading.effects["projectAccess/initPage"] ||
      loading.effects["projectAccess/getInternalPMs"],
    submitting:
      loading.effects["projectAccess/getProjectUsers"] ||
      loading.effects["projectAccess/deleteProjectUser"] ||
      loading.effects["projectAccess/addProjectUser"],
    projectUsers: projectAccess.projectUsers,
    pms: projectAccess.pms,
    projectAccess: projectAccess.projectAccess,
  };
}

export default connect(mapStateToProps)(ProjectAccessConfig);
