import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from '../serviceWorker';
import { AnnotationType } from '../types';

ReactDOM.render(
  <div style={{ padding: 32 }}>
    <h1>Annotation Tools</h1>
    <ul>
      {Object.values(AnnotationType).map((tool) => (
        <li key={tool}><a href={`/${tool}.html`}>{tool}</a></li>
      ))}
    </ul>
  </div>,
  document.getElementById('root'),
);

serviceWorker.unregister();
