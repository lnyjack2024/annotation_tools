import { pathToRegexp } from "path-to-regexp";
import { useEffect, useState } from "react";
import { Card, message, Empty, Button } from "antd";
import { getDataLabelResult, ProjectDataDetail } from "@/services/project";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import {
  downloadFile,
  mapStatusToErrorMessage,
  openDataPreviewPage,
} from "@/utils";
import { HttpStatus } from "@/types";
import { useIntl } from "@umijs/max";
import fileSvg from "@/assets/icons/file.svg";
import labelResultSvg from "@/assets/icons/label-result.svg";
import QAResultSvg from "@/assets/icons/qa-result.svg";
import { CloudDownloadOutlined, EyeOutlined } from "@ant-design/icons";

import type { DataOperationItemType } from "./RecordFlow";
import { DataOperationType } from "@/types/project";

type AnnotationResultItemType = {
  labelResultUrl: string | null;
  operSummary: DataOperationItemType;
  oriJobName: string;
  tempLabelResult: boolean;
};

type Props = {
  recordData: ProjectDataDetail;
};

function AnnotationResult({ recordData }: Props) {
  const location = useLocationWithQuery();
  const [, projectId, recordId] =
    pathToRegexp("/projects/:projectId/:recordId/:tabName").exec(
      location.pathname
    ) || [];
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnnotationResultItemType[]>([]);
  const { formatMessage } = useIntl();

  const LabelResultStatus = [
    DataOperationType.labelacquire,
    DataOperationType.labelsubmit,
    DataOperationType.reworkacquire,
    DataOperationType.reworksubmit,
  ];
  const AcquireStatus = [
    DataOperationType.labelacquire,
    DataOperationType.qaacquire,
    DataOperationType.qamodifiedacquire,
    DataOperationType.reworkacquire,
  ];
  const QAResultStatus = [
    DataOperationType.qaacquire,
    DataOperationType.qasubmit,
    DataOperationType.qamodifiedacquire,
    DataOperationType.qamodifiedsubmit,
    DataOperationType.qarejected,
    DataOperationType.qamodifiedrejected,
  ];

  useEffect(() => {
    getAnnotationResult();
  }, []);

  const getAnnotationResult = (currentPageNo?: number) => {
    setLoading(true);
    getDataLabelResult({
      projectId,
      recordId,
    })
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setData(resp.data);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Card loading={loading} bordered={false} bodyStyle={{ padding: "0 0" }}>
      {data.length === 0 && (
        <Empty
          style={{ marginTop: 24 }}
          description={formatMessage(
            { id: "common.empty.with-label" },
            {
              label: formatMessage({
                id: "job-detail.dataset",
              }),
            }
          )}
        />
      )}
      {data.map(
        ({ labelResultUrl, operSummary, oriJobName, tempLabelResult }) => {
          const isActive =
            labelResultUrl &&
            (!AcquireStatus.includes(operSummary.operationType) ||
              tempLabelResult);
          return (
            <div
              key={operSummary.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #dde0e5",
              }}
            >
              <div>
                <span style={{ fontWeight: "bold" }}>
                  {formatMessage({
                    id: `project.detail.record-detail.data.operation-type.${operSummary.operationType}`,
                  })}
                  {operSummary.operator ? `(${operSummary.operator})` : ""}
                </span>
                <span style={{ color: "#7A869A", float: "right" }}>
                  {operSummary.operationTime}
                </span>
              </div>
              <div
                style={{
                  margin: "8px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {LabelResultStatus.includes(operSummary.operationType) && (
                  <img src={labelResultSvg} />
                )}
                {QAResultStatus.includes(operSummary.operationType) && (
                  <img src={QAResultSvg} />
                )}
                <span style={{ color: "#7A869A", marginLeft: 8 }}>
                  {formatMessage({
                    id: "project.detail.record-detail.data.job",
                  })}
                  :<span style={{ marginLeft: 8 }}>{oriJobName}</span>
                </span>
              </div>
              <div
                style={{
                  backgroundColor: "#F6F7F9",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img src={fileSvg} />
                <span style={{ marginLeft: 8, color: "#42526E" }}>
                  {formatMessage({
                    id: "project.detail.record-detail.annotation.result",
                  })}
                </span>
                {tempLabelResult && (
                  <>
                    <span
                      style={{
                        padding: "0 8px",
                        border: "1px solid #DDE0E5",
                        borderRadius: 2,
                        marginLeft: 8,
                      }}
                    >
                      {formatMessage({
                        id: "project.detail.record-detail.temporary.save",
                      })}
                    </span>
                  </>
                )}
                <div style={{ flex: 1 }} />
                {isActive && (
                  <>
                    <Button
                      type="link"
                      icon={
                        <CloudDownloadOutlined style={{ color: "#42526E" }} />
                      }
                      onClick={() => {
                        downloadFile({ url: labelResultUrl });
                      }}
                    />
                    <Button
                      type="link"
                      icon={<EyeOutlined style={{ color: "#42526E" }} />}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!recordData.flowId) {
                          return;
                        }
                        openDataPreviewPage(projectId, {
                          ...recordData,
                          dataOperLogId: `${operSummary.id}`,
                        });
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        }
      )}
    </Card>
  );
}

export default AnnotationResult;
