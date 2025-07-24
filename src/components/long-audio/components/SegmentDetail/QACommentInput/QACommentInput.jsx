/* eslint-disable react/jsx-filename-extension */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import './QACommentInput.scss';
import { Input } from 'antd';
import { translate } from '../../../constants';
import { setSegmentQAComment } from '../../../redux/action';

const QACommentInput = (props) => {
  const { results, currentVideo, currentSegment } = props;
  const segment = results[currentVideo][currentSegment];

  const [comment, setComment] = useState(segment.qaComment);

  useEffect(() => {
    if (segment.qaComment !== comment) {
      setComment(segment.qaComment);
    }
  }, [segment.qaComment]);

  const handleInputChange = (e) => {
    const { value } = e.target;
    setComment(value);
    props.setSegmentQAComment({ qaComment: value });
  };
  return (
    <div className="qa-comment-container">
      <div className="qa-comment-title">{`${translate('comment')}:`}</div>
      <Input.TextArea
        className="qa-comment-text"
        value={comment}
        autoSize={{ minRows: 6 }}
        onChange={(e) => handleInputChange(e)}
        onFocus={() => { window.disableLongAudioHotKeys = true; }}
        onBlur={() => { window.disableLongAudioHotKeys = false; }}
      />
    </div>
  );
};

QACommentInput.propTypes = {
};

const mapStateToProps = (state) => ({
  results: state.results,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
});
const mapDispatchToProps = {
  setSegmentQAComment
};
export default connect(mapStateToProps, mapDispatchToProps)(QACommentInput);
