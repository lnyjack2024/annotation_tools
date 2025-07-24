export const TOOL_NAME = 'EDITABLE_TEXT';
export const DEFAULT_COLOR = '#909090';
export const FOCUS_COLOR = '#ff0000';
export const HOVER_COLOR = '#ff5151';
export const DEFAULT_BACKGROUND = '#363C4D';
export const TOOL_ITEM_BG_HIGHLIGHT = '#FFFFFF';
export const TOOL_ITEM_CHLID_BG_COLOR = '#2E3442';
export const BASE_COLOR = '#202020';
export const FONT_COLOR = '#ffffffcc';

// review style
export const REJECT_STYLE = '1px solid #FF009C';
export const PASS_STYLE = '1px solid #79B338';

export const HISTORY_SIZE = 50;
export const FONT_SIZE = 16;
export const FONT_SPACE = 0;
export const TAG_WIDTH = 40;
export const LINE_HEIGHT = 40;
export const TAG_HEIGHT = 18;
export const EDITOR_PADDING = 20;
export const READONLY = false;
export const MAX_FONT_SIZE = 50;
export const MIN_FONT_SIZE = 12;
export const MAX_TAG_HEIGHT = 100;
export const MIN_TAG_HEIGHT = 24;
export const MAX_TAG_WIDTH = 200;
export const MIN_TAG_WIDTH = 36;
export const MIN_ALPHA = 0.2;
export const MAX_ALPHA = 0.6;

// tool menu button's alpha
export const TOOL_BUTTON_ALPHA = 0.2;

// tag's alpha
export const DEFAULT_ALPHA = 0.5;
export const HOVER_ALPHA = 0.7;
export const ACTIVE_ALPHA = 0.9;

export const MISSING_LABEL = {
  bgColor: '#000000',
  color: '#ffffff',
  fontColor: '#000000',
  text: 'missing',
  isQATag: true,
  id: 'missing',
  keys: ['missing']
};

export const COMPOSITION = {
  DISABLED: 'DISABLED',
  ENABLED: 'ENABLED',
  PENDING: 'PENDING',
};
export const SELECTION = {
  MOVE: 'MOVE',
  DRAG: 'DRAG',
  CLICK: 'CLICK',
};
export const ACTION = {
  EDIT_DEFAULT: 'EDIT_DEFAULT',
  EDIT_SINGLE_ADD: 'EDIT_SINGLE_ADD',
  EDIT_SINGLE_DEL: 'EDIT_SINGLE_DEL',
  ADD_LABEL: 'ADD_LABEL',
  ADD_INSERTION: 'ADD_INSERTION',
  ADD_CONNECTION: 'ADD_CONNECTION',
  DEL_LABEL: 'DEL_LABEL',
  DEL_INSERTION: 'DEL_INSERTION',
  DEL_CONNECTION: 'DEL_CONNECTION',
  EDIT_REPLACE: 'EDIT_REPLACE',
  EDIT_REPLACE_ALL: 'EDIT_REPLACE_ALL',
  ADD_MISSING_REVIEW: 'ADD_MISSING_REVIEW',
  DEL_MISSING_REVIEW: 'DEL_MISSING_REVIEW',
  ADD_REVIEW: 'ADD_REVIEW',
  DELETE_REVIEW: 'DELETE_REVIEW',
  ADD_REVIEWS: 'ADD_REVIEWS',
  DELETE_REVIEWS: 'DELETE_REVIEWS',
};
export const KEY_COMMAND = {
  HANDLE_REDO: 'HANDLE_REDO',
  HANDLE_UNDO: 'HANDLE_UNDO',
  HANDLE_RETURN: 'HANDLE_RETURN',
  INVALID_KEY: 'INVALID_KEY',
};
export const RECALL_TYPE = {
  UNDO: 'UNDO',
  REDO: 'REDO',
};
export const CONNECTION_DIR = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export const FOCUS_TYPE = {
  NONE: 'NONE',
  HOVER: 'HOVER',
  CLICK: 'CLICK',
};

export const REVIEW_MODE = {
  TAG_REVIEW: 'TAG_REVIEW',
  MISSING: 'MISSING',
};

export const FIND_BLOCK = {
  border: '1px solid #FFA940',
  backgroundColor: 'rgba(255, 169, 64, 0.20)',
  padding: '6px 0',
};
export const FIND_BLOCK_SELECTED = {
  border: '1px solid #FFE600',
  backgroundColor: '#FFE600',
  padding: '6px 0',
  color: '#000'
};
