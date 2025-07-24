import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import DialogueApp from '../components/dialogue';
import { methods, samplePayload } from '../components/dialogue/payload';
import { AnnotationType } from '../types';

const DialogueComp: React.FC = withConnect({ type: AnnotationType.DIALOGUE, methods, samplePayload })(DialogueApp);

ReactDOM.render(
  <DialogueComp />,
  document.getElementById('root'),
);

serviceWorker.unregister();
