import React from 'react';
import PropTypes from 'prop-types';
import { Radio, Tooltip } from 'antd';
import './PlaySettingRadio.scss';
import { connect } from 'react-redux';
import { playMode, translate } from '../../../constants';
import { setPlayMode } from '../../../redux/action';
import RegionPlayIcon from '../../common/Icons/RegionPlayIcon';
import RegionLoopIcon from '../../common/Icons/RegionLoopIcon';
import OverallPlayIcon from '../../common/Icons/OverallPlayIcon';

const PlaySettingRadio = ((props) => {
  const handleRadioChange = (e) => {
    props.setPlayMode({ value: e.target.value });
  };
  const style = { float: 'left' };
  const viewBox = '0 -8 24 24';
  const icons = {
    regionPlay: <RegionPlayIcon style={style} viewBox={viewBox} />,
    regionLoop: <RegionLoopIcon style={style} viewBox={viewBox} />,
    overallLoop: <OverallPlayIcon style={style} viewBox={viewBox} />,
  };
  const playModeTip = {
    regionPlay: translate('PLAY_MODE_TIP_REGION_PLAY'),
    regionLoop: translate('PLAY_MODE_TIP_REGION_LOOP'),
    overallLoop: translate('PLAY_MODE_TIP_OVERALL'),
  };

  return (
    <div className="play-setting-radio-container">
      <Radio.Group
        value={props.currentPlayMode}
        buttonStyle="solid"
        className={`play-setting-radio-group ${props.className}`}
        onChange={(e) => handleRadioChange(e)}
      >
        {playMode.map((option, index) => (
          <Tooltip
            title={`${playModeTip[option]}`}
            key={`radio-button-tooltip-${index}`}
          >
            <Radio.Button
              /* eslint-disable-next-line react/no-array-index-key */
              key={`radio-button-${index}`}
              className="play-mode-radio-button"
              value={option}
            >
              {icons[option]}
            </Radio.Button>
          </Tooltip>
        ))}
      </Radio.Group>
    </div>
  );
});

PlaySettingRadio.propTypes = {
  currentPlayMode: PropTypes.string,
  setPlayMode: PropTypes.func,
};

const mapStateToProps = (state) => ({
  currentPlayMode: state.currentPlayMode,
});
const mapDispatchToProps = {
  setPlayMode: setPlayMode,
};
export default connect(mapStateToProps, mapDispatchToProps)(PlaySettingRadio);
