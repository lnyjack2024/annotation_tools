import React, { useContext, useState } from 'react';
import { isEqual } from 'lodash';
import ChatContent from './ChatContent';
import { Content } from '../types';
import LocaleContext from '../locales/context';
import translate from '../locales';

interface OriginalValueProps {
  originalValue?: Content;
  value?: Content;
}

const OriginalValueContent: React.FC<OriginalValueProps> = ({
  originalValue,
  value,
}) => {
  const locale = useContext(LocaleContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (originalValue && !isEqual(value, originalValue)) {
    return (
      <div className="llm-chat-item-content-original-val">
        <div className="title">
          {translate(locale, 'CHAT_ORIGIN_VALUE_LABEL')}
          <span
            className="title-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {translate(locale, isCollapsed ? 'CHAT_ORIGIN_VALUE_EXPAND' : 'CHAT_ORIGIN_VALUE_COLLAPSE')}
          </span>
        </div>
        {!isCollapsed && (
          <ChatContent
            content={originalValue}
          />
        )}
      </div>
    );
  }

  return null;
};

export default OriginalValueContent;
