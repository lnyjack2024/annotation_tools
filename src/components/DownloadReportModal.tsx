import type { MouseEvent, ReactNode } from "react";
import React, { useEffect, useState } from "react";
import { InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Checkbox, message, Popover, Spin } from "antd";
import { useIntl } from "@umijs/max";

import { JobReportStatus } from "@/types/job";
import MaterialModal from "@/components/MaterialModal";
import useInterval from "@/hooks/useInterval";
import { downloadFile, mapStatusToErrorMessage } from "@/utils/utils";

export type PartialReport = {
  id: null | string;
  jobId: null | string;
  resultFile: null | string;
  status: null | string;
  scriptId: string;
  downloadLink: null | string;
  partialReportLink: null | string;
};

type Props = {
  visible: boolean;
  couldStop?: boolean;
  generateText?: string | ReactNode;
  downloadText?: string | ReactNode;
  hasFlowData?: boolean;
  downloadLinkKey?: string;
  onGetReportStatus: () => any;
  onGenerateReport: (isWholeFlow: boolean) => any;
  onCancelGenerateReport?: (isWholeFlow: boolean) => any;
  onClose: () => any;
};

const DELAY_SECONDS = 10000;

const DownloadReportModal: React.FC<Props> = ({
  visible,
  couldStop = false,
  hasFlowData = true,
  downloadLinkKey = "partialReportLink",
  onGetReportStatus,
  onGenerateReport,
  onCancelGenerateReport,
  onClose,
}) => {
  const { formatMessage } = useIntl();
  const [partialReport, setPartialReport] = useState<PartialReport | null>(
    null
  );
  const [reportStatus, setReportStatus] = useState<JobReportStatus>(null);
  const [delay, setDelay] = useState<number | null>(null);
  const [isWholeFlow, setIsWholeFlow] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const getReportStatus = async () => {
    try {
      const resp = await onGetReportStatus();
      if (!resp) {
        return;
      }
      setPartialReport(resp.data);
      setReportStatus(resp.data.status);
      if (
        resp.data.status === JobReportStatus.PROCESSING ||
        resp.data.status === JobReportStatus.POST_SCRIPT_READY
      ) {
        setDelay(DELAY_SECONDS);
      } else if (resp.data.status === JobReportStatus.FAILURE) {
        message.error(formatMessage({ id: "job.partial-report.error" }));
        setDelay(null);
      } else {
        setDelay(null);
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const generateReport = async (e: MouseEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      await onGenerateReport(isWholeFlow);
      setReportStatus(JobReportStatus.PROCESSING);
      setDelay(DELAY_SECONDS);
    } catch (error) {
      message.error(mapStatusToErrorMessage(error));
    } finally {
      setBtnLoading(false);
    }
  };

  const handleStop = async () => {
    setBtnLoading(true);
    try {
      await onCancelGenerateReport(isWholeFlow);
      setPartialReport(null);
      setReportStatus(null);
      setDelay(null);
    } catch (error) {
      message.error(mapStatusToErrorMessage(error));
    } finally {
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getReportStatus().finally(() => setLoading(false));
    }
  }, [visible]);

  useInterval(() => {
    getReportStatus();
  }, delay);

  const downloadReport = (e: MouseEvent) => {
    e.preventDefault();
    downloadFile({ url: partialReport[downloadLinkKey] });
  };

  const Actions = () => {
    switch (reportStatus) {
      case JobReportStatus.FAILURE:
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#3e5270" }}>
              {formatMessage({ id: "report.download.failure" })}
            </p>
            <Button danger onClick={generateReport} loading={btnLoading}>
              {formatMessage({
                id: "report.generate.retry",
              })}
            </Button>
          </div>
        );
      case JobReportStatus.SUCCESS:
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#3e5270" }}>
              {formatMessage({ id: "report.download.success" })}
            </p>
            <Button
              danger
              style={{ marginRight: 12 }}
              onClick={generateReport}
              loading={btnLoading}
            >
              {formatMessage({
                id: "report.generate.retry",
              })}
            </Button>
            <Button type="primary" onClick={downloadReport}>
              {formatMessage({
                id: "report.generate.download",
              })}
            </Button>
          </div>
        );
      case JobReportStatus.PROCESSING:
      case JobReportStatus.POST_SCRIPT_READY:
        return (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#3e5270" }}>
              {formatMessage({
                id: "report.generate.tip",
              })}
              <LoadingOutlined style={{ marginLeft: 8 }} />
            </p>
            {couldStop && (
              <Button danger onClick={handleStop} loading={btnLoading}>
                {formatMessage({
                  id: "report.generate.stop",
                })}
              </Button>
            )}
          </div>
        );
      default:
        return (
          <Button type="primary" onClick={generateReport} loading={btnLoading}>
            {formatMessage({ id: "common.download.generate" })}
          </Button>
        );
    }
  };

  return (
    <MaterialModal
      title={formatMessage({ id: "job.partial-report.title" })}
      width={580}
      visible={visible}
      onClose={() => {
        onClose();
        setDelay(null);
      }}
      showFooter={false}
    >
      <Spin spinning={loading}>
        {hasFlowData && (
          <div className="margin-bottom-4">
            <Checkbox
              onChange={(e) => setIsWholeFlow(e.target.checked)}
              checked={isWholeFlow}
            />
            <span className="margin-left-1">
              {formatMessage({ id: "job-detail.report.with-flow" })}
              <Popover
                content={formatMessage({
                  id: "job-detail.report.with-flow.tip",
                })}
              >
                <InfoCircleOutlined className="margin-left-1 color-warning-color" />
              </Popover>
            </span>
          </div>
        )}
        <div
          style={{
            height: "142px",
            margin: "0 auto",
            background: "#f6f7f9",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <Actions />
        </div>
      </Spin>
    </MaterialModal>
  );
};

export default DownloadReportModal;
