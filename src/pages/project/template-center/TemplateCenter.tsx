import React, { ReactNode, useEffect, useState } from "react";
import { Card, Button, Table, Divider, message, Modal, Popconfirm } from "antd";
import { history, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { pathToRegexp } from "path-to-regexp";
import type { ColumnProps } from "antd/es/table";

import TemplateCreationModal from "@/pages/project/template-center/TemplateCreationModal";
import {
  cloneProjectTemplate,
  getProjectTemplates,
} from "@/services/template-v3";
import type { ProjectTemplate } from "@/types/v3";
import {
  mapStatusToErrorMessage,
  openTemplatePreviewPageV3,
  queryToSearch,
} from "@/utils/utils";
import { HttpStatus } from "@/types/http";
import PreviewRecordIdSelectionModal from "@/pages/project/template-center/components/PreviewRecordIdSelectionModal";
import { base64Encode } from "@/utils/string-util";
import { HistoryOutlined } from "@ant-design/icons";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import TemplateEditHistoryModal from "@/pages/project/template-center/components/TemplateEditHistoryModal";
import { ConnectState } from "@/models/connect";

const TemplateCenter: React.FC<{ isReadonly: boolean }> = ({ isReadonly }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] =
    useState<ProjectTemplate | null>(null);
  const [historyTemplateId, setHistoryTemplateId] = useState<string | null>(
    null
  );
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const location = useLocationWithQuery();
  const { formatMessage } = useIntl();
  const [, projectId] =
    pathToRegexp("/projects/:projectId/template-center").exec(
      location.pathname
    ) || [];

  const fetchTemplates = () => {
    setLoading(true);
    getProjectTemplates(projectId)
      .then((resp) => {
        setTemplates(resp.data);
      })
      .catch((err) => {
        message.error(mapStatusToErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!projectId) {
      return;
    }

    fetchTemplates();
  }, [projectId]);

  const showTemplateEditConfirm = (
    templateId: string,
    runningFlowNum: number | null
  ) => {
    const gotoEditPage = () => {
      history.push({
        pathname: `/projects/${projectId}/template-center/edit`,
        search: queryToSearch({
          templateId,
          scope: "PRIVATE",
          action: "UPDATE",
        }),
      });
    };

    if (runningFlowNum) {
      Modal.confirm({
        title: formatMessage({ id: "job-detail.template.edit-warning-title" }),
        content: formatMessage(
          { id: "job-detail.template.edit-warning-v3" },
          { count: runningFlowNum }
        ),
        onOk: gotoEditPage,
      });
    } else {
      gotoEditPage();
    }
  };

  const columns: ColumnProps<ProjectTemplate>[] = [
    {
      title: formatMessage({ id: "v3.template-name" }),
      dataIndex: "title",
    },
    {
      title: formatMessage({ id: "template.type" }),
      dataIndex: "type",
      render: (t) =>
        t ? formatMessage({ id: `template.type-list.${t}` }) : "",
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.filter.data-type",
      }),
      dataIndex: "dataType",
      render: (t) => (t ? formatMessage({ id: `data.type.${t}` }) : ""),
    },
    {
      title: formatMessage({ id: "running-flow-num" }),
      dataIndex: "runningFlowNum",
      render: (n) => n || 0,
    },
    {
      title: formatMessage({ id: "edit-history" }),
      render: (row) => (
        <HistoryOutlined
          style={{ cursor: "pointer" }}
          onClick={() => {
            setHistoryTemplateId(row.id);
          }}
        />
      ),
    },
    {
      title: formatMessage({ id: "common.operation" }),
      render: (row) => (
        <>
          <Button
            style={{ paddingLeft: 0 }}
            type="link"
            onClick={(e) => {
              e.preventDefault();
              setCurrentTemplate(row);
            }}
          >
            {formatMessage({ id: "common.preview" })}
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title={formatMessage({ id: "template-clone-confirm" })}
            disabled={isReadonly}
            onConfirm={(e) => {
              e.preventDefault();
              cloneProjectTemplate(row.id).then((resp) => {
                if (resp.status === HttpStatus.OK) {
                  fetchTemplates();
                } else {
                  message.error(mapStatusToErrorMessage(resp));
                }
              });
            }}
          >
            <Button
              style={{ paddingLeft: 0 }}
              type="link"
              disabled={isReadonly}
            >
              {formatMessage({ id: "common.clone" })}
            </Button>
          </Popconfirm>
          <Divider type="vertical" />
          <Button
            style={{ paddingLeft: 0 }}
            type="link"
            disabled={isReadonly}
            onClick={(e) => {
              e.preventDefault();
              showTemplateEditConfirm(row.id, row.runningFlowNum);
            }}
          >
            {formatMessage({ id: "common.edit" })}
          </Button>
        </>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            setModalVisible(true);
          }}
          disabled={isReadonly}
        >
          {formatMessage({ id: "template-create" })}
        </Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          className="tableStriped"
          dataSource={templates}
          columns={columns}
          loading={loading}
          pagination={false}
        />
        <TemplateCreationModal
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          projectId={projectId}
        />
      </Card>
      <PreviewRecordIdSelectionModal
        template={currentTemplate}
        onCancel={() => {
          setCurrentTemplate(null);
        }}
        onOk={(source) => {
          openTemplatePreviewPageV3({
            templateId: currentTemplate.id,
            projectId,
            source: base64Encode(source),
            scope: "PRIVATE",
          });
          setCurrentTemplate(null);
        }}
      />
      <TemplateEditHistoryModal
        templateId={historyTemplateId}
        onCancel={() => {
          setHistoryTemplateId(null);
        }}
      />
    </>
  );
};

function mapStateToProps({ projectAccess }: ConnectState) {
  return {
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(TemplateCenter);
