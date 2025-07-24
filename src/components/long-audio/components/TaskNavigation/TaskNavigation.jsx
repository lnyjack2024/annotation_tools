import React, { useEffect, useState } from 'react';
import screenfull from 'screenfull';
import { connect } from 'react-redux';
import AppenLogo from '../../../common/AppenLogo';
import TaskSelect from './TaskSelect/TaskSelect';
import Guider from './Guider/Guider';
import Measurements from './Measurements/Measurements';
import Preferences from '../Preferences';
import { ClearAll, Save, Question, Fullscreen } from '../../../common/icons';
import './TaskNavigation.scss';
import { showHideGuider } from '../../redux/action';
import { translate, SegmentMode } from '../../constants';
import version from '../../version';
import { isPreview, isAnnotationReadonly } from '../../../../utils/tool-mode';
import { isAppenCloud } from '../../../../utils';

const TaskNavigation = ((props) => {
  const { toolMode, annotateDisabled, results, currentVideo, segmentMode } = props;
  const [enableClear, setEnableClear] = useState(false);

  useEffect(() => {
    const readonly = isAnnotationReadonly(toolMode) || annotateDisabled;
    const segments = results[currentVideo];
    const len = segments.length;
    let isAnnotated = false;
    if (len === 1) {
      const { attributes, content = [{ role: 'none', text: '', attributes: {} }] } = segments[0];
      isAnnotated =
        Object.keys(attributes || {}).length > 0 ||
        content[0].role !== 'none' ||
        Object.keys(content[0].attributes || {}).length > 0;
    }

    setEnableClear(
      !readonly && (
        (segmentMode === SegmentMode.individual && len > 0) ||
        (segmentMode === SegmentMode.continuous && (len > 1 || isAnnotated))
      )
    );
  }, [results, currentVideo]);

  const handleButtonClick = (e, type) => {
    switch (type) {
      case 'fullscreen':
        if (screenfull.isEnabled) {
          screenfull.toggle();
        }
        break;
      case 'guider':
        props.showHideGuider();
        break;
      case 'save':
        props.onSave();
        break;
      case 'clearAll': {
        if (enableClear) {
          props.clearAll();
        }
        break;
      }
      default:
        break;
    }
  };
  return (
    <div className="task-navigation-container">
      {isAppenCloud() && (
        <div className="appen-logo">
          <AppenLogo />
        </div>
      )}
      <div className="appen-title">
        <span>Audio Segmentation Tool</span>
        <span className="version">
          {translate('VERSION_LABEL')}
          {' '}
          {version}
        </span>
      </div>
      <div className="task-navigation-button-list">
        <Measurements />
        <button
          disabled={!enableClear}
          className="clear-all-button"
          onClick={(e) => handleButtonClick(e, 'clearAll')}
        >
          <ClearAll />
        </button>
        <button
          className="guider-button"
          onClick={(e) => handleButtonClick(e, 'guider')}
        >
          <Question />
        </button>
        <button
          className="fullscreen-button"
          onClick={(e) => handleButtonClick(e, 'fullscreen')}
        >
          <Fullscreen />
        </button>
        <Preferences />
        <button
          className="save-button"
          disabled={isPreview(toolMode)}
          onClick={(e) => handleButtonClick(e, 'save')}
        >
          <Save />
        </button>
      </div>
      <Guider />
      <TaskSelect
        className="task-select-wrapper"
        setCurrentSegment={props.setCurrentSegment}
      />
    </div>
  );
});

const mapStateToProps = (state) => ({
  isGuiding: state.isGuiding,
  toolMode: state.toolMode,
  segmentMode: state.segmentMode,
  currentVideo: state.currentVideo,
  results: state.results,
  annotateDisabled: state.annotateDisabled,
});
const mapDispatchToProps = {
  showHideGuider,
};
export default connect(mapStateToProps, mapDispatchToProps)(TaskNavigation);
