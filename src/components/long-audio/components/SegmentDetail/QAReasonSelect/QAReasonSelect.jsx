import React from 'react';
import { connect } from 'react-redux';
import './QAReasonSelect.scss';
import { Select } from 'antd';
import { translate } from '../../../constants';
import { setSegmentQAReason } from '../../../redux/action';

const QAReasonSelect = (props) => {
  const { currentVideo, currentSegment, results, issueTypes } = props;
  const segment = results[currentVideo][currentSegment];
  const handleSelectChange = (e) => {
    props.setSegmentQAReason({ qaReason: e.join(',') });
  };
  return (
    <div className="qa-reason-container">
      <div className="qa-reason-title">{`${translate('reason')}:`}</div>
      <Select
        className="task-select"
        mode="multiple"
        value={segment.qaReason?.length > 0 ? segment.qaReason.split(',') : []}
        onChange={(e) => handleSelectChange(e)}
      >
        {issueTypes.map((issue, index) => (
          <Select.Option
            // eslint-disable-next-line react/no-array-index-key
            key={`qa-reson-select-item-${index}`}
            value={issue}
          >
            {issue}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

QAReasonSelect.propTypes = {
};

const mapStateToProps = (state) => ({
  results: state.results,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
  issueTypes: state.issueTypes,
});
const mapDispatchToProps = {
  setSegmentQAReason,
};
export default connect(mapStateToProps, mapDispatchToProps)(QAReasonSelect);
