import React, { useEffect, useState } from "react";
import { Modal, Table } from "antd";
import { useIntl } from "@umijs/max";

import type { ProjectTemplateHistory } from "@/services/template-v3";
import { getProjectTemplateHistory } from "@/services/template-v3";
import { dateFormat } from "@/utils/time-util";
import { HttpStatus } from "@/types/http";
import type { ColumnProps } from "antd/es/table";

type Props = {
  templateId: string;
  onCancel?: () => void;
};

const TemplateEditHistoryModal: React.FC<Props> = ({
  templateId,
  onCancel,
}) => {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState<ProjectTemplateHistory[]>([]);

  useEffect(() => {
    if (templateId) {
      setLoading(true);
      getProjectTemplateHistory(templateId)
        .then((resp) => {
          if (resp.status === HttpStatus.OK) {
            setHistoryList(resp.data);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [templateId]);

  const columns: ColumnProps<ProjectTemplateHistory>[] = [
    {
      title: formatMessage({ id: "common.operator" }),
      dataIndex: "operatorName",
    },
    {
      title: formatMessage({ id: "common.updated-at" }),
      dataIndex: "updatedTime",
      render: (dt) => dateFormat(dt),
    },
  ];

  return (
    <Modal
      className="custom-modal"
      title={formatMessage({ id: "edit-history" })}
      maskClosable={false}
      visible={!!templateId}
      footer={null}
      onCancel={onCancel}
    >
      <Table
        rowKey="id"
        className="tableStriped"
        loading={loading}
        dataSource={historyList}
        columns={columns}
        pagination={false}
      />
    </Modal>
  );
};

export default TemplateEditHistoryModal;
