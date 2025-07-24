import { useEffect, useState } from "react";
import { message } from "antd";
import { connect } from "react-redux";
import DownloadReportModal from "@/components/DownloadReportModal";
import {
  generateBpoDataListReport,
  getBpoDataListReportStatus,
} from "@/services/report";

import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { ConnectState } from "@/models/connect";
import type { Dispatch } from "redux";
import { Job } from "@/types/job";
import { WorkflowDataRecord } from "@/types/v3";

interface Props {
  job: Job;
  selectedData: WorkflowDataRecord[];
  visible: boolean;
  dispatch: Dispatch;
}

function DataExport({ job, dispatch, visible, selectedData }: Props) {
  const [downloadId, setDownloadId] = useState("");
  const { id: jobId, projectId } = job || {};
  const recordIds = selectedData.map((item) => item.recordId);

  const getReportStatus = () => {
    if (!downloadId) {
      return Promise.resolve();
    }
    return getBpoDataListReportStatus(projectId, jobId, downloadId);
  };

  const generateReport = () => {
    return generateBpoDataListReport({ projectId, jobId, recordIds }).then(
      (resp) => {
        if (resp.status === HttpStatus.OK) {
          setDownloadId(resp.data);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      }
    );
  };

  useEffect(() => {
    setDownloadId("");
  }, [jobId, selectedData]);

  return (
    <DownloadReportModal
      key={recordIds.join(",")}
      visible={visible}
      hasFlowData={false}
      downloadLinkKey="finalResultFile"
      onClose={() =>
        dispatch({
          type: "bpoJob/toggleVisible",
          payload: { exportVisible: false },
        })
      }
      onGenerateReport={generateReport}
      onGetReportStatus={getReportStatus}
    />
  );
}

function mapStateToProps({ bpoJob }: ConnectState) {
  return {
    job: bpoJob.job,
    visible: bpoJob.visible.exportVisible,
    selectedData: bpoJob.selectedData,
  };
}

export default connect(mapStateToProps)(DataExport);
