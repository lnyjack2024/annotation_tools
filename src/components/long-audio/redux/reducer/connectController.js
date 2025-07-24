import { Base64 } from 'js-base64';
import { cloneDeep, isEqual } from 'lodash';
import * as toWav from 'audiobuffer-to-wav';
import { notification } from 'antd';
import { createSegment } from './segmentController';
import { defaultColor, translate, tagType, SegmentMode, ValidDurationMode, StyleConfigMode } from '../../constants';
import { store, lawToWav, getFileExtension } from '../../../../utils';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';

const decode = (str) => {
  try { return JSON.parse(Base64.decode(str)); } catch (e) { return null; }
};

const AUDIO_KEY_ATTRIBUTE = 'audio_key_attribute';
const AUDIO_ROLE_ATTRIBUTE = 'role';

export const handleLawToWav = (alawUrl, tail, index) => new Promise(async (resolve, reject) => {
  try {
    const buffer = await fetch(alawUrl).then((res) => res.arrayBuffer());
    const audioBuffer = lawToWav(buffer, tail);
    const wav = toWav(audioBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    resolve(window.URL.createObjectURL(blob));
  } catch (error) {
    notification.error({ message: `${translate('AUDIO_ERROR')} ${index + 1}` });
    return false;
  }
});

const parseVideos = (audio, result) => new Promise(async (resolve, reject) => {
  const { audios = [] } = result || {};
  const array = audio.split(',');
  const videos = [];
  const videoTypes = 'asf,avi,wmv,mkv,mp4,mov,rm,3gp,flv,mpg,rmvb,mpeg'.split(',');
  for (let index = 0; index < array.length; index += 1) {
    const src = array[index];
    let video = src;
    if (video) {
      const tail = getFileExtension(video);
      if ((tail === 'alaw' || tail === 'ulaw') && index === 0) {
        video = await handleLawToWav(src, tail, index);
      }
      if (video) {
        const savedAudio = audios[index];
        videos.push({
          url: video,
          source: src,
          loaded: (tail !== 'alaw' && tail !== 'ulaw') ? true : index === 0,
          ready: false,
          zoom: 1,
          speed: 1,
          checked: !index,
          type: videoTypes.indexOf(tail) < 0 ? 'none-video' : 'video',
          ...savedAudio && savedAudio.duration && {
            duration: savedAudio.duration
          },
          ...savedAudio && savedAudio.attributes !== undefined && {
            attributes: cloneDeep(savedAudio.attributes),
            originAttributes: cloneDeep(savedAudio.attributes), // save original saved attributes
          },
        });
      }
    }
  }
  resolve(videos);
});

const parseLableConfig = (labelConfig) => {
  try {
    const keys = [AUDIO_KEY_ATTRIBUTE, AUDIO_ROLE_ATTRIBUTE];
    const obj = decode(labelConfig) || { fields: [] };
    obj.fields = obj.fields || [];
    obj.fields.forEach((value) => {
      // if (value.type.toUpperCase() !== 'RADIO'
      //     && value.type.toUpperCase() !== 'TEXTAREA'
      //     && value.type.toUpperCase() !== 'TEXT') {
      //   throw new Error(`${translate('PAYLOAD_ERROR_INVALID_ATTRIBUTE_TYPE')}: ${value.type}`);
      // }
      if (value.name && keys.indexOf(value.name.toLowerCase()) >= 0) {
        throw new Error(`${translate('PAYLOAD_ERROR_DUPLICATED_ATTRIBUTE_NAME')}: ${value.name}`);
      }
      keys.push(value.name.toLowerCase());
    });
    return obj;
  } catch (error) {
    notification.error({ message: error.message });
    return { fields: [] };
  }
};

const parseOntology = (ontology = []) => {
  try {
    const newOntology = new Map();
    newOntology.set('none', defaultColor.darkGray);
    ontology.forEach((value, index) => {
      if (!newOntology.has(value.class_name)) newOntology.set(value.class_name, value.display_color);
      else throw new Error(`${translate('PAYLOAD_ERROR_DUPLICATED_ONTOLOGY')}: ${value.class_name}`);
    });
    return newOntology;
  } catch (error) {
    notification.error({ message: error.message });
    return new Map();
  }
};

const parseResults = (results, unitId, videos, ontology, lineConfig, segmentConfig, segmentMode) => {
  // eslint-disable-next-line no-param-reassign
  // console.log(store.getStorage('long-audio', 'review_from'));
  const cache = store.getStorage('long-audio', unitId);
  results = cache && cache.results ? cache.results : results;
  if (!results || !results.length) results = [];
  videos.forEach((video, index) => {
    if (!results[index] || !results[index].length) {
      if (segmentMode === SegmentMode.individual) {
        results[index] = [];
      } else {
        results[index] = [createSegment(0, null, segmentConfig, lineConfig)];
      }
    }
  });
  return results;
};

const parseKeyAttribute = (config) => {
  const options = [];
  if (config && typeof config === 'string') {
    try {
      // e.g. valid:a,b,c|invalid:x,y,z
      const splits = config.split('|');
      splits.forEach((s) => {
        const parts = s.split(':');
        if (parts.length !== 2) {
          throw new Error('invalid config');
        }
        const part1 = parts[0].toLowerCase();
        const part2 = parts[1];
        if (part1 === 'valid' || part1 === 'invalid') {
          const values = part2.split(',').filter((p) => p.trim().length > 0);
          values.forEach((v) => {
            options.push({
              value: v,
              label: v,
              isValid: part1 === 'valid'
            });
          });
        } else {
          throw new Error('invalid config');
        }
      });
    } catch (e) {
      notification.error({ message: `${translate('PAYLOAD_ERROR_INVALID_KEY_ATTRIBUTE')} ${config}` });
    }
  }

  return {
    name: AUDIO_KEY_ATTRIBUTE,
    label: `${translate('KEY_ATTRIBUTE_FILED_NAME')}`,
    type: 'RADIO',
    options,
  };
};

const parseMinLength = (length) => {
  const min = Number.parseFloat(length);
  return Number.isNaN(min) ? 0.05 : min;
};

export const parseSegments = (state, data) => {
  const { videoIndex, segments } = data;
  const results = [...state.results];
  results[videoIndex] = segments;
  return {
    ...state,
    results,
  };
};

export const parseTagGroup = (data) => {
  try {
    const tagGroup = decode(data) || [];
    const shortcuts = {};
    tagGroup.forEach((group) => {
      if (!group.tags) {
        throw new Error(`${translate('PAYLOAD_ERROR_INVALID_TAG_CONFIG')} ${JSON.stringify(group)}`);
      }
      if (group.type === tagType.tag) {
        group.tags.forEach((tag) => {
          if (typeof tag.prefix !== 'string' || typeof tag.suffix !== 'string') {
            throw new Error(`${translate('PAYLOAD_ERROR_INVALID_TAG_CONFIG')} ${JSON.stringify(tag)}`);
          }
          if (shortcuts[tag.shortcut]) {
            throw new Error(`${translate('PAYLOAD_ERROR_DUPLICATE_SHORTCUT')} ${tag.shortcut}`);
          } else {
            shortcuts[tag.shortcut] = tag.shortcut;
          }
        });
      } else if (group.type === tagType.standalone) {
        group.tags.forEach((tag) => {
          if (typeof tag.text !== 'string') {
            throw new Error(`${translate('PAYLOAD_ERROR_INVALID_TAG_CONFIG')} ${JSON.stringify(tag)}`);
          }
          if (shortcuts[tag.shortcut]) {
            throw new Error(`${translate('PAYLOAD_ERROR_DUPLICATE_SHORTCUT')} ${tag.shortcut}`);
          } else {
            shortcuts[tag.shortcut] = tag.shortcut;
          }
        });
      } else {
        throw new Error(`${translate('PAYLOAD_ERROR_INVALID_TAG_TYPE')} ${group.type}`);
      }
    });
    return tagGroup;
  } catch (error) {
    notification.error({ message: error.message });
    return [];
  }
};

export const setWordTimestamps = (state, data) => ({
  ...state,
  wordTimestamps: data.wordTimestamps,
});

export const initPayload = (state, data) => new Promise(async (resolve, reject) => {
  const videos = await parseVideos(data.audio, data.result);
  const ontology = parseOntology(data.ontology);
  const globalConfig = parseLableConfig(data.global_config);
  if (globalConfig && Array.isArray(globalConfig.fields) && globalConfig.fields.length > 0) {
    const defaultValues = {};
    globalConfig.fields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        defaultValues[f.name] = f.defaultValue;
      }
    });
    if (Object.keys(defaultValues).length > 0) { // has default values
      videos.forEach((video) => {
        video.defaultAttributes = cloneDeep(defaultValues); // save default attributes
        if (!isAnnotationReadonly(data.mode)) {
          // update attributes if not readonly
          if (!video.attributes) {
            video.attributes = {};
          }
          Object.keys(defaultValues).forEach((key) => {
            if (video.attributes[key] === undefined) {
              video.attributes[key] = defaultValues[key];
            }
          });
        }
      });
    }
  }
  const invalidAnnotatable = data.invalid_annotatable !== 'false' && data.invalid_annotatable !== false;
  const annotateDisabled = !invalidAnnotatable && videos[state.currentVideo].attributes && videos[state.currentVideo].attributes.is_valid === 'invalid';
  const segmentConfig = parseLableConfig(data.label_config_segment);
  const lineConfig = parseLableConfig(data.label_config);
  const segmentFieldMap = {};
  const lineFieldMap = {};
  segmentConfig.fields
    .forEach((s) => {
      segmentFieldMap[s.name] = s;
    });
  lineConfig.fields
    .forEach((s) => {
      lineFieldMap[s.name] = s;
    });

  const issueTypes = data.issue_types ? data.issue_types.split(',') : ['issue type'];
  const segmentMode = Object.values(SegmentMode).includes(data.segment_mode) ? data.segment_mode : SegmentMode.continuous;
  const results = parseResults(data.review_from, data.unit_id, videos, ontology, lineConfig, segmentConfig, segmentMode);
  const tagGroup = parseTagGroup(data.tag_group);
  const jobId = data.job_id;
  const overlap = data.overlap === 'true' || data.overlap === true;
  const keyAttribute = parseKeyAttribute(data.key_attribute);
  const client = data.client || '';
  const wordTimestampUrls = data.word_timestamps?.split(',') || [];
  const minLength = parseMinLength(data.min_length);
  let spaceLine = 0;
  if (data.space_line) {
    const num = Number(data.space_line);
    if (!Number.isNaN(num) && num > 0) {
      spaceLine = num;
    }
  }
  const measurements = [];
  if (data.measurement_box) {
    data.measurement_box.split(',').forEach((item) => {
      const size = Number(item);
      if (!Number.isNaN(size) && size > 0 && !measurements.includes(size)) {
        measurements.push(size);
      }
    });
  }
  const segmentOverlap = data.segment_overlap !== 'false' && data.segment_overlap !== false;
  const adjustmentStep = 0.1;

  // parse style config
  const styleConfig = decode(data.style_config) || {
    mode: StyleConfigMode.segment,
    groups: [],
  };

  const scriptCheck = data.script_check === 'true' || data.script_check === true;
  const submitCheck = data.submit_check !== 'false' && data.submit_check !== false;
  const validDuration = Object.values(ValidDurationMode).includes(data.valid_duration) ? data.valid_duration : ValidDurationMode.attributes;
  const lastResults = JSON.parse(JSON.stringify(results)).map((v) => {
    const map = {};
    (v || []).forEach((item) => {
      delete item.qaChecked;
      delete item.qaComment;
      delete item.qaReason;
      delete item.qaWorkerName;
      map[item.id] = item;
    });
    return map;
  });
  const newState = {
    videos,
    ontology,
    results,
    lastResults,
    globalConfig,
    invalidAnnotatable,
    annotateDisabled,
    segmentConfig,
    lineConfig,
    issueTypes,
    unitId: data.unit_id,
    toolMode: data.mode,
    reviews: data._reviews,
    tagGroup,
    jobId,
    overlap,
    keyAttribute,
    client,
    wordTimestampUrls,
    minSegmentLength: minLength,
    segmentMode,
    currentSegment: segmentMode === SegmentMode.individual ? -1 : 0,
    spaceLine,
    measurements,
    selectedMeasurement: measurements[0] || -1,
    segmentOverlap,
    adjustmentStep,
    scriptCheck,
    submitCheck,
    validDuration,
    segmentFieldMap,
    lineFieldMap,
    styleConfig,
    jobProxy: data.jobProxy,
    workerName: data.jobProxy?.advanceWorkerName
  };
  resolve(newState);
});

export const initPayloadState = (state, data) => ({
  ...state,
  ...data,
});

export const saveData = (state) => {
  const data = {
    results: state.results,
    videos: state.videos,
  };
  store.setStorage('long-audio', state.unitId, data);
};

export const setVideoLoaded = (state, data) => {
  const videos = [...state.videos];
  videos.forEach((v, i) => {
    v.url = data.videos[i].url;
    v.loaded = true;
  });
  return {
    ...state,
    videos,
    isLoadedAlaw: true,
  };
};

export const setLoading = (state, data) => ({
  ...state,
  loading: data,
});

export const setVideoValid = (state, data) => {
  const { index } = data;
  const videos = [...state.videos];
  videos[index] = { ...state.videos[index] };
  videos[index].ready = true;
  return {
    ...state,
    videos,
  };
};

export const setVideoAttributes = (state, data) => {
  const { index, attributes } = data;
  const { videos } = state;
  videos[index].attributes = { ...videos[index].attributes, ...attributes };

  return {
    ...state,
    annotateDisabled: !state.invalidAnnotatable && videos[index].attributes && videos[index].attributes.is_valid === 'invalid',
  };
};

export const setAttributeFocusInfo = (state, data = {}) => {
  if (!isEqual(state.focusAttribute, data)) {
    return { ...state, focusAttribute: { ...data, videoIndex: state.currentVideo } };
  }
  return state;
};

export const setLoadReviewEnabled = (state, enabled) => ({
  ...state,
  loadReviewEnabled: enabled,
});

export const setResults = (state, data) => ({
  ...state,
  results: data.results,
});
