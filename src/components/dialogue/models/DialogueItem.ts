import { makeObservable, observable, toJS } from 'mobx';
import { cloneDeep } from 'lodash';
import { DialogueItem as IDialogueItem } from '../types';
import { Content, LLMModel, Rank } from '../../common/llm/types';
import { ChatItemType } from '../../common/llm/chat/ChatItem';

export default class DialogueItem {
  id: string;

  type: ChatItemType;

  original: boolean;

  value: Content;

  originalValue?: Content;

  rank?: Rank;

  model?: LLMModel;

  attributes?: any;

  constructor({ id, type, original, originalValue, value, rank, model, attributes }: IDialogueItem) {
    makeObservable(this, {
      value: observable.ref,
      rank: observable,
      attributes: observable,
    });

    this.id = id;
    this.type = type;
    this.original = original;
    this.value = cloneDeep(value);
    this.originalValue = cloneDeep(originalValue);
    this.rank = cloneDeep(rank);
    this.model = model;
    this.attributes = cloneDeep(attributes);
  }

  toJSON() {
    return {
      id: this.id,
      original: this.original,
      value: cloneDeep(toJS(this.value)),
      originalValue: cloneDeep(toJS(this.originalValue)),
      rank: cloneDeep(toJS(this.rank)),
      attributes: cloneDeep(toJS(this.attributes)),
      model: this.model,
    };
  }
}
