import { message, Button } from "antd";
import { history, useIntl } from "@umijs/max";
import DownloadReportModal from "@/components/DownloadReportModal";
import { generateDataListReport } from "@/services/report";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { ReportContentItem, ReportType } from "@/types/common";

interface Props {
  visible: boolean;
  projectId: string;
  recordIds: number[];
  groupId: string;
  type: ReportType;
  contentItems: ReportContentItem[];
  onClose: () => void;
}

function DataListDownload({
  visible,
  groupId,
  type,
  contentItems,
  projectId,
  recordIds,
  onClose,
}: Props) {
  const { formatMessage } = useIntl();

  const getReportStatus = () => {
    return Promise.resolve();
  };

  const generateReport = () => {
    return generateDataListReport({
      projectId,
      recordIds,
      groupId,
      type,
      contentItems,
    }).then((resp) => {
      if (resp.status === HttpStatus.OK) {
        message.success(
          <span>
            {formatMessage({ id: "data.export.tip1" })}
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => history.push("/file-center")}
            >
              {formatMessage({ id: "file.center.title" })}
            </Button>
            {formatMessage({ id: "data.export.tip2" })}
          </span>
        );
        onClose();
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    });
  };

  return (
    <DownloadReportModal
      key={groupId}
      visible={visible}
      hasFlowData={false}
      downloadLinkKey="finalResultFile"
      onClose={onClose}
      onGenerateReport={generateReport}
      onGetReportStatus={getReportStatus}
    />
  );
}

export default DataListDownload;
