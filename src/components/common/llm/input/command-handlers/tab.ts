import { DraftHandleValue, EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { ATOMIC_TYPE } from '../constants';

export default function tabCommandHandler(
  editorState: EditorState,
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>,
  options?: {
    shift?: boolean;
  }
): DraftHandleValue {
  const selection = editorState.getSelection();
  const start = selection.getStartKey();
  const end = selection.getEndKey();
  const startOffset = selection.getStartOffset();
  const endOffset = selection.getEndOffset();

  const multiLineSelected = start !== end;
  const rangeSelected = multiLineSelected || startOffset !== endOffset;

  const currentContent = editorState.getCurrentContent();
  const rawData = convertToRaw(currentContent);
  const { blocks } = rawData;

  let started = false;
  let newStartOffset;
  let newEndOffset;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.key === start) {
      started = true;
    }
    if (started && block.type !== ATOMIC_TYPE) {
      const spaceCount = block.text.search(/\S|$/);
      const mod = spaceCount % 4;
      const trimText = block.text.trim();
      if (multiLineSelected && !trimText) {
        // force empty line to empty string when multi-line selected
        block.text = '';
      } else if (options?.shift) {
        const delSpaceCount = (spaceCount >= 4 && mod === 0) ? 4 : mod;
        block.text = block.text.substring(delSpaceCount);
        if (newStartOffset === undefined) {
          if (block.key !== start) {
            newStartOffset = 0;
          } else if (startOffset > spaceCount) {
            newStartOffset = startOffset - delSpaceCount;
          } else {
            newStartOffset = Math.min(startOffset, spaceCount - delSpaceCount);
          }
        }
        newEndOffset = block.key === end ? endOffset - delSpaceCount : endOffset;
      } else {
        const newSpaceCount = 4 - mod;
        const spaceStr = new Array(newSpaceCount).fill(' ').join('');
        block.text = `${spaceStr}${block.text}`;
        if (newStartOffset === undefined) {
          if (block.key !== start) {
            newStartOffset = 0;
          } else if (!rangeSelected || startOffset > spaceCount) {
            newStartOffset = startOffset + newSpaceCount;
          } else {
            newStartOffset = startOffset;
          }
        }
        newEndOffset = block.key === end ? endOffset + newSpaceCount : endOffset;
      }
    }
    if (block.key === end) {
      started = false;
      break;
    }
  }

  const state = EditorState.push(editorState, convertFromRaw(rawData), 'insert-characters');
  const isBackward = selection.getIsBackward();
  setEditorState(EditorState.forceSelection(state, selection.merge({
    anchorOffset: isBackward ? newEndOffset : newStartOffset,
    focusOffset: isBackward ? newStartOffset : newEndOffset,
  })));

  return 'handled';
}
