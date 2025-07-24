import LabelWorkloadTable from "@/pages/project/workflow/WorkflowDetail/Workload/LabelWorkloadTable";
import QaWorkloadTable from "@/pages/project/workflow/WorkflowDetail/Workload/QaWorkloadTable";
import { Job, JobType } from "@/types/job";
import FilterFormComponent from "@/components/FilterFormComponent";
import { FormItem, FormItemType } from "@/types/common";
import { useIntl } from "@@/plugin-locale/localeExports";
import { useState } from "react";
import { Card } from "antd";

type Filter = {
  startDate?: string;
  endDate?: string;
  workerName?: string;
};

function BpoWorkloadV3({ job }: { job: Job }) {
  const { formatMessage } = useIntl();
  const [filter, setFilter] = useState<Filter>({});

  const filterFormItems: FormItem[] = [
    {
      key: "date",
      label: null,
      type: FormItemType.DateRanger,
    },
    {
      key: "workerName",
      label: (
        <span style={{ color: "#42526e" }}>
          {formatMessage({ id: "common.worker" })}
        </span>
      ),
      type: FormItemType.Text,
    },
  ];

  return (
    <Card title={formatMessage({ id: "job.monitor.label.detail" })}>
      <FilterFormComponent
        formItems={filterFormItems}
        formStyle={{ float: "left" }}
        initialValue={filter || {}}
        onFilterValueChange={(v) => {
          const { date, ...rest } = v;
          const newFilter = {
            ...rest,
            startDate: date
              ? date?.[0]?.startOf("day")?.format("YYYY-MM-DD HH:mm:ss")
              : null,
            endDate: date
              ? date?.[1]?.endOf("day")?.format("YYYY-MM-DD HH:mm:ss")
              : null,
          };
          setFilter(newFilter);
        }}
        searchMode="click"
      />
      {job?.jobType === JobType.LABEL && (
        <LabelWorkloadTable job={job} filter={filter} role="bpo" />
      )}
      {job?.jobType === JobType.QA && (
        <QaWorkloadTable job={job} filter={filter} role="bpo" />
      )}
    </Card>
  );
}

export default BpoWorkloadV3;
