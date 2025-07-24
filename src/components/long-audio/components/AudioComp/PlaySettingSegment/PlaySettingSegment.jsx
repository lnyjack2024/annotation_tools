import React, { useState, useEffect, useImperativeHandle } from 'react';
import { connect } from 'react-redux';
import { Input } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { setSegmentStartEnd } from '../../../redux/action';
import { formatTimestamp } from '../../../constants';
import './PlaySettingSegment.scss';

const TIMESTAMP = '00:00.000';
const TIMESTAMP_REGX = /^\d{2}:\d{2}\.\d{3}$/;

export const MoveType = {
  PLUS: 'plus',
  MINUS: 'minus'
};

const InputNumber = ({ className, step = 0.1, min, max, value, onChange, onFocus, onBlur }) => {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    setTimestamp(formatTimestamp(value));
  }, [value]);

  const select = (input, selectionStart, selectionEnd) => {
    setTimeout(() => {
      input.setSelectionRange(selectionStart, selectionEnd !== undefined ? selectionEnd : selectionStart);
    }, 0);
  };

  const change = (t) => {
    if (TIMESTAMP_REGX.test(t)) {
      const minute = parseInt(t.substring(0, 2), 10);
      const second = parseFloat(t.substring(3));
      const time = minute * 60 + second;
      if (time >= min && time <= max) {
        onChange(time);
      } else {
        setTimestamp(formatTimestamp(value));
      }
    }
  };

  const handleChange = (e) => {
    const input = e.target;
    const str = input.value;
    if (TIMESTAMP_REGX.test(str)) {
      setTimestamp(str);
      return;
    }

    const arr = Array.from(str);
    const timestampArr = Array.from(timestamp);
    const index = arr.findIndex((c, i) => timestampArr[i] !== c);
    const { selectionStart } = input;
    if ((index < 0 || index >= selectionStart) && arr.length <= timestampArr.length) {
      // just delete some characters
      const beginStr = str.substring(0, selectionStart);
      const endStr = str.substring(selectionStart);
      const complementStr = TIMESTAMP.substring(beginStr.length, TIMESTAMP.length - endStr.length);
      const tStr = `${beginStr}${complementStr}${endStr}`;
      setTimestamp(tStr);
      change(tStr);
      select(input, selectionStart === 3 || selectionStart === 6 ? selectionStart - 1 : selectionStart);
    } else {
      const subStr = str.substring(index, selectionStart);
      if (/^\d+$/.test(subStr)) {
        const subArr = Array.from(subStr);
        const characters = timestampArr.map((_, i) => {
          if (i >= index && subArr.length > 0) {
            if (i === 2 || i === 5) {
              return timestampArr[i];
            }
            const character = subArr.shift();
            return character;
          }
          return timestampArr[i];
        });
        const tStr = characters.join('');
        setTimestamp(tStr);
        change(tStr);
        select(input, selectionStart === 3 || selectionStart === 6 ? selectionStart + 1 : selectionStart);
      }
    }
  };

  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (key === '=' || key === '+') {
      // plus
      handlePlus();
    } else if (key === '-' || key === '_') {
      // minus
      handleMinus();
    }
  };

  const handlePlus = () => {
    onChange(Math.min(Math.max(value + step, min), max));
  };

  const handleMinus = () => {
    onChange(Math.min(Math.max(value - step, min), max));
  };

  return (
    <Input
      className={className}
      value={timestamp}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      addonAfter={(
        <>
          <div onClick={handlePlus}><UpOutlined /></div>
          <div onClick={handleMinus}><DownOutlined /></div>
        </>
      )}
    />
  );
};

const PlaySettingSegment = ({ wavesurfers, results, currentVideo, currentSegment, adjustmentStep = 0.1, minSegmentLength, segmentOverlap, updateSegment, playSettingRef }) => {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);

  useEffect(() => {
    const segment = results[currentVideo][currentSegment];
    if (segment) {
      setStart(segment.start);
      setEnd(segment.end);
    }

    if (wavesurfers && wavesurfers.current && wavesurfers.current.wavesurfer) {
      let segMin = 0;
      let segMax = wavesurfers.current.wavesurfer.getDuration();
      if (!segmentOverlap) {
        const prevSeg = results[currentVideo][currentSegment - 1];
        const nextSeg = results[currentVideo][currentSegment + 1];
        if (prevSeg) {
          segMin = prevSeg.end;
        }
        if (nextSeg) {
          segMax = nextSeg.start;
        }
      }
      setMin(segMin);
      setMax(segMax);
    }
  }, [results, currentVideo, currentSegment, wavesurfers]);

  useImperativeHandle(playSettingRef, () => ({
    moveStart,
    moveEnd,
  }));

  const handleStartChange = (value) => {
    updateSegment({
      videoIndex: currentVideo,
      segmentIndex: currentSegment,
      start: value,
      end,
    });
  };

  const handleEndChange = (value) => {
    updateSegment({
      videoIndex: currentVideo,
      segmentIndex: currentSegment,
      start,
      end: value,
    });
  };

  const moveStart = (type) => {
    const newStart = Math.min(Math.max(start + (type === 'plus' ? adjustmentStep : -adjustmentStep), min), end - minSegmentLength);
    handleStartChange(newStart);
  };

  const moveEnd = (type) => {
    const newEnd = Math.min(Math.max(end + (type === 'plus' ? adjustmentStep : -adjustmentStep), start + minSegmentLength), max);
    handleEndChange(newEnd);
  };

  return (
    <div className="play-setting-segment-container">
      {currentSegment >= 0 && (
        <>
          <span>
            <InputNumber
              className="play-setting-segment-time"
              min={min}
              max={end - minSegmentLength}
              step={adjustmentStep}
              value={start}
              onChange={handleStartChange}
              onFocus={() => { window.disableLongAudioHotKeys = true; }}
              onBlur={() => { window.disableLongAudioHotKeys = false; }}
            />
          </span>
          <span>~</span>
          <span>
            <InputNumber
              className="play-setting-segment-time"
              min={start + minSegmentLength}
              max={max}
              step={adjustmentStep}
              value={end}
              onChange={handleEndChange}
              onFocus={() => { window.disableLongAudioHotKeys = true; }}
              onBlur={() => { window.disableLongAudioHotKeys = false; }}
            />
          </span>
          <span>{`(${(end - start).toFixed(3)}s)`}</span>
        </>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  wavesurfers: state.wavesurfers,
  results: state.results,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
  adjustmentStep: state.adjustmentStep,
  minSegmentLength: state.minSegmentLength,
  segmentOverlap: state.segmentOverlap,
});
const mapDispatchToProps = {
  updateSegment: setSegmentStartEnd,
};

const PlaySettingSegmentComponent = connect(mapStateToProps, mapDispatchToProps)(PlaySettingSegment);
export default React.forwardRef((props, ref) => <PlaySettingSegmentComponent {...props} ref={ref} />);
