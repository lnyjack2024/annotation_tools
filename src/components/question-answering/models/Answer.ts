import { makeObservable, observable, toJS } from 'mobx';
import { cloneDeep } from 'lodash';
import { Answer as IAnswer } from '../types';
import { Content, LLMModel, Rank } from '../../common/llm/types';

export default class Answer {
  id: string;

  original: boolean;

  value: Content;

  originalValue?: Content;

  rank?: Rank;

  attributes?: any;

  model?: LLMModel;

  sourceModelId?: string;

  constructor({ id, original, value, originalValue, rank, attributes, model, sourceModelId }: IAnswer) {
    makeObservable(this, {
      value: observable.ref,
      rank: observable,
      attributes: observable,
    });

    this.id = id;
    this.original = original;
    this.value = cloneDeep(value);
    this.originalValue = cloneDeep(originalValue);
    this.rank = cloneDeep(rank);
    this.attributes = cloneDeep(attributes);
    this.model = model;
    this.sourceModelId = sourceModelId;
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
      sourceModelId: this.sourceModelId,
    };
  }
}
