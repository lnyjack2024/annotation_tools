import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useIntl, getLocale } from "umi";
import { ArrowLeftOutlined } from "@ant-design/icons";
import TemplateContent from "@/pages/job/components/JobTemplateEditor/components/TemplateContent";
import { EditorMode } from "@/types/template";
import BaseTemplate from "@/pages/job/components/JobTemplateEditor/tool-config/templates/Base";
import {
  TemplateAttributes,
  TemplateOntology,
  createTemplate,
  getTabsConfig,
} from "@/pages/job/components/JobTemplateEditor/tool-config/templates";
import {
  ProjectTemplate,
  ProjectTemplateParsed,
} from "@/pages/job/components/JobTemplateEditor/tool-config/templates/types";
import "./EmbeddedTemplateCreation.less";
import ToolBar from "@/pages/job/components/common/ToolBar";
import { TabsBar, TabsBarHandle } from "@/pages/job/components/common/TabsBar";
import { Language } from "@/locales/constants";

export type MenuItem = "EDITOR" | "CONFIG";

interface AppContextProps {
  locale?: Language;
  template?: BaseTemplate<TemplateAttributes, TemplateOntology>;
  templateInfo?: ProjectTemplateParsed;
  dispatch?: React.Dispatch<ActionType>;
}
interface Props {
  handleSave: (needClose: boolean, templateInfo?: ProjectTemplate) => void;
  templateInfo?: ProjectTemplate;
}
export const AppContext = React.createContext<AppContextProps>({});

type ActionType = {
  type:
    | "init"
    | "parsedAttributes"
    | "ontologies"
    | "baseInfo"
    | "setContent"
    | "setJS"
    | "setCSS";
  payload?: any;
};
function reducer(
  state: ProjectTemplateParsed,
  action: ActionType
): ProjectTemplateParsed {
  switch (action.type) {
    case "init":
      return action.payload;
    case "parsedAttributes":
      return {
        ...state,
        parsedAttributes: { ...state.parsedAttributes, ...action.payload },
      };
    case "ontologies":
      return {
        ...state,
        ontology: action.payload,
      };
    case "baseInfo":
      return {
        ...state,
        ...action.payload,
      };
    case "setContent":
      return {
        ...state,
        content: action.payload,
      };
    case "setJS":
      return {
        ...state,
        js: action.payload,
      };
    case "setCSS":
      return {
        ...state,
        css: action.payload,
      };
    default:
      return state;
  }
}
const EmbeddedTemplateCreation: React.FC<Props> = ({
  handleSave,
  templateInfo,
}) => {
  const { formatMessage } = useIntl();
  const [menu, setMenu] = useState<MenuItem>("CONFIG");
  const [state, dispatch] = useReducer(reducer, {} as ProjectTemplateParsed);
  const templateRef =
    useRef<BaseTemplate<TemplateAttributes, TemplateOntology>>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tabsBarRef = useRef<TabsBarHandle>(null);

  const updateTemplate = (templateInfo: ProjectTemplate) => {
    return new Promise((resolve, reject) => {
      if (!templateInfo) {
        reject("template info is null");
        return;
      }
      if (!templateRef.current) {
        templateRef.current = createTemplate(templateInfo);
      } else {
        templateRef.current.update(templateInfo);
      }
      dispatch({ type: "init", payload: templateRef.current!.parsed() });
      setTimeout(() => {
        resolve("success");
      }, 0);
    });
  };

  useEffect(() => {
    if (templateInfo) {
      updateTemplate(templateInfo);
    }
  }, [templateInfo]);
  const updateCurrentTabValue = useCallback(
    () => tabsBarRef.current?.updateCurrentTabValues(),
    [tabsBarRef]
  );

  useEffect(() => {
    if (state && Object.keys(state).length > 0) {
      const { parsedAttributes, ontology, questionType, ...baseInfo } = state;
      if (templateRef.current) {
        templateRef.current.attributes = parsedAttributes;
        templateRef.current.ontology = ontology;
        templateRef.current.questionType = questionType;
        templateRef.current.baseInfo = baseInfo;
      }
    }
  }, [state]);

  const formatTemplateInfo = (): ProjectTemplate | null => {
    const formattedTemplateInfo = templateRef.current?.format();

    return formattedTemplateInfo || null;
  };
  const onFinish = (needClose = true) => {
    setTimeout(() => {
      const newTemplateInfo = formatTemplateInfo();
      if (newTemplateInfo) {
        handleSave(needClose, newTemplateInfo);
      }
    }, 0);
  };

  return (
    <AppContext.Provider
      value={{
        locale: getLocale(),
        template: templateRef.current,
        templateInfo: state,
        dispatch,
      }}
    >
      <div ref={wrapperRef} className="template-config-wrapper">
        {state && (
          <ToolBar
            menu={menu}
            updateCurrentTabValues={updateCurrentTabValue}
            handelSave={() => onFinish(false)}
          />
        )}
        {state && Object.keys(state).length > 0 ? (
          <>
            <div className="template-config-button">
              {menu === "CONFIG" && (
                <div>
                  <span
                    onClick={() => {
                      tabsBarRef.current
                        ?.updateCurrentTabValues()
                        .then(() => {
                          setMenu("EDITOR");
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    }}
                  >
                    {"</>"}
                    {formatMessage({ id: "BACK_TO_EDITOR" })}
                  </span>
                </div>
              )}
              {menu === "EDITOR" && (
                <div>
                  <span onClick={() => setMenu("CONFIG")}>
                    <ArrowLeftOutlined />
                    {formatMessage({ id: "BACK_TO_CONFIG" })}
                  </span>
                </div>
              )}
            </div>
            <div className="template-config">
              {menu === "EDITOR" && (
                <TemplateContent
                  editorMode={EditorMode.CODE}
                  content={state?.content}
                  onContentChange={(content) => {
                    dispatch({ type: "setContent", payload: content });
                  }}
                  jsCode={state?.js}
                  onJsCodeChange={(js) => {
                    dispatch({ type: "setJS", payload: js });
                  }}
                  cssCode={state?.css}
                  onCssCodeChange={(css) => {
                    dispatch({ type: "setCSS", payload: css });
                  }}
                  sourceFileHeaders={[]}
                  error={""}
                />
              )}
              {menu === "CONFIG" && (
                <TabsBar
                  ref={tabsBarRef}
                  tabItemsConfig={getTabsConfig(state.type)}
                  onFinish={onFinish}
                />
              )}
            </div>
          </>
        ) : (
          <div>{formatMessage({ id: "COMMON_TEMPLATE_INFO_LOAD_ERROR" })}</div>
        )}
      </div>
    </AppContext.Provider>
  );
};
export default EmbeddedTemplateCreation;
