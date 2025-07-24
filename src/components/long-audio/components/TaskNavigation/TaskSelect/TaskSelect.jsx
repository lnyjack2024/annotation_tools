import React from 'react';
import { Select } from 'antd';
import { connect } from 'react-redux';
import './TaskSelect.scss';
import { setCurrentVideo } from '../../../redux/action';
import { translate } from '../../../constants';

class TaskSelect extends React.Component {
  handleSelectChange = (index, e) => {
    this.select.blur();
    this.props.setCurrentVideo({ index });
    this.props.setCurrentSegment({ index: 0 });
  };

  render() {
    const { currentVideo, videos } = this.props;
    return (
      <div className={`task-select-container ${this.props.className}`}>
        <Select
          className="task-select"
          value={`${translate('RECORD_PREFIX')} ${currentVideo + 1}`}
          onChange={(index, e) => this.handleSelectChange(index, e)}
          ref={(r) => { this.select = r; }}
        >
          {videos.map((value, index) => (
            <Select.Option
              value={index}
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              disabled={!videos[index].ready}
            >
              {`${translate('RECORD_PREFIX')} ${index + 1}`}
            </Select.Option>
          ))}
        </Select>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currentVideo: state.currentVideo,
  videos: state.videos,
  results: state.results,
  segmentConfig: state.segmentConfig,
  currentSegment: state.currentSegment,
  keyAttribute: state.keyAttribute,
  lineConfig: state.lineConfig
});
const mapDispatchToProps = {
  setCurrentVideo,
};
export default connect(mapStateToProps, mapDispatchToProps)(TaskSelect);
