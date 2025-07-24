import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import QuestionAnsweringApp from '../components/question-answering';
import { methods, samplePayload } from '../components/question-answering/payload';
import { AnnotationType } from '../types';

const QuestionAnsweringComp: React.FC = withConnect({ type: AnnotationType.QUESTION_ANSWERING, methods, samplePayload })(QuestionAnsweringApp);

ReactDOM.render(
  <QuestionAnsweringComp />,
  document.getElementById('root'),
);

serviceWorker.unregister();
