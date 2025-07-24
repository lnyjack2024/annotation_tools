import { useContext, useState } from "react";
import { useIntl } from "umi";
import { Button, Modal, message } from "antd";
import { EyeOutlined, SaveOutlined } from "@ant-design/icons";
import PreviewRecordIdSelectionModal from "@/pages/project/template-center/components/PreviewRecordIdSelectionModal";

import {
  AppContext,
  MenuItem,
} from "@/pages/project/template-center/EmbeddedTemplateCreation";
import { base64Encode } from "@/utils/string-util";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { downloadFile, openTemplatePreviewPageV3 } from "@/utils";
import { ProjectTemplate } from "@/types/v3";
import { ImportError } from "../JobTemplateEditor/tool-config/templates/types";

interface Props {
  updateCurrentTabValues: () => Promise<any> | undefined;
  handelSave: () => void;
  menu: MenuItem;
}
const ToolBar = ({ updateCurrentTabValues, handelSave, menu }: Props) => {
  const { formatMessage } = useIntl();
  const [needPreview, setNeedPreview] = useState<boolean>(false);
  const { template, templateInfo, dispatch } = useContext(AppContext);
  const { query } = useLocationWithQuery();

  const exportHandler = () => {
    if (template) {
      const {
        id,
        type,
        attributes,
        ontology = "[]",
        questionType,
      } = template.format();
      const data = {
        type,
        attributes: JSON.parse(attributes),
        ontology: JSON.parse(ontology),
        questionType: JSON.parse(questionType),
      };
      const url = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data)
      )}`;
      downloadFile({ url, fileName: `config-attributes${id}.json` });
    }
  };
  const handleExport = () => {
    if (menu === "CONFIG" && updateCurrentTabValues) {
      updateCurrentTabValues()
        ?.then(() => exportHandler())
        .catch((err) => {
          console.log(err);
        });
    } else {
      exportHandler();
    }
  };

  const importHandler = () => {
    if (template) {
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
              // parse error
            }

            if (result) {
              const { success, error, errorInfo } = template.import(result);
              if (success) {
                dispatch?.({ type: "init", payload: template.parsed() });
                message.success(
                  formatMessage({
                    id: "template.configuration.ontology.import.success",
                  })
                );
              } else {
                let content = null;
                if (errorInfo) {
                  content = errorInfo.map(
                    ({ path, invalidNames = [], duplicatedNames = [] }) => (
                      <div key={path}>
                        <span style={{ fontWeight: "bold" }}>{path}</span>
                        {invalidNames.length > 0 && (
                          <span>
                            {`${formatMessage({
                              id: "template.configuration.ontology.import.invalid-names",
                            })}: ${invalidNames.toString()}`}
                          </span>
                        )}
                        {duplicatedNames.length > 0 && (
                          <span>
                            {`${formatMessage({
                              id: "template.configuration.ontology.import.duplicated-names",
                            })}: ${duplicatedNames.toString()}`}
                          </span>
                        )}
                        {invalidNames.length === 0 &&
                          duplicatedNames.length === 0 && (
                            <span>
                              {formatMessage({
                                id: "template.configuration.ontology.import.invalid-name",
                              })}
                            </span>
                          )}
                      </div>
                    )
                  );
                } else if (error === ImportError.TYPE_NOT_MATCH) {
                  content = formatMessage({
                    id: "template.configuration.ontology.import.not-match",
                  });
                }
                Modal.error({
                  title: formatMessage({
                    id: "template.configuration.ontology.import.invalid",
                  }),
                  content,
                  okText: formatMessage({ id: "COMMON_OK" }),
                  okType: "danger",
                });
              }
            }
          };
          fileReader.readAsText(files[0]);
        } else {
          message.error(
            formatMessage({
              id: "template.configuration.ontology.import.no-file",
            })
          );
        }
      };
      uploader.click();
    }
  };

  const handleImport = () => {
    if (menu === "CONFIG" && updateCurrentTabValues) {
      updateCurrentTabValues()
        ?.then(() => importHandler())
        .catch((err) => {
          console.log(err);
        });
    } else {
      importHandler();
    }
  };

  const previewHandler = () => {
    setNeedPreview(true);
  };

  const saveHandler = () => {
    if (menu === "CONFIG" && updateCurrentTabValues) {
      updateCurrentTabValues()
        ?.then(() => handelSave())
        .catch((err) => {
          console.log(err);
        });
    } else {
      handelSave();
    }
  };

  return (
    <>
      <div className="template-config-toolbar">
        <div className="title">
          {` ${
            query.action === "CREATE"
              ? formatMessage({ id: "COMMON_TEMPLATE_CREATE" })
              : formatMessage({ id: "COMMON_TEMPLATE_EDIT" })
          }: ${templateInfo?.title || ""}`}
        </div>
        <div className="operations">
          <Button
            type="link"
            style={{ paddingRight: 0 }}
            onClick={handleExport}
          >
            {formatMessage({ id: "template.configuration.ontology.export" })}
          </Button>
          <Button
            type="link"
            style={{ paddingRight: 0, marginRight: 12 }}
            onClick={handleImport}
          >
            {formatMessage({ id: "template.configuration.ontology.import" })}
          </Button>
          <Button
            icon={<EyeOutlined />}
            style={{ marginRight: 12 }}
            disabled={query.action === "CREATE"}
            type="primary"
            ghost
            onClick={(e) => {
              e.preventDefault();
              previewHandler();
            }}
          >
            {formatMessage({ id: "COMMON_PREVIEW" })}
          </Button>
          <Button
            icon={<SaveOutlined />}
            type="primary"
            onClick={(e) => {
              e.preventDefault();
              saveHandler();
            }}
          >
            {formatMessage({ id: "COMMON_SAVE" })}
          </Button>
        </div>
      </div>
      {needPreview && templateInfo?.id && (
        <PreviewRecordIdSelectionModal
          template={templateInfo as unknown as ProjectTemplate}
          onCancel={() => {
            setNeedPreview(false);
          }}
          onOk={(source) => {
            openTemplatePreviewPageV3({
              templateId: templateInfo.id!,
              projectId: templateInfo.projectId,
              projectDisplayId: (query.projectDisplayId as string) || undefined,
              source: base64Encode(source),
              scope: "PRIVATE",
            });
            setNeedPreview(false);
          }}
        />
      )}
    </>
  );
};
export default ToolBar;
