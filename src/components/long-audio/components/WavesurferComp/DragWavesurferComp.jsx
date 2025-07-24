/* eslint-disable class-methods-use-this */
import React from 'react';
import hexToRgba from 'hex-to-rgba';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
import MinimapPlugin from 'wavesurfer.js/src/plugin/minimap';
import { connect } from 'react-redux';
import { v4 as uuid } from 'uuid';
import { cloneDeep } from 'lodash';
import { notification, Modal } from 'antd';
import { defaultColor, formatTimestamp, translate, triggerForm, StyleConfigMode, getConfigColor } from '../../constants';
import {
  getWavesurfers,
  setPlayingState,
  setVideoValid,
  deleteLine,
  pushLine,
  setLineRole,
  parseSegments,
  setErrorMsg,
  setAudioErrorMsg,
  appendSegment,
  updateSegment,
  deleteSegment,
  setSegments,
  updateLineRole,
  updateVideoInfo,
  setLoading,
} from '../../redux/action';
import './WavesurferComp.scss';
import { createLine, createSegment, isInput } from '../../redux/reducer/segmentController';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';
import { formatTimeCallback, primaryLabelInterval, secondaryLabelInterval, timeInterval } from '../utils/TimelineUtil';
import i18n from '../../locales';

notification.config({ top: 60 });
export const ANCHOR_MOVEMENT_STEP = 0.01;

class WavesurferComp extends React.Component {
  tempRegion = undefined;

  constructor() {
    super();
    this.wavesurfers = [];
    this.undoList = [];
    this.redoList = [];
    this.container = {
      minimap: null, // Minimap container
      waveform: null, // Waveform container
      timeline: null, // Timeline container
      audioContainer: null, // Cursor container
      videoContainer: null, // Video container
    };
    this.current = {
      zoom: 1,
      videoIndex: 0,
      wavesurfer: null,
      undoList: null,
      redoList: null,
      segmentSelected: null,
    };
    this.updatingRegionStart = null;
    this.updatingRegionEnd = null;
    this.altKeyDown = false;
    this.hoveredRegion = null;
    this.state = {
      cursorTime: 0, // seconds
    };
  }

  get currentSegments() {
    return this.props.results[this.current.videoIndex];
  }

  componentDidMount() {
    this.props.getWavesurfers({ wavesurfers: this });
    this.timer = setInterval(() => {
      if (!this.props.isPlaying) return;
      const { wavesurfer } = this.current;
      const currentTime = wavesurfer.getCurrentTime();
      const duration = wavesurfer.getDuration();
      wavesurfer.timestamp.innerText = `${formatTimestamp(currentTime)}/${formatTimestamp(duration)}`;
      this.setCurrentScroll(currentTime, 0, true);
    }, 200);
    window.addEventListener('resize', this.setCurrentZoom);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('contextmenu', this.onContextmenu);
  }

  onContextmenu(e) {
    e.preventDefault();
  }

  shouldComponentUpdate(nextProps) {
    const currSeg = this.props.results[this.props.currentVideo][this.props.currentSegment];
    const nextSeg = nextProps.results[nextProps.currentVideo][nextProps.currentSegment];
    // return !isEqual(currSeg, nextSeg);
    return currSeg?.id !== nextSeg?.id || nextProps.isLoadedAlaw !== this.props.isLoadedAlaw;
  }

  componentDidUpdate() {
    if (this.props.isLoadedAlaw) {
      this.initWaveSurfer();
    } else {
      this.setCurrentSegment(this.props.currentSegment);
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener('resize', this.setCurrentZoom);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('contextmenu', this.onContextmenu);
    if (Array.isArray(this.container.audioContainer)) {
      this.container.audioContainer.forEach((c) => {
        if (c) {
          c.removeEventListener('mousemove', this.updateMeasurement);
          c.removeEventListener('wheel', this.updateMeasurement);
        }
      });
    }
  }

  getAudioContainer(waveform, timeline, audioContainer, minimap) {
    this.container.waveform = waveform;
    this.container.timeline = timeline;
    this.container.audioContainer = audioContainer;
    this.container.minimap = minimap;
    if (this.container.videoContainer) {
      this.initWaveSurfer();
    }
  }

  getVideoContainer(videoContainer) {
    this.container.videoContainer = videoContainer;
    if (this.container.waveform) {
      this.initWaveSurfer();
    }
  }

  getCursorTime() {
    return this.state.cursorTime;
  }

  getSegmentIndexById(id) {
    return this.currentSegments.findIndex((seg) => seg.id === id);
  }

  getRegionById(id) {
    return Object.values(this.current.wavesurfer.regions.list).find((r) => r.data.id === id);
  }

  initWaveSurfer() {
    const size = this.props.videos.length;
    const urls = [];
    for (let i = 0; i < size; i += 1) {
      if (this.props.videos[i].loaded && !this.wavesurfers[i]) {
        this.wavesurfers[i] = WaveSurfer.create({
          container: this.container.waveform[i],
          autoCenter: false,
          backend: 'MediaElement',
          normalize: true,
          loopSelection: true,
          scrollParent: true,
          backgroundColor: defaultColor.defaultGray,
          waveColor: defaultColor.darkGray,
          progressColor: defaultColor.darkGray,
          cursorColor: defaultColor.defaultRed,
          pixelRatio: 1,
          maxCanvasWidth: 4000,
          plugins: [
            RegionsPlugin.create(),
            CursorPlugin.create({
              width: '1px',
              height: '10px',
              container: this.container.audioContainer[i],
              color: defaultColor.defaultGreen,
              showTime: true,
              opacity: 1,
              customShowTimeStyle: {
                color: defaultColor.defaultGreen,
                fontSize: '14px',
                paddingLeft: '5px',
                position: 'absolute',
                bottom: '3px',
              },
              formatTimeCallback: (sec) => {
                this.setState({ cursorTime: sec });
                return formatTimestamp(sec);
              },
            }),
            TimelinePlugin.create({
              container: this.container.timeline[i],
              primaryFontColor: defaultColor.defaultWhite,
              secondaryFontColor: defaultColor.defaultWhite,
              primaryColor: defaultColor.defaultWhite,
              secondaryColor: defaultColor.defaultWhite,
              fontSize: '10',
              notchPercentHeight: 30,
              timeInterval,
              primaryLabelInterval,
              secondaryLabelInterval,
              formatTimeCallback,
            }),
            MinimapPlugin.create({
              container: this.container.minimap[i],
            }),
          ],
        });
        urls[i] = this.container.videoContainer[i];

        this.wavesurfers[i].on('ready', () => {
          this.wavesurfers[i].pause();
          this.wavesurfers[i].enableDragSelection({
            color: hexToRgba(this.props.ontology.get('none'), defaultColor.defaultAlpha),
          });

          let segments;
          try {
            segments = this.parseSegments(i);
          } catch (e) {
            this.props.setErrorMsg({ errorMsg: e.toString() });
            return;
          }
          this.props.setLoading(false);
          this.initRegion(i, segments);
          this.initMiniMap(i);
          if (i === 0) {
            this.setNewVideo();
          }
          this.wavesurfers[i].on('play', () => this.handlePlayPause());
          this.wavesurfers[i].on('pause', () => this.handlePlayPause());
          this.wavesurfers[i].on('region-created', this.handleRegionCreated);
          this.wavesurfers[i].on('region-updated', (region) => this.handleRegionUpdate(region));
          this.wavesurfers[i].on('region-update-end', (region, e) => this.handleRegionEdit(region, e));
          this.wavesurfers[i].on('region-out', (region) => this.handleRegionOut(region));
          this.wavesurfers[i].on('region-in', (region) => this.handleRegionIn(region));
          this.wavesurfers[i].on('region-click', (region, e) => this.handleRegionClick(region, e));
          this.wavesurfers[i].on('region-contextmenu', (_, e) => e.preventDefault());
          this.wavesurfers[i].on('region-mouseenter', (region) => {
            this.hoveredRegion = region;
            if (this.altKeyDown) {
              this.hoveredRegion.drag = false;
              this.hoveredRegion.resize = false;
            }
          });
          this.wavesurfers[i].on('region-mouseleave', () => {
            this.hoveredRegion = null;
          });
          this.props.setVideoValid({ index: i });
          this.props.updateVideoInfo({ index: i, duration: this.wavesurfers[i].getDuration() });
        });
        this.wavesurfers[i].on('error', (error) => {
          notification.error({ message: `${translate('AUDIO_ERROR')} ${translate('RECORD_PREFIX')}${i + 1}` });
          console.log('error', urls[i].src, error);
          this.props.setAudioErrorMsg({
            index: i,
            errorMsg: `${translate('AUDIO_ERROR')} ${translate('RECORD_PREFIX')}${i + 1} ${urls[i].src} ${error}`
          });
          this.wavesurfers[i].destroy();
          if (i === size - 1) {
            this.props.setLoading(false);
          }
        });
        this.wavesurfers[i].on('redraw', this.props.setXScroll);
        this.undoList[i] = [];
        this.redoList[i] = [];

        this.container.audioContainer[i].addEventListener('mousemove', () => this.updateMeasurement(i));
        this.container.audioContainer[i].addEventListener('wheel', () => this.updateMeasurement(i));
        this.wavesurfers[i].load(this.container.videoContainer[i]);
      }
    }
  }

  initRegion(videoIndex, segments) {
    // setup initial regions
    const wavesurfer = this.wavesurfers[videoIndex];
    const { toolMode, ontology } = this.props;
    const readonly = isAnnotationReadonly(toolMode);
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex];
      const region = wavesurfer.addRegion({
        start: segment.start,
        end: segment.end,
        color: hexToRgba(ontology.get('none'), defaultColor.defaultAlpha),
        drag: !readonly,
        resize: !readonly,
      });
      region.data = { id: segment.id };
      segment.content.forEach((line, lineIndex) => {
        const attributes = this.props.styleConfig?.mode === StyleConfigMode.segment ? segment.attributes : line.attributes;
        this.insertLine({
          videoIndex,
          segmentIndex,
          region,
          lineIndex,
          role: line.role,
          attributes,
        });
      });
      this.updateRegionElement(region);
    }
  }

  insertLine = (data) => {
    // eslint-disable-next-line prefer-const
    const { segmentIndex, role: currentRole, attributes, region: currentRegion } = data;
    const { ontology, styleConfig } = this.props;
    const segment = this.currentSegments[segmentIndex];
    const region = currentRegion || this.getRegionById(segment?.id);
    if (region) {
      const role = currentRole || 'none';
      let configColor = '';
      if (attributes && styleConfig?.groups?.length > 0) {
        configColor = getConfigColor(attributes, styleConfig.groups);
      }
      const color = hexToRgba(
        configColor || ontology.get(role) || defaultColor.defaultWhite,
        (role === 'none' && !configColor) ? 0 : defaultColor.defaultAlpha
      );
      region.element.classList.add('line-region');
      const mark = document.createElement('div');
      mark.className = 'line-mark';
      mark.style.background = color;
      region.element.appendChild(mark);
      Array.from(region.element.getElementsByClassName('line-mark')).forEach((line, index, array) => {
        const height = 100 / array.length;
        const top = height * index;
        line.style.height = `${height}%`;
        line.style.top = `${top}%`;
      });
    }
  };

  deleteLine(data) {
    const { segmentIndex, lineIndex } = data;
    const segment = this.currentSegments[segmentIndex];
    const region = this.getRegionById(segment.id);
    if (region) {
      const lineEleArray = Array.from(region.element.getElementsByClassName('line-mark'));
      const removeEle = lineEleArray.splice(lineIndex, 1);
      removeEle[0]?.remove();
      lineEleArray.forEach((line, index, array) => {
        const height = 100 / array.length;
        const top = height * index;
        line.style.height = `${height}%`;
        line.style.top = `${top}%`;
      });
    }
  }

  initMiniMap(i) {
    const wave = this.container.minimap[i].getElementsByTagName('wave')[0];
    const timestamp = document.createElement('div');
    const currentTime = this.wavesurfers[i].getDuration();
    timestamp.className = 'wavesurfer-timestamp';
    timestamp.innerText = `00:00.000/${formatTimestamp(currentTime)}`;
    wave.appendChild(timestamp);
    this.wavesurfers[i].timestamp = timestamp;
  }

  parseSegments(videoIndex) {
    const { results, ontology, lineConfig, segmentConfig, keyAttribute, minSegmentLength } = this.props;
    const segments = results[videoIndex];
    const wavesurfer = this.wavesurfers[videoIndex];
    const duration = wavesurfer.getDuration();
    const segmentConfigValidKeys = segmentConfig.fields.map((value) => value.name);
    const { updatedValues: updateLineValues } = triggerForm(lineConfig, {});
    const { updatedValues: updateSegmentValues } = triggerForm(segmentConfig, {});
    if (keyAttribute) {
      segmentConfigValidKeys.push(keyAttribute.name);
    }
    const lineConfigValidKeys = lineConfig.fields.map((value) => value.name);
    const ontologyValidKeys = [];
    ontology.forEach((value, key) => {
      ontologyValidKeys.push(key);
    });
    const segmentsMap = {};
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      // validate start/end time nan
      if (segment.start) {
        const startNum = Number(segment.start);
        if (Number.isNaN(startNum)) {
          throw new Error(`${translate('PAYLOAD_ERROR_SEGMENT_START_END_NAN')} [start NAN] ${JSON.stringify(segment)}`);
        }
        segment.start = startNum;
      }
      if (segment.end) {
        const endNum = Number(segment.end);
        if (Number.isNaN(endNum)) {
          throw new Error(`${translate('PAYLOAD_ERROR_SEGMENT_START_END_NAN')} [end NAN] ${JSON.stringify(segment)}`);
        }
        segment.end = endNum;
      }
      // validate segment id
      segment.id = segment.id || uuid();
      // validate segment start & end
      if (segment.start === null || segment.start === undefined || segment.end === null || segment.end === undefined) {
        throw new Error(`${translate('PAYLOAD_ERROR_SEGMENT_START_END_INVALID')} ${JSON.stringify(segment)}`);
      }
      if (segment.end > duration) {
        segment.end = duration;
        // eslint-disable-next-line no-console
        console.log(`${translate('PAYLOAD_ERROR_SEGMENT_LENGTH_OVERFLOW')} ${JSON.stringify(segment)} set as max=${duration}`);
      }
      if (segment.start < 0 || segment.end < 0 || segment.start > segment.end || segment.end - segment.start < minSegmentLength) {
        segments.splice(i, 1);
        i -= 1;
        // throw new Error(`${translate('PAYLOAD_ERROR_SEGMENT_START_END_INVALID')} ${JSON.stringify(segment)}`);
      }
      // validate segment attribute
      segment.attributes = {
        ...updateSegmentValues,
        ...segment.attributes,
      };
      Object.keys(segment.attributes).forEach((key) => {
        if (segmentConfigValidKeys.indexOf(key) < 0) {
          // throw new Error(`${translate('PAYLOAD_ERROR_INVALID_ATTRIBUTE')}: ${key}`);
          delete segment.attributes[key];
        }
      });
      if (segment.content == null || !segment.content[0]) segment.content = [createLine('none', lineConfig)];
      segment.content.forEach((line, index, arr) => {
        line.role = line.role || 'none';
        line.attributes = {
          ...updateLineValues,
          ...line.attributes,
        };
        if (ontologyValidKeys.indexOf(line.role) < 0) {
          line.role = 'none';
          // throw new Error(`${translate('PAYLOAD_ERROR_INVALID_ROLE')}: ${line.role}`);
        }
        Object.keys(line.attributes).forEach((key) => {
          if (lineConfigValidKeys.indexOf(key) < 0) {
            // throw new Error(`${translate('PAYLOAD_ERROR_INVALID_ATTRIBUTE')}: ${key}`);
            delete line.attributes[key];
          }
        });
      });
      segmentsMap[segment.id] = segment;
    }
    const newSegments = Object.values(segmentsMap).sort((a, b) => a.start - b.start);
    if (!this.props.segmentOverlap) {
      for (let i = 0; i < newSegments.length - 1; i += 1) {
        const currSeg = newSegments[i];
        const nextSeg = newSegments[i + 1];
        if (currSeg.end > nextSeg.start) {
          currSeg.end = nextSeg.start;
        }
      }
    }
    this.props.parseSegments({
      videoIndex,
      segments: newSegments,
    });
    return newSegments;
  }

  playVideo() {
    this.current.wavesurfer.play();
  }

  pauseVideo() {
    this.current.wavesurfer.pause();
  }

  forwardVideo() {
    this.current.wavesurfer.skipForward(0.5);
  }

  backwardVideo() {
    this.current.wavesurfer.skipBackward(0.5);
  }

  setCurrentSpeed(speed) {
    this.current.wavesurfer?.setPlaybackRate(speed);
  }

  setPlayMode() {
    // mode
  }

  setNewVideo() {
    const { videoIndex } = this.current;
    if (this.wavesurfers[videoIndex].isDestroyed) {
      // eslint-disable-next-line no-console
      console.error('Video destroyed:', videoIndex);
      return;
    }
    this.current.wavesurfer = this.wavesurfers[videoIndex];
    this.current.zoom = this.props.videos[videoIndex].zoom;
    this.current.undoList = this.undoList[videoIndex];
    this.current.redoList = this.redoList[videoIndex];
    this.setCurrentZoom();
  }

  setCurrentVideo(newVideoIndex) {
    const { videoIndex } = this.current;
    this.wavesurfers[videoIndex].pause();
    this.current.videoIndex = newVideoIndex;
    this.setNewVideo();
  }

  setCurrentZoom = (newZoom) => {
    if (newZoom) {
      this.current.zoom = newZoom;
    }
    const { zoom, videoIndex, wavesurfer } = this.current;
    if (wavesurfer) {
      const duration = this.wavesurfers[videoIndex].getDuration();
      const cursorTime = this.getCursorTime();
      const currentTime = wavesurfer.getCurrentTime();
      const { offsetWidth } = wavesurfer.container;
      const { offsetLeft } = wavesurfer.cursor.cursor;
      const totalWidth = offsetWidth * zoom;
      const pxPerSec = totalWidth / duration;
      wavesurfer.zoom(pxPerSec);
      this.setCurrentScroll(
        cursorTime < 0 ? currentTime : cursorTime,
        cursorTime < 0 ? offsetWidth / 2 : offsetLeft,
        false,
      );
    }
  };

  setCurrentScroll(destTime = 0, offsetLeft = 0, boundaryCheck) {
    const { wavesurfer } = this.current;
    const { scrollLeft } = wavesurfer.container.lastChild;
    const { offsetWidth } = wavesurfer.container;
    const { minPxPerSec } = wavesurfer.params;
    const scrollTime = destTime - (offsetLeft - offsetWidth / 2) / minPxPerSec;
    const duration = wavesurfer.getDuration();
    if (!boundaryCheck) {
      wavesurfer.drawer.recenter(scrollTime / duration);
    } else {
      const rightBoundaryTime = (scrollLeft + offsetWidth) / minPxPerSec;
      const leftBoundaryTime = scrollLeft / minPxPerSec;
      if (destTime < leftBoundaryTime || destTime > rightBoundaryTime) {
        wavesurfer.drawer.recenter(scrollTime / duration);
      }
    }
  }

  setCurrentSegment(currentSegment, start) {
    const segment = this.currentSegments[currentSegment];
    if (!segment) {
      Object.values(this.current.wavesurfer.regions.list).forEach((r) => r.element.classList.remove('selected'));
      this.current.segmentSelected = null;
      return;
    }
    const region = this.getRegionById(segment.id);
    if (region) {
      if (region !== this.current.segmentSelected) {
        Object.values(this.current.wavesurfer.regions.list).forEach((r) => r.element.classList.remove('selected'));
        region.element.classList.add('selected');
        this.current.segmentSelected = region;
      }
      const s = start || region.start;
      this.seekCurrentAudio(s);
      this.setCurrentScroll(s, 0, true);
    }
    if (this.props.currentPlayMode !== 'overallLoop') {
      this.current.wavesurfer.play();
    }
  }

  setLineColor(videoIndex, segmentIndex, lineIndex, role, prevRole, type) {
    if (videoIndex === this.current.videoIndex) {
      const { styleConfig, results } = this.props;
      const segments = results[videoIndex];
      const segment = segments[segmentIndex];
      const region = this.getRegionById(segment.id);
      if (region) {
        let color = this.props.ontology.get(role);
        if (styleConfig?.groups?.length > 0) {
          const attributes = styleConfig?.mode === StyleConfigMode.line ? segment.content[lineIndex]?.attributes : segment.attributes;
          color = getConfigColor(attributes, styleConfig.groups) || color;
        }
        this.setLineEleColor(segment, region, lineIndex, color);
        if (type !== 'history') {
          this.addHistory('setLineColor', { videoIndex, segmentIndex, lineIndex, role: prevRole, actionType: 'history' });
        }
      }
    }
  }

  setSegmentColor(videoIndex, segmentIndex, lines, color) {
    const segment = this.props.results[videoIndex][segmentIndex];
    const region = this.getRegionById(segment.id);
    if (region) {
      for (let i = 0; i < lines.length; i += 1) {
        const lineIndex = lines[i];
        this.setLineEleColor(segment, region, lineIndex, color);
      }
    }
  }

  setLineEleColor(segment, region, lineIndex, color) {
    const line = segment.content[lineIndex];
    const roleColor = this.props.ontology.get(line.role);
    const rgba = hexToRgba(
      color || roleColor || defaultColor.defaultWhite,
      !color && line.role === 'none' ? 0 : defaultColor.defaultAlpha
    );
    const lineElement = region.element.getElementsByClassName('line-mark')[lineIndex];
    if (lineElement) {
      lineElement.style.background = rgba;
    }
  }

  setSegmentStartEnd(videoIndex, segmentIndex, start, end) {
    if (videoIndex === this.current.videoIndex) {
      const segments = this.props.results[videoIndex];
      const segment = segments[segmentIndex];
      const prevSegment = cloneDeep(segment);
      const region = this.getRegionById(segment.id);
      if (region) {
        region.update({ start, end });
      }
      this.addHistory('segment', {
        segmentIndex,
        prevSegment,
        nextSegment: cloneDeep(segment),
        region,
      });
    }
  }

  seekCurrentAudio(currentTime = 0) {
    const { wavesurfer } = this.current;
    const duration = wavesurfer.getDuration();
    wavesurfer.backend.seekTo(Math.min(Math.max(currentTime, 0), duration));
  }

  deleteCurrentSegment() {
    const { currentSegment } = this.props;
    const segment = this.currentSegments[currentSegment];
    if (segment) {
      const region = this.getRegionById(segment.id);
      this.addHistory('segment', {
        segmentIndex: currentSegment,
        prevSegment: cloneDeep(segment),
        region,
      });
      if (region) {
        region.remove();
      }
      this.props.deleteSegment({ segmentIndex: currentSegment });
      const currentTime = this.current.wavesurfer.getCurrentTime();
      const currentSegmentIndex = this.currentSegments.findIndex((seg) => seg.start <= currentTime && seg.end >= currentTime);
      this.props.setCurrentSegment({ index: currentSegmentIndex, start: currentTime });
      this.current.segmentSelected = null;
    }
  }

  handleKeyDown = (e) => {
    if (!e.key) return;
    if (window.disableLongAudioHotKeys) return;
    if (isInput()) return;
    if (isAnnotationReadonly(this.props.toolMode)) return;
    if (e.altKey && this.props.segmentOverlap) {
      this.altKeyDown = true;
      if (this.hoveredRegion) {
        this.hoveredRegion.drag = false;
        this.hoveredRegion.resize = false;
      }
    }
    switch (e.keyCode) {
      case 8: // backspace
      case 46: // delete
        if (e.ctrlKey) {
          this.clearAll();
        } else {
          this.deleteCurrentSegment();
        }
        break;
      case 90: // z
        if (e.ctrlKey) {
          this.recallHistory('undo');
        }
        break;
      case 89: // y
        if (e.ctrlKey) {
          this.recallHistory('redo');
        }
        break;
      default:
    }
  };

  handleKeyUp = (e) => {
    if (!e.altKey) {
      this.altKeyDown = false;
      Object.values(this.current.wavesurfer.regions.list).forEach((region) => {
        region.drag = true;
        region.resize = true;
      });
    }
  };

  handlePlayPause() {
    this.props.setPlayingState({
      isPlaying: this.current.wavesurfer.isPlaying(),
    });
  }

  handleRegionCreated = (region) => {
    if (this.tempRegion) this.tempRegion.remove();
    region.element.classList.add('line-region');
    const mark = document.createElement('div');
    mark.className = 'line-mark';
    mark.style.height = '100%';
    region.element.appendChild(mark);
  };

  handleRegionUpdate = (region) => {
    const { annotateDisabled } = this.props;
    if (annotateDisabled) {
      if (region) region.remove();
      return;
    }
    if (!this.props.segmentOverlap && !region.temp) {
      const overlappedRegions = Object.values(this.current.wavesurfer.regions.list).filter((r) => !(r.end <= region.start || r.start >= region.end) && r !== region);
      if (overlappedRegions.length > 0) {
        // has overlapping
        const minStart = Math.min(...overlappedRegions.map((r) => r.start));
        const maxEnd = Math.max(...overlappedRegions.map((r) => r.end));
        if (this.updatingRegionStart === region.start) {
          // drag end handler
          if (region.end > minStart) {
            region.update({ end: minStart });
          }
        } else if (this.updatingRegionEnd === region.end) {
          // drag start handler
          if (region.start < maxEnd) {
            region.update({ start: maxEnd });
          }
        } else if (region.start < this.updatingRegionStart) {
          // move left
          region.update({ start: maxEnd, end: region.end - region.start + maxEnd });
        } else if (region.start > this.updatingRegionStart) {
          // move right
          region.update({ start: region.start - region.end + minStart, end: minStart });
        }
      }
    }
    this.updatingRegionStart = region.start;
    this.updatingRegionEnd = region.end;
    this.updateRegionElement(region);
  };

  handleRegionEdit = (region, e) => {
    const { annotateDisabled, toolMode } = this.props;
    const readonly = isAnnotationReadonly(toolMode) || annotateDisabled;
    if ((readonly || (e?.buttons === 2 || e?.button === 2)) && !region.data.id) {
      region.temp = true;
      region.update({
        color: hexToRgba(defaultColor.defaultGray, 0.2),
      });
      this.tempRegion = region;
      this.current.wavesurfer?.play(region.start, region.end);
      this.props.setCurrentSegment({ index: -1 });
    }
    if (region.temp) return;
    this.updatingRegionStart = null;
    this.updatingRegionEn = null;

    const { id } = region.data;
    const duration = this.current.wavesurfer.getDuration();
    region.start = Math.max(region.start, 0);
    region.end = Math.min(region.end, duration);
    const { minSegmentLength, segmentConfig, lineConfig } = this.props;
    if (!id) {
      // create region
      if (region.end - region.start < minSegmentLength) {
        region.remove();
        return;
      }
      const segment = createSegment(region.start, region.end, segmentConfig, lineConfig);
      // eslint-disable-next-line no-param-reassign
      region.data.id = segment.id;
      region.play();
      this.props.appendSegment({ segment });
      this.addHistory('segment', {
        segmentIndex: this.props.currentSegment,
        nextSegment: cloneDeep(segment),
        region,
      });
    } else {
      // update region
      const segmentIndex = this.getSegmentIndexById(id);
      if (segmentIndex >= 0) {
        const segment = this.currentSegments[segmentIndex];
        const prevSegment = cloneDeep(segment);
        let { start, end } = region;
        if (end - start < minSegmentLength) {
          const draggingStart = end === segment.end;
          const draggingEnd = start === segment.start;
          if (draggingStart) {
            start = end - minSegmentLength;
          } else if (draggingEnd) {
            end = start + minSegmentLength;
          }
        }
        region.update({ start, end });
        segment.start = start;
        segment.end = end;
        this.props.updateSegment({ segment });
        this.addHistory('segment', {
          segmentIndex,
          prevSegment,
          nextSegment: cloneDeep(segment),
          region,
        });
      }
    }
  };

  handleRegionOut(region) {
    const segment = this.currentSegments[this.props.currentSegment];
    if (!segment && !region?.temp) {
      return;
    }
    const currentRegion = region.temp ? region : this.getRegionById(segment?.id);
    if (currentRegion === region) {
      if (this.props.currentPlayMode === 'overallLoop') {
        this.props.setCurrentSegment({ index: -1 });
      } else if (this.props.currentPlayMode === 'regionLoop') {
        this.seekCurrentAudio(region.start);
        this.setCurrentScroll(region.start, 0, true);
      } else if (this.props.currentPlayMode === 'regionPlay') {
        this.current.wavesurfer.pause();
        this.seekCurrentAudio(region.end);
      }
    }
  }

  handleRegionIn(region) {
    if (this.props.currentPlayMode === 'overallLoop') {
      const segmentIndex = this.getSegmentIndexById(region.data.id);
      const currentTime = this.current.wavesurfer.getCurrentTime();
      if (segmentIndex !== this.props.currentSegment && segmentIndex >= 0) {
        this.props.setCurrentSegment({ index: segmentIndex, start: currentTime });
      }
    }
  }

  handleRegionClick(region, e) {
    e.stopPropagation();
    const segmentIndex = this.getSegmentIndexById(region.data.id);
    if (segmentIndex >= 0) {
      const cursorTime = this.getCursorTime();
      const start = ((cursorTime > 0 && (e.altKey || e.ctrlKey)) || this.props.currentPlayMode === 'overallLoop') ? cursorTime : null;
      this.props.setCurrentSegment({ index: segmentIndex, start });
      if (this.tempRegion) this.tempRegion.remove();
    } else if (region) {
      this.current.wavesurfer?.play(region.start, region.end);
    }
  }

  clearAll() {
    Modal.confirm({
      className: 'modal-root',
      title: i18n.translate('COMMON_CLAER_CONFIRM_TITLE'),
      content: i18n.translate('COMMON_CLAER_CONFIRM_DESC'),
      autoFocusButton: null,
      okText: i18n.translate('COMMON_CLAER_CONFIRM_SURE'),
      okType: 'danger',
      cancelText: i18n.translate('COMMON_CLAER_CONFIRM_CANCEL'),
      onOk: () => {
        const { currentSegment } = this.props;
        const { videoIndex } = this.current;
        const segments = cloneDeep(this.currentSegments);
        this.props.setSegments({ videoIndex, segments: [] });
        this.wavesurfers[videoIndex].clearRegions();
        this.addHistory('clear_all', {
          after: {
            videoIndex,
            currentIndex: -1,
            segments: []
          },
          before: {
            videoIndex,
            currentIndex: currentSegment,
            segments
          },
        });
      },
    });
  }

  addHistory(type, data) {
    // update redo list each time
    this.current.redoList = [];
    this.current.undoList.push({ type, data });
    if (this.current.undoList.length > 50) {
      this.current.undoList.shift();
    }
  }

  recallHistory(action) {
    const { undoList, redoList } = this.current;
    const recallList = action === 'undo' ? undoList : redoList;
    if (!recallList.length) {
      return;
    }
    this.props.setCurrentSegment({ index: -1 });
    const recallItem = recallList.pop();
    const { type, data } = recallItem;
    switch (type) {
      case 'segment': {
        const { segmentIndex, prevSegment, nextSegment, region } = data;
        const currSegment = action === 'undo' ? prevSegment : nextSegment;
        const otherSegment = action === 'undo' ? nextSegment : prevSegment;
        if (currSegment && otherSegment) {
          this.props.updateSegment({ segment: currSegment });
          const currentRegion = this.getRegionById(currSegment.id);
          currentRegion.update({ start: currSegment.start, end: currSegment.end });
        } else if (region && currSegment && !otherSegment) {
          this.props.appendSegment({ segmentIndex, segment: currSegment });
          const currentRegion = this.current.wavesurfer.regions.add(region);
          this.updateRegionElement(currentRegion);
        } else if (region && !currSegment && otherSegment) {
          this.props.deleteSegment({ segmentIndex });
          const currentRegion = this.getRegionById(otherSegment.id);
          currentRegion.remove();
        }
        break;
      }
      case 'clear_all': {
        const { before, after } = data;
        const { videoIndex, currentIndex, segments } = action === 'undo' ? before : after;
        this.wavesurfers[videoIndex].clearRegions();
        this.props.setSegments({ videoIndex, segments });
        this.initRegion(videoIndex, segments);
        this.props.setCurrentSegment(currentIndex);
        break;
      }
      case 'pushLine':
        this.props.deleteLine({ ...data, actionType: 'history' });
        break;
      case 'deleteLine':
        this.props.pushLine({ ...data, actionType: 'history' });
        break;
      case 'setLineColor':
        this.props.setLineRole({ ...data, actionType: 'history' });
        break;
      default:
        break;
    }
    if (recallItem.type === 'pushLine') {
      recallItem.type = 'deleteLine';
    } else if (recallItem.type === 'deleteLine') {
      recallItem.type = 'pushLine';
    } if (recallItem.type === 'setLineColor') {
      const [nextRole, role] = [data.role, data.nextRole];
      recallItem.data.role = role;
      recallItem.data.nextRole = nextRole;
    }

    (action === 'undo' ? redoList : undoList).push(recallItem);
  }

  updateRegionElement(region) {
    const { element, start, end } = region;
    element.classList.add('dragged-region');
    if (this.props.spaceLine > 0) {
      const offset = this.props.spaceLine / (end - start);
      let startLine = element.querySelector('.space-line.space-line-start');
      let endLine = element.querySelector('.space-line.space-line-end');
      if (offset < 0.5) {
        if (!startLine) {
          startLine = document.createElement('div');
          startLine.className = 'space-line space-line-start';
          element.appendChild(startLine);
        }
        if (!endLine) {
          endLine = document.createElement('div');
          endLine.className = 'space-line space-line-end';
          element.appendChild(endLine);
        }
        startLine.style.left = `${offset * 100}%`;
        endLine.style.right = `${offset * 100}%`;
      } else {
        if (startLine) {
          startLine.remove();
        }
        if (endLine) {
          endLine.remove();
        }
      }
    }
  }

  updateMeasurement(index) {
    if (this.current.videoIndex === index) {
      // current video
      let cursorHelper = this.container.audioContainer[index].getElementsByClassName('audio-cursor-helper')[0];
      if (this.props.selectedMeasurement < 0) {
        if (cursorHelper) {
          cursorHelper.remove();
        }
      } else {
        const { zoom, wavesurfer } = this.current;
        if (!cursorHelper) {
          cursorHelper = document.createElement('div');
          cursorHelper.className = 'audio-cursor-helper';
          wavesurfer?.cursor?.cursor.appendChild(cursorHelper);
        }
        // calc width
        const duration = wavesurfer.getDuration();
        const { offsetWidth } = wavesurfer.container;
        const totalWidth = offsetWidth * zoom;
        const width = (totalWidth / duration) * this.props.selectedMeasurement;
        cursorHelper.style.width = `${width}px`;
        cursorHelper.style.left = `-${width / 2}px`;
      }
    }
  }

  renderSegments = () => {
    const { videos, results } = this.props;
    videos.forEach((v, i) => {
      if (v.ready) {
        this.wavesurfers[i].clearRegions();
        this.initRegion(i, results[i]);
      }
    });
  };

  render() { return null; }
}

const mapStateToProps = (state) => ({
  videos: state.videos,
  results: state.results,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  ontology: state.ontology,
  currentSegment: state.currentSegment,
  currentVideo: state.currentVideo,
  currentPlayMode: state.currentPlayMode,
  minSegmentLength: state.minSegmentLength,
  isPlaying: state.isPlaying,
  toolMode: state.toolMode,
  spaceLine: state.spaceLine,
  selectedMeasurement: state.selectedMeasurement,
  segmentOverlap: state.segmentOverlap,
  keyAttribute: state.keyAttribute,
  annotateDisabled: state.annotateDisabled,
  isLoadedAlaw: state.isLoadedAlaw,
  styleConfig: state.styleConfig,
});
const mapDispatchToProps = {
  getWavesurfers,
  setPlayingState,
  setVideoValid,
  deleteLine,
  pushLine,
  setLineRole,
  parseSegments,
  setErrorMsg,
  setAudioErrorMsg,
  appendSegment,
  updateSegment,
  deleteSegment,
  setSegments,
  updateLineRole,
  updateVideoInfo,
  setLoading,
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(WavesurferComp);
