import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-css';

type Props = {
  css: string;
  onCssChange: (val: string) => void;
  theme?: string;
};

function ContentCSSEditor({ css, onCssChange, theme = 'tomorrow' }: Props) {
  return (
    <div style={{ margin: '8px 0' }}>
      <h3>CSS</h3>
      <AceEditor
        width="100%"
        fontSize={14}
        mode="css"
        theme={theme}
        name="template-css-editor"
        editorProps={{ $blockScrolling: true }}
        value={css}
        onChange={onCssChange}
      />
    </div>
  );
}

export default ContentCSSEditor;
