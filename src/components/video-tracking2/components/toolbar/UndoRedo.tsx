import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Undo, Redo } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

const UndoRedo = observer(() => (
  <>
    <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_UNDO')}>
      <div
        className={cx('icon-button', {
          'icon-button--disabled': store.undo.undoDisabled,
        })}
        onClick={store.undo.undo}
      >
        <Undo />
      </div>
    </Tooltip>
    <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_REDO')}>
      <div
        className={cx('icon-button', {
          'icon-button--disabled': store.undo.redoDisabled,
        })}
        onClick={store.undo.redo}
      >
        <Redo />
      </div>
    </Tooltip>
  </>
));

export default UndoRedo;
