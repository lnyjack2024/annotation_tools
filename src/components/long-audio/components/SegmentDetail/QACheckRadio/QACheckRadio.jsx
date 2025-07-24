import React from 'react';
import { connect } from 'react-redux';
import './QACheckRadio.scss';
import { Radio } from 'antd';
import { translate } from '../../../constants';
import QARejectIcon from '../../common/Icons/QARejectIcon';
import QAAcceptIcon from '../../common/Icons/QAAcceptIcon';
import { setSegmentQAState } from '../../../redux/action';

const QACheckRadio = (props) => {
  const { results, currentVideo, currentSegment } = props;
  const segment = results[currentVideo][currentSegment];
  const handleRadioChange = (e) => { props.setSegmentQAState({ qaChecked: e.target.value }); }
  return (
    <div className="qa-check-radio-container">
      <div className="qa-check-radio-title">
        {translate('review')}
        <span className="qa-check-radio-tip">{`(${translate('reviewTip')})`}</span>
        :
      </div>
      <Radio.Group
        value={segment.qaChecked}
        buttonStyle="solid"
        onChange={(e) => { handleRadioChange(e) }}
      >
        <Radio.Button
          value
          className="qa-check-radio-button"
        >
          <QAAcceptIcon
            style={{ float: 'left' }}
            viewBox="0, -7, 24, 24"
          />
          {translate('qaAccept')}
        </Radio.Button>
        <Radio.Button
          value={false}
          className="qa-check-radio-button"
        >
          <QARejectIcon
            style={{ float: 'left' }}
            viewBox="0, -7, 24, 24"
          />
          {translate('qaReject')}
        </Radio.Button>
      </Radio.Group>
    </div>
  );
};

QACheckRadio.propTypes = {
};

const mapStateToProps = (state) => ({
  results: state.results,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
});
const mapDispatchToProps = {
  setSegmentQAState,
};
export default connect(mapStateToProps, mapDispatchToProps)(QACheckRadio);
