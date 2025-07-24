import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Save } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

const SaveButton = observer(({ onSave }: { onSave: () => void }) => (
  <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_SAVE')}>
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
