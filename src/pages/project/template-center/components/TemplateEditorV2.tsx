import type { Dispatch, ReactNode } from "react";
import React, { useEffect, useState } from "react";
import { EyeOutlined, SaveOutlined } from "@ant-design/icons";
import { FormattedMessage, useIntl } from "@umijs/max";

import { EditorMode, TemplateType } from "@/types/template";
import { Button, Collapse, message, Tabs } from "antd";
import TemplateContent from "@/pages/job/components/JobTemplateEditor/components/TemplateContent";
import TemplateAttributes from "@/pages/job/components/JobTemplateEditor/components/TemplateAttributes";
import OntologyEditor from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor";
import TextToolConfig from "@/pages/job/components/JobTemplateEditor/tool-config/TextToolConfig";
import LandmarkToolConfig from "@/pages/job/components/JobTemplateEditor/tool-config/LandmarkToolConfig";
import GeneralImageToolConfig from "@/pages/job/components/JobTemplateEditor/tool-config/general-image/GeneralImageToolConfig";
import {
  downloadFile,
  hasOntology,
  openTemplatePreviewPageV3,
  validateOntology,
} from "@/utils/utils";
import type { ProjectTemplate, TemplateScope } from "@/types/v3";
import type { BaseResp } from "@/types/common";
import { HttpStatus } from "@/types/http";
import { base64Encode } from "@/utils/string-util";
import PreviewRecordIdSelectionModal from "@/pages/project/template-center/components/PreviewRecordIdSelectionModal";
import QAProblemTypeEditor from "@/components/QAProblemTypeEditor";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

function renderOntologyEditor(
  editorRef: any,
  ontology: any,
  templateType: TemplateType
): ReactNode {
  switch (templateType) {
    case TemplateType.TRANSCRIPTION:
      return (
        <OntologyEditor
          ref={editorRef}
          type={templateType}
          ontologies={ontology}
        />
      );
    case TemplateType.TEXT:
      return <TextToolConfig ref={editorRef} config={ontology} />;
    case TemplateType.LIDAR:
      return (
        <OntologyEditor
          ref={editorRef}
          type={templateType}
          ontologies={ontology}
          options={{ descriptionType: "richtext", sizeEnabled: true }}
        />
      );
    case TemplateType.LIDAR_SSE:
      return (
        <OntologyEditor
          ref={editorRef}
          type={templateType}
          ontologies={ontology}
          options={{ descriptionType: "richtext" }}
        />
      );
    case TemplateType.LANDMARK:
      return (
        <LandmarkToolConfig
          ref={editorRef}
          type={templateType}
          ontologies={ontology}
        />
      );
    case TemplateType.GENERAL_IMAGE:
      return <GeneralImageToolConfig ref={editorRef} ontologies={ontology} />;
    default:
      return null;
  }
}

type Props = {
  ontologyEditorRef?: any;
  issueTypeEditorRef?: any;
  templateInfo: ProjectTemplate;
  dispatch: Dispatch<any>;
  previewScope: TemplateScope;
  onSave: () => Promise<BaseResp<any>>;
};

const TemplateEditorV2: React.FC<Props> = ({
  templateInfo,
  dispatch,
  ontologyEditorRef,
  issueTypeEditorRef,
  previewScope,
  onSave,
}) => {
  const { formatMessage } = useIntl();
  console.log("templateInfo.type", templateInfo.type);
  const {
    query: { action, projectId },
  } = useLocationWithQuery();
  const [activeTab, setActiveTab] = useState("editor");
  const [currentTemplate, setCurrentTemplate] =
    useState<ProjectTemplate | null>(null);

  useEffect(() => {
    if (templateInfo) {
      setActiveTab(
        templateInfo.type === TemplateType.CUSTOM ? "editor" : "config"
      );
    }
  }, []);

  const getOntologyData = (callback?: (ontology: any) => void) => {
    let ontology = [];
    try {
      if (ontologyEditorRef.current) {
        ontology = ontologyEditorRef.current?.getData();
        if (callback) callback(ontology);
      }
    } catch (error) {
      message.error(error.message);
    }
    return ontology;
  };

  const handleOntologyExport = () => {
    getOntologyData((updatedOntology) => {
      const data = { type: templateInfo.type, ontology: updatedOntology };
      const url = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data)
      )}`;
      downloadFile({ url, fileName: `config-${templateInfo.id}.json` });
    });
  };

  const handleOntologyImport = () => {
    const uploader = document.createElement("input");
    uploader.type = "file";
    uploader.accept = ".json, .txt";
    uploader.onchange = (e: any) => {
      const { files = [] } = e.target;
      if (files.length > 0) {
        const fileReader = new FileReader();
        fileReader.onload = (event: any) => {
          let result;
          try {
            result = JSON.parse(event.target.result);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log(err.message);
            return;
          }

          if (result.type !== templateInfo.type) {
            message.error(
              formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.import.not-match",
              })
            );
            return;
          }
          if (validateOntology(result.type, result.ontology)) {
            dispatch({
              type: "setOntology",
              payload: JSON.stringify(result.ontology),
            });
          } else {
            message.error(
              formatMessage({
                id: "labeling-job-create.wizard.configuration.ontology.import.invalid",
              })
            );
          }
        };
        fileReader.readAsText(files[0]);
      } else {
        message.error(
          formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.import.no-file",
          })
        );
      }
    };
    uploader.click();
  };

  return (
    <div>
      <div style={{ position: "absolute", right: 24, zIndex: 100 }}>
        <Button
          icon={<EyeOutlined />}
          style={{ marginRight: 12 }}
          disabled={action === "CREATE"}
          onClick={(e) => {
            e.preventDefault();
            setCurrentTemplate(templateInfo);
          }}
        >
          {formatMessage({ id: "common.preview" })}
        </Button>
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            onSave().then((resp) => {
              if (resp.status === HttpStatus.OK) {
                dispatch({
                  type: "init",
                  payload: resp.data,
                });
              } else {
                message.error(resp.message);
              }
            });
          }}
        >
          {formatMessage({ id: "common.save" })}
        </Button>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (!hasOntology(templateInfo.type)) {
            setActiveTab(key);
          } else {
            getOntologyData((ontology) => {
              dispatch({
                type: "setOntology",
                payload: JSON.stringify(ontology),
              });
              setActiveTab(key);
            });
          }
        }}
      >
        <Tabs.TabPane
          tab={formatMessage({ id: "job.content.script.template_editor" })}
          key="editor"
        >
          <TemplateContent
            editorMode={EditorMode.CODE}
            content={templateInfo.content}
            onContentChange={(content) => {
              dispatch({ type: "setContent", payload: content });
            }}
            jsCode={templateInfo.js}
            onJsCodeChange={(js) => {
              dispatch({ type: "setJS", payload: js });
            }}
            cssCode={templateInfo.css}
            onCssCodeChange={(css) => {
              dispatch({ type: "setCSS", payload: css });
            }}
            sourceFileHeaders={[]}
            error={""}
          />
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={formatMessage({
            id: "labeling-job-create.wizard.configuration.settings.title",
          })}
          key="config"
        >
          <Collapse defaultActiveKey={["ontology", "property"]}>
            <Collapse.Panel
              header={formatMessage({ id: "ontology-config" })}
              key="ontology"
            >
              <div style={{ textAlign: "right" }}>
                <Button
                  type="link"
                  style={{ paddingRight: 0 }}
                  onClick={handleOntologyExport}
                >
                  <FormattedMessage id="labeling-job-create.wizard.configuration.ontology.export" />
                </Button>
                <Button
                  type="link"
                  style={{ paddingRight: 0 }}
                  onClick={handleOntologyImport}
                >
                  <FormattedMessage id="labeling-job-create.wizard.configuration.ontology.import" />
                </Button>
              </div>
              {renderOntologyEditor(
                ontologyEditorRef,
                templateInfo.ontology
                  ? JSON.parse(templateInfo.ontology)
                  : null,
                templateInfo.type
              )}
            </Collapse.Panel>
            <Collapse.Panel
              header={formatMessage({ id: "property-config" })}
              key="property"
            >
              <TemplateAttributes
                templateType={templateInfo.type}
                templateInfo={templateInfo}
                attributes={templateInfo.attributes}
                onAttributesChange={(attrs) => {
                  getOntologyData((ontology) => {
                    dispatch({
                      type: "setOntology",
                      payload: JSON.stringify(ontology),
                    });
                  });
                  dispatch({ type: "setAttributes", payload: attrs });
                }}
                getOntology={() => ontologyEditorRef.current.getData()}
              />
            </Collapse.Panel>
          </Collapse>
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={formatMessage({ id: "job.qa.problem-type" })}
          key="issueTypes"
        >
          <div style={{ maxWidth: 600 }}>
            <QAProblemTypeEditor
              problemTypes={issueTypeEditorRef.current}
              ref={issueTypeEditorRef}
            />
          </div>
        </Tabs.TabPane>
      </Tabs>
      <PreviewRecordIdSelectionModal
        template={currentTemplate}
        onCancel={() => {
          setCurrentTemplate(null);
        }}
        onOk={(source) => {
          openTemplatePreviewPageV3({
            templateId: currentTemplate.id,
            projectId: projectId as string,
            source: base64Encode(source),
            scope: previewScope,
          });
          setCurrentTemplate(null);
        }}
      />
    </div>
  );
};

export default TemplateEditorV2;
