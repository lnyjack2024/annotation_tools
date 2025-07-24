import type { MouseEvent } from "react";
import { useState } from "react";
import { Button, Form } from "antd";
import { useIntl } from "@umijs/max";

import { EditorMode } from "@/types/template";
import ContentCodeEditor from "./ContentCodeEditor";
import ContentCSSEditor from "./ContentCSSEditor";
import ContentScriptEditor from "./ContentScriptEditor";

type Props = {
  editorMode: EditorMode;
  content: string;
  jsCode: string;
  cssCode: string;
  sourceFileHeaders: string[];
  error?: string;
  onEditorModeChange?: (event: MouseEvent, mode: EditorMode) => void;
  onContentChange?: (val: string) => void;
  onJsCodeChange?: (val: string) => void;
  onCssCodeChange?: (val: string) => void;
};

function TemplateContent({
  onEditorModeChange,
  editorMode,
  content,
  onContentChange,
  jsCode,
  cssCode,
  onJsCodeChange,
  onCssCodeChange,
  sourceFileHeaders,
  error,
}: Props) {
  const { formatMessage } = useIntl();
  const [extraEditorsVisible, setExtraEditorsVisible] =
    useState<boolean>(false);
  const [theme, setTheme] = useState("tomorrow");

  return (
    <>
      {editorMode === EditorMode.GRAPH && (
        <>
          <h2>Content</h2>
          <Button
            type="link"
            onClick={(e) => onEditorModeChange(e, EditorMode.CODE)}
          >
            Switch to Code Editor
          </Button>
        </>
      )}
      {editorMode === EditorMode.CODE && (
        <>
          <Form.Item
            {...(error && {
              validateStatus: "error",
              help: error,
            })}
          >
            <ContentCodeEditor
              theme={theme}
              content={content}
              onContentChange={onContentChange}
              sourceFileHeaders={sourceFileHeaders}
              onThemeChange={setTheme}
            />
          </Form.Item>
          <Button
            type="link"
            onClick={(e) => onEditorModeChange(e, EditorMode.GRAPH)}
            style={{ display: "none" }}
          >
            Switch to Graphical Editor
          </Button>
          <Button
            type="link"
            style={{ float: "right", padding: 0 }}
            onClick={(e) => {
              e.preventDefault();
              setExtraEditorsVisible(!extraEditorsVisible);
            }}
          >
            {formatMessage({
              id: extraEditorsVisible
                ? "labeling-job-create.wizard.configuration.code-editor.hide-css-js-editor"
                : "labeling-job-create.wizard.configuration.code-editor.show-css-js-editor",
            })}
          </Button>
          <div style={{ clear: "both" }} />
          {extraEditorsVisible && (
            <>
              <ContentCSSEditor
                theme={theme}
                css={cssCode}
                onCssChange={onCssCodeChange}
              />
              <ContentScriptEditor
                theme={theme}
                jsCode={jsCode}
                onJsCodeChange={onJsCodeChange}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

export default TemplateContent;
