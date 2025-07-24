/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-empty */
import React, { useRef, useImperativeHandle, useMemo } from 'react';
import { Tooltip } from 'antd';
import { connect } from 'react-redux';
import { Grid, AutoSizer } from 'react-virtualized';
import './SegmentNavigation.scss';
import { translate, ValidDurationMode } from '../../constants';

let SegmentNavigation = (props) => {
  const {
    currentVideo, currentSegment, videos, keyAttribute, refInstance,
    results: annotationResults, validDuration
  } = props;
  const gridRef = useRef();
  const handleButtonClick = (e, segmentIndex) => {
    props.setCurrentSegment({ index: segmentIndex });
  };

  const size = annotationResults[currentVideo].length;

  useImperativeHandle(refInstance, () => ({
    gridRef: gridRef.current
  }));

  const getNavigationEnd = (index) => {
    const step = props.navigationSize;
    const min = Math.min(index + step, size);
    if (min === index + 1) {
      const text = `${index + 1}`;
      // eslint-disable-next-line no-nested-ternary
      const style = text.length > 3 ? { fontSize: '9px', marginLeft: '-3px' } : text.length > 2 ? { fontSize: '11px', marginLeft: '-2px' } : null;
      return <span style={style}>{text}</span>;
    }
    return <span>{`${index + 1}~${min}`}</span>;
  };

  const containsEmptyText = (index) => {
    try {
      const results = props.results[currentVideo];
      const max = Math.min(index + props.navigationSize, size);
      for (let i = index; i < max; i += 1) {
        if (results[i]?.content.some((l) => !l.text)) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  };

  const getTextSnapshot = (index) => {
    try {
      const role = props.results[currentVideo][index]?.content[0]?.role;
      return (role ? `${role}: ` : '') + props.results[currentVideo][index]?.content[0]?.text;
    } catch (e) {}
    return '';
  };

  const durationStatistic = useMemo(() => {
    const objects = {
      originalDuartion: 0,
      validDuration: 0,
      annotatedDuration: 0,
    };
    const invalidOptions = keyAttribute.options.filter((o) => o.isValid === false).map((o) => o.value);
    const currentResults = annotationResults[currentVideo];
    const { duration } = videos[currentVideo];
    objects.originalDuartion = duration;
    for (let j = 0; j < currentResults.length; j += 1) {
      const { attributes, start, end, content } = currentResults[j];
      if (start >= duration) break;
      const time = end - start;
      let isValid = true;
      if (validDuration === ValidDurationMode.translations) {
        const index = content.findIndex((c) => c.text && c.text.trim() !== '');
        if (index < 0) {
          isValid = false;
        }
      } else {
        const keyAttributeValue = attributes[keyAttribute.name];
        if (keyAttributeValue && invalidOptions.includes(keyAttributeValue)) {
          isValid = false;
        }
      }
      objects.annotatedDuration += time;
      if (isValid) {
        objects.validDuration += time;
      }
    }
    return objects;
  }, [videos, annotationResults, currentVideo]);

  return (
    <div
      style={{ height: videos[currentVideo].type === 'video' ? 'calc(60% - 12px)' : 'calc(100% - 12px)' }}
      className="segment-navigation-container"
    >
      <div className="duration-box">
        <span className="duration-item">
          <span>{`${translate('originalDuartion')}: `}</span>
          <span className="value">
            {(durationStatistic.originalDuartion || 0).toFixed(2)}
            s
          </span>
        </span>
        <span className="duration-item">
          <span>{`${translate('annotatedDuration')}: `}</span>
          <span className="value">
            {(durationStatistic.annotatedDuration || 0).toFixed(2)}
            s
          </span>
        </span>
        <span className="duration-item">
          <span>{`${translate('validDuration')}: `}</span>
          <span className="value">
            {(durationStatistic.validDuration || 0).toFixed(2)}
            s
          </span>
        </span>
      </div>
      <span>{`${translate('navigation')}:`}</span>
      <div className="segment-navigation-list">
        <AutoSizer>
          {({ width, height }) => (
            <Grid
              ref={gridRef}
              style={{ outline: 'none' }}
              width={width}
              height={height}
              rowCount={Math.ceil(props.results[currentVideo].length / Math.floor(width / 40))}
              columnCount={Math.floor(width / 40)}
              rowHeight={40}
              columnWidth={40}
              cellRenderer={({ columnIndex: col, rowIndex: row, key, parent, style }) => (
                <div
                  style={style}
                  key={key}
                  parent={parent}
                >
                  {
                    row * Math.floor(width / 40) + col >= props.results[currentVideo].length
                      ? null
                      : (
                        <Tooltip
                          title={getTextSnapshot(row * Math.floor(width / 40) + col)}
                        >
                          <button
                            className={`segment-navigation-item ${row * Math.floor(width / 40) + col === currentSegment ? 'segment-navigation-item-focus' : ''} ${containsEmptyText(row * Math.floor(width / 40) + col) ? 'segment-navigation-item-empty' : ''}`}
                            onClick={(e) => handleButtonClick(e, row * Math.floor(width / 40) + col)}
                          >
                            {getNavigationEnd(row * Math.floor(width / 40) + col)}
                          </button>
                        </Tooltip>
                      )
                  }
                </div>
              )}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  videos: state.videos,
  results: state.results,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
  navigationSize: state.navigationSize,
  validDuration: state.validDuration,
  keyAttribute: state.keyAttribute,
  globalConfig: state.globalConfig,
});
const mapDispatchToProps = {};

SegmentNavigation = connect(mapStateToProps, mapDispatchToProps)(SegmentNavigation);
export default React.forwardRef((props, ref) => <SegmentNavigation {...props} refInstance={ref} />);
