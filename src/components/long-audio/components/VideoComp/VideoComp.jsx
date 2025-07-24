import React from 'react';
import { connect } from 'react-redux';
import { getVideoContainer } from '../../redux/action';
import './VideoComp.scss';

class VideoComp extends React.Component {
  componentDidMount() {
    const videoContainer = document.getElementsByClassName('video');
    this.props.getVideoContainer({ videoContainer });
  }

  render() {
    const { currentVideo, videos } = this.props;
    return (
      <div
        style={{ display: videos[currentVideo].type === 'video' ? 'block' : 'none' }}
        className="video-container"
      >
        {videos.map(((value, index) => (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            /* eslint-disable-next-line react/no-array-index-key */
            key={`video-waveform-container-${index}`}
            className="video"
            type="video/mpeg"
            src={value.url}
            style={{ display: (this.props.currentVideo === index ? 'block' : 'none') }}
          />
        )))}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  videos: state.videos,
  currentVideo: state.currentVideo,
});
const mapDispatchToProps = {
  getVideoContainer,
};
export default connect(mapStateToProps, mapDispatchToProps)(VideoComp);
