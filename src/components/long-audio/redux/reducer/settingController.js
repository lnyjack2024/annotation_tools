import { SegmentMode, translate } from '../../constants';

export const debug = (state, data) => {
  console.log('hello!');
  return state;
};

export const getWavesurfers = (state, data) => {
  const { wavesurfers } = data;
  return {
    ...state,
    wavesurfers,
  };
};

export const setPlayingState = (state, data) => {
  const { isPlaying } = data;
  return {
    ...state,
    isPlaying,
  };
};

export const setPlayMode = (state, data) => {
  const { value } = data;
  const { wavesurfers } = state;
  wavesurfers.setPlayMode(value);
  return {
    ...state,
    currentPlayMode: value,
  };
};

export const playCurrentVideo = (state) => {
  const { wavesurfers } = state;
  wavesurfers.playVideo();
  return state;
};

export const pauseCurrentVideo = (state) => {
  const { wavesurfers } = state;
  wavesurfers.pauseVideo();
  return state;
};

export const forwardCurrentVideo = (state) => {
  const { wavesurfers } = state;
  wavesurfers.forwardVideo();
  return state;
};

export const backwardCurrentVideo = (state) => {
  const { wavesurfers } = state;
  wavesurfers.backwardVideo();
  return state;
};

export const setCurrentVideo = (state, data) => {
  const { index } = data;
  const { currentVideo, wavesurfers } = state;
  if (currentVideo === index) return state;
  const videos = [...state.videos];
  videos[index] = { ...videos[index] };
  const video = videos[index];
  video.checked = true;
  wavesurfers.setCurrentVideo(index);
  return ({
    ...state,
    currentVideo: index,
    currentSegment: 0,
    isPlaying: false,
    videos,
    annotateDisabled: !state.invalidAnnotatable && video.attributes && video.attributes.is_valid === 'invalid',
  });
};

export const setAudioErrorMsg = (state, data) => {
  const { index, errorMsg } = data;
  const { audioErrorMsg = [] } = state;
  audioErrorMsg[index] = errorMsg;
  return {
    ...state,
    audioErrorMsg,
  };
};

export const setErrorMsg = (state, data) => {
  const { errorMsg } = data;
  console.log(errorMsg);
  return {
    ...state,
    errorMsg,
  };
};

export const setCurrentSegment = (state, data) => {
  const { index, start } = data;
  const { currentVideo, wavesurfers, results, segmentMode } = state;
  if ((segmentMode !== SegmentMode.individual && index < 0) || index >= results[currentVideo].length) return state;
  wavesurfers.setCurrentSegment(index, start);
  return ({
    ...state,
    currentSegment: index,
  });
};

export const setVideoSpeed = (state, data) => {
  const { speed } = data;
  const { wavesurfers, currentVideo } = state;
  let rate = 1;
  if (speed < 0.25) rate = 0.25;
  else if (speed > 4) rate = 4;
  // eslint-disable-next-line radix
  else if (speed >= 0.25 && speed <= 4) rate = parseFloat(speed).toFixed(2);
  const videos = [...state.videos];
  videos[currentVideo] = { ...state.videos[currentVideo] };
  videos[currentVideo].speed = rate;
  wavesurfers.setCurrentSpeed(rate);
  return ({
    ...state,
    videos,
  });
};

export const setVideoZoom = (state, data) => {
  const { zoom } = data;
  const { wavesurfers, currentVideo } = state;
  let rate = 1;
  if (zoom < 1) rate = 1;
  else if (zoom > 1000) rate = 1000;
  // eslint-disable-next-line radix
  else if (zoom >= 1 && zoom <= 1000) rate = parseInt(zoom);
  const videos = [...state.videos];
  videos[currentVideo] = { ...state.videos[currentVideo] };
  videos[currentVideo].zoom = rate;
  wavesurfers.setCurrentZoom(rate);
  return ({
    ...state,
    videos,
  });
};

export const showHideGuider = (state) => {
  const { isGuiding } = state;
  return ({
    ...state,
    isGuiding: !isGuiding,
  });
};

export const setMeasurement = (state, data) => {
  const { selectedMeasurement } = data;
  return { ...state, selectedMeasurement };
};

export const updateVideoInfo = (state, data) => {
  const { index, duration } = data;
  const videos = [...state.videos];
  videos[index] = {
    ...state.videos[index],
    duration,
  };
  return { ...state, videos };
};
