import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ContentBlock, EditorCommand, EditorState, Entity, getDefaultKeyBinding } from 'draft-js';
import Editor from '@draft-js-plugins/editor';
import createImagePlugin from '@draft-js-plugins/image';
import cx from 'classnames';
import { Check, Close, Fullscreen, FullscreenExit } from '../../icons';
import prismDecorator from './decorators/prism-decorator';
import backspaceCommandHandler from './command-handlers/backspace';
import tabCommandHandler from './command-handlers/tab';
import splitBlockCallback from './callbacks/split-block-callback';
import insertFragmentCallback from './callbacks/insert-fragment-callback';
import { contentStateToContent, contentToContentState } from './utils';
import { TAB_COMMAND, TAB_SHIFT_COMMAND } from './constants';
import { Content } from '../types';

// styles
import 'draft-js/dist/Draft.css';
import 'prismjs/themes/prism.css';

const imagePlugin = createImagePlugin();

interface InputProps {
  defaultValue?: Content;
  onSubmit: (value: Content) => void;
  onCancel: () => void;
  onError: (msg?: string) => void;
  renderTypeSwitch?: () => React.ReactElement;
}

export interface InputHandle {
  setValue: (value?: Content) => void;
  getCurrentValue: () => Content;
}

const Input = forwardRef<InputHandle, InputProps>(({
  defaultValue,
  onSubmit,
  onCancel,
  onError,
  renderTypeSwitch,
}, ref) => {
  const editor = useRef<Editor>(null);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // NOTICE: use settimeout to wait for plugin decorators setup
  const initEditor = (v?: Content) => setTimeout(() => {
    setEditorState(
      v && v.length > 0
        ? EditorState.createWithContent(contentToContentState(v))
        : EditorState.createEmpty()
    );
    editor.current?.focus();
  }, 0);

  useEffect(() => {
    initEditor(defaultValue);
  }, [defaultValue]);

  const [screenfull, setScreenfull] = useState(false);
  const [addFormula, setAddFormula] = useState(false);
  const [editingFormulaBlock, setEditingFormulaBlock] = useState<ContentBlock | null>(null);

  useImperativeHandle(ref, () => ({
    setValue: initEditor,
    getCurrentValue: () => contentStateToContent(editorState.getCurrentContent()),
  }));

  const submit = () => {
    const content = contentStateToContent(editorState.getCurrentContent());
    const last = content[content.length - 1];
    if (last?.content === '') {
      // remove last empty line
      content.pop();
    }
    if (content.length > 0) {
      onSubmit(content);
      setScreenfull(false);
    } else {
      // empty content
      onError();
      editor.current?.focus();
    }
  };

  const onEditorStateChange = (updatedEditorState: EditorState) => {
    const changeType = updatedEditorState.getLastChangeType();

    switch (changeType) {
      case 'split-block':
        // enter
        setEditorState(splitBlockCallback(updatedEditorState));
        break;
      case 'insert-fragment':
        // paste
        setEditorState(insertFragmentCallback(updatedEditorState, editorState));
        break;
      default:
        setEditorState(updatedEditorState);
    }
  };

  const handleKeyCommand = (command: EditorCommand) => {
    switch (command) {
      case 'backspace':
      case 'backspace-to-start-of-line':
        return backspaceCommandHandler(editorState, setEditorState);
      case TAB_COMMAND:
      case TAB_SHIFT_COMMAND: {
        return tabCommandHandler(editorState, setEditorState, {
          shift: command === TAB_SHIFT_COMMAND,
        });
      }
      default:
    }
    return 'not-handled';
  };

  const keyBindingFn = useCallback((e) => {
    if (e.key === 'Tab') {
      return e.shiftKey ? TAB_SHIFT_COMMAND : TAB_COMMAND;
    }
    return getDefaultKeyBinding(e);
  }, []);

  return (
    <div
      className={cx('llm-input-container', {
        'screen-full': screenfull,
      })}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="llm-input-tools">
        <div>
          <div
            className="llm-input-tools-btn"
            onClick={() => setScreenfull(!screenfull)}
          >
            {screenfull ? <FullscreenExit /> : <Fullscreen />}
          </div>
          {renderTypeSwitch && (
            <>
              <div className="divider" />
              {renderTypeSwitch()}
            </>
          )}
        </div>
        <div>
          <div
            className="llm-input-tools-btn"
            onClick={onCancel}
          >
            <Close />
          </div>
          <div
            className="llm-input-tools-btn"
            onClick={submit}
          >
            <Check />
          </div>
        </div>
      </div>
      <div className="llm-input">
        <Editor
          ref={editor}
          stripPastedStyles
          plugins={[imagePlugin]}
          decorators={[prismDecorator]}
          editorState={editorState}
          onChange={onEditorStateChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={keyBindingFn}
        />
      </div>

    </div>
  );
});

export default Input;
