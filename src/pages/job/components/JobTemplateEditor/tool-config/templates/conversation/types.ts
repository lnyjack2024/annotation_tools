export interface ConversationTemplateAttributes {
  editable?: boolean;
  addible?: boolean;
  add_model_flag?: boolean;
  add_model?: LLMModel;
  add_limit_flag?: boolean;
  add_limit?: number;
  add_limit_operator?: Operator;
  attributes_config?: string;
  ranking?: boolean;
  ranking_type?: RankingType;
  ranking_options?: string[];
  item_attributes_config?: string;
  subjects?: string;
}
export enum LLMModel {
  NONUSE = "nonuse",
}
export enum Operator {
  EQUAL = "equal_to",
  GREATER = "greater_than",
  LESS = "less_than",
}

export enum RankingType {
  SCORE = "score",
  MARK = "mark",
}
