import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Save } from '../../common/icons';
import store from '../store/RootStore';
import localMessage from '../locale';

const SaveButton = observer(({ onSave }: { onSave: () => void }) => (
  <Tooltip placement="bottom" title={localMessage('TOOLBAR_TIP_SAVE')}>
    <div
      className={cx('icon-button', {
        'icon-button--disabled': store.isPreview || !store.initialized,
      })}
      onClick={onSave}
    >
      <Save />
    </div>
  </Tooltip>
));

export default SaveButton;
