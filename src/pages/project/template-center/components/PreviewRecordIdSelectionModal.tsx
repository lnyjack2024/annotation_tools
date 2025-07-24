import React, { useState } from "react";
import { Form, Input, Modal, Spin } from "antd";
import { useIntl } from "@umijs/max";

import { getProjectDataDetail } from "@/services/project";
import { HttpStatus } from "@/types/http";
import type { ProjectTemplate } from "@/types/v3";
import { DataOriState } from "@/pages/project/data-center/components/DataList";

type Props = {
  template: ProjectTemplate | null;
  onCancel?: () => void;
  onOk?: (source: Record<string, string>) => void;
};

const PreviewRecordIdSelectionModal: React.FC<Props> = ({
  template,
  onOk,
  onCancel,
}) => {
  const { formatMessage } = useIntl();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // TODO wrap following part as function
        setLoading(true);
        getProjectDataDetail({
          recordId: values.recordId,
          projectId: template.projectId,
        })
          .then((resp) => {
            if (resp.status === HttpStatus.OK) {
              if (resp.data) {
                if (resp.data.oriState === DataOriState.DELETED) {
                  setErrMsg(formatMessage({ id: "preview-data-not-found" }));
                  return;
                }
                if (resp.data.dataType !== template.dataType) {
                  setErrMsg(formatMessage({ id: "data-type-mismatch" }));
                  return;
                }
                onOk?.({
                  recordId: values.recordId,
                  projectId: template.projectId,
                });
              } else {
                setErrMsg(formatMessage({ id: "preview-data-not-found" }));
              }
            } else {
              setErrMsg(formatMessage({ id: "preview-data-not-found" }));
            }
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCancel = () => {
    setErrMsg("");
    onCancel?.();
  };

  return (
    <Modal
      title={formatMessage({ id: "choose-preview-data" })}
      className="custom-modal"
      visible={!!template?.id}
      onCancel={handleCancel}
      onOk={handleOk}
      maskClosable={false}
      okText={formatMessage({ id: "common.confirm" })}
    >
      <Spin spinning={loading}>
        <Form layout="vertical" form={form}>
          <Form.Item
            label={formatMessage({
              id: "project.detail.data-center.add-data.data-type",
            })}
          >
            {template?.dataType ? (
              <span>
                {formatMessage({ id: `data.type.${template.dataType}` })}
              </span>
            ) : (
              <span>N/A</span>
            )}
          </Form.Item>
          <Form.Item
            name="recordId"
            initialValue="1"
            label={formatMessage({ id: "common.column.recordId" })}
            extra={errMsg && <span style={{ color: "#df3636" }}>{errMsg}</span>}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input
              onChange={() => {
                if (errMsg) {
                  setErrMsg("");
                }
              }}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PreviewRecordIdSelectionModal;
