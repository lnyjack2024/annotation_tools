import { LabelWorkload } from "@/types/job";
import { Table } from "antd";
import { useIntl } from "@umijs/max";
import { ColumnProps } from "antd/es/table";
import { humanizeSeconds } from "@/utils/time-util";

type Props = {
  workload: LabelWorkload;
};

function LabelWorkloadTable({ workload }: Props) {
  const { formatMessage } = useIntl();

  const labelingColumns: ColumnProps<LabelWorkload>[] = [
    {
      key: "labelCount",
      title: formatMessage({ id: "workload.column.labeling-items" }),
      dataIndex: "labelCount",
      render: (labelCount: number) => labelCount || 0,
    },
    {
      key: "reworkCountByOther",
      title: formatMessage({ id: "workload.column.reworked-by-items" }),
      dataIndex: "reworkCountByOther",
      render: (reworkCountByOther: number) => reworkCountByOther || 0,
    },
    {
      key: "reworkCountToOther",
      title: formatMessage({ id: "workload.column.reworked-items" }),
      dataIndex: "reworkCountToOther",
      render: (reworkCountToOther: number) => reworkCountToOther || 0,
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
      columns={labelingColumns}
      dataSource={[workload]}
    />
  );
}

export default LabelWorkloadTable;
