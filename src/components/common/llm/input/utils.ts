import { ContentState, RawDraftContentState, convertFromRaw, convertToRaw } from 'draft-js';
import { customAlphabet } from 'nanoid';
import { Content, ContentItemType } from '../types';
import { UNSTYLED_TYPE } from './constants';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5);

export function contentToContentState(content: Content): ContentState {
  const raw: RawDraftContentState = {
    entityMap: {},
    blocks: [],
  };

  for (let i = 0; i < content.length; i += 1) {
    const item = content[i];

    switch (item.type) {
      case ContentItemType.UNSTYLED: {
        raw.blocks.push({
          key: nanoid(),
          type: item.type,
          text: item.content,
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: item.data,
        });
        break;
      }

      default:
    }
  }

  // always add empty line
  raw.blocks.push({
    key: nanoid(),
    type: UNSTYLED_TYPE,
    text: '',
    depth: 0,
    inlineStyleRanges: [],
    entityRanges: [],
  });
  return convertFromRaw(raw);
}

export function contentStateToContent(contentState: ContentState): Content {
  const { blocks, entityMap } = convertToRaw(contentState);

  const content: Content = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    switch (block.type) {
      case UNSTYLED_TYPE: {
        content.push({
          type: ContentItemType.UNSTYLED,
          content: block.text,
        });
        break;
      }

      default:
    }
  }

  // remove last empty line
  const last = content[content.length - 1];
  if (last.type === ContentItemType.UNSTYLED && !last.content) {
    content.pop();
  }

  return content;
}
