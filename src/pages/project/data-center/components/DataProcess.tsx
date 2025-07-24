import { useEffect, useState } from "react";
import { Button, message, Table } from "antd";
import { useIntl } from "@umijs/max";

import MaterialModal from "@/components/MaterialModal";
import { getProjectDataDetail } from "@/services/project";
import { mapStatusToErrorMessage } from "@/utils/utils";

type Props = {
  visible: boolean;
  recordId: number;
  projectId: string;
  onClose: () => void;
};

function DataProcess({ visible, recordId, projectId, onClose }: Props) {
  const { formatMessage } = useIntl();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: formatMessage({
        id: "project.detail.data-center.process.action-time",
      }),
      dataIndex: "actionTime",
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.process.action-worker",
      }),
      dataIndex: "worker",
    },
    {
      title: formatMessage({ id: "project.detail.data-center.process.node" }),
      dataIndex: "node",
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.process.labeling",
      }),
      render() {
        return (
          <Button type="link" style={{ padding: 0 }}>
            {formatMessage({ id: "common.view" })}
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    if (visible && recordId) {
      setLoading(true);
      getProjectDataDetail({ recordId, projectId })
        .then((resp) => {
          setData([resp.data]);
        })
        .catch((e) => message.error(mapStatusToErrorMessage(e)))
        .finally(() => setLoading(false));
    }
  }, [visible, recordId]);

  return (
    <MaterialModal
      title={formatMessage({
        id: "project.detail.data-center.column.schedule",
      })}
      visible={visible}
      onClose={onClose}
      showFooter={false}
    >
      <Table
        rowKey="actionTime"
        className="tableStriped"
        style={{ borderTop: "1px solid #F0F0F0" }}
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={false}
      />
    </MaterialModal>
  );
}

export default DataProcess;
