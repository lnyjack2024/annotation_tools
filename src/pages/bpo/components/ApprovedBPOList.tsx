import { Button, Dropdown, Menu, Table, Popconfirm } from "antd";
import type { PaginationProps } from "antd/es/pagination";
import type { ColumnProps } from "antd/es/table";
import { useIntl } from "@umijs/max";

import type { BPO, BPOActiveStatus } from "@/types/vm";
import StatusActionButton from "@/pages/bpo/components/StatusActionButton";
import { getBPOListColumns } from "../superadmin/BPOTableColumns";
import { EllipsisOutlined } from "@ant-design/icons";

interface ApprovedBPOListProp {
  pagination: PaginationProps;
  bpoList: BPO[];
  editTag: (bpo: BPO) => void;
  updateBPOActiveStatus: (bpoId: string, status: BPOActiveStatus) => void;
  onUpdate: (bpoId: string) => void;
  onDelete: (bpoId: string) => void;
  updating: boolean;
  loading: boolean;
}

export default function ApprovedBPOList({
  pagination,
  bpoList,
  editTag,
  updateBPOActiveStatus,
  updating,
  loading,
  onUpdate,
  onDelete,
}: ApprovedBPOListProp) {
  const intl = useIntl();
  const { formatMessage } = intl;

  const columns: ColumnProps<BPO>[] = [
    ...getBPOListColumns("approved", editTag),
    {
      title: formatMessage({ id: "common.operation" }),
      fixed: "right",
      render: (record: BPO) => (
        <>
          <StatusActionButton
            record={record}
            updating={updating}
            onClick={updateBPOActiveStatus}
          />
          <Dropdown
            placement="bottomRight"
            trigger={["hover"]}
            overlay={
              <Menu style={{ textAlign: "center" }}>
                <Menu.Item
                  key="release"
                  onClick={() => {
                    onUpdate(record.bpoId);
                  }}
                >
                  <Button type="link">
                    {formatMessage({ id: "common.update" })}
                  </Button>
                </Menu.Item>
                <Popconfirm
                  title={formatMessage({ id: "common.confirm.delete" })}
                  onConfirm={() => {
                    onDelete(record.bpoId);
                  }}
                >
                  <Menu.Item>
                    <Button type="link" danger>
                      {formatMessage({ id: "common.delete" })}
                    </Button>
                  </Menu.Item>
                </Popconfirm>
              </Menu>
            }
          >
            <EllipsisOutlined
              style={{ cursor: "pointer", fontSize: 20, marginLeft: 8 }}
            />
          </Dropdown>
        </>
      ),
    },
  ];

  return (
    <>
      <Table
        scroll={{ x: "max-content" }}
        className="tableStriped"
        rowKey="bpoId"
        columns={columns}
        dataSource={bpoList || []}
        pagination={pagination}
        loading={loading}
      />
    </>
  );
}
