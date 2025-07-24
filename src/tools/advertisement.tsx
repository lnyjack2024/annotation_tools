import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import withConnect from '../components/withConnect';
import AdvertisementAnnotationApp from '../components/advertisement-annotation';
import payload from '../components/advertisement-annotation/payload';
import { AnnotationType } from '../types';

const AdvertisementComp: React.FC = withConnect({ type: AnnotationType.ADVERTISEMENT, samplePayload: payload })(AdvertisementAnnotationApp);

ReactDOM.render(
  <AdvertisementComp />,
  document.getElementById('root'),
);

serviceWorker.unregister();
