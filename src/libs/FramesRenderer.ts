/* eslint-disable class-methods-use-this */
import EventEmitter from 'eventemitter3';
import { cloneDeep } from 'lodash';
import { drawLine, drawRect, drawRectBorder, drawRoundedRect, drawCircle, drawScale, drawText, drawRhombus } from '../utils/canvas';
import Cursor from '../components/common/Cursor';

export interface FrameItem {
  frameStatus: {
    [frameIndex: number]: boolean | string; // boolean true means key frame, string used in other cases
  };
  frameColor?: {
    [frameIndex: number]: string;
  };
  color: string;
  type?: FrameItemType;
  showCards?: boolean;
  selected?: boolean;
  draggable?: boolean;
}

export interface FrameBlock {
  startFrame: number;
  endFrame: number;
  value: boolean | string;
  hovered: boolean;
  selected: boolean;
  draggable: boolean;
}

export enum FrameItemType {
  DEFAULT = 'default',
  CARD = 'card',
  TEXT = 'text',
  ENDPOINT = 'endpoint',
}

export enum EventAction {
  HEIGHT_CHANGE = 'height-change',
  VISIBLE_FRAMES_UPDATE = 'visible-frames-update',
  CURRENT_FRAME_CHANGE = 'current-frame-change',
  ITEMS_OFFSET_CHANGE = 'items-offset-change',
  BLOCK_HOVERED = 'block-hovered',
  BLOCK_SELECTED = 'block-selected',
  FRAME_STATUS_CHANGED = 'frame-status-changed',
}

enum HoverType {
  SCROLLBAR_X = 'scrollbarX',
  SCROLLBAR_Y = 'scrollbarY',
  SCROLLBAR_X_CONTAINER = 'scrollbarXContainer',
  SCROLLBAR_Y_CONTAINER = 'scrollbarYContainer',
}

const rangeFramesSet = [1000, 500, 200, 100, 50, 20, 10, 5]; // set of supported frames per range
const scrollbarColor = '#777B82';
const scrollbarContainerColor = '#22262D';
const borderColor = '#484C59';

export default class FramesRenderer extends EventEmitter {
  /**
   * canvas container
   * @member
   */
  container: HTMLDivElement;

  /**
   * canvas dom element
   * @member
   */
  canvas: HTMLCanvasElement;

  /**
   * frame tip element
   * @member
   */
  frameTip: HTMLDivElement;

  /**
   * frames count
   * @member
   */
  frameCount: number;

  /**
   * frames background color
   * @member
   */
  bgColor: string;

  /**
   * item default color
   * @member
   */
  itemColor: string;

  /**
   * item selected color
   * @member
   */
  itemSelectedColor: string;

  /**
   * card color
   * @member
   */
  cardColor: string;

  /**
   * is frames container height fix
   * @member
   */
  fixHeight = false;

  /**
   * scrollable
   * @private
   */
  private _scrollable = false;

  /**
   * get scrollable
   * @getter
   */
  get scrollable() {
    return this._scrollable;
  }

  /**
   * set scrollable
   * @setter
   */
  set scrollable(scrollable: boolean) {
    const shouldUpdate = this._scrollable !== scrollable;
    this._scrollable = scrollable;
    if (shouldUpdate) {
      this.setupCanvas();
    }
  }

  /**
   * invalid frames
   */
  private _invalidFrames: number[] = [];

  /**
   * set invalid frames
   * @setter
   */
  set invalidFrames(frames: number[]) {
    this._invalidFrames = [...frames];
    this.drawFrames();
  }

  /**
   * frame items
   * @private
   */
  private _items: { [id: string]: FrameItem } = {};

  /**
   * get frame items
   * @getter
   */
  get items() {
    return this._items;
  }

  /**
   * set frame items
   * @setter
   */
  set items(items: { [id: string]: FrameItem }) {
    const originItemsLen = Object.keys(this._items).length;
    this._items = cloneDeep(items);
    this._allItems = [];
    this._itemBlocks = [];

    const itemKeys = Object.keys(this._items);
    for (let i = 0; i < itemKeys.length; i += 1) {
      const itemKey = itemKeys[i];
      this._allItems[i] = { id: itemKey, index: i };
      this._itemBlocks[i] = {};

      const { frameStatus = {}, type, draggable = false } = this._items[itemKey];
      const statusFrames = Object.keys(frameStatus).map((f) => Number(f));
      let lastStartIndex = 0;
      for (let j = 0; j < statusFrames.length; j += 1) {
        const startFrame = statusFrames[lastStartIndex];
        const endFrame = statusFrames[j] + 1;
        const framesBreak = j === statusFrames.length - 1 || statusFrames[j + 1] - statusFrames[j] > 1;
        const framesChange = frameStatus[endFrame] !== frameStatus[startFrame];
        if (framesBreak || ((type === FrameItemType.TEXT || type === FrameItemType.ENDPOINT) && framesChange)) {
          this._itemBlocks[i][startFrame] = {
            startFrame,
            endFrame,
            value: frameStatus[startFrame],
            hovered: false,
            selected: false,
            draggable,
          };
          lastStartIndex = j + 1;
        }
      }
    }

    const height = Object.keys(this._items).length * this.itemHeight;
    if (height > this.itemsContainerHeight && !this.scrollable) {
      this._scrollable = true;
      this.setupCanvas();
    } else if (height <= this.itemsContainerHeight && this.scrollable && !this.fixHeight) {
      this._scrollable = false;
      this.setupCanvas();
    } if (originItemsLen !== Object.keys(items).length && !this.scrollable) {
      // when items length changes, and not scrollable, need resize canvas and redraw
      this.setupCanvas();
    } else {
      // just redraw
      this.drawFrames();
    }
  }

  /**
   * all items with id and actual index
   * @private
   */
  private _allItems: { id: string; index: number }[] = [];

  /**
   * all item blocks
   * @private
   */
  private _itemBlocks: {
    [startFrame: number]: FrameBlock;
  }[] = [];

  /**
   * current frame index
   * @private
   */
  private _currentFrame = 0;

  /**
   * get current frame
   * @getter
   */
  get currentFrame() {
    return this._currentFrame;
  }

  /**
   * set current frame
   * @setter
   */
  set currentFrame(frameIndex: number) {
    const shouldUpdate = this._currentFrame !== frameIndex;
    this._currentFrame = frameIndex;
    if (shouldUpdate) {
      this.focusFrame(frameIndex);
    }
  }

  /**
   * hovered frame index
   * @private
   */
  private _hoveredFrame = -1;

  /**
   * hovered item index
   * @private
   */
  private _hoveredItemIndex = -1;

  /**
   * hovered block
   */
  private _hoveredBlock: FrameBlock | null = null;

  /**
   * selected block
   */
  private _selectedBlock: FrameBlock | null = null;

  /**
   * pending block matches start frame
   */
  _pendingStartBlock: FrameBlock | null = null;

  /**
   * pending block matches end frame
   */
  _pendingEndBlock: FrameBlock | null = null;

  /**
   * is editing pending blocks by dragging
   */
  _pendingEditing = false;

  /**
   * cursor offset when editing pending blocks
   */
  _pendingCursorOffset = -1;

  /**
   * initial calculated range index (largest frames per range)
   * @private
   */
  private _initialRangeIndex = 0;

  /**
   * current range index in the rangeFramesSet
   * @private
   */
  private _currentRangeIndex = 0;

  /**
   * get current range index
   * @getter
   */
  get currentRangeIndex() {
    return this._currentRangeIndex;
  }

  /**
   * set current range index
   * @setters
   */
  set currentRangeIndex(index: number) {
    const rangeIndex = Math.min(Math.max(index, this._initialRangeIndex), rangeFramesSet.length - 1);
    const shouldUpdate = this._currentRangeIndex !== rangeIndex;
    this._currentRangeIndex = rangeIndex;
    if (shouldUpdate) {
      this.drawFrames();
    }
  }

  /**
   * current range start frame (used for drawing)
   * @private
   */
  private _currentRangeStart = 0;

  /**
   * current range start frame offset (used for drawing)
   * @private
   */
  private _currentRangeStartOffset = 0;

  /**
   * current offset in canvas when zooming, dragging and so on
   * @private
   */
  private _baseOffset = 0;

  /**
   * current offset frame index in canvas when zooming, dragging and so on
   * @private
   */
  private _baseOffsetFrame = 0;

  /**
   * is mouse down on horizontal scrollbar
   * @private
   */
  private _isScrollXDown = false;

  /**
   * base offset when mouse down on horizontal scrollbar
   * @private
   */
  private _scrollXDownBaseOffsetFrame = 0;

  /**
   * client X when mouse down on horizontal scrollbar
   * @private
   */
  private _scrollXDownClientX = 0;

  /**
   * horizontal scrollbar width
   * @private
   */
  private _scrollXWidth = 0;

  /**
   * horizontal scrollbar offset
   * @private
   */
  private _scrollXOffset = 0;

  /**
   * items offset
   * @private
   */
  private _itemsOffset = 0;

  /**
   * get items offset
   * @getter
   */
  get itemsOffset() {
    return this._itemsOffset;
  }

  /**
   * set items offset
   * @setter
   */
  set itemsOffset(o: number) {
    const offset = o * window.devicePixelRatio;
    const shouldUpdate = this._itemsOffset !== offset;
    this._itemsOffset = offset;
    if (shouldUpdate) {
      this.drawFrames();
    }
  }

  /**
   * vertical scrollbar height
   * @private
   */
  private _scrollYHeight = 0;

  /**
   * vertical scrollbar offset
   * @private
   */
  private _scrollYOffset = 0;

  /**
   * is mouse down on vertical scrollbar
   * @private
   */
  private _isScrollYDown = false;

  /**
   * items offset when mouse down on vertical scrollbar
   * @private
   */
  private _scrollYDownItemsOffset = 0;

  /**
   * client y when mouse down on vertical scrollbar
   * @private
   */
  private _scrollYDownClientY = 0;

  /**
   * item height
   * @private
   */
  private _itemHeight = 20;

  /**
   * get item height
   */
  get itemHeight() {
    return this._itemHeight * window.devicePixelRatio;
  }

  /**
   * frames height
   * @private
   */
  private _framesHeight = 44;

  /**
   * get frames height
   */
  get framesHeight() {
    return this._framesHeight * window.devicePixelRatio;
  }

  /**
   * frames scale enable
   */
  private _scaleEnabled = true;

  /**
   * base range width
   */
  get baseRangeWidth() {
    return 18 * 5 * window.devicePixelRatio;
  }

  /**
   * canvas padding right
   */
  get paddingRight() {
    return 18 * window.devicePixelRatio;
  }

  /**
   * horizontal scrollbar container height
   */
  get scrollbarXContainerHeight() {
    return 22 * window.devicePixelRatio;
  }

  /**
   * horizontal scrollbar height
   */
  get scrollbarXHeight() {
    return 16 * window.devicePixelRatio;
  }

  /**
   * vertical scrollbar width
   */
  get scrollbarYWidth() {
    return 10 * window.devicePixelRatio;
  }

  /**
   * vertical scrollbar offset x (from items container right)
   */
  get scrollbarYOffsetX() {
    return 4 * window.devicePixelRatio;
  }

  /**
   * item block height
   */
  get itemBlockHeight() {
    return 12 * window.devicePixelRatio;
  }

  /**
   * item block offset y (in the item container)
   */
  get itemBlockOffsetY() {
    return 4 * window.devicePixelRatio;
  }

  /**
   * item text block height
   */
  get itemTextBlockHeight() {
    return 18 * window.devicePixelRatio;
  }

  /**
   * item text block offset y (in the item container)
   */
  get itemTextBlockOffsetY() {
    return 1 * window.devicePixelRatio;
  }

  /**
   * item endpoint block height
   */
  get itemEndpointBlockHeight() {
    return 4 * window.devicePixelRatio;
  }

  /**
   * item text block offset y (in the item container)
   */
  get itemEndpointBlockOffsetY() {
    return 8 * window.devicePixelRatio;
  }

  /**
   * item card height
   */
  get itemCardHeight() {
    return 16 * window.devicePixelRatio;
  }

  /**
   * items container height (when not collapsed)
   */
  get itemsContainerHeight() {
    return 275 * window.devicePixelRatio;
  }

  /**
   * frames container height
   */
  get itemsTotalHeight() {
    if (this.scrollable) {
      return this.itemsContainerHeight;
    }
    return Object.keys(this._items).length * this.itemHeight;
  }

  /**
   * current range frames
   */
  get rangeFrames() {
    return rangeFramesSet[this._currentRangeIndex];
  }

  /**
   * current per frame width
   */
  get perFrameWidth() {
    return this._currentRangeIndex <= this._initialRangeIndex
      ? (this.canvas.width - this.paddingRight) / this.frameCount
      : this.baseRangeWidth / this.rangeFrames;
  }

  /**
   * current card width
   */
  get cardWidth() {
    return this.perFrameWidth - this.cardOffsetX * 2;
  }

  /**
   * card offset x (base on item)
   */
  get cardOffsetX() {
    return 1 * window.devicePixelRatio;
  }

  /**
   * card offset y (base on item)
   */
  get cardOffsetY() {
    return (this.itemHeight - this.itemCardHeight) / 2 - 1;
  }

  /**
   * constructor
   * @param canvas
   * @param frameCount
   * @param options
   */
  constructor(
    container: HTMLDivElement,
    frameCount: number,
    { itemHeight, framesHeight, bgColor, itemColor, itemSelectedColor, cardColor, scaleEnabled, fixHeight }: {
      itemHeight?: number,
      framesHeight?: number,
      bgColor?: string,
      itemColor?: string,
      itemSelectedColor?: string,
      cardColor?: string,
      scaleEnabled?: boolean,
      fixHeight?: boolean,
    } = {},
  ) {
    super();
    this._scaleEnabled = scaleEnabled === undefined ? true : scaleEnabled;
    this.container = container;
    this.frameCount = frameCount;
    if (itemHeight) {
      this._itemHeight = itemHeight;
    }
    if (framesHeight) {
      this._framesHeight = framesHeight;
    }
    this.bgColor = bgColor || '#3D424D';
    this.itemColor = itemColor || '#343846';
    this.itemSelectedColor = itemSelectedColor || '#2F3340';
    this.cardColor = cardColor || '#5C5F6B';
    this.fixHeight = fixHeight || false;

    this.container.style.position = 'relative';
    // create canvas dom
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);
    // create tip dom
    this.frameTip = document.createElement('div');
    this.frameTip.style.position = 'absolute';
    this.frameTip.style.background = '#34CBD1';
    this.frameTip.style.padding = '0 2px';
    this.frameTip.style.borderRadius = '2px';
    this.frameTip.style.fontSize = '10px';
    this.frameTip.style.color = '#252935';
    this.frameTip.style.lineHeight = '12px';
    this.frameTip.style.height = '12px';
    this.frameTip.style.top = '8px';
    this.frameTip.style.display = 'none';
    this.container.appendChild(this.frameTip);
    this.container.oncontextmenu = (e) => e.preventDefault();

    this.addEventListeners();
    this.setupCanvas();
  }

  /**
   * update one item's frame status
   * @param id
   * @param frameStatus
   */
  updateItemFrameStatus(id: string, frameStatus: { [frameIndex: number]: boolean }) {
    if (this._items[id]) {
      this._items[id].frameStatus = cloneDeep(frameStatus);
      this.drawFrames();
    }
  }

  /**
   * add event listeners
   */
  addEventListeners() {
    document.addEventListener('mousemove', this.cursorMove);
    document.addEventListener('mouseup', this.cursorUp);
    window.addEventListener('resize', this.setupCanvas);
    window.matchMedia('screen and (min-resolution: 2dppx)').addEventListener('change', this.setupCanvas);
    this.canvas.addEventListener('wheel', this.wheel);
    this.canvas.addEventListener('mousedown', this.canvasDown);
    this.canvas.addEventListener('mousemove', this.canvasMove);
    this.canvas.addEventListener('mouseleave', this.canvasLeave);
  }

  /**
   * remove event listeners
   */
  removeEventListeners() {
    document.removeEventListener('mousemove', this.cursorMove);
    document.removeEventListener('mouseup', this.cursorUp);
    window.removeEventListener('resize', this.setupCanvas);
    window.matchMedia('screen and (min-resolution: 2dppx)').removeEventListener('change', this.setupCanvas);
    this.canvas.removeEventListener('wheel', this.wheel);
    this.canvas.removeEventListener('mousedown', this.canvasDown);
    this.canvas.removeEventListener('mousemove', this.canvasMove);
    this.canvas.removeEventListener('mouseleave', this.canvasLeave);
  }

  /**
   * set up canvas size
   */
  setupCanvas = () => {
    const { width } = this.canvas.getBoundingClientRect();
    const originCanvasWidth = this.canvas.width;
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = this.itemsTotalHeight + this.framesHeight;
    this.emit(EventAction.HEIGHT_CHANGE, this.canvas.height / window.devicePixelRatio);

    this.setupRangeIndexes(originCanvasWidth !== this.canvas.width);
    this.drawFrames();
  };

  /**
   * calculate initial range index
   */
  setupRangeIndexes(update: boolean) {
    if (update) {
      const estimatedRangeFrames = (this.frameCount / (this.canvas.width - this.paddingRight)) * this.baseRangeWidth;
      let rangeIndex = 0;
      while (rangeFramesSet[rangeIndex] > estimatedRangeFrames && rangeIndex < rangeFramesSet.length) {
        rangeIndex += 1;
      }
      this._initialRangeIndex = rangeIndex > 0 ? rangeIndex - 1 : 0;
      this._currentRangeIndex = this._initialRangeIndex;
    }
    this.emit(
      EventAction.VISIBLE_FRAMES_UPDATE,
      this._currentRangeIndex,
      rangeFramesSet.map((_, i) => i).slice(this._initialRangeIndex),
    );
  }

  /**
   * draw frames
   */
  drawFrames() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.save();

      // clear canvas
      const { width, height } = this.canvas;
      ctx.clearRect(0, 0, width, height);

      // calc current range
      this._currentRangeStart = Math.floor(this._baseOffsetFrame / this.rangeFrames) * this.rangeFrames;
      if (this._currentRangeStart === 0) {
        // reset offset to 0
        this._currentRangeStartOffset = 0;
      } else {
        this._currentRangeStartOffset = this._baseOffset - (this._baseOffsetFrame - this._currentRangeStart) * this.perFrameWidth;
        const firstFrameOffset = this._baseOffset - this._baseOffsetFrame * this.perFrameWidth;
        const lastFrameOffset = this._baseOffset + (this.frameCount - this._baseOffsetFrame) * this.perFrameWidth;
        if (firstFrameOffset > 0) {
          this._currentRangeStartOffset -= firstFrameOffset;
        } else if (lastFrameOffset < (width - this.paddingRight)) {
          this._currentRangeStartOffset += width - this.paddingRight - lastFrameOffset;
        }
      }

      this.drawFrameItems(ctx);
      this.drawFrameScales(ctx);

      ctx.restore();
    }
  }

  /**
   * draw frame items
   * @param ctx
   */
  drawFrameItems(ctx: CanvasRenderingContext2D) {
    if (this._currentRangeIndex === rangeFramesSet.length - 1) {
      // block cursor & cards
      this.drawItems(ctx, 'blocks');
      this.drawFrameHint(ctx);
      this.drawItems(ctx, 'cards');
      this.drawInvalidFrames(ctx);
      this.drawFrameHint(ctx, 'hover');
    } else {
      // line cursor & blocks
      this.drawItems(ctx);
      this.drawFrameHint(ctx);
      this.drawInvalidFrames(ctx);
      this.drawFrameHint(ctx, 'hover');
    }
  }

  /**
   * draw items
   * @param ctx
   * @param type empty means all items
   */
  drawItems(ctx: CanvasRenderingContext2D, type?: string) {
    let items = this._allItems;
    if (type === 'blocks') {
      items = items.filter(({ id }) => !this._items[id].showCards && this._items[id].type !== FrameItemType.CARD);
    } else if (type === 'cards') {
      items = items.filter(({ id }) => this._items[id].showCards || this._items[id].type === FrameItemType.CARD);
    }

    const width = this.canvas.width - this.paddingRight;
    items.forEach(({ id, index }) => {
      const { frameStatus = {}, frameColor = {}, color, type: frameItemType, showCards, selected } = this._items[id];
      const itemOffset = index * this.itemHeight;
      if ((itemOffset + this.itemHeight) <= this._itemsOffset || (itemOffset - this._itemsOffset) >= this.itemsTotalHeight) {
        // out of container
        return;
      }

      const height = this.itemHeight;
      const offsetY = itemOffset - this._itemsOffset + this.scrollbarXContainerHeight;

      // draw background
      let bgColor = this.itemColor;
      if (frameItemType === FrameItemType.TEXT && this._hoveredItemIndex === index) {
        // text block hovered
        bgColor = this.itemSelectedColor;
      } else if (selected) {
        bgColor = this.itemSelectedColor;
      }
      drawRect(ctx, 0, offsetY, width, height, bgColor);
      // draw bottom line
      drawLine(ctx, 0, offsetY + height - 1, width, offsetY + height - 1, borderColor);

      if ((showCards || frameItemType === FrameItemType.CARD) && this._currentRangeIndex === rangeFramesSet.length - 1) {
        // draw cards
        const drawCard = (frame: number, frameOffset: number) => {
          if (frameOffset + this.cardOffsetX < width) {
            let cWidth = this.cardWidth;
            if (frameOffset + this.cardOffsetX + cWidth > width) {
              cWidth = width - (frameOffset + this.cardOffsetX);
            }
            if (frameStatus[frame] !== undefined) {
              const cardColor = frameColor[frame] || this.cardColor;
              drawRect(ctx, frameOffset + this.cardOffsetX, offsetY + this.cardOffsetY, cWidth, this.itemCardHeight, cardColor);
              if (frameStatus[frame] === true && frameOffset + this.perFrameWidth / 2 < width) {
                drawCircle(ctx, frameOffset + this.perFrameWidth / 2, offsetY + this.itemHeight / 2, 2, '#FFFFFF');
              }
            }
            if (frame === this._currentFrame && selected) {
              drawRectBorder(ctx, frameOffset + this.cardOffsetX, offsetY + this.cardOffsetY, cWidth, this.itemCardHeight, '#FFFFFF');
            }
          }
        };
        const drawRangeCards = (start: number, offset: number) => {
          Array.from({ length: 5 }).forEach((_, i) => {
            const frame = start + i;
            if (frameStatus[frame] !== undefined || (frame === this._currentFrame && selected)) {
              const frameOffset = offset + this.perFrameWidth * i;
              drawCard(frame, frameOffset);
            }
          });
        };

        if (this._currentRangeIndex <= this._initialRangeIndex) {
          // just draw all frames
          Array.from({ length: this.frameCount }).forEach((_, i) => {
            drawCard(i, this.perFrameWidth * i);
          });
        } else {
          let rangeStart = this._currentRangeStart;
          let rangeStartOffset = this._currentRangeStartOffset;
          while ((rangeStartOffset + this.baseRangeWidth) >= 0 && rangeStart >= 0) {
            drawRangeCards(rangeStart, rangeStartOffset);
            rangeStart -= this.rangeFrames;
            rangeStartOffset -= this.baseRangeWidth;
          }
          rangeStart = this._currentRangeStart + this.rangeFrames;
          rangeStartOffset = this._currentRangeStartOffset + this.baseRangeWidth;
          while (rangeStartOffset < width && rangeStart < this.frameCount) {
            drawRangeCards(rangeStart, rangeStartOffset);
            rangeStart += this.rangeFrames;
            rangeStartOffset += this.baseRangeWidth;
          }
        }
      } else {
        const drawTextBlock = (startOffset: number, endOffset: number, text: string, blockColor: string, blockSelected: boolean) => {
          if (endOffset > startOffset) {
            const o = 1 * window.devicePixelRatio;
            const itemOffsetX = startOffset + o;
            const itemOffsetY = offsetY + this.itemTextBlockOffsetY;
            const blockWidth = endOffset - startOffset - o * 2;
            drawRect(ctx, itemOffsetX, itemOffsetY, blockWidth, this.itemTextBlockHeight, blockColor);
            if (blockSelected) {
              const currentFrameOffset = this._currentRangeStartOffset + (this.currentFrame - this._currentRangeStart) * this.perFrameWidth;
              drawRect(ctx, currentFrameOffset, itemOffsetY, this.perFrameWidth, this.itemTextBlockHeight, '#4A90E2');
            }
            const textOffsetX = itemOffsetX + o * 2;
            const textOffsetY = itemOffsetY + o * 4;
            const textWidth = blockWidth - o * 4;
            drawText(ctx, text, textOffsetX, textOffsetY, '#FFFFFF', 12, textWidth);
          }
        };
        const drawEndpointBlock = (startOffset: number, endOffset: number) => {
          if (endOffset >= startOffset) {
            const startOffsetX = startOffset + this.perFrameWidth / 2;
            if (endOffset > startOffset) {
              drawRect(ctx, startOffsetX, offsetY + this.itemEndpointBlockOffsetY, endOffset - startOffset - this.perFrameWidth, this.itemEndpointBlockHeight, color);
            }
            drawRhombus(ctx, startOffsetX, offsetY + this.itemHeight / 2, 6, '#4A90E2');
          }
        };
        const drawBlock = (startOffset: number, endOffset: number) => {
          if (endOffset > startOffset) {
            drawRect(ctx, startOffset, offsetY + this.itemBlockOffsetY, endOffset - startOffset, this.itemBlockHeight, color);
          }
        };

        const allBlocks = Object.values(this._itemBlocks[index]);
        allBlocks.forEach((block) => {
          const { startFrame, endFrame } = block;
          let startOffset = this._currentRangeStartOffset + (startFrame - this._currentRangeStart) * this.perFrameWidth;
          let endOffset = this._currentRangeStartOffset + (endFrame - this._currentRangeStart) * this.perFrameWidth;
          if (this._pendingEditing) {
            if (block === this._pendingStartBlock) {
              startOffset = this._pendingCursorOffset;
            } else if (block === this._pendingEndBlock) {
              endOffset = this._pendingCursorOffset;
            } else if (index === this._hoveredItemIndex) {
              const pendingStartFrame = this._pendingEndBlock ? this._pendingEndBlock.startFrame : this._pendingStartBlock!.startFrame;
              const pendingEndFrame = this._pendingStartBlock ? this._pendingStartBlock.endFrame : this._pendingEndBlock!.endFrame;
              if (startFrame >= pendingEndFrame) {
                // blocks on the right
                if (this._pendingCursorOffset > startOffset) {
                  startOffset = this._pendingCursorOffset;
                  if (this._pendingCursorOffset > endOffset) {
                    endOffset = this._pendingCursorOffset;
                  }
                }
              } else if (endFrame <= pendingStartFrame) {
                // blocks on the left
                if (this._pendingCursorOffset < endOffset) {
                  endOffset = this._pendingCursorOffset;
                  if (this._pendingCursorOffset < startOffset) {
                    startOffset = this._pendingCursorOffset;
                  }
                }
              }
            }
          }
          startOffset = Math.min(Math.max(startOffset, 0), width);
          endOffset = Math.min(Math.max(endOffset, 0), width);
          if (frameItemType === FrameItemType.TEXT) {
            const blockColor = block.hovered ? '#777B82' : color;
            drawTextBlock(startOffset, endOffset, `${frameStatus[startFrame]}`, blockColor, block.selected);
          } else if (frameItemType === FrameItemType.ENDPOINT) {
            drawEndpointBlock(startOffset, endOffset);
          } else {
            drawBlock(startOffset, endOffset);
          }
        });
      }
    });

    if (type !== 'cards') {
      // no need to draw vertical scroll bar when drawing cards
      const visibleItemsCount = this.itemsTotalHeight / this.itemHeight;
      if (visibleItemsCount < this._allItems.length) {
        // draw scroll y
        this._scrollYHeight = (visibleItemsCount / this._allItems.length) * this.itemsTotalHeight;
        this._scrollYOffset = (this._itemsOffset / (this._allItems.length * this.itemHeight)) * this.itemsTotalHeight + this.scrollbarXContainerHeight;
        drawRoundedRect(ctx, width + this.scrollbarYOffsetX, this._scrollYOffset, this.scrollbarYWidth, this._scrollYHeight, 6, scrollbarColor);
      } else {
        this._scrollYHeight = 0;
        this._scrollYOffset = 0;
      }
    }
  }

  /**
   * draw invalid frame style
   * @param ctx
   */
  drawInvalidFrames(ctx: CanvasRenderingContext2D) {
    // draw invalid frames
    this._invalidFrames.forEach((frameIndex) => {
      const offsetX = this.getOffsetByFrame(frameIndex);
      if (offsetX >= 0) {
        drawRect(ctx, offsetX, this.scrollbarXContainerHeight, Math.max(this.perFrameWidth, 1 * window.devicePixelRatio), this.itemsTotalHeight, 'rgba(220, 70, 36, 0.3)');
      }
    });
  }

  /**
   * draw frame hint (for current frame & hovered frame)
   * @param ctx
   * @param type
   */
  drawFrameHint(ctx: CanvasRenderingContext2D, type?: string) {
    const frame = type === 'hover' ? this._hoveredFrame : this._currentFrame;
    const shouldDraw = type !== 'hover' || this._hoveredFrame !== this._currentFrame;
    if (shouldDraw) {
      const offsetX = this.getOffsetByFrame(frame);
      if (offsetX >= 0) {
        if (this._currentRangeIndex === rangeFramesSet.length - 1) {
          // block
          drawRect(ctx, offsetX, this.scrollbarXContainerHeight, this.perFrameWidth, this.itemsTotalHeight, 'rgba(41, 44, 56, 0.4)');
          if (type === 'hover' && this._hoveredItemIndex >= 0) {
            const hoveredItem = this.items[this._allItems[this._hoveredItemIndex]?.id];
            if (hoveredItem?.showCards || hoveredItem?.type === FrameItemType.CARD || hoveredItem?.type === FrameItemType.TEXT) {
              const offsetY = this._hoveredItemIndex * this.itemHeight - this._itemsOffset + this.scrollbarXContainerHeight;
              drawRectBorder(ctx, offsetX + this.cardOffsetX, offsetY + this.cardOffsetY, this.cardWidth, this.itemCardHeight, 'rgba(255, 255, 255, 0.4)');
            }
          }
          if (type !== 'hover') {
            const selectedIndex = this._allItems.findIndex((i) => this.items[i.id].selected);
            const offsetY = selectedIndex * this.itemHeight - this._itemsOffset + this.scrollbarXContainerHeight;
            drawRectBorder(ctx, offsetX + this.cardOffsetX, offsetY + this.cardOffsetY, this.cardWidth, this.itemCardHeight, '#FFFFFF');
          }
        } else {
          // line
          drawLine(ctx, offsetX + 0.5, this.scrollbarXContainerHeight, offsetX + 0.5, this.itemsTotalHeight + this.scrollbarXContainerHeight, type === 'hover' ? 'rgba(255, 255, 255, 0.4)' : '#34CBD1');
        }
      }
    }
  }

  /**
   * draw frame scales
   * @param ctx
   */
  drawFrameScales(ctx: CanvasRenderingContext2D) {
    if (!this._scaleEnabled) return;
    const width = this.canvas.width - this.paddingRight;
    const offsetY = this.itemsTotalHeight + this.scrollbarXContainerHeight;
    const scaleWidth = this.perFrameWidth * this.rangeFrames;
    const scaleHeight = 16 * window.devicePixelRatio;
    const scaleHeightShort = 4 * window.devicePixelRatio;

    // draw scales top border
    drawRect(ctx, 0, offsetY, width, this.itemHeight, this.bgColor);
    drawLine(ctx, 0, offsetY - 1, width, offsetY - 1, borderColor);

    if (this._currentRangeIndex <= this._initialRangeIndex) {
      const rangeCount = this.frameCount / this.rangeFrames;
      const rangeWidth = width / rangeCount;
      if (rangeWidth > this.baseRangeWidth * 5) {
        for (let i = 0; i < this.frameCount; i += 1) {
          drawScale(ctx, i * this.perFrameWidth, offsetY, scaleWidth, scaleHeight, scaleHeightShort, i, false);
        }
      } else {
        for (let i = 0; i < rangeCount; i += 1) {
          drawScale(ctx, i * rangeWidth, offsetY, scaleWidth, scaleHeight, scaleHeightShort, i * this.rangeFrames);
        }
      }

      this._scrollXWidth = 0;
      this._scrollXOffset = 0;
    } else {
      let rangeStart = this._currentRangeStart;
      let rangeStartOffset = this._currentRangeStartOffset;
      while ((rangeStartOffset + this.baseRangeWidth) >= 0 && rangeStart >= 0) {
        drawScale(ctx, rangeStartOffset, offsetY, scaleWidth, scaleHeight, scaleHeightShort, rangeStart);
        rangeStart -= this.rangeFrames;
        rangeStartOffset -= this.baseRangeWidth;
      }
      rangeStart = this._currentRangeStart + this.rangeFrames;
      rangeStartOffset = this._currentRangeStartOffset + this.baseRangeWidth;
      while (rangeStartOffset < width && rangeStart < this.frameCount) {
        drawScale(ctx, rangeStartOffset, offsetY, scaleWidth, scaleHeight, scaleHeightShort, rangeStart);
        rangeStart += this.rangeFrames;
        rangeStartOffset += this.baseRangeWidth;
      }
    }

    // draw scrollbar
    this._scrollXWidth = Math.max(Math.ceil((width / this.perFrameWidth / this.frameCount) * width), 42);
    this._scrollXOffset = ((this._currentRangeStart - this._currentRangeStartOffset / this.perFrameWidth) / this.frameCount) * width;
    // scrollbar container background
    drawRect(ctx, 0, 0, width, this.scrollbarXContainerHeight, scrollbarContainerColor);
    drawLine(ctx, 0, this.scrollbarXContainerHeight - 1, width, this.scrollbarXContainerHeight - 1, borderColor);
    // scrollbar thumbnail
    const scrollbarXOffsetY = (this.scrollbarXContainerHeight - this.scrollbarXHeight) / 2 - 1;
    drawRoundedRect(ctx, this._scrollXOffset, scrollbarXOffsetY, this._scrollXWidth, this.scrollbarXHeight, 2, scrollbarColor);
    const o = 2 * window.devicePixelRatio;
    const h = this.scrollbarXHeight - o * 4;
    drawRect(ctx, this._scrollXOffset + o, scrollbarXOffsetY + o * 2, o, h, scrollbarContainerColor);
    drawRect(ctx, this._scrollXOffset + this._scrollXWidth - o * 2, scrollbarXOffsetY + o * 2, o, h, scrollbarContainerColor);
    // draw current frame
    const frameOffset = (this._currentFrame / this.frameCount) * width;
    drawLine(ctx, frameOffset + 0.5, 0, frameOffset + 0.5, this.scrollbarXContainerHeight, '#34CBD1');
  }

  /**
   * update frame tip text and posistion
   */
  updateFrameTip() {
    if (this._hoveredFrame >= 0) {
      this.frameTip.innerText = `${this._hoveredFrame + 1}`;
      const { width } = this.frameTip.getBoundingClientRect();
      const frameOffset = this.getOffsetByFrame(this._hoveredFrame) / window.devicePixelRatio;
      let offset = frameOffset - width / 2;
      if (this.currentRangeIndex === rangeFramesSet.length - 1) {
        offset += (this.perFrameWidth / 2) / window.devicePixelRatio;
      }
      this.frameTip.style.left = `${offset}px`;
      this.frameTip.style.display = 'block';
    } else {
      this.frameTip.style.display = 'none';
    }
  }

  /**
   * update items scroll and emit event
   */
  updateItemsScroll(itemsOffset: number) {
    const allItemsHeight = this._allItems.length * this.itemHeight;
    if (allItemsHeight <= this.itemsContainerHeight) {
      // not scrollable
      return;
    }
    this._itemsOffset = itemsOffset;
    if (this._itemsOffset < 0) {
      this._itemsOffset = 0;
    } else if (this._itemsOffset > allItemsHeight - this.itemsTotalHeight) {
      this._itemsOffset = allItemsHeight - this.itemsTotalHeight;
    }
    this.drawFrames();
    this.emit(EventAction.ITEMS_OFFSET_CHANGE, this._itemsOffset / window.devicePixelRatio);
  }

  /**
   * get frame by clientX
   * @param clientX
   * @returns
   */
  getFrameByClientX(clientX: number) {
    const { left } = this.canvas.getBoundingClientRect();
    const offset = (clientX - left) * window.devicePixelRatio;
    let frame = this._currentRangeStart + Math.floor((offset - this._currentRangeStartOffset) / this.perFrameWidth);
    if (frame >= this.frameCount) {
      frame = this.frameCount - 1;
    } else if (frame < 0) {
      frame = 0;
    }
    return frame;
  }

  /**
   * get item index by clientY
   * @param clientY
   * @returns
   */
  getItemIndexByClientY(clientY: number) {
    const { top } = this.canvas.getBoundingClientRect();
    const offset = (clientY - top) * window.devicePixelRatio;
    const index = Math.floor((offset + this._itemsOffset - this.scrollbarXContainerHeight) / this.itemHeight);
    if (index > Object.keys(this._items).length - 1) {
      return -1;
    }
    return index;
  }

  /**
   * get offset by frame index
   * @param frame
   * @param checkOutside
   * @returns
   */
  getOffsetByFrame(frame: number, checkOutside = true) {
    const offset = this._currentRangeStartOffset + (frame - this._currentRangeStart) * this.perFrameWidth;
    if (checkOutside && (offset < 0 || offset > (this.canvas.width - this.paddingRight))) {
      return -1;
    }
    return offset;
  }

  /**
   * check hover item
   * @param clientX
   * @param clientY
   * @returns
   */
  getMouseHover(clientX: number, clientY: number) {
    const { width: canvasWidth, height: canvasHeight } = this.canvas;
    const { left, top, width, height } = this.canvas.getBoundingClientRect();
    const offsetX = clientX - left;
    const offsetY = clientY - top;

    if (
      offsetX / width >= this._scrollXOffset / canvasWidth &&
      offsetX / width <= (this._scrollXOffset + this._scrollXWidth) / canvasWidth &&
      offsetY / height <= this.scrollbarXContainerHeight / canvasHeight
    ) {
      return HoverType.SCROLLBAR_X;
    }

    if (
      offsetY / height <= this.scrollbarXContainerHeight / canvasHeight
    ) {
      return HoverType.SCROLLBAR_X_CONTAINER;
    }

    const scrollbarOffsetX = canvasWidth - this.paddingRight + this.scrollbarYOffsetX;
    if (
      offsetX / width >= scrollbarOffsetX / canvasWidth &&
      offsetX / width <= (scrollbarOffsetX + this.scrollbarYWidth) / canvasWidth &&
      offsetY / height >= this._scrollYOffset / canvasHeight &&
      offsetY / height <= (this._scrollYOffset + this._scrollYHeight) / canvasHeight
    ) {
      return HoverType.SCROLLBAR_Y;
    }

    if (
      offsetX * window.devicePixelRatio > canvasWidth - this.paddingRight &&
      offsetX * window.devicePixelRatio <= canvasWidth
    ) {
      return HoverType.SCROLLBAR_Y_CONTAINER;
    }

    return undefined;
  }

  /**
   * set cursor for progress bar
   * @param cursor
   */
  setCursor(cursor: Cursor) {
    if (this.canvas.style.cursor !== cursor) {
      this.canvas.style.cursor = cursor;
    }
  }

  /**
   * unselect block
   */
  unselectBlock() {
    if (this._selectedBlock) {
      this._selectedBlock.selected = false;
      this._selectedBlock = null;
      this.drawFrames();
    }
  }

  /**
   * focus to specific frame if not in the progress bar view
   * @param frame
   */
  focusFrame(frame: number) {
    const offset = this.getOffsetByFrame(frame, false);
    const right = this.canvas.width - this.paddingRight - this.perFrameWidth;
    if (offset < 0) {
      // move left
      this._baseOffsetFrame = frame;
      this._baseOffset = this.perFrameWidth;
    } else if (offset > right) {
      // move right
      this._baseOffsetFrame = frame;
      this._baseOffset = right - this.perFrameWidth;
    }
    this.drawFrames();
  }

  /**
   * mouse wheel
   * @param e
   */
  wheel = (e: WheelEvent) => {
    if (e.altKey) {
      this.zoom(e);
    } else {
      // scroll y
      this.updateItemsScroll(this._itemsOffset + e.deltaY);
    }
  };

  /**
   * zooming
   * @param e
   */
  zoom = (e: WheelEvent) => {
    const hover = this.getMouseHover(e.clientX, e.clientY);
    if (hover === HoverType.SCROLLBAR_Y_CONTAINER || hover === HoverType.SCROLLBAR_Y) {
      return;
    }
    // zoom to scale frames
    const { left } = this.canvas.getBoundingClientRect();
    this._baseOffset = (e.clientX - left) * window.devicePixelRatio;
    this._baseOffsetFrame = this.getFrameByClientX(e.clientX);
    if (e.deltaY > 0) {
      this._currentRangeIndex += 1;
    } else {
      this._currentRangeIndex -= 1;
    }
    this._currentRangeIndex = Math.min(Math.max(this._currentRangeIndex, this._initialRangeIndex), rangeFramesSet.length - 1);
    this.emit(EventAction.VISIBLE_FRAMES_UPDATE, this._currentRangeIndex, rangeFramesSet.map((_, i) => i).slice(this._initialRangeIndex));
    this.drawFrames();
    this.canvasMove(e);
  };

  /**
   * mouse down on canvas
   * @param e
   */
  canvasDown = (e: MouseEvent) => {
    const hover = this.getMouseHover(e.clientX, e.clientY);
    if (hover === HoverType.SCROLLBAR_X) {
      // click on horizontal scrollbar
      this._isScrollXDown = true;
      this._scrollXDownBaseOffsetFrame = this._baseOffsetFrame;
      this._scrollXDownClientX = e.clientX;
    } else if (hover === HoverType.SCROLLBAR_Y) {
      // click on vertical scrollbar
      this._isScrollYDown = true;
      this._scrollYDownItemsOffset = this._itemsOffset;
      this._scrollYDownClientY = e.clientY;
    } else if (this._pendingStartBlock || this._pendingEndBlock) {
      this._pendingEditing = true;
      this.emit(EventAction.BLOCK_HOVERED, this._hoveredBlock);
    } else if (this._hoveredBlock) {
      this.currentFrame = this._hoveredFrame;
      this.emit(EventAction.CURRENT_FRAME_CHANGE, this._currentFrame, this._hoveredItemIndex);
      if (e.buttons === 2) {
        // activate
        this._selectedBlock = this._hoveredBlock;
        this._selectedBlock.selected = true;
        this.drawFrames();
        const hoveredItemY = this._hoveredItemIndex * this.itemHeight - this._itemsOffset + this.scrollbarXContainerHeight;
        this.emit(EventAction.BLOCK_SELECTED, this._selectedBlock, this._hoveredItemIndex, e.clientX, (this.canvas.height - hoveredItemY) / window.devicePixelRatio);
      }
    } else if (this._hoveredFrame >= 0) {
      this.currentFrame = this._hoveredFrame;
      this.emit(EventAction.CURRENT_FRAME_CHANGE, this._currentFrame, this._hoveredItemIndex);
    }
  };

  /**
   * mouse move on canvas
   * @param e
   */
  canvasMove = (e: MouseEvent) => {
    if (this._pendingEditing) {
      this._hoveredFrame = this.getFrameByClientX(e.clientX);
      this.updateFrameTip();
      return;
    }

    this.setCursor(Cursor.DEFAULT);
    const hover = this.getMouseHover(e.clientX, e.clientY);
    if (hover === HoverType.SCROLLBAR_X) {
      // hover on horizontal scrollbar
      this.canvasLeave();
      this.setCursor(Cursor.POINTER);
    } else if (hover === HoverType.SCROLLBAR_Y) {
      this.canvasLeave();
      this.setCursor(Cursor.POINTER);
    } else if (hover === HoverType.SCROLLBAR_X_CONTAINER || hover === HoverType.SCROLLBAR_Y_CONTAINER) {
      this.canvasLeave();
    } else {
      this._hoveredFrame = this.getFrameByClientX(e.clientX);
      this._hoveredItemIndex = this.getItemIndexByClientY(e.clientY);
      if (this._hoveredBlock) {
        this._hoveredBlock.hovered = false;
      }
      this._hoveredBlock = null;
      this._pendingStartBlock = null;
      this._pendingEndBlock = null;

      const { left } = this.canvas.getBoundingClientRect();
      const cursorOffset = (e.clientX - left) * window.devicePixelRatio;
      const threshold = 6 * window.devicePixelRatio;
      this._itemBlocks.forEach((blocks, i) => {
        Object.values(blocks).forEach((item) => {
          if (i === this._hoveredItemIndex) {
            const { startFrame, endFrame, value } = item;
            // check block hovered
            item.hovered = this._hoveredFrame >= startFrame && this._hoveredFrame < endFrame && typeof value !== 'boolean';
            if (item.hovered) {
              this._hoveredBlock = item;
            }
            // check draggable block is pending
            if (item.draggable && (this._hoveredFrame === startFrame || this._hoveredFrame === startFrame - 1)) {
              // match the block beginning
              const frameOffset = this._currentRangeStartOffset + (startFrame - this._currentRangeStart) * this.perFrameWidth;
              if (Math.abs(cursorOffset - frameOffset) < threshold) {
                this.setCursor(Cursor.COL_RESIZE);
                this._pendingStartBlock = item;
              }
            }
            if (item.draggable && (this._hoveredFrame === endFrame || this._hoveredFrame === endFrame - 1)) {
              // match the block ending
              const frameOffset = this._currentRangeStartOffset + (endFrame - this._currentRangeStart) * this.perFrameWidth;
              if (Math.abs(cursorOffset - frameOffset) < threshold) {
                this.setCursor(Cursor.COL_RESIZE);
                this._pendingEndBlock = item;
              }
            }
          }
        });
      });

      this.drawFrames();
      this.updateFrameTip();

      const hoveredItemY = this._hoveredItemIndex * this.itemHeight - this._itemsOffset + this.scrollbarXContainerHeight;
      this.emit(
        EventAction.BLOCK_HOVERED,
        this._hoveredBlock,
        this._hoveredFrame,
        this._hoveredItemIndex,
        e.clientX,
        (this.canvas.height - hoveredItemY) / window.devicePixelRatio,
      );
    }
  };

  /**
   * mouse leave canvas
   */
  canvasLeave = () => {
    this._hoveredFrame = -1;
    this._hoveredItemIndex = -1;
    if (this._hoveredBlock) {
      this._hoveredBlock.hovered = false;
    }
    this._hoveredBlock = null;
    this._pendingStartBlock = null;
    this._pendingEndBlock = null;
    this.drawFrames();
    this.updateFrameTip();
    this.emit(EventAction.BLOCK_HOVERED, this._hoveredBlock);
  };

  /**
   * mouse move on document (dragging scrollbar)
   * @param e
   */
  cursorMove = (e: MouseEvent) => {
    if (this._pendingEditing) {
      const { left } = this.canvas.getBoundingClientRect();
      this._pendingCursorOffset = (e.clientX - left) * window.devicePixelRatio;
      this.drawFrames();
    } else if (this._isScrollXDown) {
      // move horizontal scrollbar
      const offset = (e.clientX - this._scrollXDownClientX) * window.devicePixelRatio;
      const frames = Math.floor((offset / (this.canvas.width - this.paddingRight)) * this.frameCount);
      this._baseOffsetFrame = this._scrollXDownBaseOffsetFrame + frames;
      this._hoveredFrame = -1;
      this._hoveredItemIndex = -1;
      this.drawFrames();
      this.updateFrameTip();
    } else if (this._isScrollYDown) {
      // move vertical scrollbar
      const offset = (e.clientY - this._scrollYDownClientY) * window.devicePixelRatio;
      const itemsOffset = this._scrollYDownItemsOffset + (offset / this.itemsContainerHeight) * this._allItems.length * this.itemHeight;
      this.updateItemsScroll(itemsOffset);
    }
  };

  /**
   * mouse up on document (dragging scrollbar)
   */
  cursorUp = () => {
    if (this._pendingEditing && this._pendingCursorOffset >= 0) {
      let frame = this._currentRangeStart + Math.round((this._pendingCursorOffset - this._currentRangeStartOffset) / this.perFrameWidth);
      if (frame > this.frameCount) {
        frame = this.frameCount;
      } else if (frame < 0) {
        frame = 0;
      }

      const updatedFrameStatus: {
        [frameIndex: number]: number | null;
      } = {};
      const pendingStartFrame = this._pendingStartBlock?.startFrame;
      const pendingEndFrame = this._pendingEndBlock?.endFrame;
      if (pendingStartFrame !== undefined) {
        if (frame > pendingStartFrame) {
          // move -> right
          for (let i = pendingStartFrame; i < frame; i += 1) {
            updatedFrameStatus[i] = null;
          }
          if (pendingEndFrame !== undefined) {
            for (let i = pendingEndFrame; i < frame; i += 1) {
              updatedFrameStatus[i] = pendingEndFrame - 1;
            }
          }
        } else if (frame < pendingStartFrame) {
          // move -> left
          if (pendingEndFrame !== undefined) {
            for (let i = frame; i < pendingEndFrame; i += 1) {
              updatedFrameStatus[i] = null;
            }
          }
          for (let i = frame; i < pendingStartFrame; i += 1) {
            updatedFrameStatus[i] = pendingStartFrame;
          }
        }
      } else if (pendingEndFrame !== undefined) {
        if (frame > pendingEndFrame) {
          // move -> right
          for (let i = pendingEndFrame; i < frame; i += 1) {
            updatedFrameStatus[i] = pendingEndFrame - 1;
          }
        } else if (frame < pendingEndFrame) {
          // move -> left
          for (let i = frame; i < pendingEndFrame; i += 1) {
            updatedFrameStatus[i] = null;
          }
        }
      }
      if (Object.keys(updatedFrameStatus).length > 0) {
        this.emit(EventAction.FRAME_STATUS_CHANGED, updatedFrameStatus, this._hoveredItemIndex);
      }
    }
    this._pendingEditing = false;
    this._pendingCursorOffset = -1;
    if (this._isScrollXDown) {
      this._isScrollXDown = false;
      this._scrollXDownBaseOffsetFrame = 0;
      this._scrollXDownClientX = 0;
    }
    if (this._isScrollYDown) {
      this._isScrollYDown = false;
      this._scrollYDownItemsOffset = 0;
      this._scrollYDownClientY = 0;
    }
  };
}
