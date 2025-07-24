import { DraftHandleValue, EditorState, Modifier } from 'draft-js';
import { CODE_BLOCK_TYPE } from '../constants';

export default function backspaceCommandHandler(
  editorState: EditorState,
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>,
): DraftHandleValue {
  const selection = editorState.getSelection();
  const start = selection.getStartKey();
  const end = selection.getEndKey();
  const startOffset = selection.getStartOffset();
  const endOffset = selection.getEndOffset();
  if (start === end && startOffset === endOffset && startOffset === 0) {
    // anchor is at the beginning of the line
    const currentContent = editorState.getCurrentContent();
    const currBlock = currentContent.getBlockForKey(start);
    if (currBlock?.getType() === CODE_BLOCK_TYPE) {
      const lastBlock = currentContent.getBlockBefore(currBlock.getKey());
      if (lastBlock?.getType() === CODE_BLOCK_TYPE) {
        // merge block to last block
        const lastBlockKey = lastBlock.getKey();
        const lastBlockLen = lastBlock.getLength();
        const newContent = Modifier.removeRange(currentContent, selection.merge({
          anchorKey: lastBlockKey,
          anchorOffset: lastBlockLen,
          focusOffset: 0,
        }), 'backward');
        setEditorState(EditorState.push(editorState, newContent, 'remove-range'));
        return 'handled';
      }
    }
  }
  return 'not-handled';
}
