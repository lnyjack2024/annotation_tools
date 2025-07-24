/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
import React, { createContext } from 'react';
import { Editor, EditorState, convertFromRaw, getDefaultKeyBinding } from 'draft-js';
import { notification, message } from 'antd';
import { uniq } from 'lodash';
import { substr, strlen } from 'fbjs/lib/UnicodeUtils';
import { v4 as uuidv4 } from 'uuid';
import localMessage, { setLocale } from './locale';
import { LabelTag, InsertionTag, ConnectionTag } from './components/tag';
import { isAnnotationReadonly, isRework, isReviewEditable, isPreview } from '../../utils/tool-mode';
import Sidebar from './components/sidebar';
import { genTagMap, renderTagMap } from './utils/tagMapUtil';

import ReviewForm from './components/reviewForm';
import UndoRedo from './components/UndoRedo';
import ReviewMode from './components/ReviewMode';
import Save from './components/Save';
import { isAppenCloud } from '../../utils';
import AppenLogo from '../common/AppenLogo';
import store from './store/RootStore';
import './TextAnnotationApp.scss';
import 'draft-js/dist/Draft.css';
import {
  FIND_BLOCK,
  FIND_BLOCK_SELECTED,
  FOCUS_COLOR, DEFAULT_COLOR,
  FONT_COLOR, BASE_COLOR, HISTORY_SIZE,
  FONT_SIZE, TAG_HEIGHT,
  LINE_HEIGHT, EDITOR_PADDING,
  COMPOSITION, SELECTION, ACTION, KEY_COMMAND,
  RECALL_TYPE,
  HOVER_COLOR,
  FONT_SPACE, FOCUS_TYPE,
  HOVER_ALPHA,
  ACTIVE_ALPHA,
  DEFAULT_ALPHA,
} from './store/constant';
import {
  isArabic,
  convertArrayToColor,
  convertColorToArray,
  getSliceHead,
  setSelection,
  closeSelection,
  getTextByInsertion,
  getTargetWrapperDataSet,
  getConfigByKeys,
} from './utils/helper';
import {
  isLabel,
  isInsertion,
  isConnection,
  isQATag,
} from './store/tag_mode';
import { ReviewItemResult, TAG, ReviewMode as ReviewModeType } from './types';
import TagInfoMap from './utils/TagInfoMap';

export const TextToolContext = createContext();
export default class TextAnnotationApp extends React.Component {
  constructor(props) {
    super(props);
    setLocale(props.locale);
    this.raw = { blocks: [], entityMap: {} };
    this.sliceMap = new Map();
    this.state = {
      foundTags: [],
      needJumpFound: false,
      foundTagSelectedIndex: 0,
      style: {
        FIND_BLOCK,
        FIND_BLOCK_SELECTED,
      },
      tagOpenReview: null,
      tagReviewInfo: null,
      editorState: EditorState.createEmpty(),
      currentBrush: null,
      editorHeight: null,
      editorWidth: null,
      tagMap: new TagInfoMap(),
      currentClick: {
        id: null,
        fromId: null,
        toId: null,
        fromType: null,
        toType: null,
      },
      currentHover: {
        id: '',
        fromId: null,
        toId: null,
        fromType: null,
        toType: null,
      },
      currentFrom: {
        type: null,
        id: null,
        offset: null,
      },
      currentMouse: {
        left: 0,
        top: 0,
      },
      inputEnable: false,
    };

    this.compositionTop = -1;
    this.compositionFlag = COMPOSITION.DISABLED;
    this.inputFlag = false;
    this.mouseFlag = false;
    this.pasteFlag = false;
    this.undoLock = false;
    this.redoLock = false;
    this.redoList = [];
    this.undoList = [];

    // user setting
    this.fontColor = FONT_COLOR;
    this.toolMode = this.props.jobProxy.toolMode || this.props.mode;
    store.jobProxy = this.props.jobProxy;
  };

  addHistory = (type, data) => {
    let targetList;
    if (this.undoLock) {
      // Add history to redo list
      targetList = this.redoList;
    } else if (this.redoLock) {
      // Add history back to undo list
      targetList = this.undoList;
      // Clear redo list
    } else {
      // Add history to redo list
      targetList = this.undoList;
      this.redoList = [];
    }
    let { length } = targetList;
    if (length > HISTORY_SIZE) {
      targetList.shift();
      length -= 1;
    }
    if (type === ACTION.EDIT_SINGLE_ADD && length >= 1) {
      const prev = targetList[length - 1];
      if ((prev.type === ACTION.EDIT_DEFAULT || prev.type === ACTION.EDIT_SINGLE_ADD) && (prev.data.prevSlice === '' && prev.data.end === data.prevStart)) {
        targetList.pop();
        targetList.push({
          type: ACTION.EDIT_DEFAULT,
          data: {
            prevSlice: '',
            slice: prev.data.slice + data.slice,
            prevStart: prev.data.prevStart,
            prevEnd: prev.data.prevEnd,
            start: data.start,
            end: data.end,
          }
        });
      } else targetList.push({ type, data });
    } else if (type === ACTION.EDIT_SINGLE_DEL && length >= 1) {
      const prev = targetList[length - 1];
      if ((prev.type === ACTION.EDIT_DEFAULT || prev.type === ACTION.EDIT_SINGLE_DEL) && (prev.data.slice === '' && data.prevEnd === prev.data.start)) {
        targetList.pop();
        targetList.push({
          type: ACTION.EDIT_DEFAULT,
          data: {
            slice: '',
            prevSlice: data.prevSlice + prev.data.prevSlice,
            prevStart: data.end,
            prevEnd: prev.data.prevEnd,
            start: data.start,
            end: data.end,
          }
        });
      } else targetList.push({ type, data });
    } else targetList.push({ type, data });
  };

  executeHistory = (recallType) => {
    // Execute history
    let targetList;
    if (recallType === RECALL_TYPE.UNDO) {
      // Get from undo list
      this.undoLock = true;
      targetList = this.undoList;
    } else if (recallType === RECALL_TYPE.REDO) {
      // Get from redo list
      this.redoLock = true;
      targetList = this.redoList;
    }
    if (targetList.length === 0) {
      this.undoLock = false;
      this.redoLock = false;
      return;
    }
    const item = targetList.pop();
    const { data } = item;
    let nextEditorState = this.state.editorState;
    switch (item.type) {
      case ACTION.EDIT_SINGLE_ADD:
      case ACTION.EDIT_SINGLE_DEL:
      case ACTION.EDIT_DEFAULT:
      case ACTION.EDIT_REPLACE:
      {
        const newData = {
          prevSlice: data.slice,
          slice: data.prevSlice,
          start: data.prevEnd,
          end: data.prevEnd,
          prevStart: data.prevStart,
          prevEnd: data.end,
          ...item.type === ACTION.EDIT_REPLACE && {
            tags: data.prevTags,
            prevTags: data.tags,
          }
        };
        // nextEditorState = this.onContentChange(nextEditorState, newData);
        nextEditorState = setSelection(this.onContentChange(nextEditorState, newData, item.type), newData.start, newData.end);
        break;
      }
      case ACTION.ADD_INSERTION:
      {
        const { type, id } = data.insertion;
        nextEditorState = this.deleteTag(type, id);
        break;
      }
      case ACTION.ADD_LABEL:
      {
        const { type, id } = data.label;
        nextEditorState = this.deleteTag(type, id);
        break;
      }
      case ACTION.ADD_MISSING_REVIEW:
      {
        const { preReview, id } = data;
        if (preReview) {
          const { editorState } = this.addReview(nextEditorState, id, { ...preReview });
          nextEditorState = editorState;
        } else {
          const { editorState } = this.deleteQATag(id);
          nextEditorState = editorState;
        }
        break;
      }
      case ACTION.ADD_CONNECTION:
      {
        const { type, id } = data;
        nextEditorState = this.deleteTag(type, id);
        break;
      }
      case ACTION.DEL_LABEL:
      {
        const { relatedConnections, label } = data;
        nextEditorState = this.addLabel(nextEditorState, label, relatedConnections);
        break;
      }
      case ACTION.DEL_MISSING_REVIEW:
      {
        const { label, review } = data;
        const { editorState } = this.addQALabel(nextEditorState, label, { ...review });
        nextEditorState = editorState;

        break;
      }
      case ACTION.DEL_INSERTION:
      {
        const { relatedConnections, insertion } = data;

        nextEditorState = this.addInsertion(nextEditorState, insertion, relatedConnections);
        break;
      }
      case ACTION.DEL_CONNECTION:
      {
        const { connection } = data;
        nextEditorState = this.addConnection(nextEditorState, connection);
        break;
      }
      case ACTION.EDIT_REPLACE_ALL:
      {
        const { text: currentText, prevText, prevResults, results } = data;
        store.ontology.text = prevText;
        store.ontology.setResults(prevResults);
        this.raw = this.renderTextArea(prevText);
        nextEditorState = EditorState.set(nextEditorState, { currentContent: convertFromRaw(this.raw) });
        this.addHistory(ACTION.EDIT_REPLACE_ALL, {
          text: prevText,
          prevText: currentText,
          prevResults: results,
          results: prevResults,
        });
        break;
      }
      case ACTION.ADD_REVIEW: {
        const { preReview, id } = data;
        if (preReview) {
          const { editorState } = this.addReview(nextEditorState, id, { ...preReview });
          nextEditorState = editorState;
        } else {
          const { editorState } = this.deleteReview(id);
          nextEditorState = editorState;
        }
        break;
      }
      case ACTION.DELETE_REVIEW: {
        const { review, id } = data;
        const { editorState } = this.addReview(nextEditorState, id, { ...review });
        nextEditorState = editorState;
        break;
      }
      case ACTION.ADD_REVIEWS: {
        nextEditorState = this.deleteReviewItems(data);
        break;
      }
      case ACTION.DELETE_REVIEWS: {
        nextEditorState = this.addReviewItems(nextEditorState, data);
        break;
      }
      default:
        break;
    }

    this.renderAndSave(nextEditorState);
    this.undoLock = false;
    this.redoLock = false;
  };

  renderAndSave = (
    _editorState,
    shouldRenderTags = true,
    shouldResetCurrentState = false,
    shouldSaveURL = false,
  ) => {
    const editorState = _editorState || this.state.editorState;
    const { hasFocus } = editorState.getSelection();
    const top = this.editorWrapper.scrollTop;
    // window.ew = this.editorWrapper;
    return new Promise((resolve) => {
      if (shouldResetCurrentState) {
        this.resetCurrentFrom();
      }
      this.setState({ editorState });
      if (shouldSaveURL) {
        this.exportResult();
      }
      resolve();
    }).then(() => {
      if (shouldRenderTags) {
        const { nextEditorState, tagMap } = this.measureTags(editorState);
        return new Promise((resolve) => {
          this.setState({ editorState: nextEditorState }, () => {
            store.ontology.updateOntologiesStatusMap();
          });
          resolve(tagMap);
        });
      }
    }).then((tagMap) => {
      if (shouldRenderTags) {
        this.renderTags(tagMap);
        return new Promise((resolve) => {
          this.setState({
            editorWidth: this.editorWrapper.offsetWidth - EDITOR_PADDING * 2,
            editorHeight: this.editorWrapper.scrollHeight - EDITOR_PADDING * 2,
            tagMap,
          });
          resolve();
        });
      }
    }).then(() => {
      if (hasFocus) {
        // move back to current selection after composition end
        if (this.compositionTop >= 0) {
          this.editor.focus({ y: this.compositionTop });
          this.compositionTop = -1;
        } else this.editor.focus({ y: top });
      }
      return new Promise((resolve) => resolve());
    });
  };

  updateEditorAndRender = (options) => {
    let { editorState } = this.state;
    // update rawDraftContentState, using new results
    this.raw = this.renderTextArea();
    // update editorState, using new rawDraftContentState
    editorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    if (options && typeof options[Symbol.iterator] === 'function') {
      return this.renderAndSave(editorState, ...options);
    }

    return this.renderAndSave(editorState);
  };

  onChange = (editorState) => {
    // ignore composition operation
    if (this.compositionFlag === COMPOSITION.ENABLED) return;
    // get operation type ( handled operation not included )
    const prevEditorState = this.state.editorState;
    const prevText = store.ontology.text;
    const text = editorState.getCurrentContent().getPlainText();
    let prevStart = prevEditorState.getSelection().getStartOffset();
    const prevEnd = prevEditorState.getSelection().getEndOffset();
    const start = editorState.getSelection().getStartOffset();
    const end = editorState.getSelection().getEndOffset();
    const { hasFocus } = editorState.getSelection();
    const { hasFocus: prevFocus } = prevEditorState.getSelection();

    if (hasFocus !== prevFocus) { // when focus change update new editor state and return without doing anything
      const nextEditorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
      this.renderAndSave(nextEditorState, null, false);
      return;
    }

    if (this.inputFlag || this.pasteFlag || this.compositionFlag === COMPOSITION.PENDING || prevText !== text) {
      /* text changed:
       * 1. deleted by delete key
       * 2. deleted by drag + delete key
       * 3. deleted by drag + cut operation
       * 4. insert/replace by (drag) + simply typing
       * 5. insert/replace by (drag) + composition typing
       * 6. insert/replace by (drag) + paste operation
       * 7. redo && undo
       */
      if (prevStart === prevEnd && start === prevStart - 1) prevStart -= 1;
      const prevSlice = prevText.slice(prevStart, prevEnd);
      const slice = text.slice(prevStart, end);
      const data = { prevSlice, slice, prevStart, prevEnd, start, end };
      const nextEditorState = this.onContentChange(editorState, data);
      // reset flag
      this.inputFlag = false;
      this.pasteFlag = false;
      this.compositionFlag = COMPOSITION.DISABLED;
      this.renderAndSave(nextEditorState);
    } else {
      /* selection changed
       * 1. simply select
       * 2. click select: add insertion
       * 3. drag select: add label
       */
      const data = { start, end };
      const { nextEditorState, type } = this.onSelectionChange(editorState, data);
      const shouldRender = type !== SELECTION.MOVE;
      this.renderAndSave(nextEditorState, shouldRender, shouldRender);
    }
  };

  renderTags = (tagMap) => {
    const spanMap = this.getAnchorElementsByHeads();
    const newTagMap = renderTagMap(tagMap, spanMap);
    return newTagMap;
  };

  onSave = async () => {
    if (isPreview(this.toolMode)) return;
    try {
      if (!isAnnotationReadonly(this.toolMode)) {
        await this.exportResult();
      }
      if (isReviewEditable(this.toolMode)) {
        await this.submitReviews(false);
      }
      message.success(localMessage('saveSuccess'));
    } catch (e) {
      message.warning(localMessage('saveFail'));
    }
  };

  onSubmit = async (params) => {
    const invalid = params && params.validityFlag === 'false';
    if (store.config.submitCheck && (
      !invalid || !store.config.skipCheckForInvalidData
    )) {
      // validate before submit
      await store.validation.defaultSync();
      if (store.validation.blocked) {
        throw new Error(localMessage('SUBMIT_CHECK_FAIL'));
      }
    }
    return this.exportResult(true);
  };

  exportResult = (isSubmit = false) => {
    if (isAnnotationReadonly(this.toolMode)) return;
    return store.saveResult(isSubmit);
  };

  submitReviews(isSubmit = true) {
    return store.saveReviews(isSubmit);
  }

  getReviews() {
    return this.submitReviews();
  }

  getStatistics() {
    return store.getAuditStatistics();
  }

  measureTags = (editorState) => {
    const { raw } = this;
    const { text } = store.ontology;
    const { labels, insertions } = store.ontology.getResults();

    const spanMap = this.getAnchorElementsByHeads();
    const offsetTops = uniq((labels.map((label) => spanMap.get(label.start)?.offsetTop))
      .concat(insertions.map((insertion) => spanMap.get(insertion.at)?.offsetTop)));
    const occupyMap = new Map();
    offsetTops.forEach((offsetTop) => { occupyMap.set(offsetTop, []); });

    // get label offsets
    const tagMap = genTagMap(store.ontology.getResults(), store.ontology.ontologyConfigMap, spanMap, occupyMap, text);
    const ranges = raw.blocks[0].inlineStyleRanges;
    const style = { ...this.state.style };
    ranges.filter((item) => item.style.slice(0, 6) === 'ANCHOR').forEach((item) => {
      const span = this.getAnchorElementByHead(item.offset);
      if (span) {
        const occupyList = occupyMap.get(span.offsetTop);
        const lineHeight = occupyList.map((it) => (it.top > 0 ? it.top - FONT_SIZE + TAG_HEIGHT : -it.top))
          .sort((a, b) => (a - b)).pop() * 2 + LINE_HEIGHT;
        style[`LINEHEIGHT_${lineHeight}`] = { lineHeight: `${lineHeight}px` };
        ranges.push({ offset: item.offset, length: item.length, style: `LINEHEIGHT_${lineHeight}` });
      }
    });
    const nextEditorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    this.setState({ style });
    return { nextEditorState, tagMap };
  };

  onSelectionChange = (editorState, data) => {
    const { start, end } = data;
    const { currentBrush } = this.state;
    if (!this.mouseFlag) {
      return { nextEditorState: editorState, type: SELECTION.MOVE };
    } if (start === end && isInsertion(currentBrush?.type)) {
      const fbAt = strlen(store.ontology.text.slice(0, start));
      const nextEditorState = this.addInsertion(editorState, { at: fbAt, value: currentBrush.text, keys: currentBrush.keys, type: TAG.INSERTION });
      return { nextEditorState, type: SELECTION.CLICK };
    } if (start !== end && isLabel(currentBrush?.type)) {
      const fbStart = strlen(store.ontology.text.slice(0, start));
      const fbEnd = strlen(store.ontology.text.slice(0, end));
      if (isQATag(currentBrush?.type)) {
        const { editorState: nextEditorState } = this.addQALabel(editorState, { start: fbStart, end: fbEnd, value: currentBrush.text, keys: currentBrush.keys, type: currentBrush.type }, { result: ReviewItemResult.MISSING }, true, true);
        return { nextEditorState, type: SELECTION.DRAG };
      }
      const nextEditorState = this.addLabel(editorState, { start: fbStart, end: fbEnd, value: currentBrush.text, keys: currentBrush.keys, type: currentBrush.type });
      return { nextEditorState, type: SELECTION.DRAG };
    }
    return { nextEditorState: editorState, type: SELECTION.MOVE };
  };

  deleteTag = (type, id) => {
    const { state: { editorState } } = this;
    if (isQATag(type) && store.config.reviewMode !== ReviewModeType.REVIEW) {
      return editorState;
    }
    if (!isQATag(type) && store.config.reviewMode === ReviewModeType.REVIEW) {
      return;
    }
    if (isAnnotationReadonly(this.toolMode)) {
      return editorState;
    }

    const operation = store.ontology.deleteTag(type, id);
    switch (true) {
      case (isLabel(type)): this.addHistory(ACTION.DEL_LABEL, operation); break;
      case (isConnection(type)): this.addHistory(ACTION.DEL_CONNECTION, operation); break;
      case (isInsertion(type)): this.addHistory(ACTION.DEL_INSERTION, operation); break;
      default: break;
    }
    this.raw = this.renderTextArea();
    return EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
  };

  addInsertion = (editorState, { at, value, id, keys, type }, relatedConnections = []) => {
    const { state: { currentBrush }, toolMode } = this;
    const { text } = store.ontology;
    if (isAnnotationReadonly(this.toolMode) || store.config.reviewMode === ReviewModeType.REVIEW) return editorState;
    if (at === strlen(text)) return editorState; // prevent insert to the end of content
    // eslint-disable-next-line no-restricted-syntax
    for (const item of store.ontology.results.insertions) {
      if (item.at === at && item.value === currentBrush.text) return editorState;
    }
    if (!id) id = uuidv4();
    const arabic = isArabic(substr(text, at));
    if (arabic && at) at -= 1;
    const newItem = {
      type,
      at,
      value,
      id,
      text: getTextByInsertion(store.ontology.text, { at, value }),
      isReview: isReviewEditable(toolMode),
      keys,
    };

    this.addHistory(ACTION.ADD_INSERTION, {
      insertion: newItem,
      relatedConnections,
    });

    store.ontology.addResultItem(newItem, relatedConnections);

    this.raw = this.renderTextArea();
    editorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    editorState = closeSelection(editorState);
    return editorState;
  };

  addConnection = (editorState, { fromId, fromType, toId, toType, value, id, keys, type }) => {
    const { state: { currentBrush }, toolMode } = this;
    if (isAnnotationReadonly(toolMode) || store.config.reviewMode === ReviewModeType.REVIEW) return editorState;
    if (fromId === toId) return editorState;
    if (isQATag(fromType) || isQATag(toType)) return editorState; // can't add connection for qa tool

    if (store.ontology.results.connections.some((item) => item.fromId === fromId && item.toId === toId && item.value === currentBrush.text)) return editorState;

    if (!id) id = uuidv4();
    const newItem = {
      type,
      fromId,
      fromType,
      toId,
      toType,
      value,
      id,
      isReview: isReviewEditable(toolMode),
      keys,
    };
    this.addHistory(ACTION.ADD_CONNECTION, newItem);
    store.ontology.addResultItem(newItem);

    this.raw = this.renderTextArea();
    editorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    return editorState;
  };

  addLabel = (editorState, { start, end, value, id, keys, type }, relatedConnections = []) => {
    const { toolMode } = this;
    const { ontology, config } = store;
    const { text } = store.ontology;

    if (config.reviewMode === ReviewModeType.REVIEW && (!isQATag(type))) return editorState;
    if (isAnnotationReadonly(this.toolMode) && (!isQATag(type))) return editorState;
    if (isQATag(type) && (!isReviewEditable(this.toolMode) || config.reviewMode === ReviewModeType.LABELING)) return editorState; // qa mode can only use qa tool, work mode can only use normal tool

    // slice should not begin with \n
    if (substr(text, start, 1) === '\n') return editorState;

    if (ontology.results.labels.some((item) => item.start === start && item.end === end && item.value === value)) return editorState;

    // generate new label
    if (!id) id = uuidv4();
    const newItem = {
      type,
      start,
      end,
      value,
      id,
      text: substr(text, start, end - start),
      isReview: isReviewEditable(toolMode),
      keys
    };

    this.addHistory(ACTION.ADD_LABEL, {
      label: newItem,
      relatedConnections,
    });

    ontology.addResultItem(newItem, relatedConnections);
    // update rawDraftContentState, using new results
    this.raw = this.renderTextArea();
    // update editorState, using new rawDraftContentState
    editorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    editorState = closeSelection(editorState);
    return editorState;
  };

  addQALabel = (editorState, { start, end, value, id, keys, type }, reviewInfo, needUnRedo = true, needOpenReview = false) => {
    const { toolMode } = this;
    const { ontology, config, review } = store;
    const { text } = ontology;
    if (config.reviewMode === ReviewModeType.REVIEW && (!isQATag(type))) return { editorState, operation: null };
    if (isAnnotationReadonly(this.toolMode) && (!isQATag(type))) return { editorState, operation: null };
    if (isQATag(type) && (!isReviewEditable(this.toolMode) || config.reviewMode === ReviewModeType.LABELING)) return { editorState, operation: null }; // qa mode can only use qa tool, work mode can only use normal tool

    // slice should not begin with \n
    if (substr(text, start, 1) === '\n') return { editorState, operation: null };

    if (review.reviews.missing.some((item) => item.start === start && item.end === end && item.value === value)) return { editorState, operation: null };

    // generate new label
    if (!id) id = uuidv4();
    const newItem = {
      type,
      start,
      end,
      value,
      id,
      text: substr(text, start, end - start),
      isReview: isReviewEditable(toolMode),
      keys
    };
    if (needOpenReview) {
      this.setState({ tagOpenReview: { ...newItem } });
    }

    const operation = review.addMissingReview(newItem, id, { ...reviewInfo });
    if (needUnRedo) {
      this.addHistory(ACTION.ADD_MISSING_REVIEW, operation);
    }

    // update rawDraftContentState, using new results
    this.raw = this.renderTextArea();
    // update editorState, using new rawDraftContentState
    editorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    editorState = closeSelection(editorState);
    return { editorState, operation };
  };

  deleteQATag = (id, needUnRedo = true) => {
    const { state: { editorState } } = this;

    if (store.config.reviewMode !== ReviewModeType.REVIEW) {
      return { editorState, operation: null };
    }
    if (isAnnotationReadonly(this.toolMode)) {
      return { editorState, operation: null };
    }
    const operation = store.review.deleteMissingReview(id);
    if (needUnRedo) {
      this.addHistory(ACTION.DEL_MISSING_REVIEW, operation);
    }
    this.raw = this.renderTextArea();
    return { editorState: EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) }), operation };
  };

  deleteReview = (reviewId, needUnRedo = true) => {
    const { state: { editorState } } = this;
    if (!(isReviewEditable(this.toolMode) && store.config.reviewMode === ReviewModeType.REVIEW)) {
      return { editorState, operation: null };
    }
    const operation = store.review.deleteReview(reviewId);
    if (needUnRedo) {
      this.addHistory(ACTION.DELETE_REVIEW, operation);
    }
    this.raw = this.renderTextArea();
    return { editorState: EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) }), operation };
  };

  addReview = (editorState, reviewId, review, needUnRedo = true) => {
    const { state: { editorState: currEditorState } } = this;
    if (!(isReviewEditable(this.toolMode) && store.config.reviewMode === ReviewModeType.REVIEW)) {
      return { editorState: currEditorState, operation: null };
    }
    const operation = store.review.setReview(reviewId, {
      ...review
    });
    if (needUnRedo) {
      this.addHistory(ACTION.ADD_REVIEW, operation);
    }
    this.raw = this.renderTextArea();
    return { editorState: EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) }), operation };
  };

  deleteReviewItemById = (reviewId) => {
    if (reviewId) {
      let nextEditorState = this.state.editorState;
      const reviewItem = store.ontology.getItemById(reviewId);
      if (reviewItem && isQATag(reviewItem.type)) {
        const { editorState } = this.deleteQATag(reviewItem.id);
        nextEditorState = editorState;
      } else {
        const { editorState } = this.deleteReview(reviewId);
        nextEditorState = editorState;
      }
      this.renderAndSave(nextEditorState);
    }
  };

  deleteReviewItemsById = (reviewIds) => {
    const operations = [];
    reviewIds?.forEach((reviewId) => {
      if (reviewId) {
        const reviewItem = store.ontology.getItemById(reviewId);
        if (reviewItem && isQATag(reviewItem.type)) {
          const { operation } = this.deleteQATag(reviewItem.id, false);
          if (operation) {
            operations.push(operation);
          }
        } else {
          const { operation } = this.deleteReview(reviewId, false);
          if (operation) {
            operations.push(operation);
          }
        }
      }
    });
    this.addHistory(ACTION.DELETE_REVIEWS, operations);
    const { state: { editorState } } = this;
    this.raw = this.renderTextArea();
    return EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
  };

  deleteReviewItems = (reviewItems) => {
    const operations = [];
    const { state: { editorState } } = this;
    if (!(isReviewEditable(this.toolMode) && store.config.reviewMode === ReviewModeType.REVIEW)) {
      return editorState;
    }
    reviewItems?.forEach((reviewItem) => {
      const { review, id } = reviewItem;
      if (review.result === ReviewItemResult.MISSING) {
        const { operation } = this.deleteQATag(id, false);
        if (operation) {
          operations.push(operation);
        }
      } else {
        const { operation } = this.deleteReview(id, false);
        if (operation) {
          operations.push(operation);
        }
      }
    });
    this.addHistory(ACTION.DELETE_REVIEWS, operations);
    this.raw = this.renderTextArea();
    return EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
  };

  addReviewItems = (editorState, reviewItems) => {
    const operations = [];
    if (!(isReviewEditable(this.toolMode) && store.config.reviewMode === ReviewModeType.REVIEW)) {
      return editorState;
    }
    reviewItems?.forEach((reviewItem) => {
      const { review, id } = reviewItem;
      if (review.result === ReviewItemResult.MISSING) {
        const { operation } = this.addQALabel(editorState, reviewItem.label, { ...review }, false, false);
        if (operation) {
          operations.push(operation);
        }
      } else {
        const { operation } = this.addReview(editorState, id, { ...review }, false);
        if (operation) {
          operations.push(operation);
        }
      }
    });
    this.addHistory(ACTION.ADD_REVIEWS, operations);
    this.raw = this.renderTextArea();
    return EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
  };

  deleteReviewHandle = (reviewItem) => {
    if (reviewItem) {
      let nextEditorState = this.state.editorState;
      if (isQATag(reviewItem.type)) {
        const { editorState } = this.deleteQATag(reviewItem.id);
        nextEditorState = editorState;
      } else {
        const { editorState } = this.deleteReview(reviewItem.id);
        nextEditorState = editorState;
      }
      this.renderAndSave(nextEditorState);
    }
  };

  onDeleteReview = () => {
    const { tagOpenReview } = this.state;
    this.deleteReviewHandle(tagOpenReview);
  };

  // create new RawDraftContentState and update customeStyleMap
  // update: raw, style, sliceMap
  renderTextArea = (_text) => {
    const { ontology } = store;
    const { ontologyConfigMap } = ontology;
    const {
      currentClick, currentHover,
      foundTags, foundTagSelectedIndex, needJumpFound,
    } = this.state;
    const style = { ...this.state.style };
    const text = _text || store.ontology.text;
    const { labels, insertions } = ontology.getResults();
    // render missing labels as normal labels

    // slice text to segments
    const slices = uniq(
      (labels.map((label) => label.start))
        .concat(labels.map((label) => label.end))
        .concat(insertions.map((insertion) => insertion.at))
        .concat(foundTags.map((t) => t.start))
        .concat(foundTags.map((t) => t.end))
        .concat([0, text.length])
        .sort((a, b) => a - b)
    );
    const labelHeads = uniq((labels.map((label) => label.start)));
    const insertionHeads = uniq((insertions.map((insertion) => insertion.at)));
    const foundTagHeads = uniq((foundTags.map((tag) => tag.start)));

    // .concat(insertions.map((insertion) => insertion.at)));
    const raw = {
      blocks: [{
        text,
        key: 'span-wrapper',
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [
          { offset: 0, length: text.length, style: 'DEFAULT_STYLE' }],
        children: [],
        entityRanges: [],
        data: {},
      }],
      entityMap: {}
    };
    let sliceCount = 0;
    // 对重叠的tag进行背景色叠加
    const ranges = raw.blocks[0].inlineStyleRanges;
    this.sliceMap = new Map();
    slices.forEach((anchor, index, array) => {
      // set slice
      if (!index) return;
      const { prev, next } = { prev: array[index - 1], next: anchor };
      const match = labels.filter((label) => (label.start <= prev && label.end > prev));
      let currentRGB = [0, 0, 0];
      let currentAlpha = 0;
      let nextAlpha = DEFAULT_ALPHA;
      let isCoverbyQa = false;
      let keepRGB = null;
      match.some((label) => {
        const labelItem = getConfigByKeys(ontologyConfigMap, label.keys);
        const tempRGB = convertColorToArray(labelItem.color);
        if (!keepRGB) isCoverbyQa = isQATag(label.type);
        // render clicked tag in priority
        if (currentClick.id === label.id || currentClick.fromId === label.id || currentClick.toId === label.id) {
          keepRGB = tempRGB.map((value, i) => value * ACTIVE_ALPHA);
          isCoverbyQa = isQATag(label.type);
          return true;
        }

        if ((!keepRGB && currentHover.id === label.id) || currentHover.fromId === label.id || currentHover.toId === label.id) {
          keepRGB = tempRGB.map((v) => v * HOVER_ALPHA);
        }

        if (!keepRGB) {
          currentRGB = currentRGB.map((value, i) => value + tempRGB[i] * nextAlpha);
          currentAlpha += nextAlpha;
          nextAlpha = DEFAULT_ALPHA * (1 - currentAlpha) * (1 - currentAlpha);
        }
        return false;
      });
      // background of found tag
      foundTags
        .filter((tag) => (tag.start <= prev && tag.end > prev))
        .some((tag) => {
          const tagIndex = foundTags.findIndex((f) => f.start === tag.start);
          if (tagIndex !== undefined) {
            keepRGB = foundTagSelectedIndex === tagIndex && !needJumpFound ? [255, 230, 0] : [255, 169, 64, 0.20];
            return true;
          }
          return false;
        });
      const baseRGB = convertColorToArray(BASE_COLOR);
      currentRGB = keepRGB || currentRGB.map((value, i) => Math.min(255, value + baseRGB[i] * (1 - currentAlpha)));
      const currentColor = convertArrayToColor(currentRGB);

      if (!style[`BACKGROUND_${currentColor}`]) style[`BACKGROUND_${currentColor}`] = { backgroundColor: currentColor };

      if (isCoverbyQa) ranges.push({ offset: prev, length: next - prev, style: 'MISSING_STYLE' });
      ranges.push({ offset: prev, length: next - prev, style: `BACKGROUND_${currentColor}` });
      ranges.push({ offset: prev, length: next - prev, style: `SLICE_${prev}_${next}` });
      // set slice head if for label/insertion slice
      if (labelHeads.indexOf(prev) >= 0 || insertionHeads.indexOf(prev) >= 0) {
        const slice = substr(text, prev, next - prev);
        const head = getSliceHead(slice);
        ranges.push({ offset: prev, length: strlen(head), style: `ANCHOR_${prev}` });
      }
      if (foundTagHeads.indexOf(prev) >= 0) {
        const tagIndex = foundTags.findIndex((f) => f.start === prev);
        if (tagIndex !== undefined) {
          const tag = foundTags[tagIndex];
          ranges.push({
            offset: prev,
            length: tag.end - tag.start,
            style: foundTagSelectedIndex === tagIndex && !needJumpFound ? 'FIND_BLOCK_SELECTED' : 'FIND_BLOCK',
          });
        }
      }

      if (labelHeads.indexOf(prev) >= 0 || insertionHeads.indexOf(prev) >= 0 || foundTagHeads.indexOf(prev) >= 0) {
        const slice = substr(text, prev, next - prev);
        const head = getSliceHead(slice);
        // set sliceMap
        this.sliceMap.set(prev, sliceCount);
        if (head !== slice) sliceCount += 1;
      }
      sliceCount += 1;
    });
    // update new style
    this.setState({ style });
    return raw;
  };

  async componentDidMount() {
    this.toolMode = this.props.jobProxy.toolMode;
    let { content } = this.props;
    let results;

    // insert qa tool's label
    try {
      const resultRes = await this.props.jobProxy.loadResult();
      if (resultRes?.results && resultRes?.content) {
        content = resultRes.content;
        results = resultRes.results;
      } else if (resultRes?.labels && resultRes?.connections && resultRes?.insertions) {
        results = resultRes;
      }
    } catch (e) {
      notification.error({ message: localMessage('ANNOTATION_DATA_LOAD_ERROR'), duration: null });
      return;
    }

    // init store
    try {
      await store.init({ ...this.props, content: content || '' });
    } catch (e) {
      notification.error({ message: e.message, duration: null });
      return;
    }

    // initialize results
    store.ontology.parseResults(results);

    const reviewRes = await this.props.jobProxy.loadReviews();
    if (reviewRes) {
      store.review.parseReview(reviewRes);
    }

    // initialize raw
    this.raw = this.renderTextArea();

    this.editorWrapper.addEventListener('compositionstart', this.onCompositionStart);
    this.editorWrapper.addEventListener('compositionend', this.onCompositionEnd);

    this.editorWrapper.addEventListener('mousedown', this.onMouseDown);
    this.editorWrapper.addEventListener('dragstart', (e) => e.preventDefault());
    this.editorWrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.resetCurrentFrom();
      this.resetCurrentFocus('currentClick', true);
    });
    this.editorWrapper.addEventListener('mousemove', this.onMouseMove);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', () => this.renderAndSave(null, true, false, false));

    // initialize customStyleMap
    this.setState({
      style: {
        ...this.state.style,
        DEFAULT_STYLE: {
          color: this.fontColor,
          fontSize: `${FONT_SIZE}px`,
          lineHeight: `${LINE_HEIGHT}px`,
          letterSpacing: `${FONT_SPACE}px`,
        },
        MISSING_STYLE: {
          color: '#000000',
        }
      },
    });
    this.renderAndSave(EditorState.createWithContent(convertFromRaw(this.raw)), true, true, false);
    // use url file backup to replace content, results, and reviews information
    // use local storage backup to replace text, results, and reviews information
    // save every 5 minutes
    setInterval(() => {
      this.onSave();
    }, 1000 * 60 * 5);
    if (this.props.renderComplete) {
      this.props.renderComplete();
    }
  }

  onMouseMove = (e) => {
    const box = this.svg.getBoundingClientRect();
    this.setState({
      currentMouse: {
        left: e.clientX - box.x,
        top: e.clientY - box.y,
      }
    });
  };

  moveFocusToTag = (tag) => {
    let currentClick = { ...this.state.currentClick };
    const { tagMap } = this.state;
    if (tag == null) return;
    currentClick = {
      id: tag.id,
      fromId: tag.fromId,
      toId: tag.toId,
      fromType: tag.fromType,
      toType: tag.toType,
    };
    const { top } = tagMap.getItem(tag.id, tag.type);
    const { clientHeight, scrollTop } = this.editorWrapper;
    if (top < scrollTop || top > clientHeight + scrollTop) {
      this.editor.focus({ y: top });
    }

    this.setState({ currentClick }, () => {
      this.updateEditorAndRender();
    });
  };

  onKeyDown = (e) => {
    if (window.disableTextHotKeys) {
      return;
    }
    const { currentClick, editorState } = this.state;
    const { keyCode, ctrlKey, altKey } = e;
    const config = [];
    store.ontology.ontologyConfigMap.forEach((value) => { config.push(value); });
    if (ctrlKey) {
      switch (true) {
        case (keyCode >= 48 && keyCode <= 57): {
          // 0 - 9
          e.preventDefault();
          const index = e.keyCode - 49;
          if (index === -1) {
            this.setCurrentBrush(null);
          }
          if (config[index]) {
            this.setCurrentBrush(config[index]);
          }
          break; }
        case (keyCode === 90): e.preventDefault(); this.executeHistory(RECALL_TYPE.UNDO); break; // Z
        case (keyCode === 89): e.preventDefault(); this.executeHistory(RECALL_TYPE.REDO); break; // Y
        case (keyCode === 83): e.preventDefault(); this.onSave(); break; // S
        case (keyCode === 82): { // R
          e.preventDefault();
          const nTag = store.ontology.moveToTagByStep(currentClick.id, 1, true);
          this.moveFocusToTag(nTag);
          break;
        }
        case (keyCode === 81): { // Q
          e.preventDefault();
          if (currentClick.id == null) break;
          let nxtTag;
          if (altKey) {
            nxtTag = store.ontology.stepToTag(currentClick.id, -1);
          } else {
            nxtTag = store.ontology.moveToTagByStep(currentClick.id, -1);
          }
          this.moveFocusToTag(nxtTag);
          break;
        }
        case (keyCode === 69): { // E
          e.preventDefault();
          if (currentClick.id == null) break;
          let nextTag;
          if (altKey) {
            nextTag = store.ontology.stepToTag(currentClick.id, 1);
          } else {
            nextTag = store.ontology.moveToTagByStep(currentClick.id, 1);
          }
          this.moveFocusToTag(nextTag);
          break;
        }
        default: break;
      }
    } else if (currentClick?.id !== null && isReviewEditable(this.toolMode) && !isQATag(currentClick.type) && store.config.reviewMode === ReviewModeType.REVIEW) {
      switch (keyCode) {
        case 49: // 1
          e.preventDefault();
          e.stopPropagation();
          this.addReview(editorState, currentClick.id, {
            result: 'pass',
          });
          break;
        // 2
        case 50: {
          e.preventDefault();
          e.stopPropagation();
          let tagReviewInfo = store.review.getReview(currentClick.id);
          if (!tagReviewInfo || tagReviewInfo.result !== ReviewItemResult.REJECT) {
            tagReviewInfo = { result: 'reject', id: currentClick.id, type: [] };
          }
          const item = store.ontology.getItem(currentClick.type, currentClick.id);

          this.setState({ tagOpenReview: item, tagReviewInfo });
          this.editor.blur();
          break;
        }
        default: break;
      }
    }
  };

  // update text
  onContentChange = (editorState, data, type) => {
    const { currentBrush, editorState: preState, findPanelVisible, inputEnable } = this.state;

    if (
      (isAnnotationReadonly(this.toolMode) || store.config.reviewMode === ReviewModeType.REVIEW)
      || ((currentBrush || findPanelVisible || !inputEnable) && type === undefined)
      || this.props.read_only
    ) {
      return preState;
    }
    const { slice, prevSlice, tags, prevTags } = data;
    let { prevStart, prevEnd } = data;

    if (prevSlice.length === 1 && slice.length === 0) this.addHistory(ACTION.EDIT_SINGLE_DEL, data);
    else if (prevSlice.length === 0 && slice.length === 1) this.addHistory(ACTION.EDIT_SINGLE_ADD, data);
    else if (type === ACTION.EDIT_REPLACE) this.addHistory(ACTION.EDIT_REPLACE, data);
    else this.addHistory(ACTION.EDIT_DEFAULT, data);

    prevStart = strlen(store.ontology.text.slice(0, data.prevStart));
    prevEnd = strlen(store.ontology.text.slice(0, data.prevEnd));
    store.ontology.text = store.ontology.text.slice(0, data.prevStart) + data.slice + store.ontology.text.slice(data.prevEnd);
    // update labels and insertions
    const offset = slice.length - prevSlice.length;

    if (type === ACTION.EDIT_REPLACE && prevTags) {
      const { insertions = [], labels = [], connections = [] } = prevTags;
      [...insertions, ...labels, ...connections].forEach((t) => {
        store.ontology.deleteTag(t.type, t.id);
      });
    }
    store.ontology.tagMove(prevStart, prevEnd, offset);
    if (type === ACTION.EDIT_REPLACE && tags) {
      const { insertions = [], labels = [], connections = [] } = tags;
      [...insertions, ...labels, ...connections].forEach((t) => {
        store.ontology.addResultItem(t);
      });
    }

    // update rawDraftContentState, using new text and results
    this.raw = this.renderTextArea();

    // update editorState, using new rawDraftContentState
    editorState = EditorState.set(editorState, { currentContent: convertFromRaw(this.raw) });
    return editorState;
  };

  resetCurrentFocus = (attribute = 'currentClick', shouldUpdate) => new Promise((resolve) => {
    this.setState({
      [`${attribute}`]: { id: null, from: null, to: null },
    }, () => resolve('state updated'));
  }).then(() => {
    if (shouldUpdate) {
      return this.updateEditorAndRender();
    }
  });

  resetCurrentFrom = () => {
    this.setState({
      currentFrom: { type: null, id: null, offset: null },
    });
  };

  // to status for tag: connection mode and other mode
  onTagClick = (e, type, id) => {
    const { currentFrom, currentBrush, editorState, tagMap } = this.state;
    const offset = tagMap.getItem(id, type);
    this.editor.blur();
    if (!isConnection(currentBrush?.type)) return;

    // connecting mode only applys to label and insertion
    if (isLabel(type) || isInsertion(type)) {
      // if there is no starting point, setup the starting point
      if (!currentFrom.type) {
        this.setState({
          currentFrom: {
            type,
            id,
            offset,
          }
        });
      } else {
        const nextEditorState = this.addConnection(editorState, { fromId: currentFrom.id, fromType: currentFrom.type, toId: id, toType: type, type: TAG.CONNECTION, value: currentBrush.text, keys: currentBrush.keys });
        this.renderAndSave(nextEditorState, true, true);
      }
    }
  };

  onTagDoubleClick = (e) => {
    // only work in qa mode
    if (!store.reviewable && !store.isRework) {
      return;
    }
    const { id, type } = getTargetWrapperDataSet(e);
    const item = store.ontology.getItem(type, id);
    const tagReviewInfo = store.review.getReview(id);
    this.setState({ tagOpenReview: item, tagReviewInfo });
    this.editor.blur();
  };

  // mouseEvent includes: mouse enter, mouse leave, mouse click, mouse context menu
  TagMouseEvent = (e, type, id, focusType, active) => {
    const { currentClick: { id: currId } } = this.state;
    const tag = store.ontology.getItem(type, id);
    if (!tag) {
      return;
    }

    let attribute = '';
    if (focusType === FOCUS_TYPE.HOVER) {
      if (currId === tag.id && active) return;
      attribute = 'currentHover';
    } else if (focusType === FOCUS_TYPE.CLICK) {
      attribute = 'currentClick';
      this.editor.blur();
    }

    // active status: mouse enter | mouse click
    if (active) {
      if (focusType === FOCUS_TYPE.CLICK) {
        this.onTagClick(e, type, id);
      }
      // ranges.push({ offset: label.start, length: label.end - label.start, style: `${focusType}_STYLE_${color}` });
      this.setState({
        [`${attribute}`]: {
          id: tag.id,
          fromId: tag?.fromId,
          toId: tag?.toId,
          fromType: tag?.fromType,
          toType: tag?.toType,
          type: tag?.type,
        }
      }, () => {
        this.updateEditorAndRender();
      });
    } else { // unactive status: mouse leave | mouse context menu
      const tagType = type;
      this.resetCurrentFocus(attribute, true).then(() => {
        if (focusType === FOCUS_TYPE.CLICK) {
          this.onContextMenu(e, tag.id, tagType);
        }
      });
    }
  };

  onContextMenu = (e, id, type) => {
    let nextEditorState;
    switch (type) {
      case TAG.LABEL:
      case TAG.CONNECTION:
      case TAG.INSERTION:
        nextEditorState = this.deleteTag(type, id);
        break;
      case TAG.LABEL_QA:
      {
        const { editorState } = this.deleteQATag(id);
        nextEditorState = editorState;
        break;
      }
      default: return;
    }
    this.renderAndSave(nextEditorState);
  };

  render() {
    const {
      editorState,
      style,
      currentBrush,
      editorWidth,
      editorHeight,
      currentClick,
      currentHover,
      currentMouse,
      currentFrom,
      tagMap,
      tagOpenReview,
      tagReviewInfo,

      inputEnable,
    } = this.state;
    const { config } = store;
    return (
      <div className="app-wrapper">
        <div className="topbar-wrapper" onClick={() => { this.editorOnFocus = false; }}>
          <div className="topbar-left-wrapper">
            {isAppenCloud() && (
            <div className="logo">
              <AppenLogo />
            </div>
            )}
            <ReviewMode />
            <div className="divider" />
            <UndoRedo
              undoHandle={() => this.executeHistory(RECALL_TYPE.UNDO)}
              redoHandle={() => this.executeHistory(RECALL_TYPE.REDO)}
              undoList={this.undoList}
              redoList={this.redoList}
            />
            <div className="divider" />
            <Save onSave={this.onSave} />
          </div>
          <div className="topbar-right-wrapper">
            {/* <LabelScan onToggle={this.toggleLabelsDrawer} /> */}
          </div>
        </div>
        <TextToolContext.Provider value={{ moveFocusToTag: this.moveFocusToTag, deleteReviewItemById: this.deleteReviewItemById, deleteReviewItemsById: this.deleteReviewItemsById }}>
          <Sidebar
            showReview={isRework(this.toolMode) || isReviewEditable(this.toolMode)}
            onClick={() => { this.editorOnFocus = false; }}
            currentBrush={currentBrush}
            inputEnable={inputEnable}
            setCurrentBrush={this.setCurrentBrush}
            items={tagMap}
            contentReadyOnly={this.props.read_only}
          />
        </TextToolContext.Provider>
        <div className="right-wrapper">
          <div
            className="editor-wrapper"
            ref={(r) => { this.editorWrapper = r; }}
          >
            <div className="svg-wrapper">
              <svg ref={(r) => { this.svg = r; }} style={{ height: `${editorHeight}px`, width: `${editorWidth}px` }}>
                {Object.entries(tagMap.connections).map(([id, connect]) => (
                  <g key={id}>
                    <path
                      d={connect.path}
                      stroke={currentHover.id === id ? HOVER_COLOR : currentClick.id === id ? FOCUS_COLOR : DEFAULT_COLOR}
                      fill="#00000000"
                    />
                  </g>
                ))}
                {currentFrom.type ?
                  <path d={`M ${currentFrom.offset?.left} ${currentFrom.offset?.top} L ${currentMouse.left} ${currentMouse.top}`} stroke={FOCUS_COLOR} fill="#00000000" /> :
                  null}
              </svg>
            </div>
            <div className="tags-wrapper">
              <div
                className="tags-panel"
                style={{ height: `${editorHeight}px`, width: `${editorWidth}px` }}
                onDoubleClick={this.onTagDoubleClick}
              >
                {Object.entries(tagMap.labels).map(([id, label]) => (
                  <LabelTag
                    key={id}
                    reviewResult={store.review.getReview(id)?.result}
                    label={label}
                    isHover={
                      (currentHover.id === id) ||
                      currentHover.fromId === id ||
                      currentHover.toId === id
                    }
                    isClick={
                      (currentClick.id === id) ||
                      currentClick.fromId === id ||
                      currentClick.toId === id
                    }
                    labelMouseEvent={this.TagMouseEvent}
                  />
                ))}
                {Object.entries(tagMap.insertions).map(([id, insertion]) => (
                  <InsertionTag
                    key={id}
                    reviewResult={store.review.getReview(id)?.result}
                    insertion={insertion}
                    isHover={
                      (currentHover.id === id) ||
                      currentHover.fromId === id ||
                      currentHover.toId === id
                    }
                    isClick={
                      (currentClick.id === id) ||
                      currentClick.fromId === id ||
                      currentClick.toId === id
                    }
                    insertionMouseEvent={this.TagMouseEvent}
                  />
                ))}
                {Object.entries(tagMap.connections).map(([id, connection]) => (
                  <ConnectionTag
                    key={id}
                    reviewResult={store.review.getReview(id)?.result}
                    connection={connection}
                    isHover={currentHover.id === id}
                    isClick={currentClick.id === id}
                    connectionMouseEvent={this.TagMouseEvent}
                  />
                ))}
              </div>
            </div>
            <div
              onClick={() => {
                this.editor.focus();
                this.resetCurrentFocus('currentClick', true);
              }}
            >
              <Editor
                ref={(r) => { this.editor = r; }}
                editorState={editorState}
                customStyleMap={style}
                onChange={this.onChange}
                handlePastedText={this.handlePastedText}
                handleBeforeInput={this.handleBeforeInput}
                handleKeyCommand={this.handleKeyCommand}
                keyBindingFn={this.genKeyCommand}
              />
            </div>
          </div>
        </div>
        <ReviewForm
          toolMode={this.toolMode}
          tagReviewInfo={tagReviewInfo}
          tagOpenReview={tagOpenReview}
          issueTypes={this.props.issue_types}
          setFormVisible={this.setFormVisible}
          onConfirm={(review) => {
            this.addReview(editorState, tagOpenReview?.id, review);
            store.ontology.updateOntologiesStatusMap();
          }}
          onDelete={this.onDeleteReview}
        />
      </div>
    );
  };

  setCurrentBrush = (item, input = false) => {
    this.setState({ currentBrush: item, inputEnable: input });
  };

  setFormVisible = () => {
    this.setState({ tagOpenReview: null, tagReviewInfo: null });
  };

  genKeyCommand = (e) => {
    if (e.metaKey || e.altKey) return KEY_COMMAND.INVALID_KEY;
    switch (e.keyCode) {
      case 90:
        // prevent default undo
        e.preventDefault();
        if (e.ctrlKey) return KEY_COMMAND.HANDLE_UNDO;
        return getDefaultKeyBinding(e);
      case 89:
        // prevent default redo
        e.preventDefault();
        if (e.ctrlKey) return KEY_COMMAND.HANDLE_REDO;
        return getDefaultKeyBinding(e);
      case 13:
        e.preventDefault();
        return KEY_COMMAND.HANDLE_RETURN;
      default:
        return getDefaultKeyBinding(e);
    }
  };

  handleKeyCommand = (command) => {
    const { editorState } = this.state;
    switch (command) {
      case KEY_COMMAND.INVALID_KEY: return 'handled';
      case KEY_COMMAND.HANDLE_RETURN:
      {
        const start = editorState.getSelection().getStartOffset();
        const end = editorState.getSelection().getEndOffset();
        const nextEditorState = setSelection(this.onContentChange(editorState, {
          slice: '\n',
          prevSlice: store.ontology.text.slice(start, end),
          prevStart: start,
          prevEnd: end,
          start: start + 1,
          end: start + 1,
        }), start + 1, start + 1);
        this.renderAndSave(nextEditorState);
        return 'handled';
      }
      case KEY_COMMAND.HANDLE_UNDO: return 'handled';
      case KEY_COMMAND.HANDLE_REDO: return 'handled';
      default: return 'not-handled';
    }
  };

  // Get one anchor by slice head
  getAnchorElementByHead = (at) => {
    const { sliceMap } = this;
    const wrapper = this.editorWrapper.querySelector('.public-DraftStyleDefault-block');
    const id = `span-wrapper-0-${sliceMap.get(at)}`;
    const span = wrapper.querySelector(`[data-offset-key='${id}']`);
    return span;
  };

  // Get all anchors at one time
  getAnchorElementsByHeads = () => {
    const { sliceMap } = this;
    const wrapper = this.editorWrapper.querySelector('.public-DraftStyleDefault-block');
    const spanMap = new Map();
    sliceMap.forEach((value, key) => {
      const id = `span-wrapper-0-${sliceMap.get(key)}`;
      const span = wrapper.querySelector(`[data-offset-key='${id}']`);
      spanMap.set(key, span);
    });
    return spanMap;
  };

  onMouseDown = (e) => {
    if (e.which === 1) {
      this.mouseFlag = true;
    }
    const onMouseUp = () => {
      this.mouseFlag = false;
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mouseup', onMouseUp);
  };

  onCompositionEnd = () => {
    this.compositionFlag = COMPOSITION.PENDING;
  };

  onCompositionStart = () => {
    this.compositionFlag = COMPOSITION.ENABLED;
    this.compositionTop = this.editorWrapper.scrollTop;
  };

  handleBeforeInput = () => { this.inputFlag = true; return 'not-handled'; };

  handlePastedText = () => { this.pasteFlag = true; return 'not-handled'; };
}
