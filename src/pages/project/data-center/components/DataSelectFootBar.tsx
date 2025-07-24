import type { CSSProperties } from "react";
import React, { useState } from "react";
import type { ColumnProps } from "antd/es/table";
import type { TablePaginationConfig } from "antd";
import { Button, Table, Pagination } from "antd";
import { useIntl } from "@umijs/max";

import MaterialModal from "@/components/MaterialModal";

type Props<T> = {
  actions?: React.ReactNode;
  selectAllButton?: React.ReactNode;
  barVisible?: boolean;
  disabled?: boolean;
  columns: ColumnProps<T>[];
  selectedData: T[];
  onDeselect: (record: T) => void;
  onClear: () => void;
  style?: CSSProperties;
  pagination?: TablePaginationConfig;
};

function DataSelectFootBar<T extends object>({
  style = {},
  selectAllButton,
  actions = null,
  columns = [],
  onDeselect,
  disabled = false,
  barVisible = false,
  onClear,
  selectedData,
  pagination,
}: Props<T>) {
  const { formatMessage } = useIntl();
  const [visible, setVisible] = useState(false);

  const modalColumns = [
    ...columns,
    {
      title: formatMessage({ id: "common.operation" }),
      render: (record: any) => (
        <Button
          danger
          type="link"
          style={{ padding: 0 }}
          onClick={() => onDeselect(record)}
        >
          {formatMessage({ id: "common.select-cancel" })}
        </Button>
      ),
    },
  ];

  if (selectedData.length === 0 && !barVisible) {
    return null;
  }

  return (
    <div
      className="footer-bar"
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        // height: actions ? 112 : 63,
        padding: "16px 24px 18px",
        backgroundColor: "white",
        boxShadow: "0px -4px 8px 0px rgba(122, 134, 154, 0.24)",
        zIndex: 2,
        ...style,
      }}
    >
      <div>
        {selectAllButton}
        <Button
          type="link"
          style={{ padding: 0 }}
          disabled={disabled || selectedData.length === 0}
          onClick={() => setVisible(true)}
        >
          <span style={{ textDecoration: "underline" }}>
            {formatMessage(
              { id: "common.selected" },
              { count: selectedData.length }
            )}
          </span>
        </Button>
        <Button
          danger
          disabled={selectedData.length === 0}
          type="link"
          style={{ padding: 0, marginLeft: 16 }}
          onClick={onClear}
        >
          {formatMessage({ id: "common.clear.selection" })}
        </Button>
        {pagination && (
          <Pagination style={{ float: "right" }} {...pagination} />
        )}
      </div>
      {actions && <div style={{ marginTop: 16 }}>{actions}</div>}
      <MaterialModal
        visible={visible}
        title={formatMessage(
          { id: "common.selected" },
          { count: selectedData?.length }
        )}
        width={800}
        footer={null}
        maskClosable={false}
        onClose={() => setVisible(false)}
      >
        <Table
          scroll={{ x: "max-content" }}
          className="tableStriped"
          rowKey="id"
          columns={modalColumns}
          dataSource={selectedData}
        />
      </MaterialModal>
    </div>
  );
}

export default DataSelectFootBar;
