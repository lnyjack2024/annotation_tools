import { EditorState } from 'draft-js';
import { CODE_BLOCK_TYPE } from '../constants';
import setLanguage from '../modifiers/set-language';

export default function insertFragmentCallback(updatedEditorState: EditorState, editorState: EditorState) {
  const lastContent = editorState.getCurrentContent();
  const lastSelection = editorState.getSelection();
  const lastSelectionKey = lastSelection.getStartKey();
  const lastBlock = lastContent.getBlockForKey(lastSelectionKey);
  if (lastBlock?.getType() === CODE_BLOCK_TYPE) {
    const language = lastBlock.getData().get('language');
    if (language) {
      const selection = updatedEditorState.getSelection();
      const state = setLanguage(updatedEditorState, lastSelectionKey, language);
      return EditorState.forceSelection(state, selection);
    }
  }
  return updatedEditorState;
}
