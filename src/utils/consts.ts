import {
  FieldOperatorType,
  RankingType,
} from "@/pages/job/components/JobTemplateEditor/tool-config/types/template";

export const NOT_APPLICABLE = "N/A";

// question and answer
export const RankingTypeOptions = [
  {
    label: "TEMPLATE_SUBJECT_RANKING_TYPE_SCORE",
    value: RankingType.SCORE,
  },
  {
    label: "TEMPLATE_SUBJECT_RANKING_TYPE_MARK_ERROR",
    value: RankingType.MARK,
  },
];
// llm

export const LimitOperatorOptions = [
  {
    label: "=",
    value: FieldOperatorType.EQUAL,
  },
  {
    label: ">",
    value: FieldOperatorType.GREATER,
  },
  {
    label: "<",
    value: FieldOperatorType.LESS,
  },
];

export const LimitOperatorWithEqualOptions = [
  {
    label: "=",
    value: FieldOperatorType.EQUAL,
  },
  {
    label: "≥",
    value: FieldOperatorType.GREATER_EQUAL,
  },
  {
    label: "≤",
    value: FieldOperatorType.LESS_EQUAL,
  },
];

export const reviewFromColumnName = "{{{pre_annotation}}}";
export const questionColumnName = "{{{question}}}";
