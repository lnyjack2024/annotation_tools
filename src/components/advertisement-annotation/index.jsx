import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import screenfull from 'screenfull';
import { Base64 } from 'js-base64';
import { notification } from 'antd';
import AnnotationForm, { FPS } from './AnnotationForm';
import AnnotationCanvas, { getDeltaTime } from './AnnotationCanvas';
import AnnotationResults from './AnnotationResults';
import AutoSaver from '../common/AutoSaver';
import { randomColor, simpleClone } from './util';
import Fullscreen from '../common/icons/Fullscreen';
import Save from '../common/icons/Save';
import { isPreview, isReviewEditable, isAnnotationReadonly } from '../../utils/tool-mode';
import { setLocale } from './locale';

notification.config({ top: 60, getContainer: () => document.getElementById('root') });

const useStateCb = function (init) {
  const cbRef = useRef();
  const [value, setValue] = useState(init);

  useEffect(() => {
    if (cbRef.current) cbRef.current(value);
  }, [value]);

  function setValueCb(val, cb) {
    cbRef.current = cb;
    setValue(val);
  }

  return { value, setValueCb };
};

const AdvertisementAnnotationApp = forwardRef((props, ref) => {
  const [duration, setDuration] = useState();
  const [currentIndex, setCurrentIndex] = useState();
  const { value: results, setValueCb: setResults } = useStateCb([]);
  const { value: advertisementName, setValueCb: setAdvertisementName } = useStateCb([]);
  const [currentMode, setCurrentMode] = useState('edit');
  const [currentTime, setCurrentTime] = useState(10);
  const [playBackRate, setPlayBackRate] = useState(1);
  const [advertisementType, setAdvertisementType] = useState([]);
  const canvasRef = useRef();
  const advertisementNameMap = useRef(new Map());
  const saverRef = useRef();

  let clk = null;
  const toolName = 'advertisement-annotation';

  useImperativeHandle(ref, () => ({
    onSubmit,
    submitReviews,
    getReviews: submitReviews,
  }));

  const playVideo = (function (record) {
    const { current } = canvasRef;
    if (current && current.video) {
      current.video.play();
      if (!record) return;
      if (record.start != null) current.video.currentTime = record.start;
      else current.video.currentTime = 0;
      if (clk) clearInterval(clk);
      clk = setInterval(() => {
        if ((record.start || 0) > currentTime || (record.end || duration) <= currentTime) {
          current.video.pause();
          clearInterval(clk);
        }
      }, 1000 / FPS);
    }
  });

  useEffect(() => {
    const event = (e) => handleKeyDown(e);
    document.addEventListener('keydown', event);
    return () => {
      document.removeEventListener('keydown', event);
    };
  }, [currentTime]);

  useEffect(() => {
    setLocale(props.locale);
    initData();
  }, []);

  const initData = async () => {
    try {
      const res = await props.jobProxy.loadResult();
      const newResults = res?.results || [];
      const labelConfigString = Base64.decode(props.label_config);
      const labelConfig = JSON.parse(labelConfigString);
      const reviewRes = await props.jobProxy.loadReviews();
      const reviews = reviewRes?.reviews || [];
      reviews.forEach(({ key, qaState, qaReason, qaComment }) => {
        const index = newResults.findIndex((i) => i.key === key);
        if (index >= 0) {
          newResults[index] = {
            ...newResults[index],
            qaState,
            qaReason,
            qaComment,
          };
        }
      });
      setResults(newResults);

      // TODO: label config validation
      advertisementNameMap.current = new Map();
      setAdvertisementName(labelConfig.advertisementName);
      setAdvertisementType(labelConfig.advertisementType);
      labelConfig.advertisementName.forEach((item) => {
        advertisementNameMap.current.set(item.value, item.color);
      });
    } catch (e) {
      console.log(e);
    };

    setInterval(() => {
      const { current } = canvasRef;
      if (!current?.video) return;
      const timeNow = parseFloat(current.video.currentTime.toFixed(3));
      setCurrentTime(timeNow);
      if (duration == null) setDuration(current.video.duration);
    }, 1000 / FPS);
  };

  const onSubmit = (isSubmit = true) => {
    validateResults(results, isSubmit);
    saverRef.current?.disableLeaveCheck();
    return props.jobProxy.saveResult({
      results,
      // advertisementName,
      // advertisementType,
    }, isSubmit);
  };

  const handleSave = async () => {
    if (isPreview(props.jobProxy.toolMode)) {
      return;
    }

    try {
      if (!isAnnotationReadonly(props.jobProxy.toolMode)) {
        await onSubmit(false);
      }
      if (isReviewEditable(props.jobProxy.toolMode)) {
        await submitReviews(false);
      }
      notification.success({ message: '保存成功' });
    } catch (e) {
      notification.error({ message: '保存失败' });
    }
  };

  const submitReviews = (isSubmit = true) => {
    const reviews = results.map((r) => ({
      key: r.key,
      qaState: r.qaState,
      qaReason: r.qaReason,
      qaComment: r.qaComment,
    }));
    validateReviews(reviews, isSubmit);
    saverRef.current?.disableLeaveCheck();
    return props.jobProxy.saveReviews({ reviews }, true);
  };

  const validateReviews = (reviews, isSubmit) => {
    const errorIds = {};
    reviews.forEach((review) => {
      const errors = [];
      if (review.qaState === 'rejected' && review.qaReason === null) {
        errors.push('驳回原因');
      }
      if (errors.length > 0) {
        errorIds[review.key] = errors;
      }
    });
    if (Object.keys(errorIds).length > 0) {
      const errMsg = Object.keys(errorIds).map((k) => `ID: ${k} 缺: ${errorIds[k].join(', ')}`).join('; ');
      if (isSubmit) {
        notification.error({ message: '质检未完善', description: errMsg });
        throw new Error(`请补全质检信息再提交 ID: ${Object.keys(errorIds)}`);
      } else {
        notification.warn({ message: '质检未完善', description: errMsg });
      }
    }
  };

  const validateResults = (res, isSubmit = false) => {
    const isTypeValid = (type) => Array.isArray(type) && type.length > 0;

    const isPositionValid = (position) => Array.isArray(position) && position.length > 0;

    const isTimeValid = (time) => time !== null && time >= 0;

    const errorIds = {};
    res.forEach((result) => {
      const errors = [];
      if (!result.name) {
        errors.push('识别结果');
      }
      if (!isTimeValid(result.start)) {
        errors.push('开始时间');
      }
      if (!isTimeValid(result.end)) {
        errors.push('结束时间');
      }
      if (!isTypeValid(result.type)) {
        errors.push('广告形式');
      }
      if (!isPositionValid(result.position)) {
        errors.push('标记框位置');
      }
      if (!result.snapshot) {
        errors.push('缺少截图，请手动点击生成');
      }
      if (errors.length > 0) {
        errorIds[result.key] = errors;
      }
    });
    if (Object.keys(errorIds).length > 0) {
      const errMsg = Object.keys(errorIds).map((k) => `ID: ${k} 缺: ${errorIds[k].join(', ')}`).join('; ');
      if (isSubmit) {
        notification.error({ message: '属性不全', description: errMsg });
        throw new Error(`请补全属性值再提交 ID: ${Object.keys(errorIds)}`);
      } else {
        notification.warn({ message: '属性不全', description: errMsg });
      }
    }
  };

  const setCurrentPlayBackRate = (function (rate) {
    const { current } = canvasRef;
    if (current && current.video) {
      current.video.playbackRate = rate;
      setPlayBackRate(rate);
    }
  });

  function pauseVideo() {
    const { current } = canvasRef;
    if (current && current.video && !current.video.paused) current.video.pause();
  }

  function seekVideo(targetTime = 0) {
    const { current } = canvasRef;
    if (current && current.video &&
        targetTime >= 0 && targetTime <= duration) {
      current.video.currentTime = targetTime;
    }
  }

  function getResult(index) {
    return results.find((r) => r.key === index);
  }

  const handleKeyDown = (e) => {
    const { current } = canvasRef;
    const { ctrlKey } = e;
    // except return key
    if (window.disableAdvertisementHotKeys && e.keyCode !== 13) {
      return;
    }
    switch (e.keyCode) {
      case 32:
        e.preventDefault();
        e.stopPropagation();
        if (currentMode !== 'edit') break;
        if (current.video.paused) playVideo();
        else pauseVideo();
        break;
      case 70:
        e.preventDefault();
        if (e.target.tagName.toUpperCase() === 'INPUT') break;
        if (!ctrlKey) break;
        // eslint-disable-next-line no-case-declarations
        fullScreen();
        break;
      case 37: // left arrow
        if (e.target.tagName.toUpperCase() === 'INPUT') break;
        if (current && current.video) current.video.currentTime = currentTime - 1;
        break;
      case 39: // right arrow
        if (e.target.tagName.toUpperCase() === 'INPUT') break;
        if (current && current.video) current.video.currentTime = currentTime + 1;
        break;
      case 73:
        if (e.target.tagName.toUpperCase() === 'INPUT') break;
        e.preventDefault();
        if (currentMode === 'edit') {
          if (currentIndex == null) return;
          const item = getResult(currentIndex);
          if (item.start != null && item.start > currentTime + getDeltaTime(playBackRate)) break;
          if (item.end != null && item.end < currentTime - getDeltaTime(playBackRate)) break;
          pauseVideo();
          enableSVG(currentIndex);
        } else {
          disableSVG();
        }
        break;
      case 13: // enter
        if (e.target.tagName.toUpperCase() === 'INPUT') {
          e.preventDefault();
          e.target.blur();
        }
        break;
      default:
        break;
    }
    return false;
  };

  const addAdvertisementName = (function (name) {
    const advertisementNameCopy = simpleClone(advertisementName);
    return new Promise((resolve) => {
      const color = randomColor();
      advertisementNameCopy.unshift({ value: name, label: name, color });
      advertisementNameMap.current.set(name, color);
      setAdvertisementName(advertisementNameCopy, () => {
        resolve('updateAdvertisementName');
      });
    }).then(() => {
      // onSubmit();
    });
  });

  const handleResultsChange = (function (newResult) {
    return new Promise((resolve) => {
      setResults(newResult, () => {
        resolve('updateResult');
      });
    }).then(() => {
      // onSubmit();
    });
  });

  const enableSVG = (function (index) {
    setCurrentIndex(index);
    setCurrentMode('paint');
  });

  const disableSVG = (function () {
    setCurrentMode('edit');
  });

  // const setSelectedIndex = (function (index) {
  //   if (index >= 0 && index < results.length) setCurrentIndex(index);
  //   else setCurrentIndex(null);
  // });

  const fullScreen = () => {
    const elem = document.getElementById('root');
    if (screenfull && !screenfull.isFullscreen) screenfull.request(elem);
    else if (screenfull && screenfull.isFullscreen) screenfull.toggle();
  };

  const focusItemInRightSide = (key) => {
    const cardContainer = document.getElementsByClassName('annotation-form-container');
    const cards = document.getElementsByClassName(`annotation-form-card-${key}`);
    if (cardContainer.length > 0 && cards.length > 0) {
      const { top: cTop, bottom: cBottom } = cardContainer[0].getBoundingClientRect();
      const { top: eTop, bottom: eBottom } = cards[0].getBoundingClientRect();
      if (eTop < cTop || eTop > cBottom) {
        cardContainer[0].scrollBy({ top: eTop - cTop });
      }
    }
  };

  return (
    <>
      <AutoSaver
        ref={saverRef}
        leaveCheck
        data={results}
        save={handleSave}
      />
      <div className="advertisement-annotation-app-topbar">
        <div className="advertisement-annotation-app-topbar-btn" onClick={handleSave}>
          <Save />
        </div>
        <div className="advertisement-annotation-app-topbar-btn" onClick={fullScreen}>
          <Fullscreen />
        </div>
        {/* <Fullscreen style={{ float: 'right', marginTop: '10px' }}/> */}
      </div>
      <div className="advertisement-annotation-app-container">
        <div className="paint-mode-mask" style={{ visibility: currentMode === 'edit' ? 'hidden' : 'visible' }} />
        <div className="vertical-wrapper">
          <AnnotationCanvas
            ref={canvasRef}
            currentTime={currentTime}
            currentIndex={currentIndex}
            currentMode={currentMode}
            results={results}
            video={props.video}
            advertisementName={advertisementName}
            currentPlayBackRate={playBackRate}
            setCurrentIndex={setCurrentIndex}
            toolMode={props.jobProxy.toolMode}
            projectId={props.jobProxy.projectId}
            flowId={props.jobProxy.flowId}
            jobId={props.jobProxy.jobId}
            taskId={props.jobProxy.taskId}
            recordId={props.jobProxy.recordId}
            advertisementNameMap={advertisementNameMap.current}
            handleResultsChange={handleResultsChange}
            focusItemInRightSide={focusItemInRightSide}
            saveContent={props.saveContent}
          />
          <AnnotationResults
            results={results}
            issueTypes={props.issue_types}
            playVideo={playVideo}
            advertisementName={advertisementName}
            advertisementType={advertisementType}
            advertisementNameMap={advertisementNameMap.current}
            setCurrentIndex={setCurrentIndex}
            currentIndex={currentIndex}
            toolMode={props.jobProxy.toolMode}
            canvas={canvasRef.current}
            handleResultsChange={handleResultsChange}
            focusItemInRightSide={focusItemInRightSide}
          />
        </div>
        <AnnotationForm
          canvas={canvasRef.current}
          duration={duration}
          currentTime={currentTime}
          currentMode={currentMode}
          currentIndex={currentIndex}
          toolMode={props.jobProxy.toolMode}
          advertisementName={advertisementName}
          advertisementType={advertisementType}
          advertisementNameMap={advertisementNameMap.current}
          currentPlayBackRate={playBackRate}
          results={results}
          handleResultsChange={handleResultsChange}
          setCurrentPlayBackRate={setCurrentPlayBackRate}
          enableSVG={enableSVG}
          disableSVG={disableSVG}
          setCurrentIndex={setCurrentIndex}
          addAdvertisementName={addAdvertisementName}
          onSubmit={onSubmit}
        />
      </div>
    </>
  );
});

export default AdvertisementAnnotationApp;
