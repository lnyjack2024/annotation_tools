import dayjs from "dayjs";
import {
  ImportError,
  ImportResult,
  ProjectTemplate,
  ProjectTemplateBase,
  ProjectTemplateParsed,
  TemplateType,
} from "./types";
import { getTemplateTitleWithI18n } from "@/utils";

function getHashParams(hash: string) {
  const subHash = hash.substring(1); // 去掉前面的'#'字符
  const params: { [key: string]: string } = {};
  if (subHash.length === 0) {
    return params; // 如果没有hash，返回空对象
  }
  const queries = subHash.split("?")[1] || "";
  const vars = queries.split("&");
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    params[pair[0]] = decodeURIComponent(pair[1]); // 解码参数值
  }
  return params;
}

export default abstract class BaseTemplate<T, P> {
  abstract type: TemplateType;

  attributes?: T;

  ontology?: P;

  questionType: string[] = [];

  baseInfo: ProjectTemplateBase;

  constructor(template: ProjectTemplate) {
    const { attributes, ontology, questionType, ...baseInfo } = template;
    this.baseInfo = baseInfo;
    const actionType = getHashParams(location.hash)["action"];
    if (actionType === "CREATE") {
      let title = getTemplateTitleWithI18n(baseInfo);
      title += `[${dayjs().format("YYYY-MM-DD hh:mm:ss")}]`;
      this.baseInfo.title = title;
    }
    console.log("this.baseInfo.title", this.baseInfo.title);
    this.parseQuestionType(template);
  }

  abstract parseAttributes(template: ProjectTemplate): void;

  abstract parseOntology(template: ProjectTemplate): void;

  abstract formatAttributes(): string;

  abstract formatOntology(): string | undefined;

  update(template: ProjectTemplate) {
    const { attributes, ontology, questionType, ...baseInfo } = template;
    this.baseInfo = baseInfo;
    this.parseQuestionType(template);
    this.parseAttributes(template);
    this.parseOntology(template);
  }

  format(): ProjectTemplate {
    return {
      ...this.baseInfo,
      attributes: this.formatAttributes(),
      ontology: this.formatOntology(),
      questionType: this.formatQuestionType(),
    };
  }

  parsed(): ProjectTemplateParsed {
    return {
      ...this.baseInfo,
      parsedAttributes: this.attributes,
      ontology: this.ontology,
      questionType: this.questionType,
    };
  }

  import(info: any): ImportResult {
    if (!info || !info.type) {
      return {
        success: false,
        error: ImportError.INVALID,
      };
    }
    if (info.type !== this.type) {
      return {
        success: false,
        error: ImportError.TYPE_NOT_MATCH,
      };
    }

    // import question types
    if (Array.isArray(info.questionType)) {
      const typeSet = new Set<string>();
      info.questionType.forEach((t: unknown) => {
        if (typeof t !== "object") {
          typeSet.add(`${t}`.trim());
        }
      });
      this.questionType = Array.from(typeSet);
    }

    return {
      success: true,
    };
  }

  private parseQuestionType(template: ProjectTemplate) {
    const questionType: string[] = [];
    try {
      const parsed = JSON.parse(template.questionType);
      if (Array.isArray(parsed)) {
        parsed.forEach((i: string) => {
          const iStr = `${i}`.trim();
          if (iStr && !questionType.includes(iStr)) {
            questionType.push(iStr);
          }
        });
      }
    } catch (e) {
      // parse error
    }
    this.questionType = questionType;
  }

  private formatQuestionType() {
    const questionSet = new Set(
      this.questionType.map((i: string) => i.trim()).filter((i: string) => !!i)
    );
    return JSON.stringify(Array.from(questionSet));
  }
}
