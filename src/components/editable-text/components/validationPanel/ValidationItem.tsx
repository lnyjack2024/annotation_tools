import React from 'react';
import { observer } from 'mobx-react';
import localMessage from '../../locale';
import { Result } from '../../types';

interface Props {
  warning: Result
}
const ValidationItem = observer(({ warning }: Props) => {
  const { type, id, message, info } = warning;

  const renderTitle = () => {
    if (info?.tagName) {
      return info.tagName;
    }
    return localMessage('VALIDATION_NO_INSTANCE');
  };

  return (
    <div
      key={`${type}-${id}`}
      className="warning-item"
    >
      <div className="warning-title">
        <div className="name">
          <div
            className="cat-color-dot"
            style={{ backgroundColor: '#DC4624' }}
          />
          {renderTitle()}
        </div>
      </div>
      <div className="warning-msg">
        <div
          className="img-container"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: message || '' }}
        />
      </div>
    </div>
  );
});

export default ValidationItem;
