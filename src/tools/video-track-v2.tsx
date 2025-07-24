import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import VideoTracking from '../components/video-tracking2';
import { methods, samplePayload } from '../components/video-tracking2/payload';
import { AnnotationType } from '../types';

const VideoTrackingComp: React.FC = withConnect({ type: AnnotationType.VIDEO_TRACK_V2, methods, samplePayload })(VideoTracking);

ReactDOM.render(
  <VideoTrackingComp />,
  document.getElementById('root'),
);

serviceWorker.unregister();
