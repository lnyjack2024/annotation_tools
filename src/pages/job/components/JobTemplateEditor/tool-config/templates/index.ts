import { ProjectTemplate, TemplateType } from "./types";
import { TabItemsConfig, TabKey, tabsConfig } from "./tabs";
import ConversationTemplate from "./conversation";
import QuestionAnswerTemplate from "./question-answer";
import { ConversationTemplateAttributes } from "./conversation/types";
import { QuestionAnswerTemplateAttributes } from "./question-answer/types";

export type TemplateAttributes =
  | ConversationTemplateAttributes
  | QuestionAnswerTemplateAttributes;
export type TemplateOntology = unknown;

export function createTemplate(template: ProjectTemplate) {
  const { type } = template;
  switch (type) {
    case TemplateType.LLM_CONVERSATION:
      return new ConversationTemplate(template);
    case TemplateType.LLM_QUESTION_ANSWER:
      return new QuestionAnswerTemplate(template);
    default:
  }
  return undefined;
}

export function getTabsConfig(type?: TemplateType): TabItemsConfig {
  let tabKeys: TabKey[] = [];
  switch (type) {
    case TemplateType.LLM_CONVERSATION:
      tabKeys = ConversationTemplate.tabKeys;
      break;
    case TemplateType.LLM_QUESTION_ANSWER:
      tabKeys = QuestionAnswerTemplate.tabKeys;
      break;
    default:
  }
  return tabKeys.reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: tabsConfig[curr],
    }),
    {}
  );
}
