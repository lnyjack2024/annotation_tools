import type { MouseEvent } from "react";
import React from "react";
import { Button, Modal } from "antd";
import { useIntl } from "@umijs/max";

import type { BPO } from "@/types/vm";
import { BPOActiveStatus } from "@/types/vm";

type Props = {
  record: BPO;
  updating: boolean;
  onClick: (recordId: string, status: BPOActiveStatus) => void;
};

const StatusActionButton: React.FC<Props> = ({ record, onClick, updating }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    const targetStatus =
      record.activeStatus === BPOActiveStatus.ACTIVE
        ? BPOActiveStatus.INACTIVE
        : BPOActiveStatus.ACTIVE;

    if (targetStatus === BPOActiveStatus.INACTIVE) {
      Modal.confirm({
        title: formatMessage(
          {
            id: `bpo-list.company.status.inactive-tip`,
          },
          { name: record.name }
        ),
        onOk() {
          onClick(record.bpoId, targetStatus);
        },
        okText: formatMessage({ id: "common.ok" }),
        cancelText: formatMessage({ id: "common.cancel" }),
      });
    } else {
      onClick(record.bpoId, targetStatus);
    }
  };

  return (
    <Button
      type="link"
      style={{
        color: record.activeStatus === BPOActiveStatus.ACTIVE && "#F56C6C",
        padding: 0,
      }}
      disabled={updating}
      onClick={handleClick}
    >
      {formatMessage({
        id:
          record.activeStatus === BPOActiveStatus.ACTIVE
            ? "bpo-list.bpo.status.inactive"
            : "bpo-list.bpo.operation.activate",
      })}
    </Button>
  );
};

export default StatusActionButton;
