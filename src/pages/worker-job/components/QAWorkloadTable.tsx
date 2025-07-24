import { QAWorkload } from "@/types/job";
import { Table } from "antd";
import { useIntl } from "@umijs/max";
import { ColumnProps } from "antd/es/table";
import { humanizeSeconds } from "@/utils/time-util";

type Props = {
  workload: QAWorkload;
};

function QAWorkloadTable({ workload }: Props) {
  const { formatMessage } = useIntl();

  const qaColumns: ColumnProps<QAWorkload>[] = [
    {
      key: "qaCount",
      title: formatMessage({ id: "workload.column.qa-count" }),
      dataIndex: "qaCount",
      render: (qaCount: number) => qaCount || 0,
    },
    {
      key: "passRate",
      title: formatMessage({ id: "workload.column.pass-fail-count" }),
      render: (r) => `${r.qaPassCount || 0}/${r.qaRejectCount || 0}`,
    },
    {
      key: "qaRecordCount",
      title: formatMessage({ id: "workload.column.qa-items" }),
      dataIndex: "qaRecordCount",
      render: (qaRecordCount: number) => qaRecordCount || 0,
    },
    {
      key: "timeBySeconds",
      title: formatMessage({ id: "workload.column.cost" }),
      dataIndex: "timeBySeconds",
      render: (v: number) => <span>{humanizeSeconds(v, 3)}</span>,
    },
  ];

  if (!workload) {
    return null;
  }

  return (
    <Table
      className="tableStriped"
      rowKey="workerId"
      columns={qaColumns}
      dataSource={[workload]}
    />
  );
}

export default QAWorkloadTable;
