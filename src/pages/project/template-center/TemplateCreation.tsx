import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, message } from "antd";
import { pathToRegexp } from "path-to-regexp";
import { history, useIntl } from "umi";

import Step1 from "@/pages/project/template-center/components/Step1";
import Step2 from "@/pages/project/template-center/components/Step2";
import useTemplateV2 from "@/hooks/useTemplateV2";
import {
  ProjectTemplate,
  ProjectTemplate as ProjectTemplateTool,
} from "@/pages/job/components/JobTemplateEditor/tool-config/templates/types";

import {
  createProjectTemplate,
  updateProjectTemplate,
} from "@/services/template-v3";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage, queryToSearch } from "@/utils/utils";
import type { BaseResp } from "@/types/common";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { TemplateType } from "@/types/template";
import EmbeddedTemplateCreation from "./EmbeddedTemplateCreation";
import { TemplateScope } from "@/types";

const newVersion = [
  TemplateType.LLM_CONVERSATION,
  TemplateType.LLM_QUESTION_ANSWER,
];

enum EditStep {
  BasicInfoStep = "step1",
  ConfigStep = "step2",
}

const TemplateCreation: React.FC = () => {
  const { formatMessage } = useIntl();
  const {
    query: { templateId, action },
    pathname,
  } = useLocationWithQuery();
  const [, projectId] =
    pathToRegexp("/projects/:projectId/template-center/edit").exec(pathname) ||
    [];
  const [activateStep, setActivateStep] = useState<EditStep>(
    EditStep.BasicInfoStep
  );
  // @ts-ignore
  const [templateInfo, dispatch, loading] = useTemplateV2({
    templateId: templateId as string,
  });

  const ontologyEditorRef = useRef(null);
  const issueTypeEditorRef = useRef([]);
  const templateType = useMemo(() => {
    return templateInfo.type;
  }, [templateInfo]);
  useEffect(() => {
    if (templateInfo.questionType) {
      issueTypeEditorRef.current = JSON.parse(templateInfo.questionType);
    }
  }, [templateInfo.questionType]);

  const upsertTemplate = (): Promise<BaseResp<any>> => {
    return new Promise((resolve, reject) => {
      try {
        const ontology = ontologyEditorRef.current?.getData() || "";
        if (action === "UPDATE") {
          updateProjectTemplate({
            ...templateInfo,
            ontology: JSON.stringify(ontology),
            questionType: JSON.stringify(issueTypeEditorRef.current || []),
          })
            .then(resolve)
            .catch(reject);
        } else {
          createProjectTemplate(
            {
              ...templateInfo,
              id: null,
              ontology: JSON.stringify(ontology),
              questionType: JSON.stringify(issueTypeEditorRef.current || []),
            },
            projectId
          )
            .then((resp) => {
              if (resp.status === HttpStatus.OK) {
                history.replace({
                  pathname,
                  search: queryToSearch({
                    action: "UPDATE",
                    templateId: resp.data.id,
                  }),
                });

                resolve(resp);
              } else {
                message.error(resp.message);
              }
            })
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const upsertTemplateForEmbedded = (
    data: ProjectTemplate
  ): Promise<BaseResp<ProjectTemplate>> => {
    return new Promise((resolve, reject) => {
      try {
        if (action === "CREATE") {
          delete data.id;
          createProjectTemplate(
            {
              ...data,
              type: data.type as unknown as TemplateType, // Ensure compatibility
              deleted: data.deleted ? 1 : 0,
              scope: "PRIVATE" as TemplateScope, // Ensure scope is of type TemplateScope
            },
            projectId || ""
          )
            .then((resp) => {
              if (resp.status === HttpStatus.OK) {
                history.replace({
                  pathname,
                  search: queryToSearch({
                    action: "UPDATE",
                    templateId: resp.data.id,
                  }),
                });

                resolve(resp);
              } else {
                message.error(resp.message);
              }
            })
            .catch(reject);
        } else {
          data.projectId = projectId || "";

          updateProjectTemplate({
            ...data,
          })
            .then(resolve)
            .catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          onClick={(e) => {
            e.preventDefault();
            history.replace({
              pathname: `/projects/${projectId}/template-center`,
            });
          }}
        >
          {formatMessage({ id: "common.back" })}
        </Button>
      </div>
      {newVersion.includes(templateType) ? (
        <EmbeddedTemplateCreation
          templateInfo={templateInfo as unknown as ProjectTemplateTool}
          handleSave={(needClose, data) => {
            upsertTemplateForEmbedded(data as ProjectTemplate)
              .then((resp) => {
                if (resp.status === HttpStatus.OK) {
                  if (needClose) {
                    history.replace(`/projects/${projectId}/template-center`);
                  } else {
                    dispatch({
                      type: "init",
                      payload: resp.data,
                    });
                    message.success(
                      formatMessage({ id: "common.message.success.save" })
                    );
                  }
                } else {
                  message.error(mapStatusToErrorMessage(resp));
                }
              })
              .catch((e) => message.error(e.message));
          }}
        />
      ) : (
        <Card
          title={formatMessage({ id: "labeling-job-wizard.step.template" })}
          loading={loading}
        >
          <Step1
            templateInfo={templateInfo}
            visible={activateStep === EditStep.BasicInfoStep}
            onNext={(values) => {
              dispatch({ type: "setTitle", payload: values.title });
              dispatch({ type: "setInstruction", payload: values.instruction });
              dispatch({ type: "setDataType", payload: values.dataType });
              dispatch({
                type: "setIsSupportedByApp",
                payload: values.isSupportedByApp,
              });
              dispatch({
                type: "setsupportedLowestIOSVersion",
                payload: values.supportedLowestIOSVersion,
              });
              dispatch({
                type: "setSupportedLowestAndroidVersion",
                payload: values.supportedLowestAndroidVersion,
              });
              setActivateStep(EditStep.ConfigStep);
            }}
          />
          <Step2
            templateInfo={templateInfo}
            dispatch={dispatch}
            ontologyEditorRef={ontologyEditorRef}
            issueTypeEditorRef={issueTypeEditorRef}
            visible={activateStep === EditStep.ConfigStep}
            onPre={() => setActivateStep(EditStep.BasicInfoStep)}
            onSave={() =>
              upsertTemplate()
                .then((resp) => {
                  message.success(
                    formatMessage({ id: "common.message.success.save" })
                  );
                  return resp;
                })
                .catch((e) => message.error(e.message))
            }
            onNext={() => {
              upsertTemplate()
                .then((resp) => {
                  if (resp.status === HttpStatus.OK) {
                    history.replace(`/projects/${projectId}/template-center`);
                  } else {
                    message.error(mapStatusToErrorMessage(resp));
                  }
                })
                .catch((e) => message.error(e.message));
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default TemplateCreation;
