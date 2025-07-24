import { useState } from "react";
import { Radio, RadioChangeEvent } from "antd";
import { useIntl } from "@umijs/max";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import DataExportComponent from "./DataExport";
import DataUploadComponent from "./DataUpload";

enum FileCenterTab {
  DataExport = "DataExport",
  DataUpload = "DataUpload",
}

function FileCenter() {
  const { formatMessage } = useIntl();
  const [tab, setTab] = useState(FileCenterTab.DataExport);
  const options = [
    { label: formatMessage({ id: "data.export" }), value: "DataExport" },
    { label: formatMessage({ id: "data.upload" }), value: "DataUpload" },
  ];

  return (
    <HeaderContentWrapperComponent
      title={formatMessage({ id: "file.center.title" })}
    >
      <Radio.Group
        style={{ marginBottom: 20 }}
        options={options}
        optionType="button"
        onChange={({ target: { value } }: RadioChangeEvent) => {
          setTab(value);
        }}
        value={tab}
      />
      {tab === FileCenterTab.DataExport && <DataExportComponent />}
      {tab === FileCenterTab.DataUpload && <DataUploadComponent />}
    </HeaderContentWrapperComponent>
  );
}

export default FileCenter;
