import React from 'react';
import { InputNumber } from 'antd';
import './PlaySettingInput.scss';
import { connect } from 'react-redux';
import { debounce } from 'lodash';
import { setVideoSpeed, setVideoZoom } from '../../../redux/action';
import { translate } from '../../../constants';

const PlaySettingInput = ((props) => {
  const { currentVideo, videos } = props;
  const handleInputChange = (e, type) => {
    switch (type) {
      case 'speed':
        if (parseFloat(videos[currentVideo].speed) === parseFloat(e)) break;
        props.setVideoSpeed({ speed: e });
        break;
      case 'zoom':
        if (parseFloat(videos[currentVideo].zoom) === parseFloat(e)) break;
        props.setVideoZoom({ zoom: e });
        break;
      default:
        break;
    }
  };
  const handleInputFocus = (e) => {
    e.target.blur();
  };

  return (
    <div className="play-setting-container">
      <span className="play-setting-title">
        {translate('speed')}
        {' '}
        :
      </span>
      <InputNumber
        className="play-setting"
        value={videos[currentVideo].speed}
        min={0.25}
        max={4}
        step={0.25}
        type="number"
        onChange={(e) => handleInputChange(e, 'speed')}
        onFocus={() => { window.disableLongAudioHotKeys = true; }}
        onBlur={() => { window.disableLongAudioHotKeys = false; }}
      />
      <span className="play-setting-title">
        {`${translate('zoom')}:`}
      </span>
      <InputNumber
        className="play-setting"
        value={videos[currentVideo].zoom}
        min={1}
        max={1000}
        step={1}
        type="number"
        onChange={debounce((e) => handleInputChange(e, 'zoom'), 50)}
        onFocus={() => { window.disableLongAudioHotKeys = true; }}
        onBlur={() => { window.disableLongAudioHotKeys = false; }}
      />
    </div>
  );
});

const mapStateToProps = (state) => ({
  videos: state.videos,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
});
const mapDispatchToProps = {
  setVideoSpeed,
  setVideoZoom,
};
export default connect(mapStateToProps, mapDispatchToProps)(PlaySettingInput);
