/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import React from 'react';
import ReactDOM from 'react-dom';
import hexToRgba from 'hex-to-rgba';
import { notification, Modal } from 'antd';
import { cloneDeep } from 'lodash';
import WaveSurfer from 'wavesurfer.js/dist/wavesurfer';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor.min.js';
import MinimapPlugin from 'wavesurfer.js/src/plugin/minimap';
import { connect } from 'react-redux';
import { v4 as uuid } from 'uuid';
import { defaultColor, formatTimestamp, translate, triggerForm, StyleConfigMode, getConfigColor } from '../../constants';
import HandleIcon from '../common/Icons/HandleIcon';
import {
  debug,
  getWavesurfers,
  mergeSegmentBackward,
  setPlayingState,
  setSegmentTimestamp,
  splitSegmentForward,
  setVideoValid,
  setVideoZoom,
  deleteLine,
  pushLine,
  setLineRole,
  removeSegment,
  setSegments,
  parseSegments,
  setErrorMsg,
  setAudioErrorMsg,
  moveSegmentInBatch,
  updateVideoInfo,
  setLoading,
} from '../../redux/action';
import './WavesurferComp.scss';
import { createLine, createSegment, isInput } from '../../redux/reducer/segmentController';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';
import { timeInterval, primaryLabelInterval, secondaryLabelInterval, formatTimeCallback } from '../utils/TimelineUtil';
import i18n from '../../locales';

export const ANCHOR_MOVEMENT_STEP = 0.01;

class WavesurferComp extends React.Component {
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
    this.regions = {
      segments: [],
      anchors: [],
    };
    this.current = {
      zoom: 1,
      videoIndex: 0,
      wavesurfer: null,
      segments: null,
      anchors: null,
      segmentSelected: null,
      anchorSelected: null,
      undoList: null,
      redoList: null,
      undoLock: false,
      redoLock: false,
    };
    this.state = {
      cursorTime: 0, // seconds
    };
  }

  get currentSegments() {
    return this.props.results[this.current.videoIndex];
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.isLoadedAlaw !== this.props.isLoadedAlaw;
  }

  componentDidUpdate() {
    this.initWaveSurfer();
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
        const afterSegments = [{
          id: uuid(),
          start: 0,
          end: segments[segments.length - 1].end,
          attributes: {},
          content: [{ role: 'none', text: '', attributes: {} }],
          qaChecked: undefined,
          qaComment: '',
          qaReason: null,
        }];
        this.props.setSegments({ videoIndex, segments: afterSegments });
        this.wavesurfers[videoIndex].clearRegions();
        this.regions.segments[videoIndex] = [];
        this.regions.anchors[videoIndex] = [];
        this.current = {
          ...this.current,
          anchorSelected: null,
          anchors: null,
          segmentSelected: null,
          segments: null,
          videoIndex: 0,
        };
        const currentSegments = this.parseSegments(videoIndex, afterSegments);
        this.initRegion(videoIndex, currentSegments);
        this.current.segments = this.regions.segments[videoIndex];
        this.current.anchors = this.regions.anchors[videoIndex];
        this.addHistory('clear_all', {
          after: {
            videoIndex,
            currentIndex: 0,
            segments: afterSegments
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
    const { undoList, undoLock, redoLock, redoList } = this.current;
    let recallList;
    if (undoLock) recallList = redoList;
    else if (redoLock) recallList = undoList;
    else {
      recallList = undoList;
      this.current.redoList = [];
    }
    if (type === 'trimAnchor' && recallList.length) {
      const prev = recallList[recallList.length - 1];
      if (prev.type === 'trimAnchor' && prev.data.trimAnchor === data.trimAnchor) return;
    }
    recallList.push({ type, data });
    if (recallList.length > 50) recallList.shift();
  }

  recallHistory(action) {
    const { undoList, redoList, anchors } = this.current;
    const recallList = action === 'undo' ? undoList : redoList;
    if (!recallList.length) return;
    if (action === 'undo') this.current.undoLock = true; // lock
    if (action === 'redo') this.current.redoLock = true;
    const recallItem = recallList.pop();
    const { type, data } = recallItem;
    switch (type) {
      case 'singleLination-recall':
        this.singleLination(data.sec); // addHistory inside
        break;
      case 'doubleLination-recall':
        this.doubleLination(data.start, data.end); // addHistory inside
        break;
      case 'singleLination-adjust':
        {
          const { nearbyAnchorIndex, prevStart } = data;
          const nearbyAnchor = anchors[nearbyAnchorIndex];
          const sec = nearbyAnchor.start;
          nearbyAnchor.update({ start: prevStart });
          this.handleAnchorDrag(nearbyAnchor);
          this.addHistory('singleLination-recall', { sec });
        }
        break;
      case 'singleLination-split':
        {
          const { splitAnchorIndex } = data;
          const splitAnchor = anchors[splitAnchorIndex];
          const sec = splitAnchor.start;
          this.mergeSegment(splitAnchor);
          this.addHistory('singleLination-recall', { sec });
        }
        break;
      case 'doubleLination-adjust-adjust':
        {
          const { nearbyLeftAnchorIndex, prevLeftStart, nearbyRightAnchorIndex, prevRightStart } = data;
          const nearbyLeftAnchor = anchors[nearbyLeftAnchorIndex];
          const nearbyRightAnchor = anchors[nearbyRightAnchorIndex];
          const { start } = nearbyLeftAnchor;
          const end = nearbyRightAnchor.start;
          nearbyLeftAnchor.update({ start: prevLeftStart });
          this.handleAnchorDrag(nearbyLeftAnchor);
          nearbyRightAnchor.update({ start: prevRightStart });
          this.handleAnchorDrag(nearbyRightAnchor);
          this.addHistory('doubleLination-recall', { start, end });
        }
        break;
      case 'doubleLination-adjust-split':
        {
          const { nearbyLeftAnchorIndex, prevLeftStart, splitRightAnchorIndex } = data;
          const nearbyLeftAnchor = anchors[nearbyLeftAnchorIndex];
          const splitRightAnchor = anchors[splitRightAnchorIndex];
          const { start } = nearbyLeftAnchor.start;
          const end = splitRightAnchor.start;
          nearbyLeftAnchor.update({ start: prevLeftStart });
          this.handleAnchorDrag(nearbyLeftAnchor);
          this.mergeSegment(splitRightAnchor);
          this.addHistory('doubleLination-recall', { start, end });
        }
        break;
      case 'doubleLination-split-adjust':
        {
          const { splitLeftAnchorIndex, nearbyRightAnchorIndex, prevRightStart } = data;
          const splitLeftAnchor = anchors[splitLeftAnchorIndex];
          const nearbyRightAnchor = anchors[nearbyRightAnchorIndex];
          const { start } = splitLeftAnchor.start;
          const end = nearbyRightAnchor.start;
          this.mergeSegment(splitLeftAnchor);
          nearbyRightAnchor.update({ start: prevRightStart });
          this.handleAnchorDrag(nearbyRightAnchor);
          this.addHistory('doubleLination-recall', { start, end });
        }
        break;
      case 'doubleLination-split-split':
        {
          const { splitLeftAnchorIndex, splitRightAnchorIndex } = data;
          const splitLeftAnchor = anchors[splitLeftAnchorIndex];
          const splitRightAnchor = anchors[splitRightAnchorIndex];
          const { start } = splitLeftAnchor.start;
          const end = splitRightAnchor.start;
          this.mergeSegment(splitLeftAnchor);
          this.mergeSegment(splitRightAnchor);
          this.addHistory('doubleLination-recall', { start, end });
        }
        break;
      case 'pushLine':
        this.props.deleteLine(data); // addHistory inside
        break;
      case 'deleteLine':
        this.props.pushLine(data); // addHistory inside
        break;
      case 'dragAnchor':
        {
          const { dragAnchorIndex, prevStart } = data;
          const dragAnchor = anchors[dragAnchorIndex];
          const { start } = dragAnchor;
          dragAnchor.update({ start: prevStart });
          this.handleAnchorDrag(dragAnchor);
          this.addHistory('dragAnchor', { dragAnchorIndex, prevStart: start });
        }
        break;
      case 'trimAnchor':
        {
          const { trimAnchorIndex, prevStart } = data;
          const trimAnchor = anchors[trimAnchorIndex];
          const { start } = trimAnchor;
          trimAnchor.update({ start: prevStart });
          this.handleAnchorDrag(trimAnchor);
          this.addHistory('trimAnchor', { trimAnchorIndex, prevStart: start });
        }
        break;
      case 'mergeSegment':
        {
          const { mergeSec, prevRules, nextRules } = data;
          const splitSegment = this.getSegmentByTime(mergeSec);
          this.splitSegment(splitSegment, mergeSec, prevRules, nextRules);
        }
        break;
      case 'setLineColor':
        this.props.setLineRole(data); // addHistory inside
        break;
      case 'bulkMovement': {
        const { step } = data;
        const bulkMovementDirection = action === 'redo' ? 1 : -1;
        this.moveRegionsInBatch(bulkMovementDirection * step);
        this.addHistory('bulkMovement', { step: -bulkMovementDirection * step });
        break;
      }
      case 'clear_all': {
        const { before, after } = data;
        const { videoIndex, currentIndex, segments } = action === 'undo' ? before : after;
        this.wavesurfers[videoIndex].clearRegions();
        this.props.setSegments({ videoIndex, segments });
        this.regions = {
          segments: [],
          anchors: [],
        };

        this.regions.segments[videoIndex] = [];
        this.regions.anchors[videoIndex] = [];
        this.current = {
          ...this.current,
          anchorSelected: null,
          anchors: null,
          segmentSelected: null,
          segments: null,
          videoIndex: 0,
        };
        const currentSegments = this.parseSegments(videoIndex, segments);
        this.initRegion(videoIndex, currentSegments);
        this.current.segments = this.regions.segments[videoIndex];
        this.current.anchors = this.regions.anchors[videoIndex];
        this.props.setCurrentSegment({ index: currentIndex });
        break;
      }
      default:
        break;
    }
    if (action === 'undo') this.current.undoLock = false; // lock
    if (action === 'redo') this.current.redoLock = false;
  }

  // Called after currentVideo change
  setNewVideo() {
    const { videoIndex } = this.current;
    if (this.wavesurfers[videoIndex].isDestroyed) {
      console.error('Video destroyed:', videoIndex);
      return;
    }
    this.current.wavesurfer = this.wavesurfers[videoIndex];
    this.current.segments = this.regions.segments[videoIndex];
    this.current.anchors = this.regions.anchors[videoIndex];
    this.current.zoom = this.props.videos[videoIndex].zoom;
    this.current.undoList = this.undoList[videoIndex];
    this.current.redoList = this.redoList[videoIndex];
    this.setCurrentZoom();
  }

  setCurrentVideo(newVideoIndex) {
    const { videoIndex } = this.current;
    this.wavesurfers[videoIndex].pause();
    this.removeSelectedSegment();
    this.removeSelectedAnchor();
    this.current.videoIndex = newVideoIndex;
    this.setNewVideo();
  }

  removeSelectedAnchor() {
    const { anchorSelected } = this.current;
    if (!anchorSelected) return;
    anchorSelected.mark.classList.remove('anchor-mark-selected');
    this.current.anchorSelected = null;
  }

  setCurrentZoom(newZoom) {
    if (newZoom) this.current.zoom = newZoom;
    const { zoom, videoIndex, wavesurfer } = this.current;
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

  componentDidMount() {
    // Record currentTime and locate currentCursor
    setInterval(() => {
      if (!this.props.isPlaying) return;
      const { wavesurfer } = this.current;
      const currentTime = wavesurfer.getCurrentTime();
      const duration = wavesurfer.getDuration();
      wavesurfer.timestamp.innerText = `${formatTimestamp(currentTime)}/${formatTimestamp(duration)}`;
      this.setCurrentScroll(currentTime, 0, true);
    }, 200);
  }

  componentWillUnmount() {
    if (Array.isArray(this.container.audioContainer)) {
      this.container.audioContainer.forEach((c) => {
        if (c) {
          c.removeEventListener('mousemove', this.updateMeasurement);
          c.removeEventListener('wheel', this.updateMeasurement);
        }
      });
    }
  }

  setCurrentScroll(destTime, offsetLeft, boundaryCheck) {
    offsetLeft = offsetLeft || 0;
    destTime = destTime || 0;
    const { wavesurfer } = this.current;
    const { scrollLeft } = wavesurfer.container.lastChild;
    const { offsetWidth } = wavesurfer.container;
    const { minPxPerSec } = wavesurfer.params;
    const scrollTime = destTime - (offsetLeft - offsetWidth / 2) / minPxPerSec;
    const duration = wavesurfer.getDuration();
    if (!boundaryCheck) wavesurfer.drawer.recenter(scrollTime / duration);
    else {
      const rightBoundaryTime = (scrollLeft + offsetWidth) / minPxPerSec;
      const leftBoundaryTime = scrollLeft / minPxPerSec;
      if (destTime < leftBoundaryTime || destTime > rightBoundaryTime) wavesurfer.drawer.recenter(scrollTime / duration);
    }
  }

  insertLine = (data) => {
    // eslint-disable-next-line prefer-const
    let { start, end, role, videoIndex, segmentIndex, lineIndex, attributes } = data;
    const { segments } = this.regions;
    const { ontology, styleConfig } = this.props;
    videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? this.current.videoIndex : videoIndex;
    const wavesurfer = this.wavesurfers[videoIndex];
    lineIndex = Number.isNaN(parseInt(lineIndex, 10)) ? 0 : lineIndex;
    end = Number.isNaN(parseFloat(end)) ? wavesurfer.getDuration() : end;
    if (!segments[videoIndex]) segments[videoIndex] = [];
    if (!segments[videoIndex][segmentIndex]) segments[videoIndex][segmentIndex] = [];
    role = role || 'none';
    let configColor = '';
    if (attributes && styleConfig?.groups?.length > 0) {
      configColor = getConfigColor(attributes, styleConfig.groups);
    }
    const color = hexToRgba(
      configColor || ontology.get(role) || defaultColor.defaultWhite,
      (role === 'none' && !configColor) ? 0 : defaultColor.defaultAlpha
    );
    const item = {
      start,
      end,
      color,
      resize: false,
      drag: false,
      data: { type: 'line' },
      formatTimeCallback: () => '',
    };
    const region = wavesurfer.addRegion(item);
    region.element.classList.add('line-region');
    const mark = document.createElement('div');
    mark.className = 'line-mark';
    region.element.appendChild(mark);
    const title = document.createElement('div');
    title.className = 'line-title';
    title.innerText = lineIndex === 0 ? `${segmentIndex + 1}\n${(region.end - region.start).toFixed(3)}s (${formatTimestamp(region.start)}~${formatTimestamp(region.end)})` : '';
    mark.appendChild(title);
    region.title = title;
    region.role = role;
    segments[videoIndex][segmentIndex].splice(lineIndex, 0, region);
    segments[videoIndex][segmentIndex].filter((line) => !!line?.element).forEach((line, index, array) => {
      const height = 100 / array.length;
      const top = height * index;
      line.element.style.height = `${height}%`;
      line.element.style.top = `${top}%`;
    });
    return region;
  };

  insertSegment(data) {
    const { start, end, segmentIndex } = data;
    let { videoIndex } = data;
    videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? this.current.videoIndex : videoIndex;
    const { segments } = this.regions;
    if (!segments[videoIndex]) segments[videoIndex] = [];
    segments[videoIndex].splice(segmentIndex, 0, []);
    this.insertLine({ start, end, videoIndex, segmentIndex });
    return segments[videoIndex][segmentIndex];
  }

  insertTempAnchor(data) {
    const { segmentSelected } = this.current;
    const { start, end } = data;
    const items = [{
      start,
      resize: false,
      drag: true,
      data: { type: 'tempAnchor', prevStart: start },
      formatTimeCallback: () => '',
    }, {
      start: end,
      resize: false,
      drag: true,
      data: { type: 'tempAnchor', prevStart: end },
    }];
    const { wavesurfer } = this.current;
    const regions = new Array(2);
    regions[0] = wavesurfer.addRegion(items[0]);
    regions[1] = wavesurfer.addRegion(items[1]);
    // eslint-disable-next-line prefer-destructuring
    segmentSelected.leftTempAnchor = regions[0];
    // eslint-disable-next-line prefer-destructuring
    segmentSelected.rightTempAnchor = regions[1];
    // eslint-disable-next-line no-restricted-syntax
    for (const region of regions) {
      region.element.classList.add('anchor-region');
      const handle = document.createElement('div');
      handle.className = 'anchor-handle';
      ReactDOM.render((<HandleIcon style={{ height: '100%', width: '100%' }} viewBox="0, 10, 16, 16" />), handle);
      region.element.appendChild(handle);
      region.hanlde = handle;
      const mark = document.createElement('div');
      mark.className = 'anchor-mark-temp';
      region.element.appendChild(mark);
      region.mark = mark;
    }
  }

  insertAnchor(data) {
    // eslint-disable-next-line prefer-const
    let { start, videoIndex, segmentIndex } = data;
    const { toolMode } = this.props;
    const { anchors } = this.regions;

    videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? this.current.videoIndex : videoIndex;
    if (!anchors[videoIndex]) anchors[videoIndex] = [];
    if (segmentIndex === 0) return;
    if (!anchors[videoIndex]) anchors[videoIndex] = [];
    const wavesurfer = this.wavesurfers[videoIndex];
    const item = {
      start,
      resize: false,
      drag: !isAnnotationReadonly(toolMode), // toolMode !== 'QA_RO',
      data: { type: 'anchor', prevStart: start },
      formatTimeCallback: () => '',
    };
    const region = wavesurfer.addRegion(item);
    anchors[videoIndex].splice(segmentIndex - 1, 0, region);
    region.element.classList.add('anchor-region');
    const handle = document.createElement('div');
    handle.className = 'anchor-handle';
    if (isAnnotationReadonly(toolMode)) handle.classList.add('anchor-handle-lock');
    ReactDOM.render((<HandleIcon style={{ height: '100%', width: '100%' }} viewBox="0, 10, 16, 16" />), handle);
    region.element.appendChild(handle);
    region.hanlde = handle;
    const mark = document.createElement('div');
    mark.className = 'anchor-mark';
    region.element.appendChild(mark);
    region.mark = mark;
    return region;
  }

  removeSelectedSegment() {
    const { segmentSelected, anchorSelected } = this.current;
    if (anchorSelected && anchorSelected.data.type === 'tempAnchor') this.removeSelectedAnchor();
    if (segmentSelected && segmentSelected.data.type === 'temp') {
      segmentSelected.remove();
      if (segmentSelected.leftTempAnchor) segmentSelected.leftTempAnchor.remove();
      if (segmentSelected.rightTempAnchor) segmentSelected.rightTempAnchor.remove();
    }
    this.current.segmentSelected = null;
  }

  setSelectedSegment(region) {
    this.removeSelectedSegment();
    if (region.data.type === 'line') this.current.wavesurfer.frame.update({ start: region.start, end: region.end });
    this.current.segmentSelected = region;
  }

  setCurrentSegment(currentSegment, start) {
    const { currentPlayMode } = this.props;
    const { wavesurfer } = this.current;
    const region = this.current.segments?.[currentSegment]?.[0];
    start = start || region?.start;
    this.setSelectedSegment(region);
    this.seekCurrentAudio(start);
    this.setCurrentScroll(start, 0, true);
    if (currentPlayMode !== 'overallLoop') {
      wavesurfer.play();
    }
  }

  setLineColor(videoIndex, segmentIndex, lineIndex, role) {
    try {
      const { results, styleConfig } = this.props;
      const segment = results[videoIndex][segmentIndex];
      const line = this.regions.segments[videoIndex][segmentIndex][lineIndex];
      const prevRole = line.role;
      let color = '';
      if (styleConfig?.groups?.length > 0) {
        const attributes = styleConfig?.mode === StyleConfigMode.line ? line.attributes : segment.attributes;
        color = getConfigColor(attributes, styleConfig.groups);
      }
      if (!color) {
        color = this.props.ontology.get(role);
      }

      line.update({ color: hexToRgba(color, !color ? 0 : defaultColor.defaultAlpha) });
      line.role = role;
      this.addHistory('setLineColor', { videoIndex, segmentIndex, lineIndex, role: prevRole });
    } catch (e) { console.error('Line region not found'); }
  }

  setSegmentColor(videoIndex, segmentIndex, lines, color) {
    const segment = this.regions.segments[videoIndex][segmentIndex];
    for (let i = 0; i < lines.length; i += 1) {
      const lineIndex = lines[i];
      const line = segment[lineIndex];
      const roleColor = this.props.ontology.get(line.role);
      const rgba = hexToRgba(
        color || roleColor || defaultColor.defaultWhite,
        !color && line.role === 'none' ? 0 : defaultColor.defaultAlpha
      );
      if (line && rgba !== line.color) {
        line.update({ color: rgba });
      }
    }
  }

  getAudioContainer(waveform, timeline, audioContainer, minimap) {
    this.container.waveform = waveform;
    this.container.timeline = timeline;
    this.container.audioContainer = audioContainer;
    this.container.minimap = minimap;
    if (this.container.videoContainer) this.initWaveSurfer();
  }

  getVideoContainer(videoContainer) {
    this.container.videoContainer = videoContainer;
    if (this.container.waveform) this.initWaveSurfer();
  }

  pauseVideo() {
    this.current.wavesurfer.pause();
  }

  playVideo() {
    const { wavesurfer, segmentSelected } = this.current;
    if (segmentSelected && wavesurfer.getCurrentTime() > segmentSelected.end - ANCHOR_MOVEMENT_STEP) {
      this.seekCurrentAudio(segmentSelected.start);
      this.setCurrentScroll(segmentSelected.start, 0, true);
    }
    wavesurfer.play();
  }

  forwardVideo() {
    this.current.wavesurfer.skipForward(0.5);
  }

  backwardVideo() {
    this.current.wavesurfer.skipBackward(0.5);
  }

  parseSegments(videoIndex, segs) {
    const { results, ontology, lineConfig, keyAttribute, segmentConfig } = this.props;
    const segments = Array.isArray(segs) ? segs : results[videoIndex];
    const wavesurfer = this.wavesurfers[videoIndex];
    const duration = wavesurfer.getDuration();
    const segmentConfigValidKeys = segmentConfig.fields.map((value) => value.name);
    if (keyAttribute) {
      segmentConfigValidKeys.push(keyAttribute.name);
    }
    const lineConfigValidKeys = lineConfig.fields.map((value) => value.name);
    const { updatedValues: updateLineValues } = triggerForm(lineConfig, {});
    const { updatedValues: updateSegmentValues } = triggerForm(segmentConfig, {});
    const ontologyValidKeys = [];
    ontology.forEach((value, key) => {
      ontologyValidKeys.push(key);
    });
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
      // validate segment start
      if (!segment.start && segment.start !== 0) {
        throw new Error(`${translate('PAYLOAD_ERROR_SEGMENT_START_NULL')} ${JSON.stringify(segment)}`);
      }
      if (segment.end === null || segment.end === undefined) {
        segment.end = duration;
      }
      if (segment.end > duration) {
        segment.end = duration;
        console.log(`${translate('PAYLOAD_ERROR_SEGMENT_LENGTH_OVERFLOW')} ${JSON.stringify(segment)} set as max=${duration}`);
      }
      if (segment.start < 0 || segment.end < 0 || segment.start > segment.end) {
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
    }
    // segments = segments.filter(segment => segment.isValid);
    const MIN_LENGTH = this.props.minSegmentLength;
    segments.sort((a, b) => {
      if (a.start < b.start + MIN_LENGTH && a.start > b.start - MIN_LENGTH) {
        if (a.end == null) return -1;
        if (b.end == null) return 1;
        return a.end - b.end;
      }
      return a.start - b.start;
    });
    let currentEnd = 0;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (segment.end - segment.start <= MIN_LENGTH && i < segments.length - 1) {
        segments[i + 1].start = segment.start;
        segments.splice(i, 1);
        i -= 1;
      } else if ((segment.start > currentEnd - MIN_LENGTH) && (segment.start < currentEnd + MIN_LENGTH) && (segment.end > currentEnd || !segment.end)) {
        segments[i].start = currentEnd;
        currentEnd = segment.end;
      } else if (segment.start < currentEnd - MIN_LENGTH || currentEnd == null) {
        // throw new Error(`${translate('PAYLOAD_ERROR_OVERLAP_SEGMENT')} ${JSON.stringify(segment)} start=${segment.start} currentEnd=${currentEnd} min=${MIN_LENGTH}`);
        segments.splice(i, 1);
        i -= 1;
      } else if (segment.start > currentEnd + MIN_LENGTH) {
        segments.splice(i, 0, createSegment(currentEnd, segment.start, segmentConfig, lineConfig));
        currentEnd = segment.end;
        i += 1;
      }
      if (i === segments.length - 1) {
        if (segment.end < duration) {
          if (duration - segment.end <= MIN_LENGTH) {
            segment.end = duration;
          } else {
            segments.push(createSegment(segment.end, duration, segmentConfig, lineConfig));
          }
        }
      }
    }
    // videoIndex, segments
    this.props.parseSegments({
      videoIndex,
      segments,
    });
    return segments;
  }

  initRegion(videoIndex, segments) {
    const wavesurfer = this.wavesurfers[videoIndex];
    wavesurfer.frame = wavesurfer.addRegion({
      start: segments[0].start,
      end: segments[0].end,
      color: 'rgba(0,0,0,0)',
      resize: false,
      drag: false,
    });
    wavesurfer.frame.element.classList.add('segment-frame');
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex];
      segment.content.forEach((line, lineIndex) => {
        const attributes = this.props.styleConfig?.mode === StyleConfigMode.segment ? segment.attributes : line.attributes;
        this.insertLine({
          videoIndex,
          segmentIndex,
          lineIndex,
          role: line.role,
          start: segment.start,
          end: segment.end,
          attributes,
        });
      });
      this.insertAnchor({
        videoIndex,
        segmentIndex,
        start: segment.start,
      });
    }
  }

  getSegmentByRegion(region) {
    let segmentIndex = -1;
    const { segments } = this.current;
    segments.forEach((segment, index) => {
      if (segment.indexOf(region) >= 0) segmentIndex = index;
    });
    return segmentIndex;
  }

  seekCurrentAudio(currentTime = 0) {
    const { wavesurfer } = this.current;
    const duration = wavesurfer.getDuration();
    /*
    currentTime = currentTime || 0;
    let rate = currentTime / duration;
    if (rate > 1) rate = 1;
    if (rate < 0) rate = 0;
    wavesurfer.seekTo(rate);
    */
    // Skip function wavesurfer.seekTo(progress), use wavesurfer.backend.seekTo(time) instead.
    // Fireevent seek will be ignored
    if (currentTime < 0) currentTime = 0;
    if (currentTime > duration) currentTime = duration;
    wavesurfer.backend.seekTo(currentTime);
  }

  handleRegionClick(region, e) {
    e.stopPropagation();
    const { currentPlayMode } = this.props;
    if (region.data.type === 'temp') {
      this.setCurrentScroll(region.start, 0, true);
      region.play();
    } else if (region.data.type === 'line') {
      const segmentIndex = this.getSegmentByRegion(region);
      const cursorTime = this.getCursorTime();
      const start = ((cursorTime > 0 && (e.altKey || e.ctrlKey)) || currentPlayMode === 'overallLoop') ? cursorTime : null;
      if (segmentIndex >= 0) this.props.setCurrentSegment({ index: segmentIndex, start });
    } else if (region.data.type === 'anchor' || region.data.type === 'tempAnchor') {
      const { anchorSelected } = this.current;
      if (region !== anchorSelected) this.setSelectedAnchor(region);
      else this.removeSelectedAnchor();
    }
  }

  setSelectedAnchor(region) {
    this.removeSelectedAnchor();
    region.mark.classList.add('anchor-mark-selected');
    this.current.anchorSelected = region;
  }

  getCursorTime() {
    return this.state.cursorTime;
  }

  setCurrentSpeed(speed) {
    this.current.wavesurfer?.setPlaybackRate(speed);
  }

  resetRegionTitle() {
    const { segments } = this.current;
    segments.forEach((segment, segmentIndex) => {
      segment.forEach((line, lineIndex) => {
        line.title.innerText = lineIndex === 0 ? `${segmentIndex + 1}\n${(line.end - line.start).toFixed(3)} [${formatTimestamp(line.start)}~${formatTimestamp(line.end)}]` : '';
      });
    });
  }

  moveRegionsInBatch(step) {
    const { wavesurfer, anchors, segmentSelected } = this.current;
    const min = 0;
    const max = wavesurfer.getDuration();
    Object.keys(wavesurfer.regions.list).forEach((id) => {
      const region = wavesurfer.regions.list[id];
      if (region.data.type !== 'line') {
        return;
      }
      this.__moveRegion(region, step, min, max);
      if (segmentSelected === region) { wavesurfer.frame.update({ start: region.start, end: region.end }); }
    });
    anchors.forEach((anchor) => {
      this.__moveRegion(anchor, step, min, max);
    });
    this.props.moveSegmentInBatch({ step, min, max });
    this.resetRegionTitle();
  }

  __moveRegion(region, step, min, max) {
    if (region.start > min || region.end < max) {
      if (region.start > min) {
        region.start = region.start + step < min ? min : region.start + step;
      }
      if (region.end < max) {
        region.end = region.end + step > max ? max : region.end + step;
      }
      region.update({ start: region.start, end: region.end });
    }
  }

  handleAnchorDrag(region) {
    const { wavesurfer, anchors, segments, segmentSelected } = this.current;
    const { minSegmentLength, toolMode } = this.props;
    const i = anchors.indexOf(region);
    if (i < 0) return false;
    const leftBoundary = (i === 0) ? 0 : anchors[i - 1].start;
    const rightBoundary = (i === anchors.length - 1) ? wavesurfer.getDuration() : anchors[i + 1].start;
    if (region.start < rightBoundary - minSegmentLength && region.start > leftBoundary + minSegmentLength && !isAnnotationReadonly(toolMode)) {
      region.data.prevStart = region.start;
      const prevSegment = segments[i];
      const nextSegment = segments[i + 1];
      prevSegment.forEach((line) => {
        line.update({ end: region.start });
      });
      nextSegment.forEach((line) => {
        line.update({ start: region.start });
      });
      this.props.setSegmentTimestamp({ segmentIndex: i, end: region.start });
      this.props.setSegmentTimestamp({ segmentIndex: i + 1, start: region.start });
      this.resetRegionTitle();
      if (segmentSelected === prevSegment[0]) { wavesurfer.frame.update({ start: prevSegment[0].start, end: prevSegment[0].end }); }
      if (segmentSelected === nextSegment[0]) { wavesurfer.frame.update({ start: nextSegment[0].start, end: nextSegment[0].end }); }
      return true;
    }
    region.update({ start: region.data.prevStart, end: region.data.prevStart });
    return false;
  }

  handleRegionUpdate(region, e) {
    const { type } = region.data;
    const { segmentSelected } = this.current;
    if (type === 'temp' && region !== segmentSelected) {
      this.setSelectedSegment(region);
      region.element.classList.add('line-region');
    }
  }

  handleRegionEdit(region) {
    const { type } = region.data;
    const { wavesurfer } = this.current;
    if (type === 'temp') {
      if ((region.end - region.start < this.props.minSegmentLength) || this.props.currentPlayMode === 'overallLoop') {
        this.removeSelectedSegment();
      } else {
        region.play();
        this.insertTempAnchor({ start: region.start, end: region.end });
        wavesurfer.frame.update({ start: region.start, end: region.end });
      }
    } else if (type === 'anchor') {
      const { prevStart } = region.data;
      const { anchors } = this.current;
      const result = this.handleAnchorDrag(region);
      if (result === false) return;
      const dragAnchorIndex = anchors.indexOf(region);
      this.addHistory('dragAnchor', { dragAnchorIndex, prevStart });
      this.setSelectedAnchor(region);
    } else if (type === 'tempAnchor') {
      this.setTempSegment();
    }
  }

  setTempSegment() {
    const { segmentSelected, wavesurfer } = this.current;
    const { leftTempAnchor, rightTempAnchor } = segmentSelected;
    if (leftTempAnchor.start > rightTempAnchor.start - this.props.minSegmentLength) {
      leftTempAnchor.update({ start: leftTempAnchor.data.prevStart });
      rightTempAnchor.update({ start: rightTempAnchor.data.prevStart });
    } else {
      leftTempAnchor.data.prevStart = leftTempAnchor.start;
      rightTempAnchor.data.prevStart = rightTempAnchor.start;
      segmentSelected.update({ start: leftTempAnchor.start, end: rightTempAnchor.start });
      wavesurfer.frame.update({ start: segmentSelected.start, end: segmentSelected.end });
    }
  }

  handleRegionOut(region) {
    const { currentPlayMode } = this.props;
    const { segmentSelected, wavesurfer } = this.current;
    const { type } = region.data;
    if (type !== 'line' && type !== 'temp') return;
    if (segmentSelected === region && currentPlayMode === 'regionLoop') {
      this.seekCurrentAudio(region.start);
      this.setCurrentScroll(region.start, 0, true);
    } else if (segmentSelected === region && currentPlayMode === 'regionPlay') {
      wavesurfer.pause();
      this.seekCurrentAudio(region.end);
    }
  }

  handlePlayPause() {
    this.props.setPlayingState({ isPlaying: this.current.wavesurfer.isPlaying() });
  }

  handleRegionContextmenu(region, e) {
    e.preventDefault();
    if (region.data.type === 'anchor') {
      const { anchors, segments } = this.current;
      const i = anchors.indexOf(region);
      const nextSegment = segments[i + 1];
      const prevSegment = segments[i];
      const nextRules = [];
      const prevRules = [];
      prevSegment.forEach((line, index) => {
        prevRules.push({
          role: line.role,
          start: line.start,
          end: line.end,
          segmentIndex: i,
          lineIndex: index,
        });
      });
      nextSegment.forEach((line, index) => {
        nextRules.push({
          role: line.role,
          start: line.start,
          end: line.end,
          segmentIndex: i + 1,
          lineIndex: index,
        });
      });
      this.mergeSegment(region);
      const mergeSec = region.start;
      this.addHistory('mergeSegment', { mergeSec, prevRules, nextRules });
    }
  }

  mergeSegment(region) {
    const { anchors, segments, anchorSelected, segmentSelected, wavesurfer } = this.current;
    const i = anchors.indexOf(region);
    const nextSegment = segments[i + 1];
    const prevSegment = segments[i];
    const { start } = prevSegment[0];
    const { end } = nextSegment[0];
    const prevRules = [];
    if (anchorSelected === region) this.removeSelectedAnchor();
    region.remove();
    anchors.splice(i, 1);
    this.props.setSegmentTimestamp({ segmentIndex: i, end });
    prevSegment.forEach((line, index) => {
      prevRules.push(line.role);
      line.update({ end });
    });
    this.props.setCurrentSegment({ index: i });
    this.props.mergeSegmentBackward({ segmentIndex: i + 1 });
    nextSegment.forEach((line) => {
      if (prevRules.indexOf(line.role) < 0 && line.role !== 'none') {
        this.insertLine({
          start,
          end,
          role: line.role,
          segmentIndex: i,
          lineIndex: prevSegment.length,
        });
      }
      line.remove();
    });
    segments.splice(i + 1, 1);
    if (segmentSelected === prevSegment[0]) { wavesurfer.frame.update({ start: prevSegment[0].start, end: prevSegment[0].end }); }
    this.resetRegionTitle();
  }

  // eslint-disable-next-line class-methods-use-this
  setPlayMode(mode) {
    // none
  }

  checkNearbyAnchor(sec) {
    const { anchors } = this.current;
    const { minSegmentLength } = this.props;
    let invalidAnchor = null;
    let minDistance = null;
    anchors.forEach((value) => {
      const distance = Math.abs(value.start - sec);
      if (distance < minSegmentLength) {
        if (!invalidAnchor || minDistance > distance) {
          invalidAnchor = value;
          minDistance = distance;
        }
      }
    });
    return invalidAnchor;
  }

  singleLination(sec) {
    const { minSegmentLength, annotateDisabled } = this.props;
    const { wavesurfer, anchors } = this.current;
    if (sec < minSegmentLength ||  annotateDisabled) return;
    if (sec > wavesurfer.getDuration() - minSegmentLength) return;
    const nearbyAnchor = this.checkNearbyAnchor(sec);
    if (nearbyAnchor) {
      const prevStart = nearbyAnchor.start;
      nearbyAnchor.update({ start: sec });
      this.handleAnchorDrag(nearbyAnchor);
      const nearbyAnchorIndex = anchors.indexOf(nearbyAnchor);
      this.addHistory('singleLination-adjust', { nearbyAnchorIndex, prevStart });
    } else {
      const splitSegment = this.getSegmentByTime(sec);
      const splitAnchor = this.splitSegment(splitSegment, sec);
      const splitAnchorIndex = anchors.indexOf(splitAnchor);
      this.addHistory('singleLination-split', { splitAnchorIndex });
    }
  }

  getSegmentByTime(sec) {
    const { segments } = this.current;
    // eslint-disable-next-line no-restricted-syntax
    for (const value of segments) {
      const line = value[0];
      if (line.start <= sec && line.end >= sec) return value;
    }
    return null;
  }

  splitSegment(segment, sec, prevRules, nextRules, focusPrevSegment) {
    const { segments, anchors } = this.current;
    if (!segment) return;
    const { end } = segment[0];
    const i = segments.indexOf(segment);
    const anchor = this.insertAnchor({ start: sec, segmentIndex: i + 1 });
    this.insertSegment({ start: sec, end, segmentIndex: i + 1 });
    segment.forEach((line) => { line.update({ end: sec }); });
    if (prevRules && nextRules) {
      const arr = [];
      prevRules.forEach((rule) => { arr.push(rule.role); });
      segment.forEach((line, index) => {
        if (arr.indexOf(line.role) < 0) this.deleteLine({ lineIndex: index, segmentIndex: i });
      });
      this.deleteLine({ lineIndex: 0, segmentIndex: i + 1 });
      nextRules.forEach((role) => { this.insertLine(role); });
      const splitAnchorIndex = anchors.indexOf(anchor);
      this.addHistory('singleLination-split', { splitAnchorIndex });
    }
    this.props.setSegmentTimestamp({ segmentIndex: i, end: sec });
    this.props.splitSegmentForward({ segmentIndex: i, start: sec, end, prevRules, nextRules });
    this.removeSelectedSegment();
    this.resetRegionTitle();
    this.props.setCurrentSegment({ index: focusPrevSegment ? i : i + 1 });
    return anchor;
  }

  deleteLine(data) {
    const { segments } = this.current;
    const { segmentIndex, lineIndex } = data;

    const segment = segments[segmentIndex];
    const line = segment[lineIndex];
    data.start = line.start;
    data.end = line.end;
    data.role = line.role;
    line.remove();
    segment.splice(lineIndex, 1);
    // eslint-disable-next-line no-shadow
    segment.forEach((li, index, array) => {
      const height = 100 / array.length;
      const top = height * index;
      li.element.style.height = `${height}%`;
      li.element.style.top = `${top}%`;
    });
    this.resetRegionTitle();
  }

  toppingLine(data) {
    const { segments } = this.current;
    const { segmentIndex, lineIndex } = data;

    const segment = segments[segmentIndex];
    const line = segment[lineIndex];
    segment.splice(lineIndex, 1);
    segment.unshift(line);
    // eslint-disable-next-line no-shadow
    segment.forEach((li, index, array) => {
      const height = 100 / array.length;
      const top = height * index;
      li.element.style.height = `${height}%`;
      li.element.style.top = `${top}%`;
    });
    this.resetRegionTitle();
  }

  doubleLination(start, end) {
    const { minSegmentLength, annotateDisabled } = this.props;
    const { anchors, segmentSelected } = this.current;
    if (!start || Number.isNaN(start)) start = segmentSelected.start;
    if (!end || Number.isNaN(end)) end = segmentSelected.end;
    if (end - start <= minSegmentLength || annotateDisabled) return;
    const nearbyLeftAnchor = this.checkNearbyAnchor(start);
    const nearbyRightAnchor = this.checkNearbyAnchor(end);
    const prevLeftStart = nearbyLeftAnchor ? nearbyLeftAnchor.start : -1;
    const prevRightStart = nearbyRightAnchor ? nearbyRightAnchor.start : -1;
    if (start < minSegmentLength) return;
    if (end > this.current.wavesurfer.getDuration() - minSegmentLength) return;

    if (nearbyLeftAnchor && nearbyRightAnchor) {
      nearbyLeftAnchor.update({ start });
      this.handleAnchorDrag(nearbyLeftAnchor);
      nearbyRightAnchor.update({ start: end });
      this.handleAnchorDrag(nearbyRightAnchor);
      const nearbyLeftAnchorIndex = anchors.indexOf(nearbyLeftAnchor);
      const nearbyRightAnchorIndex = anchors.indexOf(nearbyRightAnchor);
      this.addHistory('doubleLination-adjust-adjust', { nearbyLeftAnchorIndex, prevLeftStart, nearbyRightAnchorIndex, prevRightStart });
    } else if (!nearbyLeftAnchor && nearbyRightAnchor) {
      const splitLeftSegment = this.getSegmentByTime(start);
      const splitLeftAnchor = this.splitSegment(splitLeftSegment, start);
      nearbyRightAnchor.update({ start: end });
      this.handleAnchorDrag(nearbyRightAnchor);
      const splitLeftAnchorIndex = anchors.indexOf(splitLeftAnchor);
      const nearbyRightAnchorIndex = anchors.indexOf(nearbyRightAnchor);
      this.addHistory('doubleLination-split-adjust', { splitLeftAnchorIndex, nearbyRightAnchorIndex, prevRightStart });
    } else if (nearbyLeftAnchor && !nearbyRightAnchor) {
      nearbyLeftAnchor.update({ start });
      this.handleAnchorDrag(nearbyLeftAnchor);
      const splitRightSegment = this.getSegmentByTime(end);
      const splitRightAnchor = this.splitSegment(splitRightSegment, end);
      const splitRightAnchorIndex = anchors.indexOf(splitRightAnchor);
      const nearbyLeftAnchorIndex = anchors.indexOf(nearbyLeftAnchor);
      this.addHistory('doubleLination-adjust-split', { nearbyLeftAnchorIndex, prevLeftStart, splitRightAnchorIndex });
    } else {
      const splitLeftSegment = this.getSegmentByTime(start);
      const splitLeftAnchor = this.splitSegment(splitLeftSegment, start);
      const splitRightSegment = this.getSegmentByTime(end);
      const splitRightAnchor = this.splitSegment(splitRightSegment, end, null, null, true);
      const splitRightAnchorIndex = anchors.indexOf(splitRightAnchor);
      const splitLeftAnchorIndex = anchors.indexOf(splitLeftAnchor);
      this.addHistory('doubleLination-split-split', { splitLeftAnchorIndex, splitRightAnchorIndex });
    }
  }

  handleKeyDown(e) {
    if (window.disableLongAudioHotKeys) return;
    if (isInput()) return;
    if (isAnnotationReadonly(this.props.toolMode)) return;
    // if (this.props.toolMode === 'QA_RO') return;
    if (e.keyCode === 83) { // s
      const sec = this.getCursorTime();
      if (sec < 0) return;
      this.singleLination(sec);
    } else if (e.keyCode === 68) { // d
      const { segmentSelected } = this.current;
      if (segmentSelected && segmentSelected.data.type === 'temp') this.doubleLination();
    } else if (e.keyCode === 188) { // , || <
      if (e.ctrlKey) {
        this.moveRegionsInBatch(-ANCHOR_MOVEMENT_STEP);
        this.addHistory('bulkMovement', { step: -ANCHOR_MOVEMENT_STEP });
      } else {
        this.forwardAnchor();
      }
    } else if (e.keyCode === 190) { // . | >
      if (e.ctrlKey) {
        this.moveRegionsInBatch(ANCHOR_MOVEMENT_STEP);
        this.addHistory('bulkMovement', { step: ANCHOR_MOVEMENT_STEP });
      } else {
        this.backwardAnchor();
      }
    } else if (e.ctrlKey && e.keyCode === 90) { // z
      this.recallHistory('undo');
    } else if (e.ctrlKey && e.keyCode === 89) { // y
      this.recallHistory('redo');
    } else if ((e.keyCode === 8 || e.keyCode === 46) && e.ctrlKey) { // ctrl + delete/backspace
      this.clearAll();
    }
  }

  backwardAnchor() {
    const { anchorSelected, wavesurfer, anchors } = this.current;
    if (!anchorSelected) return;
    if (anchorSelected.start + ANCHOR_MOVEMENT_STEP >= wavesurfer.getDuration()) return;
    anchorSelected.update({ start: anchorSelected.start + ANCHOR_MOVEMENT_STEP });
    if (anchorSelected.data.type === 'anchor') {
      this.handleAnchorDrag(anchorSelected);
      const trimAnchorIndex = anchors.indexOf(anchorSelected);
      this.addHistory('trimAnchor', { trimAnchorIndex, prevStart: anchorSelected.start - ANCHOR_MOVEMENT_STEP });
    } else if (anchorSelected.data.type === 'tempAnchor') this.setTempSegment();
  }

  forwardAnchor() {
    const { anchorSelected, anchors } = this.current;
    if (!anchorSelected) return;
    if (anchorSelected.start - ANCHOR_MOVEMENT_STEP <= 0) return;
    anchorSelected.update({ start: anchorSelected.start - ANCHOR_MOVEMENT_STEP });
    if (anchorSelected.data.type === 'anchor') {
      this.handleAnchorDrag(anchorSelected);
      const trimAnchorIndex = anchors.indexOf(anchorSelected);
      this.addHistory('trimAnchor', { trimAnchorIndex, prevStart: anchorSelected.start + ANCHOR_MOVEMENT_STEP });
    } else if (anchorSelected.data.type === 'tempAnchor') this.setTempSegment();
  }

  handleRegionIn(region) {
    const { currentPlayMode, currentSegment } = this.props;
    const { wavesurfer } = this.current;
    const { type } = region.data;
    if (type !== 'line') return;
    if (currentPlayMode === 'overallLoop') {
      const segmentIndex = this.getSegmentByRegion(region);
      const currentTime = wavesurfer.getCurrentTime();
      if (segmentIndex === currentSegment) return;
      if (segmentIndex >= 0) this.props.setCurrentSegment({ index: segmentIndex, start: currentTime });
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
          // partialRender: true,
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
            color: hexToRgba(defaultColor.defaultRed, defaultColor.defaultAlpha),
            drag: false,
            resize: false,
            data: { type: 'temp' },
            formatTimeCallback: () => '',
          });
          let segments;
          try {
            segments = this.parseSegments(i);
          } catch (e) {
            console.log('Error', e);
            this.props.setErrorMsg({ errorMsg: e?.toString() });
            return;
          }
          this.props.setLoading(false);
          this.initRegion(i, segments);
          this.initMiniMap(i);
          if (!i) {
            this.setNewVideo();
            this.setSelectedSegment(this.current.segments[0][0]);
          }
          if (i === 0) this.addWindowEvent();
          this.wavesurfers[i].on('play', (e) => this.handlePlayPause());
          this.wavesurfers[i].on('pause', (e) => this.handlePlayPause());
          this.wavesurfers[i].on('region-updated', (region, e) => this.handleRegionUpdate(region, e));
          this.wavesurfers[i].on('region-contextmenu', (region, e) => this.handleRegionContextmenu(region, e));
          this.wavesurfers[i].on('region-update-end', (region, e) => this.handleRegionEdit(region));
          this.wavesurfers[i].on('region-out', (region, e) => this.handleRegionOut(region));
          this.wavesurfers[i].on('region-in', (region, e) => this.handleRegionIn(region));
          this.wavesurfers[i].on('region-click', (region, e) => this.handleRegionClick(region, e));
          this.wavesurfers[i].un('ready');
          this.wavesurfers[i].un('error');
          this.wavesurfers[i].on('redraw', this.props.setXScroll);
          this.props.setVideoValid({ index: i });
          this.props.updateVideoInfo({ index: i, duration: this.wavesurfers[i].getDuration() });
        });
        this.wavesurfers[i].on('error', (error) => {
          notification.error({ message: `${translate('AUDIO_ERROR')} ${translate('RECORD_PREFIX')}${i + 1}` });
          this.props.setAudioErrorMsg({
            index: i,
            errorMsg: `${translate('AUDIO_ERROR')} ${translate('RECORD_PREFIX')}${i + 1} ${urls[i].src} ${error}`
          });
          this.wavesurfers[i].un('ready');
          this.wavesurfers[i].un('error');
          this.wavesurfers[i].destroy();
          if (i === size - 1) {
            this.props.setLoading(false);
          }
        });
        this.undoList[i] = [];
        this.redoList[i] = [];

        this.container.audioContainer[i].addEventListener('mousemove', () => this.updateMeasurement(i));
        this.container.audioContainer[i].addEventListener('wheel', () => this.updateMeasurement(i));
        this.wavesurfers[i].load(this.container.videoContainer[i]);
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

  addWindowEvent() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('resize', (e) => this.setCurrentZoom());
  }

  // eslint-disable-next-line react/no-deprecated
  componentWillMount() {
    this.props.getWavesurfers({ wavesurfers: this });
  }

  renderSegments = () => {
    const { videos, results } = this.props;
    this.regions = { segments: [], anchors: [] };
    videos.forEach((v, i) => {
      if (v.ready) {
        this.wavesurfers[i].clearRegions();
        this.initRegion(i, results[i]);
        if (i === this.current.videoIndex) {
          this.setNewVideo();
          this.setSelectedSegment(this.current.segments[0][0]);
        }
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
  keyAttribute: state.keyAttribute,
  annotateDisabled: state.annotateDisabled,
  isLoadedAlaw: state.isLoadedAlaw,
  styleConfig: state.styleConfig,
});
const mapDispatchToProps = {
  debug,
  getWavesurfers,
  setPlayingState,
  setSegmentTimestamp,
  mergeSegmentBackward,
  splitSegmentForward,
  setVideoValid,
  setVideoZoom,
  deleteLine,
  pushLine,
  setLineRole,
  removeSegment,
  setSegments,
  parseSegments,
  setErrorMsg,
  setAudioErrorMsg,
  moveSegmentInBatch,
  updateVideoInfo,
  setLoading,
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(WavesurferComp);
