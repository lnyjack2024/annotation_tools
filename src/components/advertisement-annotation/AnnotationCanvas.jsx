import React from 'react';
import { Slider, Button, Popover, notification } from 'antd';
import { CaretRightOutlined, AudioOutlined, PauseOutlined } from '@ant-design/icons';
import { formatSecond, formatMinute, simpleClone, formatHour, getResizeAction, clamp, sortPosition } from './util';
import { FPS, UNDEFINED_COLOR, MIN_SEGMENT_LENGTH } from './AnnotationForm';
import { isAnnotationReadonly } from '../../utils/tool-mode';

notification.config({ top: 60, getContainer: () => document.getElementById('root') });

export const getDeltaTime = (rate) => (1 / FPS) * rate;
const DEVIATION = 0.014;

class AnnotationCanvas extends React.Component {
  constructor() {
    super();
    this.currentFrame = null;
    this.state = {
      startX: null,
      startY: null,
      endX: null,
      endY: null,
      canvasWidth: 800,
      canvasHeight: 450,
      videoWidth: 800,
      videoHeight: 450,
    };
    this.downX = null;
    this.downY = null;
    this.width = null;
    this.height = null;
    this.resizeAction = null;
    this.rectOn = null;
    this.snapshot = null;
    this.active = false;
    this.generateSnapshot = this.generateSnapshot.bind(this);
  }

  componentDidMount() {
    this.svg.addEventListener('resize', () => {
      this.forceUpdate();
    });
    window.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });
    window.addEventListener('mouseup', (e) => {
      if (this.active) this.handleMouseUp(e);
    });
    this.video.addEventListener('seeked', this.generateSnapshot);
  }

  componentWillUnmount() {
    this.video.removeEventListener('seeked', this.generateSnapshot);
  }

  getRectMouseOn(x, y, deviation) {
    const { results, currentTime } = this.props;
    let rect = null;
    let rectNearby = null;
    results.some((result, index) => {
      const { position, start, end } = result;
      // only select rect in a range of time
      if ((start != null && end != null) && (currentTime < start || currentTime > end)) return false;
      // only compare rect is not empty
      if (!position || !position.length) return false;
      let [xS, yS, xE, yE] = position;
      // swap position to ensure xS and yS is the smallest number
      if (xS > xE) [xE, xS] = [xS, xE];
      if (yS > yE) [yE, yS] = [yS, yE];
      if (x >= xS && x <= xE && y >= yS && y <= yE) {
        rect = result.key;
        return true;
      }
      if (x >= xS - deviation && x <= xE + deviation && y >= yS - deviation && y <= yE + deviation) {
        const distance = position.map((p, i) => {
          if (i % 2 === 0) return Math.abs(p - x);
          return Math.abs(p - y);
        });
        rectNearby = { key: result.key, distance };
      }
      return false;
    });
    return { on: rect, nearyby: rectNearby };
  }

  handleMouseDown(e) {
    const { clientX, clientY } = e;
    const { x, y, width, height } = this.video.getBoundingClientRect();
    // move rect or resize
    if (this.props.currentMode === 'edit' && this.rectOn != null) {
      this.downX = (clientX - x) / width;
      this.downY = (clientY - y) / height;
      this.props.setCurrentIndex(this.rectOn);
    } else { // draw rect
      const startX = (clientX - x) / width;
      const startY = (clientY - y) / height;
      this.setState({ startX, startY });
    }
    this.active = true;
  }

  // eslint-disable-next-line class-methods-use-this
  getResult(results, index) {
    return results.find((r) => r.key === index);
  }

  // used to move or resize selected area
  handleMouseMove(e) {
    const { currentMode, currentIndex, results, handleResultsChange, toolMode } = this.props;
    const { clientX, clientY } = e;
    const { resizeAction } = this;

    if (isAnnotationReadonly(toolMode)) return;
    const { x, y, width, height } = this.video.getBoundingClientRect();
    // if there is no click recorded and is not in paint mode, monitor the mouse position to change cursor style
    if (currentMode === 'edit' && this.downX == null && this.downY == null) {
      const left = (clientX - x) / width;
      const top = (clientY - y) / height;
      const { on, nearyby } = this.getRectMouseOn(left, top, DEVIATION);
      if (on != null) { // if mouse in rect use move mode
        document.body.style.cursor = 'move';
        this.rectOn = on;
        this.resizeAction = null;
      } else if (nearyby) { // if mouse is somewhere nearby rect's boundry use resize mode
        const { key, distance } = nearyby;
        this.resizeAction = getResizeAction(distance, DEVIATION);
        if (this.resizeAction.length === 1) {
          if (this.resizeAction[0] === 0 || this.resizeAction[0] === 2) {
            document.body.style.cursor = 'e-resize';
          } else {
            document.body.style.cursor = 'n-resize';
          }
        } else {
          const [first, second] = this.resizeAction;
          if ((first + second === 1) || (first + second === 5)) { // left-top or right-bottom
            document.body.style.cursor = 'nwse-resize';
          } else {
            document.body.style.cursor = 'nesw-resize';
          }
        }
        this.rectOn = key;
      } else {
        document.body.style.cursor = 'default';
      }
    } else if (currentMode === 'edit' && currentIndex != null && this.getResult(results, currentIndex)?.position.length && this.downX && this.downY) {
      // if in edit mode, and there is click recorded, then use move/resize mode
      const resultsCopy = simpleClone(results);
      const { position } = this.getResult(resultsCopy, currentIndex);
      const displacement = [(clientX - x) / width - this.downX, (clientY - y) / height - this.downY];
      if (resizeAction) { // if there is resize action then use resize mode
        const newPosition = position.map(p => p);
        resizeAction.forEach((action) => {
          newPosition[action] = clamp(newPosition[action] + displacement[action % 2], 0, 1);
        });

        // const resizeWidth = resizeAction.includes(0) || resizeAction.includes(2);
        // const resizeHeight = resizeAction.includes(1) || resizeAction.includes(3);

        let newW = Math.abs((newPosition[2] - newPosition[0]) * width);
        let newH = Math.abs((newPosition[3] - newPosition[1]) * height);
        const newRatio = newW / newH;

        if (resizeAction.length === 1) {
          const [action] = resizeAction;
          if (action === 0 || action === 2) {
            newH = (newW / 16) * 9;
            newPosition[3] = newPosition[1] + (newH / height);
          } else {
            newW = (newH / 9) * 16;
            newPosition[2] = newPosition[0] + (newW / width);
          }
        } else {
          newH = (newW / 16) * 9;
          if (resizeAction.includes(3)) {
            newPosition[3] = newPosition[1] + (newH / height);
          }
          if (resizeAction.includes(1)) {
            newPosition[1] = newPosition[3] - (newH / height);
          }
        }
        position[0] = clamp(newPosition[0], 0, 1);
        position[1] = clamp(newPosition[1], 0, 1);
        position[2] = clamp(newPosition[2], 0, 1);
        position[3] = clamp(newPosition[3], 0, 1);
      } else { // if there is no action then use move mode
        const [moveX, moveY] = displacement;

        // check whether selected area out of boundary in x axis, if not, move it in x axis
        if ((moveX > 0 && position[2] + moveX <= 1) || (moveX < 0 && position[0] + moveX >= 0)) {
          position[0] += moveX;
          position[2] += moveX;
        }

        // check whether selected area out of boundary in y axis, if not, move it in y axis
        if ((moveY > 0 && position[3] + moveY <= 1) || (moveY < 0 && position[1] + moveY >= 0)) { // if move up
          position[1] += moveY;
          position[3] += moveY;
        }
      }
      this.downX = (clientX - x) / width;
      this.downY = (clientY - y) / height;
      handleResultsChange(resultsCopy);
    } else if (this.props.currentMode === 'paint') {
      const { startX, startY } = this.state;
      if (startX == null || startY == null) return;
      const originStartClientX = (startX * width) + x;
      const originStartClientY = (startY * height) + y;
      const rectWidth = clientX - originStartClientX;
      const rectHeight = clientY - originStartClientY;
      const newClientY = (Math.sign(rectHeight) * ((Math.abs(rectWidth) / 16) * 9)) + originStartClientY;
      const endX = clamp((clientX - x) / width, 0, 1);
      const endY = clamp((newClientY - y) / height, 0, 1);
      // const rectRatio = rectWidth / rectHeight;
      // let newY = (Math.sign(rectHeight) * ((Math.abs(rectWidth) / 16) * 9)) + this.state.startY;
      this.setState({ endX, endY });
    }
  }

  async handleMouseUp(e) {
    this.active = false;
    const { currentTime, results, currentIndex, currentMode, toolMode } = this.props;
    const { startX, startY, endX, endY } = this.state;
    this.setState({
      startX: null,
      startY: null,
      endX: null,
      endY: null,
    });
    if (isAnnotationReadonly(toolMode)) return;

    const resultsCopy = simpleClone(results);
    const currentItem = this.getResult(resultsCopy, currentIndex);
    if (currentItem) {
      // resultsCopy[currentIndex].snapshot = this.genSnapshot(currentIndex, results);
      this.props.focusItemInRightSide(currentItem.key);
      sortPosition(currentItem.position);
    }

    if (currentMode === 'edit' || currentIndex == null) {
      this.downX = null;
      this.downY = null;
      this.rectOn = null;
      this.props.handleResultsChange(resultsCopy);
      return;
    }
    currentItem.position = [startX, startY, endX, endY];
    sortPosition(currentItem.position);
    const item = currentItem;
    if (item.start == null) {
      item.start = currentTime;
      if (item.end != null && item.end < currentTime + MIN_SEGMENT_LENGTH) item.end = null;
      const imageUrl = await this.generateImageUrl(currentTime);
      item.snapshot = imageUrl;
    }
    this.props.handleResultsChange(resultsCopy);
  }

  async generateSnapshot() {
    const timestamp = this.video.currentTime;
    this.generateSnapshotWithTimestamp(timestamp);
  }

  // for seeked event, we should check the start time for all items and update the results
  async generateSnapshotWithTimestamp(timestamp) {
    const resultsCopy = simpleClone(this.props.results);
    let imageUrl;
    let needUpdate = false;
    for (let i = 0; i < resultsCopy.length; i += 1) {
      const r = resultsCopy[i];
      if (r.start === timestamp) {
        if (!r.snapshot || !r.snapshot.endsWith(`_${timestamp}.jpg`)) {
          if (!imageUrl) {
            imageUrl = await this.generateImageUrl(timestamp);
          }
          r.snapshot = imageUrl;
          r.start = timestamp;
          needUpdate = true;
        }
      }
    };
    if (needUpdate) {
      this.props.handleResultsChange(resultsCopy);
    }
  }

  async generateImageUrl(timestamp) {
    let imageUrl;
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    this.snapshot.width = w;
    this.snapshot.height = h;
    const ctx = this.snapshot.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.video, 0, 0, w, h);
    const dataUrl = this.snapshot.toDataURL('image/jpeg', 0.3);
    const filename = `video_ads/${this.props.jobId}.${this.props.taskId}.${this.props.recordId}.${this.props.toolMode}_${timestamp}.jpg`;
    try {
      imageUrl = await this.props.saveContent(
        dataUrl,
        'image/jpeg',
        filename,
        this.props.jobId,
        this.props.jobId,
        this.props.projectId,
        this.props.recordId,
        'UNKNOWN',
        this.props.flowId,
      );
    } catch (e) {
      notification.warn({ message: '生成截图失败，请重试' });
    }
    return imageUrl;
  }

  render() {
    const { startX, startY, endX, endY, canvasHeight, canvasWidth } = this.state;
    const { width, height } = this;
    const {
      currentIndex,
      results,
      currentTime,
      currentPlayBackRate,
      advertisementNameMap
    } = this.props;

    if (this.container) {
      this.width = this.svg.getBoundingClientRect().width;
      this.height = this.svg.getBoundingClientRect().height;
    }

    return (
      <div
        className="annotation-canvas-container"
        ref={(r) => { this.container = r; }}
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      >
        <canvas ref={(r) => { this.snapshot = r; }} style={{ display: 'none' }} />
        <div className="annotation-canvas-wrapper">
          <svg
            className="annotation-canvas"
            ref={(r) => { this.svg = r; }}
            onMouseDown={(e) => this.handleMouseDown(e)}
            width={this.state.videoWidth}
            height={this.state.videoHeight}
            // onMouseMove={(e) => this.handleMouseMove(e)}
            // onMouseUp={(e) => this.handleMouseUp(e)}
            version="1.1"
          >
            {
              startX == null || startY == null || endX == null || endY == null || currentIndex == null
                ? null
                : (
                  <rect
                    x={Math.min(startX, endX) * width}
                    y={Math.min(startY, endY) * height}
                    width={Math.abs(endX - startX) * width}
                    height={Math.abs(endY - startY) * height}
                    stroke={advertisementNameMap.get(this.getResult(results, currentIndex)?.name) || UNDEFINED_COLOR}
                    fill="rgba(0,0,0,0)"
                    strokeDasharray="5, 5"
                    strokeWidth={1}
                  />
                )
            }
            {
              results.map((item) => (
                ((item.start == null || item.end == null) || (item.start <= currentTime + getDeltaTime(currentPlayBackRate) && item.end >= currentTime - getDeltaTime(currentPlayBackRate))) &&
                item.position != null && item.position[0] != null && item.position[1] != null &&
                item.position[2] != null && item.position[3] != null ? (
                  // eslint-disable-next-line react/no-array-index-key
                  <g key={item.key}>
                    <rect
                      x={Math.min(item.position[0], item.position[2]) * width}
                      y={Math.min(item.position[1], item.position[3]) * height}
                      width={Math.abs(item.position[2] - item.position[0]) * width}
                      height={Math.abs(item.position[3] - item.position[1]) * height}
                      stroke={advertisementNameMap.get(item.name) || UNDEFINED_COLOR}
                      strokeDasharray={(item.start == null || item.end == null) ? '5, 5' : null}
                      fill={
                        // eslint-disable-next-line no-nested-ternary
                        currentIndex === item.key
                          ? (advertisementNameMap.get(item.name)
                            ? `${advertisementNameMap.get(item.name)}40`
                            : `${UNDEFINED_COLOR}40`) : 'rgba(0,0,0,0)'
                      }
                      strokeWidth={1}
                    />
                    <rect
                      x={Math.min(item.position[0], item.position[2]) * width}
                      y={Math.min(item.position[1], item.position[3]) * height - 10}
                      rx="5"
                      ry="5"
                      width="80"
                      height="20"
                      stroke={advertisementNameMap.get(item.name) || UNDEFINED_COLOR}
                      fill={advertisementNameMap.get(item.name) || UNDEFINED_COLOR}
                      strokeWidth={1}
                    />
                    <text
                      x={Math.min(item.position[0], item.position[2]) * width + 5}
                      y={Math.min(item.position[1], item.position[3]) * height + 5}
                      fill="white"
                    >
                      {`${item.name || '未标识'}[${item.key}]`}
                    </text>
                  </g>
                  ) : null
              ))
            }
          </svg>
          <video
            src={this.props.video}
            ref={(r) => { this.video = r; }}
            controlsList="nodownload"
            // controls={currentMode === 'edit'}
            tabIndex={-1}
            crossOrigin="Anonymous"
            onLoadedData={(e) => this.setState({ videoWidth: this.video.getBoundingClientRect().width, videoHeight: this.video.getBoundingClientRect().height })}
          >
            <track default kind="captions" />
          </video>
          <div className="annotation-video-controll-bar">
            <Button
              type="text"
              onClick={() => {
                if (this.video && this.video.paused) this.video.play();
                else if (this.video && this.video.played) this.video.pause();
              }}
            >
              {
                this.video && this.video.paused ? <CaretRightOutlined /> : <PauseOutlined />
              }
            </Button>
            <Slider
              style={{ flex: '1' }}
              max={this.video ? this.video.duration : 0}
              tipFormatter={(v) => `${formatHour(v) === '00' ? '' : `${formatHour(v)}:`}${formatMinute(v)}:${formatSecond(v)}`}
              getTooltipPopupContainer={() => document.getElementById('root')}
              step={0.01}
              value={this.video ? this.video.currentTime : 0}
              onChange={(v) => {
                if (this.video) this.video.currentTime = v;
              }}
            />
            <Popover
              content={(
                <Slider
                  vertical
                  style={{ height: '50px' }}
                  value={this.video ? this.video.volume * 100 : 0}
                  onChange={(v) => {
                    if (this.video) this.video.volume = v / 100;
                  }}
                />
              )}
              trigger="click"
              getPopupContainer={() => document.getElementById('root')}
            >
              <Button type="text">
                <AudioOutlined />
              </Button>
            </Popover>
          </div>
        </div>
      </div>

    );
  }
}

export default AnnotationCanvas;
