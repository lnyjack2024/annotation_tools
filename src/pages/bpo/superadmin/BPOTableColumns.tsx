import { EditOutlined } from "@ant-design/icons";
import { Badge, Button } from "antd";
import { FormattedMessage, history } from "@umijs/max";
import type { ColumnProps } from "antd/es/table";

import type { BPO } from "@/types/vm";
import { BPOActiveStatus } from "@/types/vm";
import BPOTagComponent from "@/pages/bpo/components/BPOTagComponent";
import moment from "moment";

export function getBPOListColumns(
  bpoListName: "approved" | "applying" | "declined" | "invited",
  editTag?: (bpo: BPO) => void
): ColumnProps<BPO>[] {
  const bpo = {
    title: <FormattedMessage id="bpo-list.bpo" />,
    render: (record: BPO) => (
      <>
        <p style={{ margin: 0, fontWeight: "bold", color: "#42526e" }}>
          {record.name}
        </p>
        <p style={{ margin: 0, color: "#7a869a" }}>{record.bpoCode}</p>
        <div style={{ margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <BPOTagComponent tags={record.tags || []} />
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => editTag(record)}
            />
          </div>
        </div>
      </>
    ),
  };

  const contact = {
    title: <FormattedMessage id="bpo-list.bpo.contact" />,
    render: (record: BPO) => (
      <>
        <p style={{ margin: 0, fontWeight: "bold", color: "#42526e" }}>
          {record.contact}
        </p>
        <p style={{ margin: 0, color: "#7a869a" }}>{record.contactEmail}</p>
        <p style={{ margin: 0, color: "#7a869a" }}>{record.contactPhone}</p>
      </>
    ),
  };

  const createdTime = {
    title: <FormattedMessage id="common.createdTime" />,
    dataIndex: "createdTime",
    render: (createdTime: string) => {
      if (!createdTime) {
        return <FormattedMessage id="common.nothing-symbol" />;
      }

      const [day, time] = moment(createdTime)
        .format("YYYY-MM-DD HH:mm")
        .split(" ");

      return (
        <>
          <p style={{ color: "#42526e", margin: 0 }}>{day}</p>
          <p style={{ color: "#42526e", margin: 0 }}>{time}</p>
        </>
      );
    },
  };

  const bpoDisplayId = {
    title: <FormattedMessage id="bpo-list.bpo.codename" />,
    dataIndex: "bpoDisplayId",
  };

  const bpoName = {
    title: <FormattedMessage id="bpo-list.bpo.name" />,
    dataIndex: "name",
  };

  const bpoContact = {
    title: <FormattedMessage id="bpo-list.bpo.contactName" />,
    dataIndex: "contact",
  };

  const bpoContactPhone = {
    title: <FormattedMessage id="bpo-list.bpo.contactPhone" />,
    dataIndex: "contactPhone",
  };

  const bpoEmail = {
    title: <FormattedMessage id="bpo-list.bpo.contactEmail" />,
    dataIndex: "contactEmail",
  };

  const bpoWorkerNumber = {
    title: <FormattedMessage id="bpo-list.bpo.workerNum" />,
    dataIndex: "workerNumber",
    render: (workerNumber: number, record: BPO) => {
      return (
        <>
          {record.currentWorkerNumber || 0}/{workerNumber}
          <Button
            type="link"
            style={{ padding: "0 4px" }}
            onClick={() => history.push(`/bpo/${record.bpoId}/workforce`)}
          >
            <FormattedMessage id="common.view" />
          </Button>
        </>
      );
    },
  };

  const bpoStatus = {
    title: <FormattedMessage id="bpo-list.bpo.status" />,
    dataIndex: "activeStatus",
    render: (status: BPOActiveStatus) => (
      <>
        {status ? (
          <Badge
            color={status === BPOActiveStatus.ACTIVE ? "green" : "red"}
            text={
              <FormattedMessage
                id={`bpo-list.bpo.status.${status.toLowerCase()}`}
              />
            }
          />
        ) : (
          <FormattedMessage id="common.nothing-symbol" />
        )}
      </>
    ),
  };

  if (bpoListName === "approved") {
    return [bpo, contact, createdTime, bpoWorkerNumber, bpoStatus];
  }

  if (bpoListName === "invited") {
    return [
      bpoDisplayId,
      bpoName,
      bpoContact,
      bpoContactPhone,
      bpoEmail,
      bpoWorkerNumber,
    ];
  }

  return [];
}
