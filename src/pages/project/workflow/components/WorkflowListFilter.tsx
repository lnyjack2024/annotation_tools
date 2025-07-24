import { useEffect, useState } from "react";
import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import { useIntl } from "@umijs/max";
import type { ProjectFlowParam } from "@/types/project";
import { FlowStatus } from "@/types/project";
import type { BPO } from "@/types/vm";
import { JobTenantType } from "@/types/job";
import { getProjectBpoList } from "@/services/project";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { message } from "antd";

interface Props {
  projectId: string;
  onFilterChange: (filter: ProjectFlowParam) => void;
}

function WorkflowListFilter({ projectId, onFilterChange }: Props) {
  const { formatMessage } = useIntl();
  const [bpo, setBpo] = useState<BPO[]>([]);

  const teams = Object.keys(JobTenantType).map((item) => ({
    label: formatMessage({
      id: `workflow.job-type.team.${item.toLowerCase()}`,
    }),
    value: item,
    children:
      item === JobTenantType.COMPANY
        ? bpo.map((i) => ({
            value: i.bpoId,
            label: i.name,
          }))
        : [],
  }));

  const formItems: FormItem[] = [
    {
      key: "flowName",
      type: FormItemType.Text,
      label: formatMessage({
        id: "project.detail.data-center.filter.process-data.workflow",
      }),
      placeholder: formatMessage({ id: "common.input.placeholder" }),
    },
    {
      key: "flowStatus",
      type: FormItemType.Single,
      label: formatMessage({ id: "workflow.status" }),
      options: Object.values(FlowStatus),
      optionLabel: (val: FlowStatus) =>
        formatMessage({ id: `workflow.status.${val?.toLowerCase()}` }),
      style: { width: 160 },
    },
    {
      key: "jobDisplayId",
      type: FormItemType.Text,
      label: formatMessage({ id: "jobDisplayId" }),
      placeholder: formatMessage({ id: "common.input.placeholder" }),
    },
    {
      key: "jobTeamType",
      type: FormItemType.Cascader,
      label: formatMessage({ id: "workflow.team" }),
      options: teams,
      optionValueKey: "value",
      optionLabelKey: "label",
      style: { width: 160 },
    },
  ];

  useEffect(() => {
    if (!projectId) {
      return;
    }

    getProjectBpoList(projectId)
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setBpo(resp.data);
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)));
  }, [projectId]);

  return (
    <FilterFormComponent
      searchMode="click"
      formStyle={{ marginTop: 16 }}
      buttonStyle={{ marginBottom: 24 }}
      formItems={formItems}
      initialValue={{}}
      onFilterValueChange={onFilterChange}
    />
  );
}

export default WorkflowListFilter;
