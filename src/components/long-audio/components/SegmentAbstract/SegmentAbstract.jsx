import React, { createRef } from 'react';
import { connect } from 'react-redux';
import { CellMeasurer, CellMeasurerCache, List, AutoSizer } from 'react-virtualized';
import SegmentAbstractItem from './SegmentAbstractItem/SegmentAbstractItem';
import './SegmentAbstract.scss';

const cache = new CellMeasurerCache({
  // defaultHeight: 72,
  fixedWidth: true,
});

class SegmentAbstract extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = createRef();
  }

  rowHeights = {};

  getRowHeight = ({ index }) => this.rowHeights[index] || 72;

  onUpdate = (index, rowHeight) => {
    cache.clear(index, 0);
    this.rowHeights[index] = rowHeight;
    // this.listRef?.recomputeRowHeights(index);
  };

  // TODO: slider bar
  render() {
    this.segmentAbstractItems = [];
    const { currentVideo, results, setCurrentSegment, loading } = this.props;

    if (loading) {
      return null;
    }

    return (
      // eslint-disable-next-line react/jsx-filename-extension
      <div
        className="segment-abstract-container"
        id="segment-abstract-container"
        ref={(r) => { this.segmentAbstractBox = r; }}
      >
        <AutoSizer onResize={() => cache.clearAll()}>
          {({ width, height }) => (
            <List
              ref={(r) => { this.listRef = r; }}
              style={{ outline: 'none' }}
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowCount={results[currentVideo].length}
              rowHeight={this.getRowHeight}
              rowRenderer={({ index, key, parent, style }) => (
                <CellMeasurer
                  cache={cache}
                  columnIndex={0}
                  key={key}
                  parent={parent}
                  rowIndex={index}
                >
                  <div style={style}>
                    <SegmentAbstractItem
                      ref={(r) => { this.segmentAbstractItems[index] = r; }}
                      segmentIndex={index}
                      segment={results[currentVideo][index]}
                      setCurrentSegment={setCurrentSegment}
                      onUpdate={(rowHeight) => { this.onUpdate(index, rowHeight); }}
                    />
                  </div>
                </CellMeasurer>
              )}
            />
          )}
        </AutoSizer>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  results: state.results,
  ontology: state.ontology,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
  videos: state.videos,
  loading: state.loading,
});
const mapDispatchToProps = {
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SegmentAbstract);
