import BaseTemplate from "../Base";
import { ProjectTemplate, TemplateType } from "../types";
import { TabKey } from "../tabs";
import { parseBoolean, parseOption } from "../parser";
import {
  LLMModel,
  QuestionAnswerTemplateAttributes,
  RankingType,
} from "./types";
import { questionColumnName, reviewFromColumnName } from "@/utils/consts";

const defaultAttributes = {
  sortable: false,
  editable: false,
  addible: false,
  ranking: false,
};

export default class QuestionAnswerTemplate extends BaseTemplate<
  QuestionAnswerTemplateAttributes,
  unknown
> {
  static tabKeys = [
    TabKey.BASIC_INFO,
    TabKey.LABEL_SUBJECT,
    // TabKey.LABEL_CHECK,
    TabKey.QA,
  ];

  type = TemplateType.LLM_QUESTION_ANSWER;

  constructor(template: ProjectTemplate) {
    super(template);
    this.parseAttributes(template);
    // this.parseOntology(template);
  }

  parseAttributes(template: ProjectTemplate) {
    const { attributes } = template;

    let p;
    try {
      p = JSON.parse(attributes);
    } catch (error) {
      // parse error
    }

    this.setAttributes(p);
  }

  parseOntology() {
    // no ontology
  }

  formatAttributes() {
    const attributes: any = {
      ...this.attributes,
    };

    if (!attributes.addible) {
      delete attributes.add_model;
      delete attributes.add_limit;
      delete attributes.add_limit_operator;
    } else {
      if (!attributes.add_model_flag) {
        delete attributes.add_model;
      }
      if (!attributes.add_limit_flag) {
        delete attributes.add_limit;
        delete attributes.add_limit_operator;
      }
    }
    delete attributes.add_model_flag;
    delete attributes.add_limit_flag;

    if (!attributes.ranking) {
      delete attributes.ranking_type;
      delete attributes.ranking_options;
    }

    if (attributes.ranking_options) {
      attributes.ranking_options = attributes.ranking_options.join(",");
    }

    attributes.review_from = reviewFromColumnName;
    attributes.question = questionColumnName;
    Object.keys(attributes).forEach((key) => {
      const currentValue = attributes[key];
      if (
        typeof currentValue === "number" ||
        typeof currentValue === "boolean"
      ) {
        attributes[key] = currentValue?.toString();
      }
    });

    return JSON.stringify(attributes);
  }

  formatOntology(): undefined {
    return undefined;
  }

  import(info: any) {
    const importResult = super.import(info);
    if (importResult.success) {
      this.setAttributes(info.attributes);
    }
    return importResult;
  }

  private setAttributes(attr: any) {
    if (!attr) {
      this.attributes = {
        ...defaultAttributes,
      } as QuestionAnswerTemplateAttributes;
    } else {
      this.attributes = {};

      this.attributes.sortable = parseBoolean(
        attr.sortable,
        defaultAttributes.sortable
      );
      this.attributes.editable = parseBoolean(
        attr.editable,
        defaultAttributes.editable
      );
      this.attributes.addible = parseBoolean(
        attr.addible,
        defaultAttributes.addible
      );
      if (this.attributes.addible) {
        this.attributes.add_model = parseOption(
          attr.add_model,
          LLMModel.NONUSE,
          Object.values(LLMModel)
        ) as LLMModel;

        if (this.attributes.add_model !== LLMModel.NONUSE) {
          this.attributes.add_model_flag = true;
        } else {
          this.attributes.add_model_flag = false;
          this.attributes.add_model = undefined;
        }

        // this.attributes.add_limit = parseNumber(
        //   attr.add_limit,
        //   -1,
        //   { min: 0 },
        // );
        // this.attributes.add_limit_operator = parseOption(
        //   attr.add_limit_operator,
        //   undefined,
        //   Object.values(Operator),
        // ) as Operator | undefined;
        // if (
        //   this.attributes.add_limit >= 0 &&
        //   this.attributes.add_limit_operator
        // ) {
        //   this.attributes.add_limit_flag = true;
        // } else {
        //   this.attributes.add_limit_flag = false;
        //   this.attributes.add_limit = undefined;
        //   this.attributes.add_limit_operator = undefined;
        // }
      }
      this.attributes.attributes_config = attr.attributes_config;
      this.attributes.ranking = parseBoolean(
        attr.ranking,
        defaultAttributes.ranking
      );
      if (this.attributes.ranking) {
        this.attributes.ranking_type = parseOption(
          attr.ranking_type,
          RankingType.SCORE,
          Object.values(RankingType)
        ) as RankingType;
        this.attributes.ranking_options = parseOption(
          attr.ranking_options,
          []
        ) as string[];
      }
      this.attributes.item_attributes_config = attr.item_attributes_config;
      this.attributes.subjects = attr.subjects;
    }
  }
}
