import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import cx from 'classnames';
import { Question } from '../../../common/icons';
import i18n from '../../locales';

const Guide = () => {
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <>
      <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_GUIDE')}>
        <div
          className={cx('icon-button', {
            'icon-button--active': helpVisible,
          })}
          onClick={() => setHelpVisible(!helpVisible)}
        >
          <Question />
        </div>
      </Tooltip>
      {helpVisible && (
        <div className="toolbar-panel help-panel">
          <div className="title">
            {i18n.translate('HELP_TITLE')}
            <div className="close" onClick={() => setHelpVisible(false)}>
              <CloseOutlined />
            </div>
          </div>
          <div className="scroller">
            <div className="section">
              <div className="section-title">{i18n.translate('HELP_SECTION_MAIN_TITLE')}</div>
              <div className="section-content">
                <div className="help-item">
                  <div>{i18n.translate('HELP_RIGHT_MOUSE_LABEL')}</div>
                  <div>{i18n.translate('HELP_RIGHT_MOUSE_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>{i18n.translate('HELP_MOUSE_SCROLL_LABEL')}</div>
                  <div>{i18n.translate('HELP_MOUSE_SCROLL_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Ctrl / Cmd + S</div>
                  <div>{i18n.translate('HELP_SAVE_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Ctrl / Cmd + Z</div>
                  <div>{i18n.translate('HELP_UNDO_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Ctrl / Cmd + Y</div>
                  <div>{i18n.translate('HELP_REDO_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>,</div>
                  <div>{i18n.translate('HELP_PREV_FRAME_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>.</div>
                  <div>{i18n.translate('HELP_NEXT_FRAME_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>{'<'}</div>
                  <div>{i18n.translate('HELP_PREV_FRAME_10_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>{'>'}</div>
                  <div>{i18n.translate('HELP_NEXT_FRAME_10_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>/</div>
                  <div>{i18n.translate('HELP_PLAY_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Shift + C</div>
                  <div>{i18n.translate('HELP_REVIEW_MODE_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Shift + L</div>
                  <div>{i18n.translate('HELP_ASSISTANT_LINE_DESC')}</div>
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-title">{i18n.translate('HELP_SECTION_SHAPE_TITLE')}</div>
              <div className="section-content">
                <div className="help-item">
                  <div>Space</div>
                  <div>{i18n.translate('HELP_CREATE_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Tab</div>
                  <div>{i18n.translate('HELP_UNSELECT_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Delete / Backspace</div>
                  <div>{i18n.translate('HELP_REMOVE_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Up</div>
                  <div>{i18n.translate('HELP_UP_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Shift + Up</div>
                  <div>{i18n.translate('HELP_TOP_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Down</div>
                  <div>{i18n.translate('HELP_DOWN_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Shift + Down</div>
                  <div>{i18n.translate('HELP_BOTTOM_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>O</div>
                  <div>{i18n.translate('HELP_ATTR_MODAL_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>M</div>
                  <div>{i18n.translate('HELP_MERGE_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>S</div>
                  <div>{i18n.translate('HELP_SUBTRACT_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Alt / Option</div>
                  <div>{i18n.translate('HELP_ADD_POINT_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>Ctrl</div>
                  <div>{i18n.translate('HELP_CANCEL_SNAP_DESC')}</div>
                </div>
                <div className="help-item">
                  <div>T</div>
                  <div>{i18n.translate('HELP_FILL_DESC')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Guide;
