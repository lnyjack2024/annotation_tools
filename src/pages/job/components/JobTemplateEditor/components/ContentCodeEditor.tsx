import { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-html';

import { parseTemplate } from '@/utils/templateParser';
import HtmlReference from './HtmlReference';
import InsertDataDropDown from './InsertDataDropdown';
import EditorThemeSwitch from '@/pages/job/components/JobTemplateEditor/components/EditorThemeSwitch';

import styles from './ContentCodeEditor.less';

type Props = {
  content: string;
  onContentChange?: (val: string) => void;
  sourceFileHeaders?: string[];
  theme?: string;
  onThemeChange?: (theme: string) => void;
};

function ContentCodeEditor({
  content,
  onContentChange,
  sourceFileHeaders,
  theme = 'tomorrow',
  onThemeChange,
}: Props) {
  const [editorError, setEditorError] = useState([]);
  const [editorCursorPosition, setEditorCursorPosition] = useState<any>();
  const [editorSelection, setEditorSelection] = useState<any>();

  const handleTextChange = async (newText: string) => {
    onContentChange(newText);

    try {
      await parseTemplate(newText);
      setEditorError([]);
    } catch (error) {
      const [msg, line, column, details] = error.message.split('\n');
      const row = +line.split(':')[1];
      const col = +column.split(':')[1];

      setEditorError([
        {
          text: `${msg} - ${details}`,
          row,
          columns: col,
          type: 'error',
        },
      ]);
    }
  };
  const htmlReferenceSelect = (value: any) => {
    const val = `${content}\n${value}`;
    onContentChange(val);
  };

  const cursorChange = (selection: any) => {
    const pos = selection.getCursor();
    setEditorCursorPosition(pos);
    setEditorSelection(selection);
  };

  const insertDataDropdownSelect = (val: string) => {
    if (editorSelection?.session) {
      editorSelection?.session.insert(editorCursorPosition, `{{${val}}}`);
    }
  };

  return (
    <>
      <div className={styles['code-editor-title']}>
        <EditorThemeSwitch onThemeChange={onThemeChange} />
        <HtmlReference itemSelect={htmlReferenceSelect} />
        {sourceFileHeaders.length > 0 && (
          <InsertDataDropDown
            sourceFileHeaders={sourceFileHeaders}
            itemSelect={insertDataDropdownSelect}
          />
        )}
      </div>
      <AceEditor
        width="100%"
        fontSize={14}
        mode="html"
        theme={theme}
        name="template-html-editor"
        editorProps={{ $blockScrolling: true }}
        value={content}
        onChange={handleTextChange}
        onCursorChange={cursorChange}
        annotations={editorError}
      />
    </>
  );
}

export default ContentCodeEditor;
