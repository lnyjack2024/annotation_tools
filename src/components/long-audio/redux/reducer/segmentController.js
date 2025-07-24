import { v4 as uuid } from 'uuid';
import { notification } from 'antd';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';
import { translate, triggerForm, StyleConfigMode, getConfigColor, SegmentMode } from '../../constants';

export const createSegment = (start, end, segmentConfig, lineConfig) => {
  start = Number.isNaN(parseFloat(start)) ? 0 : start;
  end = Number.isNaN(parseFloat(end)) ? null : end;
  const defaultValues = {};
  segmentConfig.fields.forEach((value) => {
    if (value.defaultValue) defaultValues[value.name] = value.defaultValue;
  });
  return {
    id: uuid(),
    start,
    end,
    qaChecked: undefined,
    qaComment: '',
    qaReason: null,
    qaWorkerName: null,
    attributes: defaultValues,
    content: [createLine('none', lineConfig)],
  };
};

export const createLine = (role, lineConfig) => {
  const defaultValues = {};
  lineConfig.fields.forEach((value) => {
    if (value.defaultValue) defaultValues[value.name] = value.defaultValue;
  });
  return {
    role: role || 'none',
    text: '',
    attributes: defaultValues,
  };
};

export const getVideoContainer = (state, data) => {
  const { videoContainer } = data;
  const { wavesurfers } = state;
  wavesurfers.getVideoContainer(videoContainer);
  return state;
};

export const getAudioContainer = (state, data) => {
  const { waveform, timeline, audioContainer, minimap } = data;
  const { wavesurfers } = state;
  wavesurfers.getAudioContainer(waveform, timeline, audioContainer, minimap);
  return state;
};

export const segmentDeepClone = (results, videoIndex, segmentIndex) => {
  results[videoIndex] = [...results[videoIndex]];
  const segments = results[videoIndex];
  segments[segmentIndex] = { ...segments[segmentIndex] };
  const segment = segments[segmentIndex];
  return segment;
};

const lineDeepClone = (results, videoIndex, segmentIndex, lineIndex) => {
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.content = [...segment.content];
  const { content } = segment;
  content[lineIndex] = { ...content[lineIndex] };
  const line = content[lineIndex];
  return line;
};

export const setLineText = (state, data) => {
  let { videoIndex, segmentIndex } = data;
  const { lineIndex, text } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  const results = [...state.results];
  const line = lineDeepClone(results, videoIndex, segmentIndex, lineIndex);
  line.text = text;
  return { ...state, results };
};

export const setLineRole = (state, data) => {
  const { lineIndex, role, actionType } = data;
  let { videoIndex, segmentIndex } = data;
  const { currentVideo, currentSegment, wavesurfers } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  // const segmentIndex
  const results = [...state.results];
  const line = lineDeepClone(results, videoIndex, segmentIndex, lineIndex);
  const segment = results[videoIndex][segmentIndex];
  const roles = segment.content.map((value) => value.role);
  if (roles.indexOf(role) >= 0) return state;
  const prevRole = line.role;
  line.role = role;
  let timer = setTimeout(() => {
    clearTimeout(timer);
    timer = null;
    wavesurfers.setLineColor(videoIndex, segmentIndex, lineIndex, role, prevRole, actionType);
  }, 0);
  return { ...state, results };
};

export const setLineCategory = (state, data) => {
  const { lineIndex, key, value } = data;
  let { videoIndex, segmentIndex } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  // const segmentIndex
  const results = [...state.results];
  const line = lineDeepClone(results, videoIndex, segmentIndex, lineIndex);
  line.attributes = { ...line.attributes };
  const { attributes } = line;
  attributes[key] = value;
  return { ...state, results };
};

export const setLineAttributes = (state, data) => {
  const { videoIndex, segmentIndex, lineIndex, attributes } = data;
  const { styleConfig, wavesurfers } = state;
  const results = [...state.results];
  const line = lineDeepClone(results, videoIndex, segmentIndex, lineIndex);
  line.attributes = { ...attributes };
  if (styleConfig?.mode === StyleConfigMode.line && styleConfig?.groups?.length > 0) {
    const color = getConfigColor(attributes, styleConfig.groups);
    wavesurfers.setSegmentColor(videoIndex, segmentIndex, [lineIndex], color);
  }
  return { ...state, results };
};

export const setSegmentType = (state, data) => {
  let { videoIndex, segmentIndex } = data;
  const { value } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  // const segmentIndex
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.type = value;
  return { ...state, results };
};

export const setSegmentCategory = (state, data) => {
  let { videoIndex, segmentIndex } = data;
  const { key, value } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.attributes = { ...segment.attributes };
  const { attributes } = segment;
  attributes[key] = value;
  return { ...state, results };
};

export const setSegmentAttributes = (state, data) => {
  const results = [...state.results];
  const { styleConfig, wavesurfers } = state;
  const { videoIndex, segmentIndex, attributes } = data;
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.attributes = { ...attributes };
  if (styleConfig?.mode === StyleConfigMode.segment && styleConfig?.groups?.length > 0) {
    const color = getConfigColor(attributes, styleConfig.groups);
    const lines = Array(segment.content.length).fill(0).map((v, i) => i);
    wavesurfers.setSegmentColor(videoIndex, segmentIndex, lines, color);
  }
  return { ...state, results };
};

export const setSegmentTimestamp = (state, data) => {
  // eslint-disable-next-line prefer-const
  let { videoIndex, segmentIndex, start, end } = data;
  const { currentVideo } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  if (start !== undefined && start !== null) segment.start = start;
  if (end !== undefined && end !== null) segment.end = end;
  return { ...state, results };
};

export const moveSegmentInBatch = (state, data) => {
  let { videoIndex } = data;
  const { min, max, step } = data;
  const { currentVideo/* , results */ } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  results[videoIndex] = [...results[videoIndex]];
  const segments = results[videoIndex];
  segments.forEach((segment, i) => {
    segments[i] = { ...segments[i] };
    if (segments[i].start > min) {
      segments[i].start = segments[i].start + step < min ? min : segments[i].start + step;
    }
    if (segments[i].end < max) {
      segments[i].end = segments[i].end + step > max ? max : segments[i].end + step;
    }
  });
  // segments[segmentIndex] = { ...segments[segmentIndex] };
  // const segment = segments[segmentIndex];
  // return segment;

  // results[videoIndex] = results[videoIndex].map((segment) => {
  //   const newSegment = segmentDeepClone()//deepClone(segment);
  //   if (newSegment.start > min) {
  //     newSegment.start = newSegment.start + step < min ? min : newSegment.start + step;
  //   }
  //   if (newSegment.end < max) {
  //     newSegment.end = newSegment.end + step > max ? max : newSegment.end + step;
  //   }
  //   return newSegment;
  // });
  return { ...state, results };
};

const deepClone = (item) => JSON.parse(JSON.stringify(item));

export const mergeSegmentBackward = (state, data) => {
  let { videoIndex } = data;
  const { segmentIndex } = data;
  const { currentVideo } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  results[videoIndex] = deepClone(results[videoIndex]);
  const nextSegment = results[videoIndex][segmentIndex];
  const prevSegment = results[videoIndex][segmentIndex - 1];
  const prevRoles = [];
  prevSegment.content.forEach((line) => {
    prevRoles.push(line.role);
  });
  nextSegment.content.forEach((line) => {
    if (prevRoles.indexOf(line.role) >= 0) {
      const i = prevRoles.indexOf(line.role);
      prevSegment.content[i].text += line.text;
    } else if (line.role !== 'none') prevSegment.content.push(line);
  });
  results[videoIndex].splice(segmentIndex, 1);
  return { ...state, results };
};

export const splitSegmentForward = (state, data) => {
  const { segmentIndex, start, end, prevRules, nextRules } = data;
  let { videoIndex } = data;
  const { segmentConfig, lineConfig, currentVideo } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  results[videoIndex] = deepClone(results[videoIndex]);
  const nextSegment = createSegment(start, end, segmentConfig, lineConfig);
  results[videoIndex].splice(segmentIndex + 1, 0, nextSegment);
  if (prevRules && nextRules) {
    const prevSegment = results[videoIndex][segmentIndex];
    prevSegment.content = [];
    nextSegment.content = [];
    prevRules.forEach((rule) => prevSegment.content.push(createLine(rule.role, lineConfig)));
    nextRules.forEach((rule) => nextSegment.content.push(createLine(rule.role, lineConfig)));
  }
  return { ...state, results };
};

export const pushLine = (state, data) => {
  // eslint-disable-next-line prefer-const
  let { segmentIndex, role, lineIndex, videoIndex, deleteContent, actionType } = data;
  const { wavesurfers, lineConfig, currentVideo } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.content = [...segment.content];
  const { content, start, end } = segment;
  lineIndex = Number.isNaN(parseInt(lineIndex, 10)) ? content.length : lineIndex;
  wavesurfers.insertLine({ role, videoIndex, segmentIndex, lineIndex, start, end });
  data.lineIndex = lineIndex;
  if (actionType !== 'history') wavesurfers.addHistory('pushLine', data);
  content.push(deleteContent || createLine(role, lineConfig));
  return { ...state, results };
};

export const deleteLine = (state, data) => {
  const { segmentIndex, lineIndex, actionType } = data;
  let { videoIndex } = data;
  const { wavesurfers, currentVideo } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.content = [...segment.content];
  const deleteContent = segment.content.splice(lineIndex, 1);
  wavesurfers.deleteLine(data);
  if (actionType !== 'history') wavesurfers.addHistory('deleteLine', { ...data, deleteContent: deleteContent[0] });
  return {
    ...state,
    results,
  };
};

export const toppingLine = (state, data) => {
  const { segmentIndex, lineIndex } = data;
  let { videoIndex } = data;
  const { wavesurfers, currentVideo } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.content = [...segment.content];
  const line = JSON.parse(JSON.stringify(segment.content[lineIndex]));
  segment.content.splice(lineIndex, 1);
  segment.content.unshift(line);
  wavesurfers.toppingLine(data);

  return { ...state, results };
};

export const setSegmentQAState = (state, data) => {
  const { qaChecked } = data;
  let { segmentIndex, videoIndex } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.qaChecked = qaChecked;
  segment.qaWorkerName = state.workerName;
  return { ...state, results };
};

export const setSegmentQAComment = (state, data) => {
  const { qaComment } = data;
  let { segmentIndex, videoIndex } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;
  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.qaComment = qaComment;
  segment.qaWorkerName = state.workerName;
  return { ...state, results };
};

export const setSegmentQAReason = (state, data) => {
  const { qaReason } = data;
  let { segmentIndex, videoIndex } = data;
  const { currentVideo, currentSegment } = state;
  videoIndex = Number.isNaN(parseInt(videoIndex, 10)) ? currentVideo : videoIndex;
  segmentIndex = Number.isNaN(parseInt(segmentIndex, 10)) ? currentSegment : segmentIndex;

  const results = [...state.results];
  const segment = segmentDeepClone(results, videoIndex, segmentIndex);
  segment.qaReason = qaReason;
  segment.qaWorkerName = state.workerName;
  return { ...state, results };
};

export const removeSegment = (state, data) => {
  const { segmentIndex, videoIndex } = data;
  const results = [...state.results];
  results[videoIndex] = [...results[videoIndex]];
  const segments = results[videoIndex];
  segments.splice(segmentIndex, 1);
  return { ...state, results };
};

export const appendSegment = (state, data) => {
  const { segment, segmentIndex, videoIndex: vIndex } = data;
  const { segmentOverlap, segmentMode } = state;
  const videoIndex = Number.isNaN(parseInt(vIndex, 10)) ? state.currentVideo : vIndex;
  const results = deepClone(state.results);
  const currentIndex = results[videoIndex].findIndex((seg) => seg.id === segment.id);
  if (currentIndex >= 0) {
    results[videoIndex].splice(currentIndex, 1, segment);
  } else if (segmentIndex !== undefined) {
    results[videoIndex].splice(segmentIndex, 0, segment);
  } else {
    results[videoIndex].push(segment);
  }
  results[videoIndex].sort((a, b) => a.start - b.start);
  const index = results[videoIndex].indexOf(segment);
  if (segmentMode === SegmentMode.continuous || (segmentMode === SegmentMode.individual && !segmentOverlap)) {
    const prevSegment = results[videoIndex][index - 1];
    const nextSegment = results[videoIndex][index + 1];
    if (prevSegment && segment.start < prevSegment.end) {
      segment.start = prevSegment.end;
    }
    if (nextSegment && segment.end > nextSegment.start) {
      segment.end = nextSegment.start;
    }
  }
  return { ...state, results, currentSegment: index };
};

export const updateSegment = (state, data) => {
  const { segment, videoIndex: vIndex } = data;
  const { segmentOverlap, segmentMode } = state;
  const videoIndex = Number.isNaN(parseInt(vIndex, 10)) ? state.currentVideo : vIndex;
  const results = deepClone(state.results);
  const segmentIndex = results[videoIndex].findIndex((seg) => seg.id === segment.id);
  if (segmentIndex >= 0) {
    results[videoIndex].splice(segmentIndex, 1, segment);
  }
  results[videoIndex].sort((a, b) => a.start - b.start);
  const index = results[videoIndex].indexOf(segment);
  if (segmentMode === SegmentMode.continuous || (segmentMode === SegmentMode.individual && !segmentOverlap)) {
    const prevSegment = results[videoIndex][index - 1];
    const nextSegment = results[videoIndex][index + 1];
    if (prevSegment && segment.start < prevSegment.end) {
      segment.start = prevSegment.end;
    }
    if (nextSegment && segment.end > nextSegment.start) {
      segment.end = nextSegment.start;
    }
  }
  return { ...state, results, currentSegment: index };
};

export const deleteSegment = (state, data) => {
  const { segmentIndex, videoIndex: vIndex } = data;
  const videoIndex = Number.isNaN(parseInt(vIndex, 10)) ? state.currentVideo : vIndex;
  const results = deepClone(state.results);
  if (segmentIndex >= 0) {
    results[videoIndex].splice(segmentIndex, 1);
  }
  return { ...state, results };
};

export const setSegments = (state, data) => {
  const { videoIndex, segments = [] } = data;
  const results = deepClone(state.results);
  results[videoIndex] = segments;
  return { ...state, results };
};

export const updateLineRole = (state, data) => {
  const { videoIndex: vIndex, segmentIndex: sIndex, lineIndex, role } = data;
  const videoIndex = Number.isNaN(parseInt(vIndex, 10)) ? state.currentVideo : vIndex;
  const segmentIndex = Number.isNaN(parseInt(sIndex, 10)) ? state.currentSegment : sIndex;

  const results = deepClone(state.results);
  const line = lineDeepClone(results, videoIndex, segmentIndex, lineIndex);
  const segment = results[videoIndex][segmentIndex];
  const roles = segment.content.map((value) => value.role);
  if (roles.indexOf(role) >= 0) {
    return state;
  }
  line.role = role;
  return { ...state, results };
};

export const setSegmentStartEnd = (state, data) => {
  const { videoIndex: vIndex, segmentIndex: sIndex, start, end } = data;
  const videoIndex = Number.isNaN(parseInt(vIndex, 10)) ? state.currentVideo : vIndex;
  const segmentIndex = Number.isNaN(parseInt(sIndex, 10)) ? state.currentSegment : sIndex;
  const results = deepClone(state.results);
  const segment = results[videoIndex][segmentIndex];
  segment.start = start;
  segment.end = end;
  state.wavesurfers.setSegmentStartEnd(videoIndex, segmentIndex, start, end);
  results[videoIndex].sort((a, b) => a.start - b.start);
  const index = results[videoIndex].indexOf(segment);
  return { ...state, results, currentSegment: index };
};

export const verifyCurrentForm = (state, action) => {
  if (isAnnotationReadonly(state.toolMode)) return true;
  const { results, segmentConfig, currentVideo, currentSegment, keyAttribute, lineConfig } = state;
  const currentValues = results[currentVideo][currentSegment];
  if (currentSegment < 0) return true;
  const updatedSegment = triggerForm({
    ...segmentConfig,
    fields: [...segmentConfig.fields, ...keyAttribute.options]
  }, currentValues.attributes);
  // add segment default values
  currentValues.attributes = updatedSegment.updatedValues;
  const segmentFields = updatedSegment.updatedFields;
  const segmentFieldIndex = segmentFields.findIndex((v) => v.required === true && v.readonly !== true && v.visible !== false && (v.defaultValue === undefined || v.defaultValue === ''));

  const lineIndex = [];
  let lineFields = [];
  for (let i = 0; i < currentValues.content?.length; i += 1) {
    const line = currentValues.content[i];
    const updatedLine = triggerForm(lineConfig, line.attributes);
    // add line default values
    line.attributes = updatedLine.updatedValues;
    lineFields = updatedLine.updatedFields;
    const index = lineFields.findIndex((v) => v.required === true && v.readonly !== true && v.visible !== false && (v.defaultValue === undefined || v.defaultValue === ''));
    if (index >= 0) lineIndex.push(index);
  }
  if (segmentFieldIndex < 0 && lineIndex.length === 0) return { result: true, data: currentValues };
  const err = `Item ${currentVideo + 1}-Segment ${currentSegment + 1}: ${translate('DATA_ERROR_REQUIRED')} ${(segmentFields[segmentFieldIndex] || lineFields[lineIndex[0]]).label}`;
  if (action !== 'nohint') {
    notification.error({ message: err });
  }
  return { result: false, error: err };
};

export const isInput = () => (document.activeElement.tagName === 'INPUT' && (document.activeElement.type === 'text' || document.activeElement.type === 'number')) || document.activeElement.tagName === 'TEXTAREA';
