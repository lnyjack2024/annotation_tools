import type { Dispatch } from "react";
import React from "react";
import { useIntl } from "@umijs/max";
import { Button } from "antd";

import TemplateEditorV2 from "@/pages/project/template-center/components/TemplateEditorV2";
import type { BaseResp } from "@/types/common";
import type { ProjectTemplate } from "@/types/v3";

type Props = {
  visible: boolean;
  templateInfo: ProjectTemplate;
  dispatch: Dispatch<any>;
  ontologyEditorRef?: any;
  issueTypeEditorRef?: any;
  onPre: () => void;
  onSave: () => Promise<BaseResp<any>>;
  onNext: () => void;
};

const Step2: React.FC<Props> = ({
  visible,
  templateInfo,
  dispatch,
  onPre,
  onNext,
  onSave,
  ontologyEditorRef,
  issueTypeEditorRef,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div style={visible ? undefined : { display: "none" }}>
      <TemplateEditorV2
        templateInfo={templateInfo}
        dispatch={dispatch}
        ontologyEditorRef={ontologyEditorRef}
        issueTypeEditorRef={issueTypeEditorRef}
        previewScope="PRIVATE"
        onSave={onSave}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 24,
        }}
      >
        <Button onClick={onPre} style={{ marginRight: 48 }}>
          {formatMessage({ id: "common.prev-step" })}
        </Button>
        <Button type="primary" onClick={onNext}>
          {formatMessage({ id: "common.complete" })}
        </Button>
      </div>
    </div>
  );
};

export default Step2;
