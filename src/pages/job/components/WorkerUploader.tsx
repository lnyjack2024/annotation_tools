import {
  LoadingOutlined,
  UploadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Button, message, Upload } from "antd";
import type { UploadChangeParam, UploadProps } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { useState } from "react";
import { useIntl } from "@umijs/max";
import type { Job } from "@/types/job";

type WorkerUploaderProps = {
  job: Job;
  onUploading?: (status: boolean) => void;
  onFileUploaded?: (file: UploadFile) => void;
  config?: UploadProps;
  isDragger?: boolean;
  uploadURL?: string;
};

function WorkerUploader({
  job,
  onUploading,
  onFileUploaded,
  config,
  isDragger = false,
  uploadURL,
}: WorkerUploaderProps) {
  const { formatMessage } = useIntl();
  const [uploading, setUploading] = useState(false);
  const workerUploadURL = `${uploadURL}?jobId=${job.id}`;

  const uploadProps = {
    name: "file",
    accept: ".csv",
    action: workerUploadURL,
    showUploadList: false,
    withCredentials: true,
    onChange({ file }: UploadChangeParam) {
      if (onUploading) {
        onUploading(true);
      }
      if (file.status === "done") {
        if (onFileUploaded) {
          message.success(
            formatMessage(
              { id: "job.form.upload.success" },
              { name: file.name }
            )
          );

          onFileUploaded(file);
        }
        setUploading(false);
        if (onUploading) {
          onUploading(false);
        }
      } else if (file.status === "error") {
        message.error(
          formatMessage({ id: "job.form.upload.error" }, { name: file.name })
        );

        setUploading(false);

        if (onUploading) {
          onUploading(false);
        }
      }
    },
    ...config,
  };

  return isDragger ? (
    <Upload.Dragger {...uploadProps}>
      <div style={{ margin: "32px 0" }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {formatMessage({ id: "component.uploader.dragger.title" })}
        </p>
        <p className="ant-upload-hint">
          {formatMessage(
            { id: "component.uploader.dragger.support" },
            { list: ".csv" }
          )}
        </p>
      </div>
    </Upload.Dragger>
  ) : (
    <Upload {...uploadProps} disabled={uploading}>
      <Button
        icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
        disabled={uploading}
      >
        {formatMessage({ id: "job-create.email.upload.button" })}
      </Button>
    </Upload>
  );
}

export function DelayUploader({
  onFileUpdate,
}: {
  onFileUpdate: (file: UploadFile) => void;
}) {
  const { formatMessage } = useIntl();
  const uploadProps = {
    name: "file",
    accept: ".csv",
    maxCount: 1,
    onRemove: () => {
      onFileUpdate(null);
    },
    beforeUpload: (file: UploadFile) => {
      onFileUpdate(file);
      return false;
    },
  };

  return (
    <Upload.Dragger {...uploadProps}>
      <div style={{ margin: "32px 0" }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {formatMessage({ id: "component.uploader.dragger.title" })}
        </p>
        <p className="ant-upload-hint">
          {formatMessage(
            { id: "component.uploader.dragger.support" },
            { list: ".csv" }
          )}
        </p>
      </div>
    </Upload.Dragger>
  );
}

export default WorkerUploader;
