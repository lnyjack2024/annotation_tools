import { getDataOperationDetail } from "@/services/project";
import { HttpStatus } from "@/types";
import { mapStatusToErrorMessage } from "@/utils";
import { Modal, Spin, message, Descriptions } from "antd";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";

type Props = {
  visible: boolean;
  dataOperLogId: number;
  projectId: string;
  recordId: string;
  onClose: () => void;
};

type DataOperationDetailType = {
  assignedUserName?: string;
  auditBillName?: string;
  auditNum?: number;
  oriJobName?: string;
  targetJobName?: string;
};

function DataOperationDetailModal({
  visible,
  dataOperLogId,
  projectId,
  recordId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [operationDetail, setOperationDetail] =
    useState<DataOperationDetailType>(null);
  const { assignedUserName, auditBillName, auditNum, oriJobName } =
    operationDetail || {};
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (visible) {
      getDetail();
    } else {
      setOperationDetail(null);
    }
  }, [visible]);

  const getDetail = () => {
    getDataOperationDetail({
      dataOperLogId,
      projectId,
      recordId,
    })
      .then((resp) => {
        setLoading(true);
        if (resp.status === HttpStatus.OK) {
          setOperationDetail(resp.data);
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
    <Modal visible={visible} footer={null} onCancel={onClose}>
      <Spin spinning={loading}>
        <Descriptions
          column={1}
          labelStyle={{ color: "#7A869A" }}
          contentStyle={{ color: "#42526E" }}
        >
          {auditBillName && (
            <Descriptions.Item
              label={formatMessage({
                id: "project.detail.record-detail.data.audit",
              })}
            >
              <span>
                [No.{auditNum}] {auditBillName}
              </span>
            </Descriptions.Item>
          )}
          {oriJobName && (
            <Descriptions.Item
              label={formatMessage({
                id: "project.detail.record-detail.data.job",
              })}
            >
              <span>{oriJobName}</span>
            </Descriptions.Item>
          )}
          {assignedUserName && (
            <Descriptions.Item
              label={formatMessage({
                id: "project.detail.record-detail.data.assigned-user",
              })}
            >
              <span>{assignedUserName}</span>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Spin>
    </Modal>
  );
}

export default DataOperationDetailModal;
