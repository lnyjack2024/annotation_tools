import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Undo, Redo } from '../../common/icons';
import localMessage from '../locale';

interface Props {
  undoList: any[];
  redoList: any[];
  undoHandle: () => void;
  redoHandle: () => void;
}
const UndoRedo = observer(({ undoList, redoList, undoHandle, redoHandle }: Props) => (
  <>
    <Tooltip placement="bottom" title={localMessage('TOOLBAR_TIP_UNDO')}>
      <div
        className={cx('icon-button', {
          'icon-button--disabled': undoList.length === 0,
        })}
        onClick={undoHandle}
      >
        <Undo />
      </div>
    </Tooltip>
    <Tooltip placement="bottom" title={localMessage('TOOLBAR_TIP_REDO')}>
      <div
        className={cx('icon-button', {
          'icon-button--disabled': redoList.length === 0,
        })}
        onClick={redoHandle}
      >
        <Redo />
      </div>
    </Tooltip>
  </>
));

export default UndoRedo;
