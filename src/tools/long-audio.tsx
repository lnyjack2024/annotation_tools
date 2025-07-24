import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import VideoAnnotationWrapper from '../components/long-audio';
import { samplePayload, methods } from '../components/long-audio/payload';
import { AnnotationType } from '../types';

const VideoAnnotationComp: React.FC = withConnect({ type: AnnotationType.LONG_AUDIO, methods, samplePayload })(VideoAnnotationWrapper);

ReactDOM.render(
  <VideoAnnotationComp />,
  document.getElementById('root'),
);

serviceWorker.unregister();
