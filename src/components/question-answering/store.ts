import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { Modal, message } from 'antd';
import { validate as validateForm } from '@appen-china/easy-form/es/utils';
import { FormConfig } from '@appen-china/easy-form/es/types';
import { Base64 } from 'js-base64';
import i18n from './locales';
import MAnswer from './models/Answer';
import ValidationStore from './validationStore';
import { Payload, ReviewMode } from './types';
import { Content, ContentItemType, LLMModel, Rank, RankingType } from '../common/llm/types';
import { contentToPlainText, isContentEmpty, parseContent } from '../common/llm/helper';
import { InputType } from '../common/llm/input/InputWrapper';
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
   * question
   */
  question: Content = [];

  /**
   * answers
   */
  answers: MAnswer[] = [];

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
   * current selected answer
   */
  selectedAnswer?: MAnswer;

  /**
   * is editing answer
   */
  isEditingAnswer = false;

  /**
   * is adding answer
   */
  isAddingAnswer = false;

  /**
   * is adding answer by real-time api
   */
  isAddingAnswerByAPI = false;

  /**
   * is ranking answer
   */
  isRankingAnswer = false;

  /**
   * is dragging answer
   */
  isDraggingAnswer = false;

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
   * [config] answers rank
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
   * [config] answers sortable
   */
  sortable = false;

  /**
   * [config] answers editable (only control original answers)
   */
  editable = false;

  /**
   * [config] can add new answers
   */
  addible = false;

  /**
   * [config] model used when add answer
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
  editorTypes = [InputType.DEFAULT];

  /**
   * can add answer
   */
  get canAddAnswer() {
    if (this.readonly || !this.addible) {
      return false;
    }

    return true;
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

  isOriginalAnswer(val: unknown, forceToolModeCheck = false) {
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
      if (this.question.length === 0 && payload.question) {
        // no question loaded, try get question from payload
        this.question = [{
          type: ContentItemType.UNSTYLED,
          content: payload.question,
        }];
      }
      this.initialized = true;
    });
  }

  initValidate() {
    this.validation = new ValidationStore(this);
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

    // sortable
    this.sortable = payload.sortable === true || payload.sortable === 'true';

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

    // parse result
    const { desc, input, output, attributes, instruction } = result;
    if (typeof desc === 'string' && desc) {
      this.subject = desc;
    }

    if (attributes) {
      this.attributes = attributes;
    }
    this.instruction = parseContent(instruction);
    this.question = parseContent(input);
    if (Array.isArray(output) && output.length > 0) {
      const answers: MAnswer[] = [];
      output.forEach((o) => {
        if (typeof o === 'string') {
          answers.push(new MAnswer({
            id: uuidv4(),
            original: this.isLabeling,
            value: [{
              type: ContentItemType.UNSTYLED,
              content: o,
            }],
            ...this.isLabeling && {
              originalValue: [{
                type: ContentItemType.UNSTYLED,
                content: o,
              }],
            },
          }));
        } else if (typeof o === 'object') {
          const original = this.isOriginalAnswer(o.original, !savedResult);
          const value = parseContent(o.value);
          let originalValue;
          if (o.originalValue) {
            originalValue = parseContent(o.originalValue);
          } else if (original) {
            originalValue = value;
          }
          answers.push(new MAnswer({
            id: o.id || uuidv4(),
            original,
            value,
            originalValue,
            rank: o.rank,
            attributes: o.attributes,
            model: o.model,
            sourceModelId: o.sourceModelId,
          }));
        }
      });
      this.answers = answers;
    }
  }

  async saveResult(submit = false) {
    if (submit && this.annotatable) {
      this.validateResult();
    }
    return this.jobProxy!.saveResult({
      instruction: toJS(this.instruction),
      attributes: toJS(this.attributes),
      desc: this.subject,
      input: toJS(this.question),
      output: this.answers.map((answer) => answer.toJSON()),
      modelInput: this.generateModelInput(),
      auditId: this.jobProxy!.auditId,
      templateConfig: this.jobProxy!.templateConfig,
    }, submit);
  }

  saveReviews(submit = false) {
    // TODO:
  }

  generateModelInput() {
    return {
      desc: this.subject,
      input: contentToPlainText(this.question),
      output: this.answers.map((answer) => ({
        value: contentToPlainText(answer.value),
        rank: toJS(answer.rank),
        attributes: toJS(answer.attributes),
        sourceModelId: answer.sourceModelId,
      })),
    };
  }

  validateResult = () => {
    // 1) check answer value
    // 2) check answer rank
    // 3) check answer item attributes
    // 4) check answer limit
    let newlyAddedAnswersCount = 0;
    this.answers.forEach((answer) => {
      if (!answer.original) {
        newlyAddedAnswersCount += 1;
        if (isContentEmpty(answer.value)) {
          this.selectedAnswer = answer;
          this.isEditingAnswer = true;
          this.hasError = true;
          throw new Error(i18n.translate('CHAT_ITEM_EMPTY_ERROR'));
        }
      }
      if (this.ranking && this.rankingType === RankingType.SCORE
        && this.rankingOptions.some((o) => answer.rank?.scores?.[o] === undefined)) {
        this.selectedAnswer = answer;
        this.isRankingAnswer = true;
        this.hasError = true;
        throw new Error(i18n.translate('CHAT_ITEM_RANK_EMPTY_ERROR'));
      }
      if (this.itemAttributesConfig) {
        const { attributes } = answer;
        if (attributes) {
          const validateRes = validateForm(this.itemAttributesConfig, attributes);
          if (!validateRes) {
            this.selectedAnswer = answer;
            this.isItemAttributesEditing = true;
            this.hasItemAttrError = true;
            throw new Error(i18n.translate('CHAT_ITEM_ATTR_EMPTY_ERROR'));
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
    if (this.isAddingAnswer || this.isAddingAnswerByAPI) {
      this.catchSaveError();
      throw new Error('should finish adding');
    }
    if (this.selectedAnswer) {
      if (this.isRankingAnswer && this.rankingType === RankingType.SCORE
        && this.rankingOptions.some((o) => this.selectedAnswer?.rank?.scores?.[o] === undefined)) {
        this.catchRankError();
        throw new Error('should finish ranking');
      }
      if (this.isItemAttributesEditing && this.itemAttributesConfig) {
        const { attributes } = this.selectedAnswer;
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
      this.isRankingAnswer = false;
      this.isItemAttributesEditing = false;
    } catch (e) {
      // validate failed
    }
  };

  selectAnswer = (answer: MAnswer) => {
    if (this.selectedAnswer?.id === answer.id) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      this.selectedAnswer = answer;
      this.isEditingAnswer = false;
      this.isRankingAnswer = false;
      this.isItemAttributesEditing = false;
    } catch (e) {
      // validate failed
    }
  };

  getQuestionItemContent = () => {
    if (this.question) {
      const content = contentToPlainText(this.question);
      return [
        {
          role: 'user',
          content,
        }
      ];
    }
    return null;
  };

  // addAnswerByAPI = () => {
  //   if (this.readonly || !this.canAddAnswer) {
  //     return;
  //   }
  //   try {
  //     this.validate();
  //     this.hasError = false;
  //     this.selectedAnswer = undefined;
  //     this.isEditingAnswer = false;
  //     this.isRankingAnswer = false;
  //     this.isItemAttributesEditing = false;
  //     this.isAddingAnswerByAPI = true;
  //   } catch (e) {
  //     // validate failed
  //   }
  //   const messages = this.getQuestionItemContent();
  //   if (!messages) {
  //     message.error(i18n.translate('CHAT_ITEM_GENERATE_NO_QUESTION'));
  //     return;
  //   }
  //   const data = {
  //     messages,
  //     stream: false,
  //     temperature: 0.5,
  //     presence_penalty: 0,
  //     frequency_penalty: 0,
  //   };
  //   const apiForwardType = {
  //     [LLMModel.CHAT_GPT]: APIForwardType.CHAT_GPT,
  //     [LLMModel.CHAT_GPT_4]: APIForwardType.CHAT_GPT_4,
  //   };
  //   this.jobProxy?.forwardAPI(apiForwardType[(this.addModel as LLMModel.CHAT_GPT | LLMModel.CHAT_GPT_4)], data).then((res) => {
  //     if (!res || res.error) {
  //       message.error(res?.msg || i18n.translate('CHAT_ITEM_GENERATE_FAIL'));
  //       this.cancelSaveAnswerByAPI();
  //       return;
  //     }
  //     if (res && Array.isArray(res) && res.length > 0) {
  //       this.generateAnswerItem(res[0].message.content);
  //     }
  //   });
  // };

  generateAnswerItem = (value: string) => {
    if (this.readonly) {
      return;
    }
    this.hasError = false;

    if (this.isAddingAnswerByAPI) {
      // add new answer
      const newAnswer = new MAnswer({
        id: uuidv4(),
        original: false,
        value: [{
          type: ContentItemType.UNSTYLED,
          content: value,
        }],
        originalValue: [{
          type: ContentItemType.UNSTYLED,
          content: value,
        }],
        model: this.addModel,
      });
      this.answers.push(newAnswer);
      this.selectedAnswer = newAnswer;
      if (!this.readonly && this.ranking) {
        this.isRankingAnswer = true;
      }
    }
    this.cancelSaveAnswerByAPI();
  };

  cancelSaveAnswerByAPI = () => {
    this.isAddingAnswerByAPI = false;
  };

  addAnswer = () => {
    if (this.readonly || !this.canAddAnswer) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      this.selectedAnswer = undefined;
      this.isEditingAnswer = false;
      this.isRankingAnswer = false;
      this.isItemAttributesEditing = false;
      this.isAddingAnswer = true;
    } catch (e) {
      // validate failed
    }
  };

  editAnswer = (answer: MAnswer) => {
    if (this.readonly || (answer.original && !this.editable)) {
      return;
    }
    if (this.selectedAnswer?.id === answer.id) {
      this.isEditingAnswer = true;
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      this.selectedAnswer = answer;
      this.isRankingAnswer = false;
      this.isItemAttributesEditing = false;
      this.isEditingAnswer = true;
    } catch (e) {
      // validate failed
    }
  };

  saveAnswer = (value: Content) => {
    if (this.readonly) {
      return;
    }
    if (this.isAddingAnswer) {
      // add new answer
      const newAnswer = new MAnswer({
        id: uuidv4(),
        original: false,
        value,
      });
      this.answers.push(newAnswer);
      this.selectedAnswer = newAnswer;
      if (!this.readonly && this.ranking) {
        this.isRankingAnswer = true;
      }
    } else if (this.isEditingAnswer && this.selectedAnswer) {
      // update answer
      this.selectedAnswer.value = value;
    }
    this.cancelSaveAnswer();
  };

  updateAnswer = (answer: MAnswer, value: Content) => {
    if (this.readonly || this.isAddingAnswer || this.isEditingAnswer) {
      return;
    }
    answer.value = value;
  };

  cancelSaveAnswer = () => {
    this.isEditingAnswer = false;
    this.isAddingAnswer = false;
  };

  catchSaveError = (msg?: string) => {
    this.hasError = true;
    message.error(msg || i18n.translate('CHAT_ITEM_EMPTY_ERROR'));
  };

  rankAnswer = (answer: MAnswer) => {
    if (this.readonly || !this.ranking) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
      if (this.selectedAnswer?.id !== answer.id) {
        this.isItemAttributesEditing = false;
      }
      this.selectedAnswer = answer;
      this.isEditingAnswer = false;
      this.isRankingAnswer = true;
    } catch (e) {
      // validate failed
    }
  };

  saveRank = (answer: MAnswer, rank: Rank) => {
    if (this.readonly) {
      return;
    }
    if (this.selectedAnswer?.id !== answer.id) {
      try {
        this.validate();
        this.hasError = false;
        this.isItemAttributesEditing = false;
      } catch (e) {
        // validate failed
        return;
      }
    }
    this.isRankingAnswer = true;
    this.selectedAnswer = answer;
    this.selectedAnswer.rank = rank;
  };

  catchRankError = (msg?: string) => {
    this.hasRankError = true;
    message.error(msg || i18n.translate('CHAT_ITEM_RANK_EMPTY_ERROR'));
  };

  onItemAttributesEdit = (answer: MAnswer) => {
    if (this.readonly || !this.itemAttributesConfig) {
      return;
    }
    try {
      this.validate();
      this.hasError = false;
    } catch (e) {
      // validate failed
      return;
    }
    if (this.selectedAnswer?.id !== answer.id) {
      this.isRankingAnswer = false;
    }
    this.selectedAnswer = answer;
    this.isEditingAnswer = false;
    this.isItemAttributesEditing = true;
  };

  setItemAttributes = (answer: MAnswer, attributes: any) => {
    if (this.readonly) {
      return;
    }
    if (this.selectedAnswer?.id !== answer.id) {
      try {
        this.validate();
        this.hasError = false;
      } catch (e) {
        // validate failed
        return;
      }
    }
    this.selectedAnswer = answer;
    this.selectedAnswer.attributes = attributes;
  };

  deleteItemAttributes = (answer: MAnswer) => {
    Modal.confirm({
      title: i18n.translate('CHAT_ITEM_DEL_TITLE'),
      okText: i18n.translate('CHAT_ITEM_DEL_OK'),
      cancelText: i18n.translate('CHAT_ITEM_DEL_CANCEL'),
      onOk: () => {
        this.setItemAttributes(answer, undefined);
        this.isItemAttributesEditing = false;
      }
    });
  };

  saveItemAttributes = (answer: MAnswer, attributes: any) => {
    this.setItemAttributes(answer, attributes);
    this.isItemAttributesEditing = true;
  };

  catchItemAttributesError = (msg?: string) => {
    this.hasItemAttrError = true;
    message.error(msg || i18n.translate('CHAT_ITEM_ATTR_EMPTY_ERROR'));
  };

  updateAnswerOrder = (source: string, destination?: number) => {
    if (destination === undefined) {
      return;
    }

    const currIndex = this.answers.findIndex((i) => i.id === source);
    if (currIndex < 0 || currIndex === destination) {
      return;
    }

    const currAnswer = this.answers[currIndex];
    this.answers.splice(currIndex, 1);
    this.answers.splice(destination, 0, currAnswer);

    this.isDraggingAnswer = false;
  };
}

export default new Store();
