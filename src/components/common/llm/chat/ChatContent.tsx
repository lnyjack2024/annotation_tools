/* eslint-disable react/no-array-index-key */
import React, { useCallback } from 'react';
import CodeHighlight from '../../code/CodeHighlight';
import { Content, ContentItemType } from '../types';
import { ChatItemType } from './ChatItem';

interface ChatContentProps {
  type?: ChatItemType;
  content?: Content;
  onContentChange?: (newContent: Content) => void;
}

const ChatContent: React.FC<ChatContentProps> = ({
  content,
}) => {
  const renderContent = useCallback(() => {
    if (!content) {
      return null;
    }

    const allItems = [];
    let code = '';
    let language: string | undefined;
    content.forEach((item, i) => {
      if (code) {
        allItems.push(
          <CodeHighlight key={i - 1} code={code} language={language} />
        );
        code = '';
      }
      if (item.type === ContentItemType.UNSTYLED) {
        if (!item.content) {
          allItems.push(
            <br key={i} />
          );
        } else {
          const splitted = item.content.split('\n');
          splitted.forEach((t, ii) => {
            allItems.push(
              <div key={`${i}-${ii}`}>{t}</div>,
            );
          });
        }
      }
    });
    if (code) {
      allItems.push(
        <CodeHighlight key={content.length} code={code} language={language} />
      );
    }
    return allItems;
  }, [content]);

  return (
    <div className="llm-chat-content">
      {renderContent()}
    </div>
  );
};

export default ChatContent;
