/* connection operation */
export const DEBUG = 'DEBUG';
export const INIT_PAYLOAD = 'INIT_PAYLOAD';
export const SET_VIDEO_VALID = 'SET_VIDEO_VALID';
export const SET_VIDEO_ATTR = 'SET_VIDEO_ATTR';
export const SET_VIDEO_LOADED = 'SET_VIDEO_LOADED';
export const SET_LOADING = 'SET_LOADING';
export const SET_LOAD_REVIEW_ENABLED = 'SET_LOAD_REVIEW_ENABLED';
export const SET_RESULT = 'SET_RESULT';
/* segments operation */
export const GET_WAVESURFERS = 'GET_WAVESURFER';
export const GET_AUDIO_CONTAINRE = 'GET_AUDIO_CONTAINER';
export const GET_VIDEO_CONTAINER = 'GET_VIDEO_CONTAINER';
export const SET_LINE_TEXT = 'SET_LINE_TEXT';
export const SET_LINE_ROLE = 'SET_LINE_ROLE';
export const SET_LINE_CATEGORY = 'SET_LINE_CATEGORY';
export const SET_LINE_ATTRIBUTES = 'SET_LINE_ATTRIBUTES';
export const SET_SEGMENT_ATTRIBUTES = 'SET_SEGMENT_ATTRIBUTES';
export const SET_SEGMENT_TYPE = 'SET_SEGMENT_TYPE';
export const SET_SEGMENT_CATEGORY = 'SET_SEGMENT_CATEGORY';
export const SET_SEGMENT_TIMESTAMP = 'SET_SEGMENT_TIMESTAMP';
export const MERGE_SEGMENT_BACKWARD = 'MERGE_SEGMENT_BACKWARD';
export const SPLIT_SEGMENT_FORWARD = 'INSERT_SEGMENT_FORWARD';
export const REMOVE_SEGMENT = 'REMOVE_SEGMENT';
export const PUSH_LINE = 'PUSH_LINE';
export const DELETE_LINE = 'DELETE_LINE';
export const TOPPING_LINE = 'TOPPING_LINE';
export const SHOW_HIDE_GUIDE = 'SHOW_HIDE_GUIDE';
/* video operation */
export const PLAY_CURRENT_VIDEO = 'PLAY_CURRENT_VIDEO';
export const PAUSE_CURRENT_VIDEO = 'PAUSE_CURRENT_VIDEO';
export const FORWARD_CURRENT_VIDEO = 'FORWARD_CURRENT_VIDEO';
export const BACKWARD_CURRENT_VIDEO = 'BACKWARD_CURRENT_VIDEO';
export const SET_VIDEO_SPEED = 'SET_VIDEO_SPEED';
export const SET_VIDEO_ZOOM = 'SET_VIDEO_ZOOM';
/* setting operation */
export const SET_PLAY_MODE = 'SET_PLAY_MODE';
export const SET_CURRENT_VIDEO = 'SET_CURRENT_VIDEO';
export const SET_CURRENT_SEGMENT = 'SET_CURRENT_SEGMENT';
export const SET_PLAYING_STATE = 'SET_PLAYING_STATE';
/* qa operation */
export const SET_SEGMENT_QASTATE = 'SET_SEGMENT_QASTATE';
export const SET_SEGMENT_QACOMMENT = 'SET_SEGMENT_QACOMMENT';
export const SET_SEGMENT_QAREASON = 'SET_SEGMENT_QAREASON';
export const PARSE_SEGMENTS = 'PARSE_SEGMENTS';
export const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';
export const SET_AUDIO_ERROR_MESSAGE = 'SET_AUDIO_ERROR_MESSAGE';

export const MOVE_SEGMENT_IN_BATCH = 'MOVE_SEGMENT_IN_BATCH';

export const SET_WORD_TIMESTAMPS = 'SET_WORD_TIMESTAMPS';

/* drag mode */
export const APPEND_SEGMENT = 'APPEND_SEGMENT';
export const UPDATE_SEGMENT = 'UPDATE_SEGMENT';
export const DELETE_SEGMENT = 'DELETE_SEGMENT';
export const SET_SEGMENTS = 'SET_SEGMENTS';
export const UPDATE_LINE_ROLE = 'UPDATE_LINE_ROLE';
export const SET_SEGMENT_START_END = 'SET_SEGMENT_START_END';
/* measurements */
export const SET_MEASUREMENT = 'SET_MEASUREMENT';

export const UPDATE_VIDEO_INFO = 'UPDATE_VIDEO_INFO';
export const SET_ATTRIBUTE_FOCUS_INFO = 'SET_ATTRIBUTE_FOCUS_INFO';

export const debug = (data) => ({ type: DEBUG, data });
export const getWavesurfers = (data) => ({ type: GET_WAVESURFERS, data });
export const initPayloadState = (data) => ({ type: INIT_PAYLOAD, data });
export const setWordTimestamps = (data) => ({ type: SET_WORD_TIMESTAMPS, data });
export const getAudioContainer = (data) => ({ type: GET_AUDIO_CONTAINRE, data });
export const getVideoContainer = (data) => ({ type: GET_VIDEO_CONTAINER, data });
export const setLineText = (data) => ({ type: SET_LINE_TEXT, data });
export const setPlayMode = (data) => ({ type: SET_PLAY_MODE, data });
export const setCurrentVideo = (data) => ({ type: SET_CURRENT_VIDEO, data });
export const playCurrentVideo = () => ({ type: PLAY_CURRENT_VIDEO });
export const pauseCurrentVideo = () => ({ type: PAUSE_CURRENT_VIDEO });
export const forwardCurrentVideo = () => ({ type: FORWARD_CURRENT_VIDEO });
export const backwardCurrentVideo = () => ({ type: BACKWARD_CURRENT_VIDEO });
export const setCurrentSegment = (data) => ({ type: SET_CURRENT_SEGMENT, data });
export const setSegmentType = (data) => ({ type: SET_SEGMENT_TYPE, data });
export const setSegmentCategory = (data) => ({ type: SET_SEGMENT_CATEGORY, data });
export const setLineRole = (data) => ({ type: SET_LINE_ROLE, data });
export const setLineCategory = (data) => ({ type: SET_LINE_CATEGORY, data });
export const setLineAttributes = (data) => ({ type: SET_LINE_ATTRIBUTES, data });
export const setSegmentAttributes = (data) => ({ type: SET_SEGMENT_ATTRIBUTES, data });
export const setPlayingState = (data) => ({ type: SET_PLAYING_STATE, data });
export const setSegmentTimestamp = (data) => ({ type: SET_SEGMENT_TIMESTAMP, data });
export const mergeSegmentBackward = (data) => ({ type: MERGE_SEGMENT_BACKWARD, data });
export const splitSegmentForward = (data) => ({ type: SPLIT_SEGMENT_FORWARD, data });
export const pushLine = (data) => ({ type: PUSH_LINE, data });
export const deleteLine = (data) => ({ type: DELETE_LINE, data });
export const toppingLine = (data) => ({ type: TOPPING_LINE, data });
export const setVideoSpeed = (data) => ({ type: SET_VIDEO_SPEED, data });
export const setVideoZoom = (data) => ({ type: SET_VIDEO_ZOOM, data });
export const setVideoValid = (data) => ({ type: SET_VIDEO_VALID, data });
export const setVideoAttributes = (data) => ({ type: SET_VIDEO_ATTR, data });
export const showHideGuider = (data) => ({ type: SHOW_HIDE_GUIDE, data });
export const setSegmentQAState = (data) => ({ type: SET_SEGMENT_QASTATE, data });
export const setSegmentQAComment = (data) => ({ type: SET_SEGMENT_QACOMMENT, data });
export const setSegmentQAReason = (data) => ({ type: SET_SEGMENT_QAREASON, data });
export const removeSegment = (data) => ({ type: REMOVE_SEGMENT, data });
export const parseSegments = (data) => ({ type: PARSE_SEGMENTS, data });
export const setErrorMsg = (data) => ({ type: SET_ERROR_MESSAGE, data });
export const setAudioErrorMsg = (data) => ({ type: SET_AUDIO_ERROR_MESSAGE, data });
export const setVideoLoaded = (data) => ({ type: SET_VIDEO_LOADED, data });
export const setLoading = (data) => ({ type: SET_LOADING, data });

export const moveSegmentInBatch = (data) => ({ type: MOVE_SEGMENT_IN_BATCH, data });

/* drag mode */
export const appendSegment = (data) => ({ type: APPEND_SEGMENT, data });
export const updateSegment = (data) => ({ type: UPDATE_SEGMENT, data });
export const deleteSegment = (data) => ({ type: DELETE_SEGMENT, data });
export const setSegments = (data) => ({ type: SET_SEGMENTS, data });
export const updateLineRole = (data) => ({ type: UPDATE_LINE_ROLE, data });
export const setSegmentStartEnd = (data) => ({ type: SET_SEGMENT_START_END, data });
/* measurements */
export const setMeasurement = (data) => ({ type: SET_MEASUREMENT, data });

export const updateVideoInfo = (data) => ({ type: UPDATE_VIDEO_INFO, data });
export const setAttributeFocusInfo = (data) => ({ type: SET_ATTRIBUTE_FOCUS_INFO, data });
export const setLoadReviewEnabled = (data) => ({ type: SET_LOAD_REVIEW_ENABLED, data });
export const setResults = (data) => ({ type: SET_RESULT, data });
