import React from 'react';
import { observer } from 'mobx-react';
import GlobalInfo from './GlobalInfo';
import CameraAttributes from './CameraAttributes';

const GlobalPanel = observer(() => (
  <>
    <GlobalInfo />
    <CameraAttributes />
  </>
));

export default GlobalPanel;
