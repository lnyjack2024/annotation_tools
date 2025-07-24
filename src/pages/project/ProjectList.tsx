import { useEffect, useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Dropdown,
  List,
  Menu,
  Modal,
  Typography,
  Row,
  Col,
  message,
} from "antd";
import type { Dispatch } from "redux";
import { history as router, FormattedMessage, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import type { ConnectState } from "@/models/connect";
import type { Project } from "@/types/project";
import { ProjectAccessLevel } from "@/types/project";
import ProjectListFilter from "@/pages/project/components/ProjectListFilter";
import { mapStatusToErrorMessage, queryToSearch } from "@/utils/utils";
import ProjectFormModal from "@/pages/project/components/ProjectFormModal";

import globalStyles from "@/global.less";
import styles from "./ProjectList.less";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

type ProjectListProps = {
  dispatch: Dispatch;
  projects: Project[];
  loading: boolean;
  submitting: boolean;
  isAdmin: boolean;
  loadingAccess: boolean;
};

const { Paragraph } = Typography;

function ProjectList({
  projects,
  loading,
  dispatch,
  submitting,
  isAdmin,
  loadingAccess,
}: ProjectListProps) {
  const { formatMessage } = useIntl();

  const location = useLocationWithQuery();
  const { query: locationQuery, pathname } = location;
  const [query, setQuery] = useState<{
    search?: string;
    projectDisplayId?: string;
    customerCode?: string;
  }>({
    ...locationQuery,
  });
  const [creationModalVisible, setCreationModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentProject, setCurrentProject] = useState<Project>();

  useEffect(() => {
    if (!loading) {
      router.replace({
        pathname,
        search: queryToSearch(query),
      });
    }

    return () => {
      dispatch({ type: "project/resetProjects" });
    };
  }, [query]);

  useEffect(() => {
    setErrorMessage("");
  }, [creationModalVisible]);

  const renderListItem = (project: Project) => {
    const openJobList = () => {
      router.push({
        pathname: `/projects/${project.id}/data-center`,
      });
      dispatch({ type: "project/saveCurrentProject", payload: project });
    };

    const menu = (projectId: string, projectName?: string) => (
      <Menu>
        <Menu.Item
          key="update"
          onClick={() => {
            dispatch({
              type: "projectAccess/getProjectAccess",
              payload: projectId,
            });
            setCurrentProject(project);
            setCreationModalVisible(true);
          }}
        >
          <EditOutlined />
          {formatMessage({ id: "project-list.update" })}
        </Menu.Item>
        <Menu.Item
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: `${formatMessage({
                id: "project-create.form.project-name",
              })}： ${projectName}`,
              content: formatMessage({ id: "project-list.delete-msg" }),
              okText: formatMessage({ id: "project-list.delete.ok" }),
              cancelText: formatMessage({ id: "project-list.delete.cancel" }),
              onOk: () => {
                dispatch({ type: "project/deleteProject", payload: projectId });
              },
            });
          }}
        >
          <DeleteOutlined />
          {formatMessage({ id: "project-list.delete" })}
        </Menu.Item>
      </Menu>
    );

    return (
      <List.Item key={project.name}>
        <Card
          bordered={false}
          className={`${globalStyles["with-shadow"]} ${styles.projectCard}`}
          actions={[
            <Button
              style={{ width: "100%" }}
              key="open"
              size="small"
              type="link"
              className="color-grey-9"
              onClick={openJobList}
            >
              <FormattedMessage id="common.open" />
            </Button>,
            <Button
              style={{ width: "100%" }}
              size="small"
              type="link"
              className="color-grey-9"
              onClick={(e) => {
                e.preventDefault();
                router.push({
                  pathname: "/project-access",
                  search: queryToSearch({
                    projectId: project.id,
                  }),
                });
              }}
            >
              {formatMessage({ id: "project-list.card.access" })}
            </Button>,
          ]}
        >
          <Card.Meta
            style={{ height: 228 }}
            title={<span style={{ color: "#3e5270" }}>{project.name}</span>}
            description={
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <p className={styles.title}>
                    {formatMessage({ id: "projectId" })}：
                  </p>
                  <p
                    className={styles.content}
                    title={project.projectDisplayId}
                  >
                    {project.projectDisplayId || "N/A"}
                  </p>
                </Col>
                <Col span={24}>
                  <p className={styles.title}>
                    {formatMessage({
                      id: "project-create.form.project-description",
                    })}
                    ：
                  </p>
                  <Paragraph
                    style={{ height: 48, color: "#42526e" }}
                    ellipsis={{ rows: 2 }}
                    title={project.description}
                  >
                    {project.description || "N/A"}
                  </Paragraph>
                </Col>
              </Row>
            }
          />
          <Dropdown
            placement="bottomRight"
            trigger={["hover"]}
            overlay={menu(project.id, project.name)}
          >
            <MoreOutlined
              className={styles.extra}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                cursor: "pointer",
              }}
            />
          </Dropdown>
        </Card>
      </List.Item>
    );
  };

  const headerAction = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => {
        setCreationModalVisible(true);
        setCurrentProject(null);
      }}
    >
      {formatMessage({ id: "project-list.card.new" })}
    </Button>
  );

  const closeModal = () => {
    setCurrentProject(null);
    setCreationModalVisible(false);
  };

  const handleSubmit = (values: Project) => {
    Object.assign(values, { name: values.name.trim() });
    setErrorMessage(null);
    dispatch({
      type: currentProject ? "project/updateProject" : "project/createProject",
      payload: {
        project: currentProject
          ? {
              ...currentProject,
              ...values,
            }
          : values,
        onSuccess: () => {
          closeModal();
          router.replace({
            pathname,
            search: queryToSearch(query),
          });
          message.success(
            formatMessage({ id: "common.message.success.operation" })
          );
        },
        onError: (resp: any) => {
          setErrorMessage(mapStatusToErrorMessage(resp));
        },
      },
    });
  };

  return (
    <HeaderContentWrapperComponent
      title={formatMessage({ id: "menu.project-v3" })}
      actions={headerAction}
    >
      <div style={{ marginBottom: 10 }}>
        <ProjectListFilter
          initialValue={query}
          onSearch={(filter) => {
            setQuery({
              ...query,
              ...filter,
            });
          }}
          onReset={() => {
            setQuery({});
          }}
        />
      </div>
      <List
        loading={loading}
        rowKey="id"
        grid={{ gutter: 16, xxl: 4, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
        dataSource={projects}
        renderItem={renderListItem}
      />
      <ProjectFormModal
        visible={creationModalVisible}
        onCancel={closeModal}
        submitting={submitting}
        handleSubmit={handleSubmit}
        errorMessage={errorMessage}
        isAdmin={isAdmin}
        loadingAccess={loadingAccess}
        project={currentProject}
      />
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ project, loading, projectAccess }: ConnectState) {
  return {
    projects: project.projects,
    loading: loading.effects["project/getProjects"],
    submitting:
      loading.effects["project/createProject"] ||
      loading.effects["project/updateProject"],
    isAdmin: projectAccess.projectAccess === ProjectAccessLevel.ADMIN,
    loadingAccess: loading.effects["projectAccess/getProjectAccess"] || false,
  };
}

export default connect(mapStateToProps)(ProjectList);
