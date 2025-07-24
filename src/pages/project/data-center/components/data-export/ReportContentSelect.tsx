import { useIntl } from "@umijs/max";
import { Checkbox, Radio } from "antd";
import { ReportContentItem, ReportType } from "@/types/common";
import { useEffect, useState } from "react";
import MaterialModal from "@/components/MaterialModal";

type Props = {
  title: string;
  onClose: () => void;
  visible: boolean;
  onSave: (type: ReportType, content: ReportContentItem[]) => void;
};

const resultContent = [
  ReportContentItem.ORIGIN_DATA,
  ReportContentItem.FINAL_RESULT_DATA,
  ReportContentItem.SIMPLE_PROCESS_DATA,
  ReportContentItem.ALL_PROCESS_DATA,
  ReportContentItem.FIRST_LABELING_RESULT_DATA,
];

const deliveryContent = [
  ReportContentItem.ORIGIN_DATA,
  ReportContentItem.FINAL_RESULT_DATA,
];

const defaultSelectedContent = [
  ReportContentItem.ORIGIN_DATA,
  ReportContentItem.RESULT_DATA,
  ReportContentItem.FINAL_RESULT_DATA,
];

const labelStyle = { marginBottom: 12, color: "#42526e", lineHeight: "20px" };

function ReportContentSelect({ onClose, onSave, title, visible }: Props) {
  const { formatMessage } = useIntl();
  const [reportContent, setReportContent] = useState<ReportContentItem[]>([]);
  const [selectedReportContent, setSelectedReportContent] = useState<
    ReportContentItem[]
  >([]);
  const [reportType, setReportType] = useState<ReportType>(ReportType.REPORT);

  const save = () => {
    onSave(reportType, selectedReportContent);
  };

  useEffect(() => {
    setReportContent(
      reportType === ReportType.REPORT ? resultContent : deliveryContent
    );
  }, [reportType]);

  useEffect(() => {
    setSelectedReportContent(
      defaultSelectedContent.filter((item) =>
        reportContent.find((i) => i === item)
      )
    );
  }, [reportContent]);

  return (
    <>
      <MaterialModal
        title={title}
        width={536}
        visible={visible}
        onClose={onClose}
        onSave={save}
        disabled={selectedReportContent.length === 0}
        destroyOnClose
      >
        <p style={labelStyle}>{formatMessage({ id: "report.type" })}</p>
        <Radio.Group
          onChange={(e) => setReportType(e.target.value)}
          style={{ marginBottom: 24 }}
          value={reportType}
        >
          {Object.keys(ReportType).map((key) => (
            <Radio
              key={key}
              value={ReportType[key]}
              style={{ color: "#42526e" }}
            >
              {formatMessage({ id: `report.type.${ReportType[key]}` })}
            </Radio>
          ))}
        </Radio.Group>
        <p style={labelStyle}>{formatMessage({ id: "report.content" })}</p>
        <Checkbox.Group
          value={selectedReportContent}
          onChange={(checkedValue) =>
            setSelectedReportContent(checkedValue as ReportContentItem[])
          }
          style={{ marginBottom: 24 }}
        >
          {reportContent.map((item) => (
            <div key={item} style={{ marginBottom: 12 }}>
              <Checkbox value={item} style={{ color: "#42526e" }}>
                {formatMessage({ id: `report.content.${item}` })}
              </Checkbox>
            </div>
          ))}
        </Checkbox.Group>
      </MaterialModal>
    </>
  );
}

export default ReportContentSelect;
