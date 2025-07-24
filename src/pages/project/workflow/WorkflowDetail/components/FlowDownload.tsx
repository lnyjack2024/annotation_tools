import { useState } from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";
import DownloadReportModal from "@/components/DownloadReportModal";
import {
  generatePartialReport,
  getPartialReportStatus,
} from "@/services/report";

function FlowDownload({ jobId }: { jobId: string }) {
  const { formatMessage } = useIntl();
  const [visible, setVisible] = useState(false);

  const getReportStatus = () => {
    return getPartialReportStatus(jobId);
  };

  const generateReport = (isWholeFlow: boolean) => {
    return generatePartialReport(jobId, isWholeFlow);
  };

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        {formatMessage({ id: "common.download" })}
      </Button>
      <DownloadReportModal
        key={jobId}
        visible={visible}
        downloadLinkKey="finalResultFile"
        onClose={() => setVisible(false)}
        onGenerateReport={generateReport}
        onGetReportStatus={getReportStatus}
      />
    </>
  );
}

export default FlowDownload;
