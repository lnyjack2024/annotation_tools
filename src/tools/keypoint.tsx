import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import LandmarkAnnotation from '../components/keypoint';
import { methods, samplePayload } from '../components/keypoint/payload';
import { AnnotationType } from '../types';

const LandmarkAnnotationComp: React.FC = withConnect({ type: AnnotationType.KEYPOINT, methods, samplePayload })(LandmarkAnnotation);

ReactDOM.render(
  <LandmarkAnnotationComp />,
  document.getElementById('root'),
);

serviceWorker.unregister();
