import React from 'react';
import { observer } from 'mobx-react';
import { reaction, IReactionDisposer, makeObservable, observable, action } from 'mobx';
import { Application, Point, Texture, utils } from 'pixi.js';
import ResizeObserver from 'resize-observer-polyfill';
import imageLoader from 'blueimp-load-image';
import OperationNavigator from '../toolbar/OperationNavigator';
import Assistant from '../../../common/shapes/assists/Assistant';
import type View from '../../shapes/View';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { NAVIGATOR_HEIGHT, CAMERA_VIEW, CAMERA_VIEW_LABELS } from '../../constants';
import './CamerasContainer.scss';

interface CancellableLoader {
  cancelled: boolean;
  cancel: () => void;
  load: () => Promise<Event | HTMLCanvasElement | HTMLImageElement>;
}

interface CamerasContainerProps {
  app: Application;
}

class CamerasContainer extends React.Component<CamerasContainerProps> {
  /**
   * canvas dom container
   */
  container = React.createRef<HTMLDivElement>();

  /**
   * cameras dom container
   */
  camerasContainer = React.createRef<HTMLDivElement>();

  /**
   * cancellable image loader
   */
  cancellableLoaders: CancellableLoader[] = [];

  /**
   * loaded count for current frame
   */
  loadedCount = 0;

  /**
   * reactions
   */
  reactionDisposers: IReactionDisposer[] = [];

  /**
   * mouse position
   */
  mousePosition = {
    x: -1,
    y: -1,
  };

  /**
   * image load errors
   */
  imageLoadErrors: {
    [camera: string]: string;
  } = {};

  constructor(props: CamerasContainerProps) {
    super(props);

    makeObservable(this, {
      mousePosition: observable,
      imageLoadErrors: observable,
      updateMousePosition: action,
      onLoaded: action,
    });

    this.reactionDisposers.push(reaction(
      () => [store.initialized, store.frame.currentFrame],
      () => {
        // when initialized, or frame changes
        this.updateCameras();
      },
    ));
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.updateMousePosition);
    if (this.container.current) {
      new ResizeObserver(this.resize).observe(this.container.current);
      this.props.app.renderer.on('resolution-changed', this.resize);

      // setup view
      this.container.current.appendChild(this.props.app.view);
      this.resize();
      this.updateCameras();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousemove', this.updateMousePosition);
    this.props.app.renderer.off('resolution-changed', this.resize);
    this.reactionDisposers.forEach((disposer) => disposer());
    // remove camera views
    Object.values(store.frame.cameraViews).forEach((view) => {
      this.props.app.stage.removeChild(view);
    });
  }

  /**
   * update mouse position
   * @param e
   */
  updateMousePosition = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    this.mousePosition = {
      x: clientX,
      y: clientY,
    };
  };

  /**
   * get container's size, defualt is 800 * 600
   */
  getContainerSize() {
    // default size is 800 * 600
    const size = {
      width: 800,
      height: 600,
    };
    if (this.container.current) {
      size.width = this.container.current.clientWidth;
      size.height = this.container.current.clientHeight;
    }
    return size;
  }

  /**
   * resize
   */
  resize = () => {
    const { width, height } = this.getContainerSize();
    this.props.app.renderer.resize(width, height);
    this.props.app.render();

    // update camera views
    Object.values(store.frame.cameraViews).forEach((cameraView, i) => {
      this.updateCameraBounds(cameraView, i);
      if (store.fullscreenRequested) {
        cameraView.fitImageToView();
      }
    });

    // delay to set to false to wait fullscreen finish
    setTimeout(() => {
      store.fullscreenRequested = false;
    }, 0);
  };

  /**
   * update cameras for current frame
   */
  updateCameras() {
    const { cameras, currentFrame } = store.frame;

    utils.clearTextureCache();
    this.cancellableLoaders.forEach((loader) => {
      loader.cancel();
    });
    this.cancellableLoaders = [];
    this.loadedCount = 0;

    Object.keys(cameras).forEach((camera, i) => {
      const url = cameras[camera][currentFrame] || '';
      const loader: CancellableLoader = {
        cancelled: false,
        cancel() {
          this.cancelled = true;
        },
        load() {
          return new Promise((resove, reject) => {
            imageLoader(url, (data) => {
              if (!this.cancelled) {
                resove(data);
              } else {
                reject();
              }
            }, {
              canvas: true,
              orientation: true,
              crossOrigin: 'anonymous',
            });
          });
        }
      };
      loader
        .load()
        .then((data) => this.onLoaded(camera, i, url, data))
        .catch(() => {
          // canceled
        });
      this.cancellableLoaders.push(loader);
    });
  }

  /**
   * update camera bounds
   * @param cameraView
   * @param index
   */
  updateCameraBounds(cameraView: View, index: number) {
    const x = 0;
    const y = 0;
    const { width, height } = this.props.app.screen;
    cameraView.updatePositionAndSize(x, y, width, height);
    const cameraDom = document.getElementById(`${CAMERA_VIEW}-${cameraView.id}`);
    if (cameraDom) {
      cameraDom.style.left = `${x}px`;
      cameraDom.style.top = `${y}px`;
      cameraDom.style.width = `${width}px`;
      cameraDom.style.height = `${height}px`;
    }
  }

  /**
   * on resource loaded
   * @param name
   * @param index
   * @param url
   * @param data
   */
  onLoaded = (name: string, index: number, url: string, data: Event | HTMLCanvasElement | HTMLImageElement) => {
    const error = data instanceof Event && data.type === 'error';
    const cameraView = store.frame.cameraViews[name];
    if (cameraView) {
      const { currentCamera, currentFrame, updateImageSize } = store.frame;

      if (currentCamera === name) {
        this.props.app.stage.addChild(cameraView);
      } else {
        this.props.app.stage.removeChild(cameraView);
      }

      cameraView.imageLoadError = error;
      this.updateCameraBounds(cameraView, index);

      let texture: Texture;
      if (!error) {
        texture = Texture.from(data as HTMLCanvasElement);
        cameraView.setImage(texture);
      }
      updateImageSize(name, currentFrame, error ? -1 : texture!.width, error ? -1 : texture!.height);
    }
    this.imageLoadErrors[name] = error
      ? i18n.translate('COMMON_IMAGE_ERROR', { values: { image: url || i18n.translate('COMMON_EMPTY') } })
      : '';
    this.loadedCount += 1;
    this.checkLoaded();
  };

  /**
   * check all cameras loaded in current frame
   */
  checkLoaded() {
    const { cameras, onFrameLoaded } = store.frame;
    if (this.loadedCount === Object.keys(cameras).length) {
      onFrameLoaded();
    }
  }

  /**
   * update all cameras bounds
   */
  updateAllCameraViewsBounds() {
    const { cameraViews } = store.frame;
    Object.values(cameraViews).forEach((cameraView, i) => {
      this.updateCameraBounds(cameraView, i);
    });
  }

  /**
   * wheel
   */
  wheel = (event: React.WheelEvent) => {
    event.stopPropagation();
    const { currentCameraView } = store.frame;
    if (currentCameraView) {
      const point = this.mapScreenToStagePosition(event.clientX, event.clientY);
      const localPoint = this.mapStageToLocalPosition(point);
      currentCameraView.zoom(event.nativeEvent, localPoint);
    }
  };

  /**
   * map screen position to stage position as a PIXI point
   * @param x screen position x
   * @param y screen position y
   */
  mapScreenToStagePosition(x: number, y: number) {
    const point = new Point();
    this.props.app.renderer.plugins.interaction.mapPositionToPoint(point, x, y);
    return point;
  }

  /**
   * map stage position to local posistion as a PIXI point
   * @param point
   */
  mapStageToLocalPosition(point: Point) {
    return this.props.app.stage.toLocal(point);
  }

  render() {
    const { cursor, viewScale, crossLineVisible, activeMeasurementBox } = store.config;
    const { currentCamera, currentCameraView } = store.frame;
    return (
      <>
        <OperationNavigator
          onViewReset={() => currentCameraView?.fitImageToView()}
          setViewScale={(scale) => currentCameraView?.zoomTo(scale)}
        />
        <div
          style={{
            width: '100%',
            height: `calc(100% - ${NAVIGATOR_HEIGHT}px)`,
            position: 'relative',
            cursor,
          }}
        >
          <div
            ref={this.container}
            className="canvas-container"
            style={{ width: '100%', height: '100%' }}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={this.wheel}
          />
          <div
            ref={this.camerasContainer}
            className="cameras-container"
          >
            <div
              id={`${CAMERA_VIEW}-${currentCamera}`}
              className="camera-view selected single"
            >
              <div
                id={`${CAMERA_VIEW_LABELS}-${currentCamera}`}
                className="shape-labels-container label-mode"
              />
              <Assistant
                scale={viewScale}
                crossline={crossLineVisible}
                measurementBox={activeMeasurementBox}
                mousePosition={this.mousePosition}
              />
              <div className="outer-border">
                <div className="inner-border">
                  {this.imageLoadErrors[currentCamera] && (
                    <div className="error">
                      {this.imageLoadErrors[currentCamera]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default observer(CamerasContainer);
