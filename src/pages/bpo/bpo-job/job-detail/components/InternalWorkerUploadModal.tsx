import { Button, Modal, Spin } from "antd";
import { CloudDownloadOutlined } from "@ant-design/icons";
import { FormattedMessage, useIntl } from "@umijs/max";
import WorkerUploader from "@/pages/job/components/WorkerUploader";
import { WORKER_UPLOAD_URL_V3 } from "@/utils/constants";
import type { Job } from "@/types/job";
import { useState } from "react";
import { getPublicPath } from "@/utils/env";

type Props = {
  job: Job;
  visible: boolean;
  onWorkersChange: (data: any) => void;
  onClose: () => void;
};

function InternalWorkerUploadModal({
  job,
  visible,
  onWorkersChange,
  onClose,
}: Props) {
  const { formatMessage } = useIntl();
  const [uploading, setUploading] = useState(false);

  return (
    <Modal
      width={768}
      visible={visible}
      footer={null}
      maskClosable={false}
      onCancel={onClose}
    >
      <h3>{formatMessage({ id: "job-detail.workforce.add" })}</h3>
      <div style={{ marginBottom: 24 }}>
        {formatMessage({ id: "job-detail.workforce.add.modal-text" })}
        <a href={`${getPublicPath()}/templates/workers-sample.csv`}>
          <Button type="link" icon={<CloudDownloadOutlined />}>
            <FormattedMessage id="job-detail.workforce.download-template" />
          </Button>
        </a>
      </div>
      <Spin spinning={uploading}>
        <WorkerUploader
          isDragger
          job={job}
          onFileUploaded={(file) => {
            const { response } = file;
            const { data } = response;
            onWorkersChange(data);
            onClose();
          }}
          onUploading={setUploading}
          uploadURL={WORKER_UPLOAD_URL_V3}
        />
      </Spin>
    </Modal>
  );
}

export default InternalWorkerUploadModal;
