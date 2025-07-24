/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-nested-ternary */
import React from 'react';
import { Card, Radio, Cascader, Button, Tag, Input } from 'antd';
import { formatTime, simpleClone, parseTime } from './util';
import AdvertisementNameSelect from './AdvertisementNameSelect';
import { getDeltaTime } from './AnnotationCanvas';
import './index.scss';
import { isAnnotationReadonly } from '../../utils/tool-mode';

export const MIN_SEGMENT_LENGTH = 0.1;
export const UNDEFINED_COLOR = '#dddddd';
export const FOCUS_COLOR = '#f5f5f5';
export const FPS = 20;

class AnnotationForm extends React.Component {
  constructor() {
    super();
    this.state = ({
      tempOption: null,
      historySelect: [],
      currentFocus: null,
      currentFocusValue: '',
      currentTimestampType: null,
    });
    this.snapshotPlaceholder = null;
  }

  handleInputChange(v, key) {
    const { results, currentMode, currentIndex, canvas, advertisementNameMap } = this.props;
    if (currentMode !== 'edit') return;
    const resultsCopy = simpleClone(results);
    const item = this.getResult(resultsCopy, key);
    item.name = v;
    this.props.handleResultsChange(resultsCopy);
  }

  handleSelectChange(e, type, key) {
    const { results, currentMode, currentIndex, canvas, advertisementNameMap } = this.props;
    const { historySelect } = this.state;
    const resultsCopy = simpleClone(results);
    const item = this.getResult(resultsCopy, key);
    const hisotryCopy = simpleClone(historySelect);
    // let currStorage;
    switch (type) {
      case 'name': {
        this.setState({ tempOption: null });
        if (currentMode !== 'edit') break;
        if (!advertisementNameMap.has(e)) {
          break;
          //this.props.addAdvertisementName(e);
        }
        item.name = e;
        // resultsCopy[currentIndex].snapshot = canvas.genSnapshot(currentIndex, resultsCopy);
        this.props.handleResultsChange(resultsCopy);

        const eIndex = hisotryCopy.indexOf(e);
        if (eIndex !== -1) hisotryCopy.splice(hisotryCopy.indexOf(e), 1);
        if (hisotryCopy.length === 5) hisotryCopy.pop();
        hisotryCopy.unshift(e);
        this.setState({
          historySelect: hisotryCopy,
        });
        break;
      }
      case 'type':
        if (currentMode !== 'edit') break;
        item.type = e;
        this.props.handleResultsChange(resultsCopy);
        break;
      default:
        break;
    }
  }

  handleSelectBlur() {
    this.setState({ tempOption: null });
  }

  handleSelectSearch(e) {
    this.setState({ tempOption: e });
  }

  handleTimestampFocus(e, key, type) {
    window.disableAdvertisementHotKeys = true;
    this.setState({ currentFocus: key, currentTimestampType: type, currentFocusValue: e.target.value });
  }

  getResult(results, key) {
    return results.find(r => r.key === key);
  }

  async handleTimestampBlur(e, key, type) {
    const { results, canvas, toolMode } = this.props;
    if (isAnnotationReadonly(toolMode)) return;
    const resultsCopy = simpleClone(results);
    const item = this.getResult(resultsCopy, key);
    let start = item?.start;
    let end = item?.end;
    let startChanged = false;
    let endChanged = false;
    if (type === 'start') {
      const newStart = parseTime(e.target.value);
      if (newStart && (!end || newStart < end)) {
        start = newStart;
        startChanged = true;
      }
    } else if (type === 'end') {
      const newEnd = parseTime(e.target.value);
      if (newEnd && (!start || newEnd > start)) {
        end = newEnd;
        endChanged = true;
      }
    }
    if (startChanged || endChanged) {
      this.pauseVideo();
      if (startChanged) {
        canvas.video.currentTime = start;
      } else if (endChanged) {
        canvas.video.currentTime = end;
      }
      item.start = start;
      item.end = end;
      this.props.handleResultsChange(resultsCopy);
    }
    this.setState({ currentFocus: null, currentTimestampType: null, currentFocusValue: '' });
    window.disableAdvertisementHotKeys = false;
  }

  getMaxKey(results) {
    const keys = (results || []).map(r => r.key);
    const maxKey = keys.reduce((a, b) => Math.max(a, b), 0);
    return maxKey;
  }

  async handleButtonClick(e, type, key) {
    e.stopPropagation();
    e.preventDefault();
    const { results, currentTime, canvas, currentMode, toolMode, setCurrentIndex, currentIndex } = this.props;
    if (isAnnotationReadonly(toolMode)) return;
    const resultsCopy = simpleClone(results) || [];
    const item = this.getResult(resultsCopy, key);
    const maxKey = this.getMaxKey(resultsCopy);
    switch (type) {
      case 'delete':
        if (currentMode === 'edit') {
          // resultsCopy.splice(index, 1);
          for (let i = 0; i < resultsCopy.length; i += 1) {
            if (resultsCopy[i].key === key) {
              resultsCopy.splice(i, 1);
              break;
            }
          }
          this.pauseVideo();
          this.props.setCurrentIndex();
        } else {
          this.props.disableSVG();
          item.position = null;
          // resultsCopy[index].snapshot = canvas.genSnapshot(currentIndex, resultsCopy);
          setCurrentIndex(null);
        }
        this.props.handleResultsChange(resultsCopy);
        break;
      case 'add':
        if (currentMode !== 'edit') break;
        const newKey = maxKey + 1;
        resultsCopy.push({
          key: newKey,
          name: undefined,
          type: [],
          position: [],
          start: null,
          end: null,
          qaState: 'unchecked',
          qaComment: null,
          qaReason: null,
        });
        this.pauseVideo();
        this.props.handleResultsChange(resultsCopy).then(() => {
          this.props.setCurrentIndex(newKey);
        });
        break;
      case 'currentStart':
        if (currentMode !== 'edit') break;
        if (item.end != null && item.end <= currentTime + MIN_SEGMENT_LENGTH) break;
        if (currentTime == null) break;
        if (item.start !== currentTime) {
          item.start = currentTime;
          this.pauseVideo();
          const imageUrl = await this.props.canvas.generateImageUrl(currentTime);
          item.snapshot = imageUrl;
          this.props.handleResultsChange(resultsCopy);
        }
        break;
      case 'currentEnd':
        if (currentMode !== 'edit') break;
        if (currentTime == null) break;
        if (item.start != null && item.start >= currentTime - MIN_SEGMENT_LENGTH) break;
        item.end = currentTime;
        this.props.handleResultsChange(resultsCopy);
        this.pauseVideo();
        break;
      case 'removeStart':
        if (currentMode !== 'edit') break;
        if (currentTime == null) break;
        item.start = null;
        item.snapshot = null;
        this.props.handleResultsChange(resultsCopy);
        break;
      case 'removeEnd':
        if (currentMode !== 'edit') break;
        if (currentTime == null) break;
        item.end = null;
        this.props.handleResultsChange(resultsCopy);
        break;
      case 'paint':
        if (currentMode === 'edit') {
          this.props.enableSVG(item.key);
          this.pauseVideo();
        } else {
          // resultsCopy[currentIndex].snapshot = canvas.genSnapshot(currentIndex, resultsCopy);
          this.props.handleResultsChange(resultsCopy);
          this.props.disableSVG();
        }
        break;
      case 'copy': {
        const newItem = JSON.parse(JSON.stringify(item));
        newItem.key = this.getMaxKey(results) + 1;
        newItem.position = [];
        resultsCopy.push(newItem);
        this.props.handleResultsChange(resultsCopy).then((resolve) => {
          this.pauseVideo();
          this.props.enableSVG(newItem.key);
        });
        break;
      }
      default:
        break;
    }
  }

  handleCardClick(e, key) {
    this.props.setCurrentIndex(key);
  }

  pauseVideo() {
    const { canvas } = this.props;
    if (canvas && canvas.video) canvas.video.pause();
  }

  render() {
    const { tempOption, historySelect } = this.state;
    const {
      results,
      advertisementName,
      advertisementType,
      currentTime,
      currentMode,
      currentIndex,
      canvas,
      currentPlayBackRate,
      advertisementNameMap,
      toolMode,
    } = this.props;
    const currentItem = this.getResult(results, currentIndex);
    return (
      <div className="annotation-form-wrapper">
        <Card className="annotation-form-card">
          <Card className="video-currentTime" size="small">
            {formatTime(currentTime)}
          </Card>
          <Radio.Group
            className="video-playBackRate"
            onChange={(e) => this.props.setCurrentPlayBackRate(e.target.value)}
            defaultValue={1}
          >
            <Radio.Button value={0.25}>
              X0.25
            </Radio.Button>
            <Radio.Button value={0.5}>
              X0.5
            </Radio.Button>
            <Radio.Button value={1}>
              X1
            </Radio.Button>
            <Radio.Button value={2}>
              X2
            </Radio.Button>
            <Radio.Button value={4}>
              X4
            </Radio.Button>
          </Radio.Group>
          <Button
            className="annotation-form-button"
            onClick={(e) => this.handleButtonClick(e, 'add')}
            type="primary"
            block
            disabled={isAnnotationReadonly(toolMode)}
          >
            新增标注
          </Button>
        </Card>
        <div className="annotation-form-container">
          {results.reduceRight((arr, item, index) => {
            arr.push(
              ((item.start == null || item.end == null) || (item.start <= currentTime + getDeltaTime(currentPlayBackRate) && item.end >= currentTime - getDeltaTime(currentPlayBackRate)))
                ? (
                  <Card
                    // eslint-disable-next-line react/no-array-index-key
                    key={item.key}
                    className={`annotation-form-card annotation-form-card-${item.key}`}
                    style={{ border: currentIndex === item.key ? '1px solid #1890ff' : null }}
                    onClick={(e) => this.handleCardClick(e, item.key)}
                  >
                    <div className="advertisement-attribute-wrapper">
                      <label className="advertisement-attribute-label">
                        中国元素词条
                      </label>
                      <Input
                        className="advertisement-attribute-select"
                        value={item.name || ''}
                        onChange={(e) => this.handleInputChange(e.target.value, item.key)}
                        onFocus={(e) => {
                          window.disableAdvertisementHotKeys = true;
                        }}
                        onBlur={(e) => {
                          window.disableAdvertisementHotKeys = false;
                        }}
                        placeholder="输入中国元素词条"
                        onPressEnter={(e) => this.handleSelectChange(e.target.value, 'name', item.key)}
                        autoComplete="off"
                        list="advertisement-name-list"
                        disabled={isAnnotationReadonly(toolMode)}
                      />
                      {/* <AdvertisementNameSelect
                        index={item.key}
                        historySelect={historySelect}
                        handleSelectChange={this.handleSelectChange.bind(this)}
                        handleSelectSearch={this.handleSelectSearch.bind(this)}
                        handleSelectBlur={this.handleSelectBlur.bind(this)}
                        item={item}
                        advertisementName={advertisementName}
                        advertisementNameMap={advertisementNameMap}
                        tempOption={tempOption}
                        disabled={isAnnotationReadonly(toolMode)}
                      /> */}
                    </div>
                    <div className="advertisement-attribute-wrapper">
                      <label className="advertisement-attribute-label">
                        视频描述
                      </label>
                      <Input
                        className="advertisement-attribute-select"
                        value={item.type?.length ? item.type.join(',') : ''}
                        onChange={(e) => this.handleSelectChange(e.target.value.split(','), 'type', item.key)}
                        onFocus={(e) => {
                          window.disableAdvertisementHotKeys = true;
                        }}
                        onBlur={(e) => {
                          window.disableAdvertisementHotKeys = false;
                        }}
                        placeholder="输入视频描述"
                        autoComplete="off"
                        list="advertisement-type-list"
                        disabled={isAnnotationReadonly(toolMode)}
                      />
                      {/* <Cascader
                        showSearch
                        className="advertisement-attribute-select"
                        options={advertisementType}
                        placeholder="选择广告形式"
                        onChange={(e) => this.handleSelectChange(e, 'type', item.key)}
                        defaultValue={item.type}
                        getPopupContainer={() => document.getElementById('root')}
                        disabled={isAnnotationReadonly(toolMode)}
                        onFocus={() => window.disableAdvertisementHotKeys = true}
                        onBlur={() => window.disableAdvertisementHotKeys = false}
                      /> */}
                    </div>
                    <div className="advertisement-attribute-wrapper">
                      <label className="advertisement-attribute-label">
                        开始时间
                      </label>
                      <input
                        disabled={isAnnotationReadonly(toolMode)}
                        className="advertisement-timestamp"
                        value={this.state.currentFocus === item.key && this.state.currentTimestampType === 'start' ? this.state.currentFocusValue : formatTime(item.start)}
                        onFocus={(e) => this.handleTimestampFocus(e, item.key, 'start')}
                        onBlur={(e) => this.handleTimestampBlur(e, item.key, 'start')}
                        onChange={(e) => { this.setState({ currentFocusValue: e.target.value }) }}
                      />
                      {/*<input
                        readOnly
                        className="advertisement-timestamp"
                        value={formatTime(item.start)}
                        onChange={(e) => {
                          console.log('start time', e.target.value, formatTime(e.target.value));
                          item.start = 123;
                        }}
                      />*/}
                      <Button
                        className="advertisement-timestamp-reset"
                        onClick={(e) => this.handleButtonClick(e, 'currentStart', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        √
                      </Button>
                      <Button
                        className="advertisement-timestamp-reset"
                        onClick={(e) => this.handleButtonClick(e, 'removeStart', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        x
                      </Button>
                    </div>
                    <div className="advertisement-attribute-wrapper">
                      <label className="advertisement-attribute-label">
                        结束时间
                      </label>
                      <input
                        /*readOnly*/
                        disabled={isAnnotationReadonly(toolMode)}
                        className="advertisement-timestamp"
                        /*value={formatTime(item.end)}*/
                        value={this.state.currentFocus === item.key && this.state.currentTimestampType === 'end' ? this.state.currentFocusValue : formatTime(item.end)}
                        onFocus={(e) => this.handleTimestampFocus(e, item.key, 'end')}
                        onBlur={(e) => this.handleTimestampBlur(e, item.key, 'end')}
                        onChange={(e) => { this.setState({ currentFocusValue: e.target.value }) }}
                      />
                      <Button
                        className="advertisement-timestamp-reset"
                        onClick={(e) => this.handleButtonClick(e, 'currentEnd', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        √
                      </Button>
                      <Button
                        className="advertisement-timestamp-reset"
                        onClick={(e) => this.handleButtonClick(e, 'removeEnd', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        x
                      </Button>
                    </div>
                    <div className="advertisement-attribute-wrapper">
                      <div className="advertisement-index">
                        {(item.name == null || !item.type?.length || item.end == null || item.start == null || !item.position?.length)
                          ? (
                            <Tag style={{ backgroundColor: `${UNDEFINED_COLOR}40`, borderColor: UNDEFINED_COLOR }}>
                              {`ID: ${item.key}未完成`}
                            </Tag>
                          )
                          : (item.qaState === 'unchecked')
                            ? (
                              <Tag color="gold">
                                {`ID: ${item.key}待质检`}
                              </Tag>
                            )
                            : (item.qaState === 'accepted')
                              ? <Tag color="green">{`ID: ${item.key}已通过`}</Tag>
                              : <Tag color="red">{`ID: ${item.key}被驳回`}</Tag>}
                      </div>
                      <Button
                        className="annotation-form-button-right"
                        onClick={(e) => this.handleButtonClick(e, 'delete', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        删除
                      </Button>
                      <Button
                        className="annotation-form-button-right"
                        onClick={(e) => this.handleButtonClick(e, 'copy', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        复制
                      </Button>
                      <Button
                        className="annotation-form-button-right"
                        onClick={(e) => this.handleButtonClick(e, 'paint', item.key)}
                        disabled={isAnnotationReadonly(toolMode)}
                      >
                        标记位置
                      </Button>
                    </div>
                  </Card>
                )
                : null
            );
            return arr;
          }, [])}
          {
            currentMode !== 'edit' && currentIndex != null && currentItem?.position != null
              ? (
                <div
                  className="annotation-form-buttons-float"
                  style={{
                    left: `${(Math.max(currentItem?.position[0], currentItem?.position[2]) * (canvas ? canvas.width : 0) || -5) + (canvas ? canvas.container.offsetLeft : 0) + 5}px`,
                    top: `${(Math.max(currentItem?.position[1], currentItem?.position[3]) * (canvas ? canvas.height : 0) || 60) + (canvas ? canvas.container.offsetTop : 0) - 60}px`,
                  }}
                >
                  <Button
                    className="annotation-form-button-float"
                    onClick={(e) => this.handleButtonClick(e, 'paint', currentIndex)}
                    size="small"
                  >
                    {currentMode === 'edit' ? '标记位置' : '确定'}
                  </Button>
                  <Button
                    className="annotation-form-button-float"
                    onClick={(e) => this.handleButtonClick(e, 'copy', currentIndex)}
                    size="small"
                  >
                    复制
                  </Button>
                  {/*<Button
                    className="annotation-form-button-float"
                    onClick={(e) => this.handleButtonClick(e, 'delete', currentIndex)}
                    size="small"
                  >
                    删除
                  </Button>*/}
                </div>
              )
              : null
          }
        </div>
      </div>
    );
  }
}

export default AnnotationForm;
