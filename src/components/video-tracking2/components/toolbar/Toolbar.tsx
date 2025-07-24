import React from 'react';
import { Tooltip } from 'antd';
import screenfull from 'screenfull';
import { isAppenCloud } from 'src/utils';
import ReviewMode from './ReviewMode';
import UndoRedo from './UndoRedo';
import MeasurementBox from './MeasurementBox';
import DisplaySettings from './DisplaySettings';
import Save from './Save';
import Guide from './Guide';
import AppenLogo from '../../../common/AppenLogo';
import {
  Fullscreen,
} from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';
import './Toolbar.scss';

interface ToolbarProps {
  onSave: () => void;
}

class Toolbar extends React.Component<ToolbarProps> {
  handleScreenFull = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle().then(() => {
        store.fullscreenRequested = true;
      });
    }
  };

  render() {
    return (
      <div className="toolbar">
        <div>
          {isAppenCloud() && (
            <div className="logo">
              <AppenLogo />
            </div>
          )}
          <ReviewMode />
          <UndoRedo />
          <Guide />
        </div>
        <div>
          <MeasurementBox />
          <DisplaySettings />
          <Save onSave={this.props.onSave} />
          <div className="divider" />
          <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_FULLSCREEN')}>
            <div className="icon-button" onClick={this.handleScreenFull}>
              <Fullscreen />
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default Toolbar;
