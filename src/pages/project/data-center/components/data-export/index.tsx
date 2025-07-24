import type { CSSProperties } from "react";
import { useState } from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";
import MaterialModal from "@/components/MaterialModal";
import ReportContentSelect from "@/pages/project/data-center/components/data-export/ReportContentSelect";
import DataListDownload from "@/pages/project/data-center/components/DataListDownload";
import type { ReportContentItem, ReportType } from "@/types/common";
import { useDataCheck } from "@/hooks/useDataCheck";
import DataGroupRadio from "@/pages/project/data-center/components/DataGroupRadio";
import { DataCheckTarget } from "@/types/v3";

const defaultVisible = {
  dataType: false,
  content: false,
  download: false,
};

function DataExport({
  style,
  projectId,
  recordIds,
  readonly = false,
}: {
  style: CSSProperties;
  projectId: string;
  recordIds: number[];
  readonly?: boolean;
}) {
  const { formatMessage } = useIntl();
  const [visible, setVisible] = useState(defaultVisible);
  const [reportType, setReportType] = useState<ReportType>();
  const [dataGroupId, setDataGroupId] = useState("");
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [reportContent, setReportContent] = useState<ReportContentItem[]>([]);

  const close = () => {
    setVisible({
      ...defaultVisible,
    });
  };

  const save = (type: ReportType, content: ReportContentItem[]) => {
    setReportType(type);
    setReportContent(content);
    setVisible({
      ...defaultVisible,
      download: true,
    });
  };

  const { checkSelectedRecords, loading, checkedData } = useDataCheck({
    projectId,
    recordIds,
    dataCheckTarget: DataCheckTarget.EXPORT,
    onSuccess: (results) => {
      if (results.validGroups.length === 1) {
        setDataGroupId(results.validGroups[0].groupId);
        setSelectedRecordIds(results.validGroups[0].recordIds || []);
      }
      setVisible({
        ...defaultVisible,
        dataType: results.validGroups.length > 1,
        content: results.validGroups.length <= 1,
      });
    },
  });

  return (
    <>
      <Button
        type="primary"
        style={style}
        loading={loading}
        disabled={readonly}
        onClick={checkSelectedRecords}
      >
        {formatMessage({ id: "common.export" })}
      </Button>
      <MaterialModal
        title={formatMessage({ id: "common.export" })}
        visible={visible.dataType}
        onClose={close}
        onSave={() => {
          setVisible({
            ...defaultVisible,
            content: true,
          });
        }}
        destroyOnClose
      >
        <p>{formatMessage({ id: "interim-qa-data-select-tip2" })}</p>
        <DataGroupRadio
          dataGroups={checkedData.validGroups}
          onChange={(groupId: string) => {
            setSelectedRecordIds(
              (checkedData.validGroups || []).find(
                (item) => item.groupId === groupId
              )?.recordIds || []
            );
            setDataGroupId(groupId);
          }}
        />
      </MaterialModal>
      <ReportContentSelect
        visible={visible.content}
        title={formatMessage({ id: "common.export" })}
        onClose={close}
        onSave={save}
      />
      <DataListDownload
        recordIds={selectedRecordIds}
        projectId={projectId}
        groupId={dataGroupId}
        type={reportType}
        contentItems={reportContent}
        visible={visible.download}
        onClose={close}
      />
    </>
  );
}

export default DataExport;
