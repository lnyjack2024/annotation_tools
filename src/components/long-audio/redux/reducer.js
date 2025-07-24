import {
  BACKWARD_CURRENT_VIDEO,
  DEBUG,
  FORWARD_CURRENT_VIDEO,
  GET_AUDIO_CONTAINRE,
  GET_VIDEO_CONTAINER,
  GET_WAVESURFERS,
  INIT_PAYLOAD,
  MERGE_SEGMENT_BACKWARD,
  PAUSE_CURRENT_VIDEO,
  PLAY_CURRENT_VIDEO,
  PUSH_LINE,
  SET_CURRENT_SEGMENT,
  SET_CURRENT_VIDEO,
  SET_LINE_CATEGORY,
  SET_LINE_ATTRIBUTES,
  SET_LINE_ROLE,
  SET_LINE_TEXT,
  SET_PLAY_MODE,
  SET_PLAYING_STATE,
  SET_SEGMENT_CATEGORY,
  SET_SEGMENT_ATTRIBUTES,
  SET_SEGMENT_TIMESTAMP,
  SET_SEGMENT_TYPE,
  SET_VIDEO_SPEED,
  SET_VIDEO_ZOOM,
  SPLIT_SEGMENT_FORWARD,
  DELETE_LINE,
  TOPPING_LINE,
  SET_VIDEO_LOADED,
  SET_VIDEO_VALID,
  SET_VIDEO_ATTR,
  SHOW_HIDE_GUIDE,
  SET_SEGMENT_QASTATE,
  SET_SEGMENT_QACOMMENT,
  SET_SEGMENT_QAREASON,
  REMOVE_SEGMENT,
  PARSE_SEGMENTS,
  SET_ERROR_MESSAGE,
  SET_AUDIO_ERROR_MESSAGE,
  MOVE_SEGMENT_IN_BATCH,
  SET_WORD_TIMESTAMPS,
  APPEND_SEGMENT,
  UPDATE_SEGMENT,
  DELETE_SEGMENT,
  SET_SEGMENTS,
  UPDATE_LINE_ROLE,
  SET_SEGMENT_START_END,
  SET_MEASUREMENT,
  UPDATE_VIDEO_INFO,
  SET_LOADING,
  SET_ATTRIBUTE_FOCUS_INFO,
  SET_LOAD_REVIEW_ENABLED,
  SET_RESULT,
} from './action';
import {
  initPayloadState,
  parseSegments,
  saveData,
  setVideoLoaded,
  setVideoValid,
  setVideoAttributes,
  setWordTimestamps,
  setLoading,
  setAttributeFocusInfo,
  setLoadReviewEnabled,
  setResults,
} from './reducer/connectController';
import {
  getVideoContainer,
  getAudioContainer,
  setLineText,
  setSegmentType,
  setSegmentCategory,
  setLineRole,
  setLineCategory,
  setLineAttributes,
  setSegmentAttributes,
  mergeSegmentBackward,
  setSegmentTimestamp, splitSegmentForward, pushLine,
  toppingLine, deleteLine,
  setSegmentQAState,
  setSegmentQAComment,
  removeSegment,
  setSegmentQAReason,
  moveSegmentInBatch,
  appendSegment,
  updateSegment,
  deleteSegment,
  setSegments,
  updateLineRole,
  setSegmentStartEnd,
} from './reducer/segmentController';
import {
  setPlayMode,
  setCurrentVideo,
  playCurrentVideo,
  pauseCurrentVideo,
  forwardCurrentVideo,
  backwardCurrentVideo,
  setCurrentSegment,
  debug,
  getWavesurfers,
  setPlayingState,
  setVideoZoom,
  setVideoSpeed,
  showHideGuider,
  setErrorMsg,
  setAudioErrorMsg,
  setMeasurement,
  updateVideoInfo,
} from './reducer/settingController';
import { SegmentMode } from '../constants';

const initState = {
  videos: [],
  results: [],
  ontology: [],
  globalConfig: null,
  invalidAnnotatable: true,
  annotateDisabled: false,
  segmentConfig: [],
  lineConfig: [],
  reviews: null,
  /* job setting */
  unitId: null,
  toolMode: null,
  issueTypes: [],
  /* user setting */
  currentPlayMode: 'regionPlay',
  currentVideo: 0,
  currentSegment: 0,
  isPlaying: false,
  isGuiding: false,
  /* constant setting */
  minSegmentLength: 0.05,
  navigationSize: 1,
  /* wavesurfer component */
  wavesurfers: null,
  errorMsg: '',
  audioErrorMsg: undefined,
  tagGroup: [],
  segmentMode: SegmentMode.continuous,
  spaceLine: 0,
  measurements: [],
  selectedMeasurement: -1,
  segmentOverlap: true,
  adjustmentStep: 0.1,
  isLoadedAlaw: false,
  loading: true,
  focusAttribute: {},
  loadReviewEnabled: false,
};

export default (state = initState, action) => {
  let newState = initState;
  switch (action.type) {
    case DEBUG:
      newState = debug(state, action.data);
      break;
    case GET_WAVESURFERS:
      newState = getWavesurfers(state, action.data);
      break;
    case SET_VIDEO_VALID:
      newState = setVideoValid(state, action.data);
      break;
    case SET_VIDEO_ATTR:
      newState = setVideoAttributes(state, action.data);
      break;
    case INIT_PAYLOAD:
      newState = initPayloadState(initState, action.data);
      break;
    case SET_WORD_TIMESTAMPS:
      newState = setWordTimestamps(state, action.data);
      break;
    case GET_VIDEO_CONTAINER:
      newState = getVideoContainer(state, action.data);
      break;
    case GET_AUDIO_CONTAINRE:
      newState = getAudioContainer(state, action.data);
      break;
    case SET_LINE_TEXT:
      newState = setLineText(state, action.data);
      break;
    case SET_PLAY_MODE:
      newState = setPlayMode(state, action.data);
      break;
    case SET_CURRENT_VIDEO:
      newState = setCurrentVideo(state, action.data);
      break;
    case PLAY_CURRENT_VIDEO:
      newState = playCurrentVideo(state);
      break;
    case PAUSE_CURRENT_VIDEO:
      newState = pauseCurrentVideo(state);
      break;
    case FORWARD_CURRENT_VIDEO:
      newState = forwardCurrentVideo(state);
      break;
    case BACKWARD_CURRENT_VIDEO:
      newState = backwardCurrentVideo(state);
      break;
    case SET_CURRENT_SEGMENT:
      newState = setCurrentSegment(state, action.data);
      break;
    case SET_SEGMENT_TYPE:
      newState = setSegmentType(state, action.data);
      break;
    case SET_SEGMENT_CATEGORY:
      newState = setSegmentCategory(state, action.data);
      break;
    case SET_LINE_ROLE:
      newState = setLineRole(state, action.data);
      break;
    case SET_LINE_CATEGORY:
      newState = setLineCategory(state, action.data);
      break;
    case SET_LINE_ATTRIBUTES:
      newState = setLineAttributes(state, action.data);
      break;
    case SET_PLAYING_STATE:
      newState = setPlayingState(state, action.data);
      break;
    case MERGE_SEGMENT_BACKWARD:
      newState = mergeSegmentBackward(state, action.data);
      break;
    case SET_SEGMENT_TIMESTAMP:
      newState = setSegmentTimestamp(state, action.data);
      break;
    case SPLIT_SEGMENT_FORWARD:
      newState = splitSegmentForward(state, action.data);
      break;
    case PUSH_LINE:
      newState = pushLine(state, action.data);
      break;
    case SET_VIDEO_ZOOM:
      newState = setVideoZoom(state, action.data);
      break;
    case SET_VIDEO_SPEED:
      newState = setVideoSpeed(state, action.data);
      break;
    case DELETE_LINE:
      newState = deleteLine(state, action.data);
      break;
    case TOPPING_LINE:
      newState = toppingLine(state, action.data);
      break;
    case SHOW_HIDE_GUIDE:
      newState = showHideGuider(state, action.data);
      break;
    case SET_SEGMENT_QASTATE:
      newState = setSegmentQAState(state, action.data);
      break;
    case SET_SEGMENT_QACOMMENT:
      newState = setSegmentQAComment(state, action.data);
      break;
    case SET_SEGMENT_QAREASON:
      newState = setSegmentQAReason(state, action.data);
      break;
    case MOVE_SEGMENT_IN_BATCH:
      newState = moveSegmentInBatch(state, action.data);
      break;
    case REMOVE_SEGMENT:
      newState = removeSegment(state, action.data);
      break;
    case PARSE_SEGMENTS:
      newState = parseSegments(state, action.data);
      break;
    case SET_ERROR_MESSAGE:
      newState = setErrorMsg(state, action.data);
      break;
    case SET_AUDIO_ERROR_MESSAGE:
      newState = setAudioErrorMsg(state, action.data);
      break;
    case APPEND_SEGMENT:
      newState = appendSegment(state, action.data);
      break;
    case UPDATE_SEGMENT:
      newState = updateSegment(state, action.data);
      break;
    case DELETE_SEGMENT:
      newState = deleteSegment(state, action.data);
      break;
    case SET_SEGMENTS:
      newState = setSegments(state, action.data);
      break;
    case UPDATE_LINE_ROLE:
      newState = updateLineRole(state, action.data);
      break;
    case SET_SEGMENT_START_END:
      newState = setSegmentStartEnd(state, action.data);
      break;
    case SET_MEASUREMENT:
      newState = setMeasurement(state, action.data);
      break;
    case UPDATE_VIDEO_INFO:
      newState = updateVideoInfo(state, action.data);
      break;
    case SET_VIDEO_LOADED:
      newState = setVideoLoaded(state, action.data);
      break;
    case SET_LOADING:
      newState = setLoading(state, action.data);
      break;
    case SET_ATTRIBUTE_FOCUS_INFO:
      newState = setAttributeFocusInfo(state, action.data);
      break;
    case SET_SEGMENT_ATTRIBUTES:
      newState = setSegmentAttributes(state, action.data);
      break;
    case SET_LOAD_REVIEW_ENABLED:
      newState = setLoadReviewEnabled(state, action.data);
      break;
    case SET_RESULT:
      newState = setResults(state, action.data);
      break;
    default:
      return newState;
  }
  // saveData(newState, action.type);
  return newState;
};
