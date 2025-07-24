import { DataRecordDetailTab } from "@/types/project";
import { Radio, Divider } from "antd";
import { RadioChangeEvent } from "antd/lib/radio/interface";
import React, { useState } from "react";
import RecordFlow from "./RecordFlow";
import AnnotationResult from "./AnnotatonResult";
import { useIntl } from "@umijs/max";
import { ProjectDataDetail } from "@/services/project";

const RecordDetailTabComponents = {
  [DataRecordDetailTab.RECORD_FLOW]: RecordFlow,
  [DataRecordDetailTab.ANNOTATION_RESULT]: AnnotationResult,
};

type Props = {
  recordData: ProjectDataDetail;
};

function RecordDetailTab({ recordData }: Props) {
  const { formatMessage } = useIntl();
  const [selectedTab, setSelectedTab] = useState<DataRecordDetailTab>(
    DataRecordDetailTab.RECORD_FLOW
  );

  const onChange = (e: RadioChangeEvent) => {
    setSelectedTab(e.target.value);
  };

  return (
    <>
      <Radio.Group
        onChange={onChange}
        defaultValue={DataRecordDetailTab.RECORD_FLOW}
      >
        <Radio.Button value={DataRecordDetailTab.RECORD_FLOW}>
          {formatMessage({ id: "project.detail.record-detail.processes" })}
        </Radio.Button>
        <Radio.Button value={DataRecordDetailTab.ANNOTATION_RESULT}>
          {formatMessage({
            id: "project.detail.record-detail.annotation.result",
          })}
        </Radio.Button>
      </Radio.Group>
      <Divider style={{ margin: "16px 0 0 0", backgroundColor: "#DDE0E5" }} />
      <div>
        {React.createElement(
          RecordDetailTabComponents[
            selectedTab
          ] as React.FunctionComponent<Props>,
          {
            recordData,
          }
        )}
      </div>
    </>
  );
}

export default RecordDetailTab;
