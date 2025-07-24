import AceEditor from "react-ace";
import { useIntl } from "@umijs/max";
import "ace-builds/src-noconflict/mode-javascript";

type Props = {
  jsCode: string;
  onJsCodeChange: (val: string) => void;
  theme?: string;
};

function ContentScriptEditor({
  jsCode,
  onJsCodeChange,
  theme = "tomorrow",
}: Props) {
  const intl = useIntl();
  const { formatMessage } = intl;
  return (
    <div style={{ margin: "8px 0" }}>
      <h3>JavaScript</h3>
      <AceEditor
        width="100%"
        fontSize={14}
        mode="javascript"
        theme={theme}
        name={formatMessage({ id: "job.content.script.template_editor" })}
        editorProps={{ $blockScrolling: true }}
        value={jsCode}
        onChange={onJsCodeChange}
      />
    </div>
  );
}

export default ContentScriptEditor;
