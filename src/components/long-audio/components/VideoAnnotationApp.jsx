/* eslint-disable no-return-await */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable class-methods-use-this */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { cloneDeep, isEqual } from 'lodash';
import { message, notification, Modal } from 'antd';
import LayoutWrapper from '../../common/layout/LayoutWrapper';
import { initPayloadState, setCurrentSegment, setErrorMsg, setWordTimestamps, setVideoLoaded, setLoadReviewEnabled, setResults } from '../redux/action';
import TaskNavigation from './TaskNavigation/TaskNavigation';
import AudioComp from './AudioComp/AudioComp';
import VideoComp from './VideoComp/VideoComp';
import SegmentNavigation from './SegmentNavigation/SegmentNavigation';
import SegmentAbstract from './SegmentAbstract/SegmentAbstract';
import SegmentDetail from './SegmentDetail/SegmentDetail';
import Validation from './Validation/Validation';
import GlobalAttributes from './GlobalAttributes/GlobalAttributes';
import './VideoAnnotationApp.scss';
import { isReviewEditable, isPreview, isAnnotationReadonly } from '../../../utils/tool-mode';
import { translate, validateForm, ValidDurationMode, SegmentMode } from '../constants';
import { fetchResultByUrl, getFileExtension, getWords } from '../../../utils';
import { verifyCurrentForm, isInput } from '../redux/reducer/segmentController';
import { initPayload, handleLawToWav } from '../redux/reducer/connectController';
import AutoSaver from '../../common/AutoSaver';

notification.config({ top: 60 });

class VideoAnnotationApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
    };
    window.disableLongAudioHotKeys = true;

    this.validator = React.createRef();
    this.audioRef = React.createRef();
    this.saverRef = React.createRef();
  }

  componentDidMount() {
    // initialize the annotations and reviews
    this.props.jobProxy.loadResult().then(async (result) => {
      // TODO: review the implementation of the init function

      // handle old and new result format, old - array, new object with results and auditId
      let annotationResult = [];
      if (Array.isArray(result)) {
        annotationResult = result;
      } else if (result && result.results) {
        annotationResult = result.results;
        if (result.auditId) {
          this.props.jobProxy.setAuditId(result.auditId);
        }
      }
      const reviews = await this.props.jobProxy.loadReviews() || {};
      this.appendReviews(annotationResult, reviews);
      try {
        if (!this.props.payload.audio) {
          this.props.setErrorMsg({ errorMsg: translate('AUDIO_SOURCE_ERROR') });
          return;
        }
        const payload = await initPayload(this.props.state, { ...this.props.payload, review_from: annotationResult, result });
        this.props.initPayloadState(payload);
        await this.initWordTimestamps();
        this.setState({ ready: true });
        this.props.renderComplete();
        window.disableLongAudioHotKeys = false;
        this.loadAlaws(payload.videos);
        this.props.setLoadReviewEnabled(this.props.jobProxy.loadReviewEnabled);
      } catch (e) {
        console.log('Error', e);
        this.props.setErrorMsg({ errorMsg: e?.toString() });
      }
    }).catch(() => {
      this.props.setErrorMsg({ errorMsg: translate('ANNOTATION_DATA_LOAD_ERROR') });
    }).then(() => {
      // check temp saved data
      if (this.props.jobProxy.savedDataLoadError) {
        Modal.confirm({
          title: translate('TEMP_SAVED_LOAD_ERROR'),
          okText: translate('TEMP_SAVED_LOAD_ERROR_OK'),
          cancelText: translate('TEMP_SAVED_LOAD_ERROR_CANCEL'),
          autoFocusButton: null,
          onOk: () => {
            // set temp saved to true to disable leave check
            this.saverRef.current?.setTempSaved(true);
            window.location.reload();
          },
          onCancel: () => {
            // set to false to enable result save
            this.props.jobProxy.savedDataLoadError = false;
          },
        });
      }
    });

    window.addEventListener('keydown', async (e) => {
      if (window.disableLongAudioHotKeys) return;
      if (isInput()) return;
      if (e.keyCode === 83) { // s
        if (e.altKey || e.metaKey) return;
        if (e.ctrlKey) {
          e.preventDefault();
          this.onSave();
        }
      }
    });
  }

  componentWillUnmount() {

  }

  loadAlaws = async (audios) => {
    let loadAlaw = false;
    const videos = cloneDeep(audios);
    for (let i = 0; i < videos.length; i += 1) {
      const { url } = videos[i];
      const tail = getFileExtension(url);
      if (tail === 'alaw' || tail === 'ulaw') {
        loadAlaw = true;
        // eslint-disable-next-line no-await-in-loop
        videos[i].url = await handleLawToWav(url, tail, i);
        videos[i].loaded = true;
      }
    }
    if (loadAlaw) {
      this.props.setVideoLoaded({ videos });
    }
  };

  async initWordTimestamps() {
    const wordTimestamps = await Promise.all(this.props.wordTimestampUrls.map(async (url) => await this.parseWords(url)));
    this.props.setWordTimestamps({ wordTimestamps });
  }

  async parseWords(wordUrl) {
    if (wordUrl) {
      try {
        const ret = await fetchResultByUrl(wordUrl);
        ret.words.sort((a, b) => (a < b ? -1 : 1));
        return ret;
      } catch (e) {
        console.log(`failed to load word from ${wordUrl}`, e);
      }
    }
    return [];
  };

  onSave = async () => {
    if (isPreview(this.props.toolMode)) {
      return;
    }
    try {
      if (!isAnnotationReadonly(this.props.toolMode)) {
        await this.saveResult();
      }
      if (isReviewEditable(this.props.toolMode)) {
        await this.saveReviews();
      }
      notification.success({ message: translate('saveSuccess') });
    } catch (e) {
      notification.error({ message: e?.message || translate('saveFailure') });
    }
  };

  appendReviews(result, reviews) {
    if (!result) return;
    result.forEach((videoSegments, videoIdx) => {
      const videoReviews = reviews[videoIdx] || {};
      videoSegments.forEach((segment) => {
        if (Object.keys(reviews).length > 0) {
          delete segment.qaChecked;
          delete segment.qaComment;
          delete segment.qaReason;
          delete segment.qaWorkerName;
        }
        const segmentReview = videoReviews[segment.id];
        if (segmentReview) {
          segment.qaChecked = segmentReview.qaChecked;
          segment.qaComment = segmentReview.qaComment;
          segment.qaReason = segmentReview.qaReason;
          segment.qaWorkerName = segmentReview.qaWorkerName;
        }
      });
    });
  }

  isLineCountMatched(source, target) {
    if (typeof source === 'string' && source.length > 0) {
      return target && source.split(/\r\n|\r|\n/).length === target.split(/\r\n|\r|\n/).length;
    }
    return true;
  }

  async saveResult(isSubmit = false) {
    if (!this.state.ready) {
      throw new Error(`${translate('TOOL_NOT_INITIALIZED')}`);
    }
    const invalidOptions = this.props.keyAttribute.options.filter((o) => o.isValid === false).map((o) => o.value);
    const annotationResults = cloneDeep(this.props.results);
    const annotationVideos = cloneDeep(this.props.videos);
    let validAudios;
    let invalidAudios;
    for (let i = 0; i < annotationVideos.length; i += 1) {
      const video = annotationVideos[i];
      delete video.originAttributes;
      delete video.defaultAttributes;
      video.url = video.source || video.url;
      delete video.source;
      if (isSubmit && video.duration === undefined) {
        throw new Error(`${translate('AUDIO_NOT_COMPLETE')} No: ${i + 1} `);
      }
    }
    if (isSubmit && this.props.globalConfig && Array.isArray(this.props.globalConfig.fields) && this.props.globalConfig.fields.length > 0) {
      annotationResults.forEach((_, index) => {
        const { attributes } = annotationVideos[index];
        // global attributes check
        if (!attributes || !validateForm(this.props.globalConfig, attributes)) {
          throw new Error(translate('GLOBAL_ATTR_MISS'));
        }
        // remove invalid audio results
        const invalid = (attributes || {}).is_valid === 'invalid';
        if (!this.props.invalidAnnotatable && invalid) {
          annotationResults[index] = [];
        }
        const isValidField = this.props.globalConfig.fields.find((f) => f.name === 'is_valid');
        if (isValidField) {
          if (validAudios === undefined) {
            validAudios = [];
            invalidAudios = [];
          }
          if (invalid) {
            invalidAudios.push(index);
          } else {
            validAudios.push(index);
          }
        }
      });
    }
    const isContinuous = this.props.segmentMode === SegmentMode.continuous;
    const minLen = Math.min(this.props.minSegmentLength, 0);
    for (let currentVideo = 0; currentVideo < annotationResults.length; currentVideo += 1) {
      const video = annotationVideos[currentVideo];
      const audio = annotationResults[currentVideo].filter((s) => s.start < video.duration);
      const segmentsMap = {};
      let prevEnd = 0;
      for (let n = 0; n < audio.length; n += 1) {
        const { qaChecked, qaComment, qaReason, qaWorkerName, ...oldsSegment } = audio[n];
        let segment = oldsSegment;
        if (segment.end - segment.start <= minLen) {
          // eslint-disable-next-line no-continue
          continue;
        }
        if (this.props.lineConfig || this.props.segmentConfig) {
          // required field check
          if (isSubmit) {
            const varifyRes = verifyCurrentForm({
              ...this.props,
              currentVideo,
              currentSegment: n
            });
            if (varifyRes.result === true) {
              const { qaChecked: qaCh, qaComment: qaCo, qaReason: qaRe, qaWorkerName: qaWname, ...newSegment } = varifyRes.data;
              segment = {
                ...segment,
                ...newSegment,
              };
            } else {
              throw new Error(varifyRes.error);
            }
          }

          // set segment valid
          if (this.props.validDuration === ValidDurationMode.translations) {
            const index = segment.content.findIndex((c) => c.text && c.text.trim() !== '');
            if (index >= 0) {
              segment.isValid = true;
            } else {
              segment.isValid = false;
            }
          } else {
            const keyAttributeValue = segment.attributes[this.props.keyAttribute.name];
            if (keyAttributeValue && invalidOptions.includes(keyAttributeValue)) {
              segment.isValid = false;
            } else {
              segment.isValid = true;
            }
          }
        }
        if (isContinuous && segment.start !== prevEnd) {
          segment.start = prevEnd;
        }
        if (isContinuous && n === audio.length - 1) {
          segment.end = video.duration;
        }

        prevEnd = segment.end;
        if (Array.isArray(segment.content)) {
          segment.content.forEach((l, i) => {
            l.text = l.text?.trim();
            if (isSubmit) {
              if (this.props.client === 'hw-translation') {
                if (!this.isLineCountMatched(segment.attributes.source, l.text)) {
                  const err = `${translate('DATA_ERROR_LINE_COUNT_MISMATCH')}. Segment: ${n + 1}`;
                  notification.error({ message: err });
                  throw new Error(err);
                }
              }
            }
          });
        }
        segmentsMap[segment.id] = segment;
      }
      annotationResults[currentVideo] = Object.values(segmentsMap);
    }

    // custom validation
    if (isSubmit && this.props.submitCheck && this.validator.current) {
      const { hasCustomError, blockSubmitErrors } = await this.validator.current.handleValidate();
      if (hasCustomError) {
        throw new Error(translate('VALIDATION_CUSTOM_ERROR'));
      }
      const errorVideos = [];
      blockSubmitErrors.forEach((errors, index) => {
        if (errors.length > 0) {
          errorVideos.push(index);
        }
      });
      if (errorVideos.length > 0) {
        throw new Error(`${translate('VALIDATION_SUBMIT_FAIL')}${errorVideos.map((i) => i + 1).join(', ')}`);
      }
    }

    const statData = this.getTimeStatistics(annotationResults);
    const statistics = await this.props.jobProxy.saveResultStat(statData);
    return this.props.jobProxy.saveResult({
      results: annotationResults,
      audios: annotationVideos,
      keyAttribute: this.props.keyAttribute,
      auditId: this.props.jobProxy.auditFileId,
      statistics,
      templateConfig: this.props.jobProxy.templateConfig,
      ...validAudios && {
        validAudios,
        invalidAudios,
      },
    }, isSubmit);
  }

  saveReviews(isSubmit = false) {
    const reviews = this.extractReviews();
    return this.props.jobProxy.saveReviews(reviews, isSubmit);
  }

  extractReviews() {
    return this.props.results.map((audio, m) => {
      const segmentReviews = {};
      audio.forEach((segment, n) => {
        segmentReviews[segment.id] = {
          qaChecked: segment.qaChecked,
          qaComment: segment.qaComment,
          qaReason: segment.qaReason,
          qaWorkerName: segment.qaWorkerName,
          label: `audio${m}-${n}`
        };
      });
      return segmentReviews;
    });
  }

  setCurrentSegment = (data) => {
    const { index } = data;
    this.props.setCurrentSegment(data);
    if (this.props.results[0][index]) {
      if (this.segmentAbstract.listRef) {
        this.segmentAbstract.listRef.scrollToRow(index);
      }
      if (this.segmentNavigation.gridRef) {
        this.segmentNavigation.gridRef.scrollToCell({ rowIndex: Math.floor(index / this.segmentNavigation.gridRef.props.columnCount) });
      }
    }
  };

  segmentIsValid = (attributes, content, invalidOptions) => {
    let isValid = true;
    if (this.props.validDuration === ValidDurationMode.translations) {
      const index = content.findIndex((c) => c.text && c.text.trim() !== '');
      if (index < 0) {
        isValid = false;
      }
    } else {
      const keyAttributeValue = attributes[this.props.keyAttribute.name];
      if (keyAttributeValue && invalidOptions.includes(keyAttributeValue)) {
        isValid = false;
      }
    }
    return isValid;
  };

  getTimeStatistics = (annotationResults) => {
    const objects = {
      summary: [],
      duration: 0, // file duration
      validDuration: 0,
      annotationDuration: 0, // annotation duration
      approvedValidDuration: 0,
      rejectedValidDuration: 0,
      annotationWordCount: 0,
      annotatedCount: 0,
      validAnnotatedCount: 0,
      incrementDuration: 0,
    };
    const reviews = this.extractReviews();
    const { videos, lastResults: reviewResults } = this.props;
    const lastAnnotationResults = cloneDeep(reviewResults);

    for (let m = 0; m < videos.length; m += 1) {
      const { duration, attributes } = videos[m];
      objects.duration += duration * 1000;
      const isValidField = this.props.globalConfig.fields.find((f) => f.name === 'is_valid');
      if (isValidField) {
        const invalid = attributes?.is_valid === 'invalid';
        if (objects.validAudios === undefined) {
          objects.validAudios = [];
          objects.invalidAudios = [];
        }
        if (invalid) {
          objects.invalidAudios.push(m);
        } else {
          objects.validAudios.push(m);
        }
      }
    }
    const invalidOptions = this.props.keyAttribute.options.filter((o) => o.isValid === false).map((o) => o.value);
    for (let i = 0; i < videos.length; i += 1) {
      const results = annotationResults[i];
      const review = reviews[i];
      const { duration } = videos[i];
      for (let j = 0; j < results.length; j += 1) {
        const { attributes, id, start, end, content } = results[j];
        if (start >= duration) break;
        const time = (end - start) * 1000;
        const isValid = this.segmentIsValid(attributes, content, invalidOptions);

        // changed segment
        const lastResults = lastAnnotationResults[i];
        const equal = isEqual(results[j], lastResults[id]);
        const incrementDuration = (isValid && !equal) ? time : 0;
        delete lastResults[id];
        objects.incrementDuration += incrementDuration;
        for (let index = 0; index < content.length; index += 1) {
          const { text } = content[index];
          const words = getWords(text, []);
          objects.annotationWordCount += words.length;
        }
        objects.annotatedCount += 1;
        objects.annotationDuration += time;
        // valid time statistic
        if (isValid) {
          objects.validDuration += time;
          objects.validAnnotatedCount += 1;
          if (review?.[id]?.qaChecked === true) {
            objects.approvedValidDuration += time;
          } else if (review?.[id]?.qaChecked === false) {
            objects.rejectedValidDuration += time;
          }
        }
      }
    }

    // removed segment
    for (let m = 0; m < lastAnnotationResults.length; m += 1) {
      const keys = Object.keys(lastAnnotationResults[m]);
      for (let n = 0; n < keys.length; n += 1) {
        const { start, end, content = [], attributes = {} } = lastAnnotationResults[m][keys[n]];
        const isValid = this.segmentIsValid(attributes, content, invalidOptions);
        if (isValid) {
          objects.incrementDuration += (end - start) * 1000;
        }
      }
    }
    return {
      ...objects,
      duration: Number(objects.duration.toFixed(2)),
      validDuration: Number(objects.validDuration.toFixed(2)),
      annotationDuration: Number(objects.annotationDuration.toFixed(2)),
      approvedValidDuration: Number(objects.approvedValidDuration.toFixed(2)),
      rejectedValidDuration: Number(objects.rejectedValidDuration.toFixed(2)),
      incrementDuration: Number(objects.incrementDuration.toFixed(2)),
    };
  };

  clearAll = () => {
    this.audioRef?.current?.clearAll();
  };

  /**
   * load latest data of advance job
   */
  loadAdvanceJobData = (e) => {
    const { results } = this.props;
    const reviews = this.extractReviews();
    const newResults = e.result?.results || results;
    this.appendReviews(newResults, e.reviews || reviews);
    this.props.setResults({ results: newResults });
    if (e.result) {
      this.audioRef?.current?.renderSegments();
    }
  };

  render() {
    const { currentVideo, videos, errorMsg, audioErrorMsg } = this.props;
    if (errorMsg) {
      return (
        <div className="error-message">{errorMsg}</div>
      );
    }

    return (
      <LayoutWrapper className="video-annotation-container" loading={this.props.loading}>
        {(videos.length && this.state.ready) ? (
          <>
            <AutoSaver
              ref={this.saverRef}
              data={this.props.results}
              save={() => this.onSave()}
              onSaved={() => message.success(translate('AUTO_SAVE_SUCCESS'))}
            />
            <TaskNavigation
              setCurrentSegment={this.setCurrentSegment}
              clearAll={this.clearAll}
              onSave={this.onSave}
            />
            { audioErrorMsg?.[currentVideo] ? (
              <div className="error-container">
                {audioErrorMsg?.[currentVideo]}
              </div>
            ) : (
              <>
                <AudioComp
                  ref={this.audioRef}
                  setCurrentSegment={this.setCurrentSegment}
                />
                <div className="right-component-wrapper">
                  <VideoComp />
                  <SegmentNavigation
                    setCurrentSegment={this.setCurrentSegment}
                    ref={(r) => { this.segmentNavigation = r; }}
                  />
                </div>
                <div className="left-component-wrapper">
                  <GlobalAttributes />
                  <SegmentAbstract
                    setCurrentSegment={this.setCurrentSegment}
                    // eslint-disable-next-line no-return-assign
                    ref={(r) => this.segmentAbstract = r}
                  />
                </div>
                <SegmentDetail setCurrentSegment={this.setCurrentSegment} />
                <Validation
                  ref={this.validator}
                  jobProxy={this.props.jobProxy}
                  saveResult={() => this.saveResult()}
                />
              </>
            )}
          </>
        ) : null}
      </LayoutWrapper>
    );
  }
}

VideoAnnotationApp.propTypes = {
  initPayloadState: PropTypes.func.isRequired,
  renderComplete: PropTypes.func,
  jobProxy: PropTypes.object,
};

const mapStateToProps = (state) => ({
  videos: state.videos,
  currentVideo: state.currentVideo,
  results: state.results,
  lastResults: state.lastResults,
  segmentMode: state.segmentMode,
  toolMode: state.toolMode,
  errorMsg: state.errorMsg,
  audioErrorMsg: state.audioErrorMsg,
  currentSegment: state.currentSegment,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  keyAttribute: state.keyAttribute,
  client: state.client,
  wordTimestampUrls: state.wordTimestampUrls,
  submitCheck: state.submitCheck,
  invalidAnnotatable: state.invalidAnnotatable,
  globalConfig: state.globalConfig,
  loading: state.loading,
  validDuration: state.validDuration,
  minSegmentLength: state.minSegmentLength,
  state,
});
const mapDispatchToProps = {
  initPayloadState,
  setCurrentSegment,
  setErrorMsg,
  setWordTimestamps,
  setVideoLoaded,
  setLoadReviewEnabled,
  setResults,
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(VideoAnnotationApp);
