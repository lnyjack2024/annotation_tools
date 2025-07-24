import { useState } from "react";
import { Form, Tag, InputNumber, message } from "antd";
import MaterialModal from "@/components/MaterialModal";
import { useIntl } from "@umijs/max";

import { updateWorkerSample, updateQaOverallSample } from "@/services/job";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";

interface Props {
  visible: boolean;
  workers?: any[];
  jobId: string;
  totalNum: number;
  mode?: "all" | "batch";
  onClose: () => void;
  onRefresh: () => void;
}

function BatchEditRateModal({
  mode = "all",
  workers = [],
  jobId,
  totalNum,
  visible,
  onClose,
  onRefresh,
}: Props) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then((values) => {
      setSubmitting(true);
      (mode === "all"
        ? updateQaOverallSample(jobId, values.sampleRate)
        : updateWorkerSample(
            workers.map((worker) => ({
              ...worker,
              qaJobId: jobId,
              sampleRate: values.sampleRate,
            }))
          )
      )
        .then((resp) => {
          if (resp.status === HttpStatus.OK) {
            onClose();
            onRefresh();
          } else {
            message.error(mapStatusToErrorMessage(resp));
          }
        })
        .catch((e) => message.error(mapStatusToErrorMessage(e)))
        .finally(() => setSubmitting(false));
    });
  };

  return (
    <MaterialModal
      title={mode && formatMessage({ id: `job.qa.set-rate.modify-${mode}` })}
      width={760}
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      saveLoading={submitting}
    >
      {mode === "batch" ? (
        <div>
          <p style={{ margin: "0 0 12px", color: "#42526e" }}>
            {formatMessage(
              { id: "job.qa.set-rate.selected-worker" },
              { number: workers.length }
            )}
          </p>
          {workers.map((item) => (
            <Tag
              style={{
                marginBottom: 16,
                marginRight: 16,
                borderRadius: 4,
                background: "#f6f7f9",
                height: 28,
                lineHeight: "28px",
              }}
            >
              {item.workerEmail}
            </Tag>
          ))}
        </div>
      ) : (
        <p style={{ color: "#42526e" }}>
          {formatMessage(
            { id: "job.qa.set-rate.all-worker" },
            { number: totalNum }
          )}
        </p>
      )}
      <Form form={form}>
        <Form.Item
          label={
            <span style={{ color: "#42526e" }}>
              {formatMessage({ id: "job.qa.set-rate.modify-label" })}
            </span>
          }
        >
          <Form.Item
            noStyle
            name="sampleRate"
            rules={[
              {
                validator: (rule, value, callback) => {
                  if (!value && value !== 0) {
                    callback(formatMessage({ id: "job.qa.set-rate.required" }));
                  } else {
                    callback();
                  }
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: 160 }}
              min={0}
              max={100}
              precision={0}
            />
          </Form.Item>
          <span style={{ marginLeft: 8 }}>%</span>
        </Form.Item>
      </Form>
    </MaterialModal>
  );
}

export default BatchEditRateModal;
