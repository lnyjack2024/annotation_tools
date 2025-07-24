import React from 'react';
import { observer } from 'mobx-react';
import i18n from '../../locales';
import { Result } from '../../types';

interface Props {
  warning: Result
}
const ValidationItem = observer(({ warning }: Props) => {
  const { type, id, message, info } = warning;

  const renderTitle = () => {
    if (info?.title) {
      return info.title;
    }
    return i18n.translate('VALIDATION_NO_INSTANCE');
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
