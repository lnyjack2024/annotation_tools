import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Save } from 'src/components/common/icons';

interface SaveProps {
  disabled: boolean;
  onSave: () => void;
  title?: string;
}

const SaveButton = observer(({ onSave, disabled, title }: SaveProps) => (
  <Tooltip placement="bottom" title={title}>
    <div
      className={cx('icon-button', {
        'icon-button--disabled': disabled,
      })}
      onClick={() => onSave()}
    >
      <Save />
    </div>
  </Tooltip>
));

export default SaveButton;
