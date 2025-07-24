import { DataOriState } from "@/pages/project/data-center/components/DataList";
import { DataType } from "@/types/dataset";

export enum EditorMode {
  CODE = "code",
  GRAPH = "graph",
}

export type TemplateScope = "GLOBAL" | "PRIVATE";

export type ProjectDataDetail = {
  dataType: DataType;
  oriState: DataOriState;
};

export enum AssistOperation {
  DRAGGABLE = "draggable",
  BOUNDARY_CHECK = "boundary_check",
  ROTATABLE = "rotatable",
  AUTO_SNAP = "auto_snap",
  AUTO_SNAP_POINT = "auto_snap_point",
}

export enum CheckPreset {
  EMPTY_AREA_CHECK = "empty_area_check",
  FULLY_COVERED_CHECK = "fully_covered_check",
  ATTR_CHECK = "attr_check",
  INSTANCE_ITEM_COUNT_CHECK = "instance_item_count_check",
  FRAME_VALID_CHECK = "frame_valid_annotate_check",
  FRAME_COMMON_VALID_CHECK = "frame_common_valid_annotate_check",
}

export enum RankingType {
  SCORE = "score",
  MARK = "mark",
}

export enum FieldOperatorType {
  EQUAL = "equal_to",
  GREATER = "greater_than",
  GREATER_EQUAL = "greater_than_or_equal_to",
  LESS = "less_than",
  LESS_EQUAL = "less_than_or_equal_to",
}
