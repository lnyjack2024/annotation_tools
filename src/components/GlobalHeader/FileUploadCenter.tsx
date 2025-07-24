import { CloudDownloadOutlined } from "@ant-design/icons";
import { useIntl, history as router } from "@umijs/max";
import { connect } from "react-redux";
import type { ConnectState } from "@/models/connect";
import type { UploadProgressState } from "@/pages/project/models/uploadProgress";
import { Button } from "antd";
import styles from "./index.less";
import { useEffect, useRef, useState } from "react";
import { throttle, cloneDeep } from "lodash";
import { OriginalFileUploadStatus } from "@/types/project";
import { formatBytes } from "@/utils";
import uploadingGif from "@/assets/gif/uploading.gif";

function FileUploadCenter({
  uploadProgress,
}: {
  uploadProgress: UploadProgressState;
}) {
  const { formatMessage } = useIntl();
  const preUploadProgress = useRef(null);
  const [speed, setSpeed] = useState(0);
  const [uploadingCount, setUploadingCount] = useState(0);
  const throttled = useRef(
    throttle((newUploadProgress) => {
      let size = 0;
      let count = 0;
      for (const key in newUploadProgress) {
        if (
          newUploadProgress[key].status ===
          OriginalFileUploadStatus.RAW_DATA_UPLOADING
        ) {
          count++;
          size +=
            newUploadProgress[key].loaded -
            (preUploadProgress.current[key]?.loaded || 0);
        }
      }
      setSpeed(size);
      setUploadingCount(count);
      preUploadProgress.current = cloneDeep(newUploadProgress);
    }, 1000)
  );

  useEffect(() => {
    throttled.current(uploadProgress);
  }, [uploadProgress]);

  return (
    <Button
      className={styles.action}
      style={{ display: "flex", alignItems: "center" }}
      type="link"
      onClick={() => router.push("/file-center")}
    >
      {speed > 0 && (
        <div
          className="flex-center"
          style={{
            backgroundColor: "#F6F7F9",
            borderRadius: 14,
            height: 28,
            padding: "0 2px",
          }}
        >
          <span style={{ margin: "0 10px" }}>{formatBytes(speed)}/s</span>
          <img src={uploadingGif} style={{ width: 24 }} />
        </div>
      )}
      <span style={{ marginLeft: 10 }}>
        <CloudDownloadOutlined />
        <span style={{ marginLeft: 10 }}>
          {formatMessage({ id: "menu.file" })}
        </span>
      </span>
      {uploadingCount > 0 && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            top: 2,
            right: 0,
            backgroundColor: "#F56C6C",
            height: 16,
            minWidth: 16,
            borderRadius: 8,
          }}
        >
          <span style={{ color: "white", fontSize: 10 }}>{uploadingCount}</span>
        </div>
      )}
    </Button>
  );
}

export default connect(({ uploadProgress }: ConnectState) => ({
  uploadProgress,
}))(FileUploadCenter);
