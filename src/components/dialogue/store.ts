import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { Modal, message } from 'antd';
import { cloneDeep, findLastIndex } from 'lodash';
import { validate as validateForm } from '@appen-china/easy-form/es/utils';
import { FormConfig } from '@appen-china/easy-form/es/types';
import { Base64 } from 'js-base64';
import i18n from './locales';
import MDialogueItem from './models/DialogueItem';
import ValidationStore from './validationStore';
import { Chat, Payload, ReviewMode } from './types';
import { ChatItemType } from '../common/llm/chat/ChatItem';
import { InputType } from '../common/llm/input/InputWrapper';
import { contentToPlainText, isContentEmpty, parseContent } from '../common/llm/helper';
import { Content, LLMModel, Rank, RankingType } from '../common/llm/types';
import JobProxy from '../../libs/JobProxy';
import { ToolMode, isAnnotationReadonly, isPreview, isReviewEditable, isRework, isTemplatePreview } from '../../utils/tool-mode';

class Store {
  /**
   * job proxy
   */
  jobProxy?: JobProxy;

  /**
   * is tool initialized
   */
  initialized = false;

  /**
   * labeling or review mode
   */
  reviewMode = ReviewMode.LABELING;

  /**
   * instruction
   */
  instruction: Content = [];

  /**
   * dialogue
   */
  dialogue: MDialogueItem[] = [];

  /**
   * subject
   */
  subject?: string;

  /**
   * [config] global rank
   */
  attributes: { [key: string]: any; } | undefined;

  /**
   * [config] global rank config
   */
  attributesConfig = '';

  /**
   * [config] item attributes  config
   */
  itemAttributesConfig?: FormConfig;

  /**
   * current selected dialogue item
   */
  selectedDialogueItem?: MDialogueItem;

  /**
   * is editing
   */
  isEditing = false;

  /**
   * is adding
   */
  isAdding = false;

  /**
   * is ranking
   */
  isRanking = false;

  /**
   * is attributes editing
   */
  isItemAttributesEditing = false;

  /**
   * has error
   */
  _hasError = false;

  get hasError() {
    return this._hasError || this.hasRankError || this.hasItemAttrError;
  }

  set hasError(val: boolean) {
    this._hasError = val;
    if (!val) {
      this.hasRankError = val;
      this.hasItemAttrError = val;
    }
  }

  /**
   * item rank has error
   */
  hasRankError = false;

  /**
   * item attributes has error
   */
  hasItemAttrError = false;

  /**
   * [config] options for subject selection
   */
  subjectOptions: string[] = [];

  /**
   * [config] dialogue rank
   */
  ranking = false;

  /**
   * [config] ranking type (score / mark)
   */
  rankingType = RankingType.SCORE;

  /**
   * [config] options for ranking
   */
  rankingOptions: string[] = [];

  /**
   * [config] dialogue editable (only control original answers)
   */
  editable = false;

  /**
   * [config] can add new dialogue
   */
  addible = false;

  /**
   * [config] model used when add dialogue item
   */
  addModel = LLMModel.NONUSE;

  /**
   * validation
   */
  validation: ValidationStore | undefined;

  /**
 * validation config
 */
  validationConfig = { script: false };

  /**
   * submit check
   */
  submitCheck = false;

  /**
   * editor types
   */
  editorTypes = {
    Q: [InputType.DEFAULT],
    A: [InputType.DEFAULT],
  };

  /**
   * next dialogue item type
   */
  get nextDialogueItemType() {
    if (this.dialogue.length === 0) {
      return ChatItemType.Q;
    }
    const last = this.dialogue[this.dialogue.length - 1];
    return last.type === ChatItemType.A ? ChatItemType.Q : ChatItemType.A;
  }

  /**
   * can add dialogue item
   */
  get canAddDialogueItem() {
    if (this.readonly || !this.addible) {
      return false;
    }

    return true;
  }

  /**
   * current editor types
   */
  get currentEditorTypes() {
    const type = this.isAdding ? this.nextDialogueItemType : this.selectedDialogueItem?.type;
    return type === ChatItemType.A ? this.editorTypes.A : this.editorTypes.Q;
  }

  /**
   * is tool readonly (annotate not allowed)
   */
  get readonly() {
    return isAnnotationReadonly(this.jobProxy!.toolMode) || this.reviewMode === ReviewMode.REVIEW;
  }

  /**
   * is tool annotate allowed
   */
  get annotatable() {
    return !isAnnotationReadonly(this.jobProxy!.toolMode);
  }

  /**
   * is tool review enabled
   */
  get reviewable() {
    return isReviewEditable(this.jobProxy!.toolMode);
  }

  /**
   * is tool in labeling mode or template preview mode
   */
  get isLabeling() {
    return this.jobProxy!.toolMode === ToolMode.LABELING || this.isTemplatePreview;
  }

  /**
   * is tool in rework mode
   */
  get isRework() {
    return isRework(this.jobProxy!.toolMode);
  }

  /**
   * is tool in preview mode
   */
  get isPreview() {
    return isPreview(this.jobProxy!.toolMode);
  }

  /**
   * is tool in template preview mode
   */
  get isTemplatePreview() {
    return isTemplatePreview(this.jobProxy!.toolMode);
  }

  isOriginalDialogue(val: unknown, forceToolModeCheck = false) {
    if (forceToolModeCheck && this.isLabeling) {
      return true;
    }
    return typeof val === 'boolean' ? val : this.isLabeling;
  }

  constructor() {
    makeAutoObservable(this, {
      jobProxy: false,
    });
  }

  async init(payload: Payload) {
    this.initConfig(payload);
    this.initValidate();

    try {
      await this.loadResult();
    } catch (e) {
      // load error
    }

    runInAction(() => {
      this.initialized = true;
    });
  }

  initConfig(payload: Payload) {
    // subject
    if (typeof payload.subjects === 'string') {
      const subjectsSplits = payload.subjects.split(',').map((i) => i.trim()).filter((i) => !!i);
      if (subjectsSplits.length > 0) {
        this.subjectOptions = Array.from(new Set(subjectsSplits));
      }
    }
    // attributes_config
    if (typeof payload.attributes_config === 'string') {
      this.attributesConfig = payload.attributes_config;
    }

    // item_attributes_config
    if (typeof payload.item_attributes_config === 'string') {
      const configStr = Base64.decode(payload.item_attributes_config || '');
      if (configStr) {
        try {
          const parsedConfig = JSON.parse(configStr);
          this.itemAttributesConfig = parsedConfig;
        } catch (error) {
          // parse error
        }
      }
    }

    // ranking
    this.ranking = payload.ranking === true || payload.ranking === 'true';
    if (this.ranking) {
      if (Object.values(RankingType).includes(payload.ranking_type as RankingType)) {
        this.rankingType = payload.ranking_type as RankingType;
      }
      if (typeof payload.ranking_options === 'string') {
        const optionsSplits = payload.ranking_options.split(',').map((i) => i.trim()).filter((i) => !!i);
        if (optionsSplits.length > 0) {
          this.rankingOptions = [...optionsSplits];
        }
      }
    }

    // editable
    this.editable = payload.editable === true || payload.editable === 'true';

    // addible
    this.addible = payload.addible === true || payload.addible === 'true';
    if (this.addible) {
      if (Object.values(LLMModel).includes(payload.add_model as LLMModel)) {
        this.addModel = payload.add_model as LLMModel;
      }
    }
  }

  initValidate() {
    this.validation = new ValidationStore(this);
  }

  async loadResult() {
    const savedResult = await this.jobProxy!.loadSavedResult();
    const reviewFromResult = await this.jobProxy!.loadReviewFrom();

    const result = savedResult || reviewFromResult;
    if (!result) {
      return;
    }
    if (result.auditId) {
      this.jobProxy!.setAuditId(result.auditId);
    }

    const { desc, dialogue, chat, attributes, instruction } = result;
    if (typeof desc === 'string' && desc) {
      this.subject = desc;
    }

    if (attributes) {
      this.attributes = attributes;
    }
    this.instruction = parseContent(instruction);
    this.parseDialogue(dialogue, chat, !savedResult);
  }

  async saveResult(submit = false) {
    if (submit && this.annotatable) {
      this.validateResult();
    }

    return this.jobProxy!.saveResult({
      instruction: toJS(this.instruction),
      attributes: toJS(this.attributes),
      desc: this.subject,
      dialogue: this.dialogue.map((dialogueItem) => dialogueItem.toJSON()),
      modelInput: this.generateModelInput(),
      auditId: this.jobProxy!.auditId,
      templateConfig: this.jobProxy!.templateConfig,
    }, submit);
  }

  saveReviews(submit = false) {
    // TODO:
  }

  parseDialogue(dialogue: unknown, chat: unknown, isFromReviewFrom = false) {
    const list: MDialogueItem[] = [];
    if (Array.isArray(dialogue) && dialogue.length > 0) {
      let lastItemType = ChatItemType.A;
      dialogue.forEach((item) => {
        let { type } = item;
        if (Object.values(ChatItemType).indexOf(type) < 0) {
          type = lastItemType === ChatItemType.A ? ChatItemType.Q : ChatItemType.A;
        }
        const original = this.isOriginalDialogue(item.original, isFromReviewFrom);
        const value = parseContent(item.value);
        let originalValue;
        if (item.originalValue) {
          originalValue = parseContent(item.originalValue);
        } else if (original) {
          originalValue = value;
        }
        if (type === lastItemType) {
          // merge value to last item if same type with last item
          const lastItem = list[list.length - 1];
          if (lastItem) {
            lastItem.value.push(...value);
            if (originalValue) {
              if (lastItem.originalValue) {
                lastItem.originalValue.push(...originalValue);
              } else {
                lastItem.originalValue = originalValue;
              }
            }
          }
        } else {
          list.push(new MDialogueItem({
            id: item.id || uuidv4(),
            type,
            original,
            value,
            originalValue,
            rank: item.rank,
            model: item.model,
            attributes: item.attributes,
          }));
        }
        lastItemType = type;
      });
      const lastOriginalIndex = findLastIndex(list, (i) => i.original);
      let i = 0;
      while (i < lastOriginalIndex) {
        // fix original value
        list[i].original = true;
        if (!list[i].originalValue) {
          // miss original value
          list[i].originalValue = cloneDeep(list[i].value);
        }
        i += 1;
      }
    } else if (Array.isArray(chat) && chat.length > 0) {
      chat.forEach((item) => {
        const { input, output } = item;
        if (input !== undefined && output !== undefined) {
          const inputContent = parseContent(input);
          list.push(new MDialogueItem({
            id: uuidv4(),
            type: ChatItemType.Q,
            original: this.isLabeling,
            value: inputContent,
            ...this.isLabeling && {
              originalValue: inputContent,
            },
          }));

          const ouputContent = parseContent(output);
          list.push(new MDialogueItem({
            id: uuidv4(),
            type: ChatItemType.A,
            original: this.isLabeling,
            value: ouputContent,
            ...this.isLabeling && {
              originalValue: ouputContent,
            },
          }));
        }
      });
    }
    this.dialogue = list;
  }

  generateModelInput() {
    const chat: Chat = [];
    const start = this.dialogue.findIndex((i) => i.type === ChatItemType.Q);
    for (let i = start; i < this.dialogue.length; i += 2) {
      const q = this.dialogue[i];
      const a = this.dialogue[i + 1];
      if (q && a) {
        chat.push({
          input: contentToPlainText(q.value),
          output: contentToPlainText(a.value),
          rank: toJS(a.rank),
          attributes: toJS(a.attributes),
        });
      }
    }
    return {
      desc: this.subject,
      attributes: toJS(this.attributes),
      chat,
    };
  }

  validateResult = () => {
    // 1) check dialogue item value
    // 2) check dialogue item rank
    // 3) check dialogue item attributes
    // 4) check dialogue limit
    let newlyAddedRoundsCount = 0;
    this.dialogue.forEach((dialogueItem) => {
      if (!dialogueItem.original) {
        if (isContentEmpty(dialogueItem.value)) {
          this.selectedDialogueItem = dialogueItem;
          this.isEditing = true;
          this.hasError = true;
          throw new Error(i18n.translate('CHAT_ITEM_EMPTY_ERROR'));
        }
        if (dialogueItem.type === ChatItemType.A) {
          newlyAddedRoundsCount += 1;
        }
      }
      if (dialogueItem.type === ChatItemType.A) {
        if (this.ranking && this.rankingType === RankingType.SCORE
          && this.rankingOptions.some((o) => dialogueItem.rank?.scores?.[o] === undefined)) {
          this.selectedDialogueItem = dialogueItem;
          this.isRanking = true;
          this.hasRankError = true;
          throw new Error(i18n.translate('CHAT_ITEM_RANK_EMPTY_ERROR'));
        }
        if (this.itemAttributesConfig) {
          const { attributes } = dialogueItem;
          if (attributes) {
            const validateRes = validateForm(this.itemAttributesConfig, attributes);
            if (!validateRes) {
              this.selectedDialogueItem = dialogueItem;
              this.isItemAttributesEditing = true;
              this.hasItemAttrError = true;
              throw new Error(i18n.translate('CHAT_ITEM_ATTR_EMPTY_ERROR'));
            }
          }
        }
      }
    });
  };

  setSubject = (subject: string) => {
    this.subject = subject;
  };

  setAttributesConfig = (attributes: any) => {
    this.attributes = attributes;
  };

  validate = () => {
    if (this.isAdding) {
      this.catchSaveError();
      throw new Error('should finish adding');
    }
    if (this.selectedDialogueItem?.type === ChatItemType.A) {
      if (this.isRanking && this.rankingType === RankingType.SCORE
        && this.rankingOptions.some((o) => this.selectedDialogueItem?.rank?.scores?.[o] === undefined)) {
        this.catchRankError();
        throw new Error('should finish ranking');
      }
      if (this.isItemAttributesEditing && this.itemAttributesConfig) {
        const { attributes } = this.selectedDialogueItem;
        if (attributes) {
          const validateRes = validateForm(this.itemAttributesConfig, attributes);
          if (!validateRes) {
            this.catchItemAttributesError();
            throw new Error('should finish the item attributes form');
          }
        }
      }
    }
  };

  validateItem = () => {
    try {
      this.validate();
      this.hasError = false;
      this.isRanking = false;
      this.isItemAttributesEditing = false;
    } catch (e) {
      // validate failed
    }
  };

  selectDialogueItem = (dialogueItem: MDialogueItem) => {
    if (this.selectedDialogueItem?.id === dialogueItem.id) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      this.selectedDialogueItem = dialogueItem;
      this.isEditing = false;
      this.isRanking = false;
      this.isItemAttributesEditing = false;
    } catch (e) {
      // validate failed
    }
  };

  addDialogueItem = () => {
    if (this.readonly || !this.canAddDialogueItem) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      this.selectedDialogueItem = undefined;
      this.isEditing = false;
      this.isRanking = false;
      this.isItemAttributesEditing = false;
      this.isAdding = true;
    } catch (e) {
      // validate failed
    }
  };

  getDialogueItemContent = () => {
    const currentDialogue = [...this.dialogue];
    const lastQuestionItem = currentDialogue.reverse().find((item) => item.type === ChatItemType.Q);
    if (lastQuestionItem) {
      const content = contentToPlainText(lastQuestionItem.value);
      return [
        {
          role: 'user',
          content,
        }
      ];
    }
    return null;
  };

  editDialogueItem = (dialogueItem: MDialogueItem) => {
    if (this.readonly || (dialogueItem.original && !this.editable)) {
      return;
    }
    if (this.selectedDialogueItem?.id === dialogueItem.id) {
      this.isEditing = true;
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      this.selectedDialogueItem = dialogueItem;
      this.isRanking = false;
      this.isItemAttributesEditing = false;
      this.isEditing = true;
    } catch (e) {
      // validate failed
    }
  };

  saveDialogueItem = (value: Content) => {
    if (this.readonly) {
      return;
    }
    if (this.isAdding) {
      // add new dialogue item
      const newItem = new MDialogueItem({
        id: uuidv4(),
        type: this.nextDialogueItemType,
        original: false,
        value,
      });
      this.dialogue.push(newItem);
      this.selectedDialogueItem = newItem;
      if (!this.readonly && this.ranking && newItem.type === ChatItemType.A) {
        this.isRanking = true;
      }
    } else if (this.isEditing && this.selectedDialogueItem) {
      // update dialogue item
      this.selectedDialogueItem.value = value;
    }
    this.cancelSaveDialogueItem();
  };

  updateDialogueItem = (dialogueItem: MDialogueItem, value: Content) => {
    if (this.readonly || this.isAdding || this.isEditing) {
      return;
    }
    dialogueItem.value = value;
  };

  cancelSaveDialogueItem = () => {
    this.isEditing = false;
    this.isAdding = false;
  };

  catchSaveError = (msg?: string) => {
    this.hasError = true;
    message.error(msg || i18n.translate('CHAT_ITEM_EMPTY_ERROR'));
  };

  rankDialogueItem = (dialogueItem: MDialogueItem) => {
    if (this.readonly || !this.ranking || dialogueItem.type === ChatItemType.Q) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      if (this.selectedDialogueItem?.id !== dialogueItem.id) {
        this.isItemAttributesEditing = false;
      }
      this.selectedDialogueItem = dialogueItem;
      this.isEditing = false;
      this.isRanking = true;
    } catch (e) {
      // validate failed
    }
  };

  saveRank = (dialogueItem: MDialogueItem, rank: Rank) => {
    if (this.readonly) {
      return;
    }
    if (this.selectedDialogueItem?.id !== dialogueItem.id) {
      try {
        this.validate();
        this.hasError = false;
        this.isItemAttributesEditing = false;
      } catch (e) {
        // validate failed
        return;
      }
    }
    this.isRanking = true;
    this.selectedDialogueItem = dialogueItem;
    this.selectedDialogueItem.rank = rank;
  };

  onItemAttributesEdit = (dialogueItem: MDialogueItem) => {
    if (this.readonly || !this.itemAttributesConfig || dialogueItem.type === ChatItemType.Q) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
    } catch (e) {
      // validate failed
      return;
    }
    if (this.selectedDialogueItem?.id !== dialogueItem.id) {
      this.isRanking = false;
    }
    this.selectedDialogueItem = dialogueItem;
    this.isEditing = false;
    this.isItemAttributesEditing = true;
  };

  setItemAttributes = (dialogueItem: MDialogueItem, attributes: any) => {
    if (this.readonly) {
      return;
    }
    if (this.selectedDialogueItem?.id !== dialogueItem.id) {
      try {
        this.validate();
        this.hasError = false;
      } catch (e) {
        // validate failed
        return;
      }
    }
    this.selectedDialogueItem = dialogueItem;
    this.selectedDialogueItem.attributes = attributes;
  };

  deleteItemAttributes = (dialogueItem: MDialogueItem) => {
    Modal.confirm({
      title: i18n.translate('CHAT_ITEM_DEL_TITLE'),
      okText: i18n.translate('CHAT_ITEM_DEL_OK'),
      cancelText: i18n.translate('CHAT_ITEM_DEL_CANCEL'),
      onOk: () => {
        this.setItemAttributes(dialogueItem, undefined);
        this.isItemAttributesEditing = false;
      }
    });
  };

  saveItemAttributes = (dialogueItem: MDialogueItem, attributes: any) => {
    this.setItemAttributes(dialogueItem, attributes);
    this.isItemAttributesEditing = true;
  };

  catchRankError = (msg?: string) => {
    this.hasRankError = true;
    message.error(msg || i18n.translate('CHAT_ITEM_RANK_EMPTY_ERROR'));
  };

  catchItemAttributesError = (msg?: string) => {
    this.hasItemAttrError = true;
    message.error(msg || i18n.translate('CHAT_ITEM_ATTR_EMPTY_ERROR'));
  };
}

export default new Store();
