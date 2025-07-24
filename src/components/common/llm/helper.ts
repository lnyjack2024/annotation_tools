import { Content, ContentItemType } from './types';

export function contentToPlainText(content?: Content) {
  if (!content) {
    return '';
  }
  let result = '';
  content.forEach((item) => {
    if (item.type === ContentItemType.UNSTYLED) {
      result += `${item.content}\n`;
    }
  });
  if (result.endsWith('\n')) {
    return result.replace(/\n$/, '');
  }
  return result;
}

export function parseContent(content: unknown): Content {
  if (content === undefined || content === null) {
    // no content
    return [];
  }

  if (typeof content === 'string') {
    // content is string
    // parse to one content item
    return [{
      type: ContentItemType.UNSTYLED,
      content,
    }];
  }

  if (!Array.isArray(content)) {
    // not valid content
    // set to empty
    return [];
  }

  // parse from legacy data if needed
  const allTypes = Object.values(ContentItemType);
  const parsedContent: Content = [];
  for (let i = 0; i < content.length; i += 1) {
    const item = content[i];
    if (item?.insert) {
      // legacy data
      // should be removed later
      if (typeof item.insert === 'string') {
        parsedContent.push({
          type: ContentItemType.UNSTYLED,
          content: item.insert,
        });
      }
    } else if (allTypes.includes(item?.type)
      && typeof item.content === 'string') {
      parsedContent.push(item);
    }
  }
  return parsedContent;
}

export function isContentEmpty(content: Content) {
  return content.length === 0 || (
    content.length === 1 &&
    content[0].type === ContentItemType.UNSTYLED &&
    content[0].content === ''
  );
}
