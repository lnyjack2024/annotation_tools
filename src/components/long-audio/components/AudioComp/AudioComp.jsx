import React from 'react';
import { connect } from 'react-redux';
import {
  backwardCurrentVideo,
  debug,
  forwardCurrentVideo,
  getAudioContainer,
  getWavesurfers,
  pauseCurrentVideo,
  playCurrentVideo, setVideoZoom,
} from '../../redux/action';
import PlaySettingRadio from './PlaySettingRadio/PlaySettingRadio';
import PlaySettingButtons from './PlaySettingButtons/PlaySettingButtons';
import './AudioComp.scss';
import PlaySettingInput from './PlaySettingInput/PlaySettingInput';
import PlaySettingSegment, { MoveType } from './PlaySettingSegment/PlaySettingSegment';
import WavesurferComp from '../WavesurferComp/WavesurferComp';
import DragWavesurferComp from '../WavesurferComp/DragWavesurferComp';
import { isInput } from '../../redux/reducer/segmentController';
import { SegmentMode } from '../../constants';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';
import XScroll from '../XScroll';

class AudioComp extends React.Component {
  xScroller = null;

  scrolls = {};

  constructor(props) {
    super(props);
    this.playSettingRef = React.createRef();
    this.wavesurferRef = React.createRef();
    this.xScrollerRef = React.createRef();
  }

  componentDidMount() {
    const waveform = document.getElementsByClassName('audio-waveform');
    const timeline = document.getElementsByClassName('audio-waveform-timeline');
    const audioContainer = document.getElementsByClassName('audio-waveform-container');
    const minimap = document.getElementsByClassName('audio-waveform-minimap');
    this.props.getAudioContainer({ waveform, timeline, audioContainer, minimap });
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.waveformComp.addEventListener('wheel', (e) => this.handleMouseWheel(e));
    if (this.xScrollerRef.current) {
      this.xScroller = new XScroll({
        container: this.xScrollerRef.current,
        height: 20,
        barColor: '#5a5860',
        trackStyle: {
          color: '#000000',
          padding: '2px',
        },
        onScroll: this.handleScroll
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.currentVideo !== prevProps.currentVideo) {
      this.initXScroll();
    }
  }

  getCurrentWaveDom = () => {
    const { currentVideo, wavesurfers } = this.props;
    let waveDom;
    const waveformContainer = wavesurfers?.container?.audioContainer?.[currentVideo];
    if (waveformContainer) {
      waveDom = waveformContainer.getElementsByTagName('wave')[0];
    }
    return waveDom;
  };

  handleScroll = (start) => {
    const waveDom = this.getCurrentWaveDom();
    if (waveDom) {
      const { precent = 1 } = this.scrolls[this.props.currentVideo] || {};
      waveDom.scroll(start * waveDom.scrollWidth, 0);
      this.scrolls[this.props.currentVideo] = { start, end: start + precent, precent };
    }
  };

  initXScroll() {
    if (this.xScroller) {
      const { precent = 1 } = this.scrolls[this.props.currentVideo] || {};
      this.scrolls[this.props.currentVideo] = { start: 0, end: precent, precent };
      this.xScroller?.setScroll({ start: 0, end: precent });
    }
  }

  setXScroll = () => {
    let timer = setTimeout(() => {
      clearTimeout(timer);
      timer = null;
      const waveDom = this.getCurrentWaveDom();
      if (waveDom) {
        const { clientWidth, scrollWidth, scrollLeft } = waveDom;
        const viewPrecent = clientWidth / scrollWidth;
        const start = scrollLeft / scrollWidth;
        const end = start + viewPrecent;
        this.scrolls[this.props.currentVideo] = { start, end, precent: viewPrecent };
        this.xScroller?.setScroll({ start, end });
      }
    }, 0);
  };

  handleMouseWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const { currentVideo } = this.props;
    const { zoom } = this.props.videos[currentVideo];
    let delta = 1;
    if (zoom > 200) {
      delta = 30;
    } else if (zoom > 150) {
      delta = 20;
    } else if (zoom > 80) {
      delta = 8;
    } else if (zoom > 50) {
      delta = 5;
    } else if (zoom > 20) {
      delta = 2;
    }
    if (e.deltaY < 0) {
      this.props.setVideoZoom({ zoom: zoom + delta });
    } else if (e.deltaY > 0) {
      this.props.setVideoZoom({ zoom: zoom - delta });
    }
  }

  handleKeyDown(e) {
    if (window.disableLongAudioHotKeys) return;
    if (isInput()) return;
    const { isPlaying } = this.props;
    if (e.keyCode === 32) { // space
      e.preventDefault();
      if (isPlaying) this.props.pauseCurrentVideo();
      else this.props.playCurrentVideo();
    } else if (e.keyCode === 37) { // left
      e.preventDefault();
      if (e.shiftKey) {
        this.playSettingRef.current?.moveStart(MoveType.MINUS);
      } else if (e.ctrlKey || e.metaKey) {
        this.playSettingRef.current?.moveEnd(MoveType.MINUS);
      } else {
        this.props.backwardCurrentVideo();
      }
    } else if (e.keyCode === 39) { // right
      e.preventDefault();
      if (e.shiftKey) {
        this.playSettingRef.current?.moveStart(MoveType.PLUS);
      } else if (e.ctrlKey || e.metaKey) {
        this.playSettingRef.current?.moveEnd(MoveType.PLUS);
      } else {
        this.props.forwardCurrentVideo();
      }
    }
  }

  clearAll() {
    this.wavesurferRef.current?.clearAll();
  }

  renderSegments() {
    this.wavesurferRef.current?.renderSegments();
  }

  render() {
    const { currentVideo, setCurrentSegment, segmentMode } = this.props;
    const readonly = isAnnotationReadonly(this.props.toolMode);
    return (
      // eslint-disable-next-line react/jsx-filename-extension
      <div className="audio-container">
        {segmentMode === SegmentMode.individual ? (
          <DragWavesurferComp ref={this.wavesurferRef} setCurrentSegment={setCurrentSegment} setXScroll={this.setXScroll} />
        ) : (
          <WavesurferComp ref={this.wavesurferRef} setCurrentSegment={setCurrentSegment} setXScroll={this.setXScroll} />
        )}
        <div ref={(r) => { this.waveformComp = r; }}>
          {
          this.props.videos.map((value, index) => (
            <div
              key={value.url}
              className={`audio-waveform-container ${currentVideo === index ? 'audio-waveform-container-current' : null}`}
              style={{ visibility: (this.props.currentVideo === index ? 'visible' : 'hidden') }}
            >
              <div className="audio-waveform" />
              <div className="audio-waveform-timeline" />
              <div className="audio-waveform-minimap" />
            </div>
          ))
        }
        </div>
        <div className="waveform-scroll-x" ref={this.xScrollerRef} />
        <div className="audio-button-group">
          <PlaySettingInput className="play-setting-buttons" />
          <PlaySettingRadio className="play-setting-radio" />
          <PlaySettingButtons className="play-setting-input" />
          {segmentMode === SegmentMode.individual && !readonly && <PlaySettingSegment playSettingRef={this.playSettingRef} />}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  videos: state.videos,
  results: state.results,
  ontology: state.ontology,
  currentZoom: state.currentZoom,
  currentVideo: state.currentVideo,
  currentPlayMode: state.currentPlayMode,
  isPlaying: state.isPlaying,
  segmentMode: state.segmentMode,
  wavesurfers: state.wavesurfers,
  toolMode: state.toolMode,
});
const mapDispatchToProps = {
  getAudioContainer,
  getWavesurfers,
  debug,
  playCurrentVideo,
  pauseCurrentVideo,
  forwardCurrentVideo,
  backwardCurrentVideo,
  setVideoZoom,
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(AudioComp);
