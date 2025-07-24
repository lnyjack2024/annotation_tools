import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import TextAnnotationApp from '../components/editable-text/TextAnnotationApp';
import { samplePayload, methods } from '../components/editable-text/payload';
import { AnnotationType } from '../types';

const TextAnnotationComp: React.FC = withConnect({ type: AnnotationType.EDITABLE_TEXT, methods, samplePayload })(TextAnnotationApp);

ReactDOM.render(
  <TextAnnotationComp />,
  document.getElementById('root'),
);
serviceWorker.unregister();
