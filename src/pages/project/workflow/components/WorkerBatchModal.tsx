import { useEffect, useMemo, useRef, useState } from "react";
import { message, Button, Tag, Modal, Steps } from "antd";
import { useIntl } from "@umijs/max";
import classnames from "classnames";
import { RightOutlined } from "@ant-design/icons";

import { getTargetJobs, upsertWorkerBatchData } from "@/services/job";
import { AvailableTargetJobsResultItem } from "@/types/project";
import { useAsync, useToggle } from "@/hooks";
import { safeFetch } from "@/utils";
import { ModalWithModalWrap } from "@/components/ModalWithModalWrap";
import { map2ruleLines } from "./utils";
import { OrientatedSelector } from "./OrientatedSelector";
import styles from "./JobDetailDrawer.less";

const { Step } = Steps;

interface Props {
  jobId: string;
  visible: boolean;
  isQAJob: boolean;
  isBPO?: boolean;
  onClose: () => void;
  onSave: () => void;
  setDisableBatchQa: (status: boolean) => void;
}

export default function WorkerBatchModal({
  jobId,
  visible,
  isQAJob,
  isBPO,
  onClose,
  onSave,
  setDisableBatchQa,
}: Props) {
  const { formatMessage } = useIntl();
  const [selectedJobId, setSelectedJobId] = useState("");
  const { visible: shiftVisible, toggle } = useToggle();
  const { visible: loading, toggle: setLoading } = useToggle(false);
  const [updated, setUpdated] = useState(false);
  const ref = useRef(null);
  const { data: targetJobs, fetchData: fetchTargetJobs } = useAsync<
    AvailableTargetJobsResultItem[]
  >(getTargetJobs, jobId, isQAJob, []);
  const configuredJob = targetJobs.find((i) => i.isConfiguredRule);
  const selectedJob = useMemo(
    () => targetJobs.find((i) => i.jobId === selectedJobId),
    [targetJobs, selectedJobId]
  );

  useEffect(() => {
    setDisableBatchQa(!targetJobs.length);
  }, [targetJobs.length]);

  useEffect(() => {
    setUpdated(false);
  }, [visible]);

  const resetSelectedJobId = async () => {
    // clear both local and server
    setLoading(true);
    await safeFetch({
      api: upsertWorkerBatchData,
      params: {
        qaJobId: jobId,
        qaTargetJobId: configuredJob?.jobId,
        ruleLines: [],
      },
      onSuccess: () => {
        toggle(false);
      },
      onFinally: () => setLoading(false),
    });
  };

  async function onConfirm() {
    setLoading();
    await safeFetch({
      api: upsertWorkerBatchData,
      params: {
        qaJobId: jobId,
        qaTargetJobId: selectedJobId,
        ruleLines: map2ruleLines(ref.current.map),
      },
      onSuccess: () => {
        message.success(formatMessage({ id: "qa.batch.setting.success" }));
        meaningfulFetchWorkTargets();
        onSave();
        onClose();
      },
      onFinally: () => setLoading(false),
    });
  }

  function goPrevStep() {
    //是否有改动
    if (!updated) {
      // map.size === 0: clear local
      setSelectedJobId("");
      // onClosePrevStep();
    } else {
      Modal.confirm({
        title: formatMessage({ id: "common.confirm" }),
        content: formatMessage({ id: "qa.batch.back.confirmed" }),
        onOk: () => {
          setSelectedJobId("");
          ref.current?.clearAll();
        },
      });
      // toggle(true);
    }
  }

  function needReset() {
    const configuredJobId = configuredJob?.jobId;

    return configuredJobId && configuredJobId !== selectedJobId;
  }

  const saveHandle = async () => {
    await resetSelectedJobId();
    await onConfirm();
  };

  async function clearBeforeUpload() {
    if (needReset()) {
      await resetSelectedJobId();
    }
  }

  async function meaningfulFetchWorkTargets() {
    if (needReset()) {
      await fetchTargetJobs();
    }
  }

  return (
    <ModalWithModalWrap
      width={1200}
      reducedHeight={"auto"}
      destroyOnClose
      visible={visible}
      onCancel={onClose}
      title={
        <div>
          {formatMessage({ id: "qa.batch.setting" })}
          <Tag hidden={!selectedJob} style={{ marginLeft: 12 }}>
            {selectedJob?.jobName}
          </Tag>
        </div>
      }
      footer={
        selectedJobId && [
          <Button key="back" onClick={goPrevStep}>
            {formatMessage({ id: "common.prev-step" })}
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!updated}
            loading={loading}
            onClick={() => {
              if (needReset()) {
                toggle(true);
              } else {
                onConfirm();
              }
            }}
          >
            {formatMessage({ id: "common.save" })}
          </Button>,
        ]
      }
    >
      <div className="flex-center">
        <Steps
          size="small"
          current={selectedJobId ? 2 : 1}
          style={{ width: 424, marginBottom: 22 }}
        >
          <Step title={formatMessage({ id: "qa.batch.setting.step1" })} />
          <Step title={formatMessage({ id: "qa.batch.setting.step2" })} />
        </Steps>
      </div>
      {selectedJob ? (
        <OrientatedSelector
          ref={ref}
          isBPO={isBPO}
          jobId={jobId}
          selectedJobId={selectedJobId}
          setUpdated={setUpdated}
          onClear={clearBeforeUpload}
          afterUploaded={() => {
            meaningfulFetchWorkTargets();
            onSave();
          }}
        />
      ) : (
        <div className={styles["select-box"]}>
          <p className={styles.tip}>
            {formatMessage({ id: "target.job.select" })}
          </p>
          {targetJobs.map((item) => (
            <div
              key={item.jobId}
              className={classnames(styles.targetJob, {
                [styles.disabled]: !item.isViewer,
              })}
              onClick={() => {
                if (!item.isViewer) {
                  return;
                }
                setSelectedJobId(item.jobId);
              }}
            >
              {item.jobName}
              {item.isConfiguredRule && (
                <span style={{ position: "absolute", right: 40 }}>
                  {formatMessage({ id: "common.set" })}
                </span>
              )}
              <RightOutlined className={styles.arrow} />
            </div>
          ))}
        </div>
      )}

      <Modal
        okType="danger"
        visible={shiftVisible}
        maskClosable={false}
        okText={formatMessage({ id: "common.clear-all" })}
        title={formatMessage({ id: "common.tips" })}
        onOk={saveHandle}
        confirmLoading={loading}
        onCancel={toggle}
      >
        {formatMessage(
          { id: "project.detail.analysis.workload.prev-step" },
          { name: configuredJob?.jobName }
        )}
      </Modal>
    </ModalWithModalWrap>
  );
}
