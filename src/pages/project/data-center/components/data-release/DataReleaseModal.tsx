import { Alert, message, Radio, Select } from "antd";
import MaterialModal from "@/components/MaterialModal";
import { Dispatch, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { useEffect, useState } from "react";
import { mapStatusToErrorMessage } from "@/utils/utils";
import {
  checkDataJob,
  getReleaseWorker,
  releaseData,
} from "@/services/project";
import { HttpStatus } from "@/types/http";
import { releaseBPOData } from "@/services/bpo";
import { InfoCircleOutlined } from "@ant-design/icons";
import { MAX_EXECUTE_DATA } from "@/pages/project/models/dataCenter";

type Props = {
  visible: boolean;
  role?: "bpo" | "pm";
  selectedRecordIds: number[];
  projectId: string;
  jobId?: string;
  onRefresh: () => void;
  onClose: () => void;
  dispatch: Dispatch;
};

/**
 This component is for PM and BPO.
 */

function DataRelease({
  selectedRecordIds,
  role = "pm",
  jobId,
  projectId,
  visible,
  onClose,
  onRefresh,
  dispatch,
}: Props) {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"pool" | "worker">("pool");
  const [inSameJob, setInSameJob] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const release = async () => {
    if (role === "pm" && selectedRecordIds.length > MAX_EXECUTE_DATA) {
      dispatch({
        type: "dataCenter/bigDataAction",
        payload: {
          projectId,
          actionType: "release",
          reAssignedWorkerId: selectedWorker,
          recordIds: selectedRecordIds,
        },
      });
      return;
    }

    setLoading(true);
    try {
      const resp =
        role === "bpo"
          ? await releaseBPOData({
              projectId,
              jobId,
              recordIds: selectedRecordIds,
              reAssignedWorkerId: selectedWorker,
            })
          : await releaseData({
              projectId,
              recordIds: selectedRecordIds,
              reAssignedWorkerId: selectedWorker,
            });
      if (resp.status === HttpStatus.OK) {
        message.success(
          formatMessage({ id: "release-success" }, { count: resp.data })
        );
        onClose();
        onRefresh();
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (role === "bpo") {
        setInSameJob(true);
        return;
      }
      checkDataJob({ projectId, recordIds: selectedRecordIds })
        .then((resp) => {
          if (resp.status === HttpStatus.OK) {
            setInSameJob(resp.data);
          } else {
            message.error(mapStatusToErrorMessage(resp));
          }
        })
        .catch((e) => message.error(mapStatusToErrorMessage(e)));
    } else {
      setType("pool");
      setInSameJob(false);
      setSelectedWorker(null);
    }
  }, [visible]);

  useEffect(() => {
    if (inSameJob) {
      getReleaseWorker({
        projectId,
        recordIds: selectedRecordIds,
        pageIndex: 0,
        pageSize: 100000,
      })
        .then((resp) => {
          if (resp.status === HttpStatus.OK) {
            setWorkers(resp.data.results);
          } else {
            message.error(mapStatusToErrorMessage(resp));
          }
        })
        .catch((e) => message.error(mapStatusToErrorMessage(e)));
    }
  }, [inSameJob]);

  return (
    <MaterialModal
      title={formatMessage(
        { id: "project.detail.data-center.release.title" },
        { num: selectedRecordIds.length }
      )}
      visible={visible}
      onSave={release}
      saveLoading={loading}
      disabled={type === "worker" && !selectedWorker}
      onClose={onClose}
    >
      <Alert
        message={
          <h3 style={{ marginLeft: -8, color: "#42526e", fontSize: 14 }}>
            <InfoCircleOutlined style={{ color: "#E1AB0A", marginRight: 6 }} />
            {formatMessage({
              id: "project.detail.data-center.release.tip.title",
            })}
          </h3>
        }
        description={
          <div style={{ marginLeft: 12 }}>
            <p style={{ margin: 0, color: "#42526e" }}>
              {formatMessage({
                id: "project.detail.data-center.release.tip.content-1",
              })}
            </p>
            <p style={{ margin: 0, color: "#42526e" }}>
              {formatMessage({
                id: "project.detail.data-center.release.tip.content-2",
              })}
            </p>
            <p style={{ margin: 0, color: "#42526e" }}>
              {formatMessage({
                id: "project.detail.data-center.release.tip.content-3",
              })}
            </p>
          </div>
        }
        type="warning"
        style={{ marginBottom: 16 }}
      />
      <p
        style={{
          margin: "0 0 16px",
          fontWeight: "bold",
          color: "#42526e",
        }}
      >
        {formatMessage({
          id: "project.detail.data-center.release.select-type",
        })}
      </p>
      <Radio.Group
        onChange={(e) => {
          setType(e.target.value);
          setSelectedWorker(null);
        }}
        value={type}
      >
        <Radio
          value="pool"
          style={{
            color: type === "pool" ? "#42526e" : "#7a869a",
            marginBottom: 8,
          }}
        >
          {formatMessage({ id: "project.detail.data-center.release.to-pool" })}
        </Radio>
        <Radio
          value="worker"
          style={{ color: type === "worker" ? "#42526e" : "#7a869a" }}
          disabled={!inSameJob}
        >
          {formatMessage({
            id: "project.detail.data-center.release.to-worker",
          })}
        </Radio>
      </Radio.Group>
      {type === "worker" && (
        <>
          <p
            style={{
              margin: "24px 0 16px",
              fontWeight: "bold",
              color: "#42526e",
            }}
          >
            {formatMessage({
              id: "project.detail.data-center.release.select-worker",
            })}
          </p>
          <Select
            style={{ width: 348 }}
            showSearch
            onChange={(v) => setSelectedWorker(v)}
            value={selectedWorker}
            filterOption={(input, option) =>
              (option!.children as unknown as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onPopupScroll={(...args) => console.log(args)}
          >
            {workers.map((item) => (
              <Select.Option key={item.workerId}>
                {item.uniqueName}
              </Select.Option>
            ))}
          </Select>
        </>
      )}
    </MaterialModal>
  );
}

export default connect()(DataRelease);
