import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Popover, Form } from "antd";
import { useEffect } from "react";
import { useIntl } from "@umijs/max";

import { WorkerNumValidator } from "@/utils/validator";

export interface DistributionInfo {
  recordNum?: number;
  workerNum?: number;
}

interface DistributionEditModalProps {
  visible: boolean;
  multipleRecords: boolean;
  distribution: DistributionInfo;
  submitting: boolean;
  showDataSelection: boolean;
  showRecordNum: boolean;
  showWorkerNum?: boolean;
  onCancel: () => void;
  onSubmit: (distribution: DistributionInfo) => void;
}

function DistributionEditModal({
  visible,
  multipleRecords,
  distribution,
  submitting,
  showRecordNum,
  showWorkerNum = true,
  onCancel,
  onSubmit,
}: DistributionEditModalProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [form] = Form.useForm();

  useEffect(() => {
    if (!visible) {
      form.resetFields();
    }
  }, [form, visible]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  const recordNumLabel = (
    <span>
      {formatMessage({ id: "job-detail.distribution.form.record-num" })}
      {!multipleRecords && (
        <Popover
          content={formatMessage({
            id: "job-detail.distribution.form.record-num.tip",
          })}
        >
          <InfoCircleOutlined style={{ margin: "0 5px" }} />
        </Popover>
      )}
    </span>
  );

  return (
    <Modal
      destroyOnClose
      visible={visible}
      footer={null}
      maskClosable={false}
      onCancel={onCancel}
    >
      <h3>{formatMessage({ id: "job-detail.distribution.edit" })}</h3>
      <br />
      <Form
        form={form}
        hideRequiredMark
        colon={false}
        onFinish={handleSubmit}
        initialValues={{
          ...distribution,
        }}
      >
        {showRecordNum && (
          <Form.Item
            name="recordNum"
            label={recordNumLabel}
            rules={[
              {
                required: true,
                message: formatMessage({
                  id: "job-detail.distribution.form.record-num.required",
                }),
              },
              {
                pattern: /^[1-9]+[\d]*$/,
                message: formatMessage({
                  id: "job-detail.distribution.form.number.error",
                }),
              },
            ]}
          >
            <Input disabled={!multipleRecords} />
          </Form.Item>
        )}
        {showWorkerNum && (
          <Form.Item
            name="workerNum"
            label={formatMessage({
              id: "job-detail.distribution.form.worker-num",
            })}
            rules={[
              {
                required: true,
                message: formatMessage({
                  id: "job-detail.distribution.form.worker-num.required",
                }),
              },
              {
                pattern: /^[1-9]+[\d]*$/,
                message: formatMessage({
                  id: "job-detail.distribution.form.number.error",
                }),
              },
              {
                validator: WorkerNumValidator,
              },
            ]}
          >
            <Input />
          </Form.Item>
        )}
        <div style={{ textAlign: "right", paddingTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {formatMessage({ id: "common.save" })}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default DistributionEditModal;
