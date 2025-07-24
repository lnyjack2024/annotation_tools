import { useState } from "react";
import type { UploadChangeParam } from "antd/es/upload";
import { PlusOutlined } from "@ant-design/icons";
import { Button, message, Spin, Upload } from "antd";
import { useIntl } from "@umijs/max";
import type { UploadFile } from "antd/es/upload/interface";

import styles from "./ImageUploader.less";
import { getAPIGatewayPrefix } from "@/utils";

export type ImageUploaderProps = {
  onFinish: (file: UploadFile) => void;
  onError?: (file: UploadFile) => void;
  onClear?: () => void;
  iconMessage: string;
  accept?: string;
  uploadUrl?: string;
  data?: any;
  method?: "post" | "put";
  initialImgUrl?: string;
};

export default function ImageUploader({
  onClear,
  onFinish,
  onError,
  accept,
  uploadUrl,
  method = "put",
  data = null,
  initialImgUrl = "",
}: ImageUploaderProps) {
  const { formatMessage } = useIntl();
  const [uploading, setUploading] = useState(false);
  const [imgUrl, setImgUrl] = useState(initialImgUrl);

  const uploadProps = {
    name: "file",
    accept: accept || ".csv",
    action: getAPIGatewayPrefix() + uploadUrl,
    method,
    withCredentials: true,
    showUploadList: false,
    data,
    // beforeUpload,
    onChange(info: UploadChangeParam) {
      if (info.file.status === "done") {
        setUploading(false);
        if (info.file.size / 1024 / 1024 < 10) {
          message.success(
            formatMessage(
              { id: "job.form.upload.success" },
              { name: info.file.name }
            )
          );
          setImgUrl(info?.file?.response?.data);
          onFinish(info.file);
        } else {
          message.error("Image must smaller than 10MB!");
        }
      } else if (info.file.status === "error") {
        setUploading(false);
        onError?.(info.file);
      } else if (!uploading) {
        setUploading(true);
      }
    },
  };

  return (
    <div className={styles["image-uploader"]}>
      <Spin spinning={uploading}>
        {imgUrl ? (
          <div className={styles.preview}>
            <img
              src={imgUrl}
              alt="Business License"
              width="100%"
              height="100%"
            />
            <div className={styles.modal}>
              <Button
                className={styles.clear}
                type="link"
                onClick={() => {
                  setImgUrl("");
                  onClear();
                }}
              >
                {formatMessage({ id: "bpo-apply.clear" })}
              </Button>
              <Upload
                {...uploadProps}
                disabled={uploading}
                className={styles.upload}
              >
                <span className={styles.reupload}>
                  {formatMessage({ id: "bpo-apply.re-upload" })}
                </span>
              </Upload>
            </div>
          </div>
        ) : (
          <Upload.Dragger
            {...uploadProps}
            disabled={uploading}
            style={{ width: 188, height: 104 }}
          >
            <div>
              <p className={styles["plus-icon"]}>
                <PlusOutlined />
              </p>
              <p className={styles["upload-placeholder"]}>
                {formatMessage({ id: "bpo-apply.placeholder.uploader" })}
              </p>
            </div>
          </Upload.Dragger>
        )}
      </Spin>
    </div>
  );
}
