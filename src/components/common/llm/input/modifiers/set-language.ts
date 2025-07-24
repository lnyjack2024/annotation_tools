import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { CODE_BLOCK_TYPE } from '../constants';

export default function setLanguage(editorState: EditorState, startBlockKey: string, language: string) {
  const currentContent = editorState.getCurrentContent();
  const rawData = convertToRaw(currentContent);
  const { blocks } = rawData;

  let start = false;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.type === CODE_BLOCK_TYPE) {
      if (block.key === startBlockKey) {
        start = true;
      }
      if (start) {
        block.data = { ...block.data, language };
      }
    } else if (start) {
      start = false;
      break;
    }
  }

  return EditorState.push(editorState, convertFromRaw(rawData), 'change-block-data');
}
