import { forwardRef, useImperativeHandle, useRef } from "react";
import { useIntl } from "umi";
import {
  TabItemConfig,
  TabKey,
} from "../JobTemplateEditor/tool-config/templates/tabs";
import BasicInfo, {
  BasicInfoHandle,
} from "../JobTemplateEditor/tool-config/pages/BasicInfo";
import QA, { QAHandle } from "../JobTemplateEditor/tool-config/pages/QA";
import { TemplateType } from "@/types/template";
import LabelCheckLLM, {
  LabelCheckLLMHandle,
} from "../JobTemplateEditor/tool-config/pages/LabelCheck/LabelCheckLLM";
import LabelSubjectMultiRoundConversation, {
  LabelSubjectMultiRoundConversationHandle,
} from "../JobTemplateEditor/tool-config/pages/LabelSubject/MultiRoundConversation";
import LabelSubjectQuestionAnswer, {
  LabelSubjectQuestionAnswerHandle,
} from "../JobTemplateEditor/tool-config/pages/LabelSubject/QuestionAnswer";

interface Props {
  templateType: TemplateType;
  tabItem: TabItemConfig;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

export interface TabsContentHandle {
  refMap: { [refKey: string]: React.RefObject<any> };
}

const TabsContent = forwardRef<TabsContentHandle, Props>(
  ({ templateType, tabItem, onNext, onPrev, onFinish }, ref) => {
    const { formatMessage } = useIntl();
    const { titleKey, subTitleKey, key } = tabItem;
    const BasicInfoRef = useRef<BasicInfoHandle>(null);
    const LabelSubjectRef = useRef<
      | LabelSubjectQuestionAnswerHandle
      | LabelSubjectMultiRoundConversationHandle
    >(null);
    const LabelCheckRef = useRef<LabelCheckLLMHandle>(null);
    const QARef = useRef<QAHandle>(null);

    const refMap: { [refKey: string]: React.RefObject<any> } = {
      [TabKey.BASIC_INFO]: BasicInfoRef,
      [TabKey.LABEL_SUBJECT]: LabelSubjectRef,
      [TabKey.LABEL_CHECK]: LabelCheckRef,
      [TabKey.QA]: QARef,
    };

    useImperativeHandle(ref, () => ({
      refMap,
    }));

    const onPrevHandle = () => {
      refMap[key]?.current?.updateValues().then(
        (res: string) => {
          if (res === "success") {
            onPrev();
          }
        },
        (err: any) => {
          console.log(err);
        }
      );
    };

    const onNextHandle = () => {
      refMap[key]?.current?.updateValues().then(
        (res: string) => {
          if (res === "success") {
            onNext();
          }
        },
        (err: any) => {
          console.log(err);
        }
      );
    };
    const onFinishHandle = () => {
      refMap[key]?.current?.updateValues().then(
        (res: string) => {
          if (res === "success") {
            onFinish();
          }
        },
        (err: any) => {
          console.log(err);
        }
      );
    };

    return (
      <div className="template-config-content">
        <div className="template-config-content-top">
          <div className="template-config-content-top-title">
            {formatMessage({ id: titleKey })}
          </div>
          <div className="template-config-content-top-tip">
            {formatMessage({ id: subTitleKey })}
          </div>
        </div>
        {key === TabKey.BASIC_INFO && (
          <BasicInfo onNext={onNextHandle} ref={BasicInfoRef} activeKey={key} />
        )}
        {key === TabKey.LABEL_SUBJECT && (
          <>
            {templateType === TemplateType.LLM_QUESTION_ANSWER && (
              <LabelSubjectQuestionAnswer
                onNext={onNextHandle}
                onPrev={onPrevHandle}
                ref={LabelSubjectRef}
              />
            )}

            {templateType === TemplateType.LLM_CONVERSATION && (
              <LabelSubjectMultiRoundConversation
                onNext={onNextHandle}
                onPrev={onPrevHandle}
                ref={LabelSubjectRef}
              />
            )}
          </>
        )}
        {key === TabKey.QA && (
          <QA onFinish={onFinishHandle} onPrev={onPrevHandle} ref={QARef} />
        )}
      </div>
    );
  }
);
export default TabsContent;
