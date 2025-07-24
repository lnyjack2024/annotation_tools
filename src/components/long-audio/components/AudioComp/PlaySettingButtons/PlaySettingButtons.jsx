import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Tooltip } from 'antd';
import BackwardIcon from '../../common/Icons/BackwardIcon';
import ForwardIcon from '../../common/Icons/ForwardIcon';
import PlayIcon from '../../common/Icons/PlayIcon';
import PauseIcon from '../../common/Icons/PauseIcon';
import './PlaySettingButtons.scss';
import { playCurrentVideo, pauseCurrentVideo, forwardCurrentVideo, backwardCurrentVideo } from '../../../redux/action';
import { translate } from '../../../constants';

const PlaySettingButtons = ((props) => {
  const viewBox = '0 -2 24 24';
  const { isPlaying } = props;
  const handleButtonClick = (e, type) => {
    switch (type) {
      case 'play':
        props.playCurrentVideo();
        break;
      case 'pause':
        props.pauseCurrentVideo();
        break;
      case 'backward':
        props.backwardCurrentVideo();
        break;
      case 'forward':
        props.forwardCurrentVideo();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`audio-group-container ${props.className}`}>
      <Tooltip title={translate('BACKWARD_TIP')} placement="bottom">
        <button
          onClick={(e) => handleButtonClick(e, 'backward')}
          className="audio-button"
        >
          <BackwardIcon viewBox={viewBox} />
        </button>
      </Tooltip>
      {isPlaying
        ? (
          <Tooltip title={translate('PAUSE_TIP')} placement="bottom">
            <button
              onClick={(e) => handleButtonClick(e, 'pause')}
              className="audio-button"
            >
              <PauseIcon viewBox={viewBox} />
            </button>
          </Tooltip>
        ) : (
          <Tooltip title={translate('PLAY_TIP')} placement="bottom">
            <button
              onClick={(e) => handleButtonClick(e, 'play')}
              className="audio-button"
            >
              <PlayIcon viewBox={viewBox} />
            </button>
          </Tooltip>
        )}
      <Tooltip title={translate('FORWARD_TIP')} placement="bottom">
        <button
          onClick={(e) => handleButtonClick(e, 'forward')}
          className="audio-button"
        >
          <ForwardIcon viewBox={viewBox} />
        </button>
      </Tooltip>
    </div>
  );
});

PlaySettingButtons.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  isPlaying: PropTypes.bool,
  playCurrentVideo: PropTypes.func,
  pauseCurrentVideo: PropTypes.func,
  forwardCurrentVideo: PropTypes.func,
  backwardCurrentVideo: PropTypes.func,
};
const mapStateToProps = (state) => ({
  isPlaying: state.isPlaying,
});
const mapDispatchToProps = {
  playCurrentVideo: playCurrentVideo,
  pauseCurrentVideo: pauseCurrentVideo,
  forwardCurrentVideo: forwardCurrentVideo,
  backwardCurrentVideo: backwardCurrentVideo,
};
export default connect(mapStateToProps, mapDispatchToProps)(PlaySettingButtons);
