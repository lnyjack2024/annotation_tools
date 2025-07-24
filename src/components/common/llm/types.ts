export enum ContentItemType {
  UNSTYLED = 'unstyled',
}

export type ContentItem = {
  type: ContentItemType;
  content: string;
  data?: any;
};
export type Content = ContentItem[];

export enum RankingType {
  SCORE = 'score',
  MARK = 'mark',
}

export interface Rank {
  scores?: Record<string, number>;
  marks?: string[];
}

export enum LLMModel {
  NONUSE = 'nonuse',
}
