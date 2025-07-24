import React from 'react';
import { connect } from 'react-redux';
import './QAForm.scss';
import QACheckRadio from '../QACheckRadio/QACheckRadio';
import QAReasonSelect from '../QAReasonSelect/QAReasonSelect';
import QACommentInput from '../QACommentInput/QACommentInput';

const QAForm = (props) => {
  const { results, currentVideo, currentSegment } = props;
  const segment = results[currentVideo][currentSegment];
  return (
    <div className="qa-form-container">
      <QACheckRadio />
      {segment.qaChecked ? null : <QAReasonSelect />}
      {segment.qaChecked ? null : <QACommentInput />}
    </div>
  );
};

QAForm.propTypes = {
};

const mapStateToProps = (state) => ({
  results: state.results,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
});
const mapDispatchToProps = {

};
export default connect(mapStateToProps, mapDispatchToProps)(QAForm);
