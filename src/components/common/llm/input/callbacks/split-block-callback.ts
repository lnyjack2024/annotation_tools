import { EditorState, Modifier, RichUtils } from 'draft-js';
import { CODE_BLOCK_TYPE, UNSTYLED_TYPE } from '../constants';

export default function splitBlockCallback(updatedEditorState: EditorState) {
  const currentContent = updatedEditorState.getCurrentContent();
  const selection = updatedEditorState.getSelection();
  const selectionKey = selection.getAnchorKey();
  const currBlock = currentContent.getBlockForKey(selectionKey);
  if (currBlock?.getType() === CODE_BLOCK_TYPE) {
    const lastBlock = currentContent.getBlockBefore(selectionKey);
    if (lastBlock?.getType() === CODE_BLOCK_TYPE) {
      // last block is code block
      if (!currBlock.getText() && !lastBlock.getText()) {
        // curr & last is empty line
        const nextBlock = currentContent.getBlockAfter(selectionKey);
        const preLastBlock = currentContent.getBlockBefore(lastBlock.getKey());
        if (nextBlock?.getType() !== CODE_BLOCK_TYPE
          && preLastBlock?.getType() === CODE_BLOCK_TYPE
          && !preLastBlock.getText()) {
          // two empty lines break code block
          return RichUtils.toggleBlockType(updatedEditorState, UNSTYLED_TYPE);
        }
      }
      const language = lastBlock.getData().get('language');
      if (language) {
        const currBlockData = currBlock.getData().merge({ language });
        const newContent = Modifier.setBlockData(currentContent, selection, currBlockData);
        return EditorState.set(updatedEditorState, {
          currentContent: newContent,
        });
      }
    }
  }
  return updatedEditorState;
}
