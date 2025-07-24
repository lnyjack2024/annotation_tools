import { CSSProperties } from "react";
import { useIntl } from "@umijs/max";

import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { WorkerJobStatus, FormItemType } from "@/types";

export enum OrientationType {
  ORIENTATION = "orientation",
  NOT_ORIENTATION = "not-orientation",
}

interface Props {
  isOrientation?: boolean;
  onFilterChange: (filter: any) => void;
  initialValue: Record<string, any>;
  isOrientationWithAll?: boolean;
  formStyle?: CSSProperties;
}

function WorkforceFilter({
  onFilterChange,
  initialValue,
  isOrientation = true,
  isOrientationWithAll = false,
  formStyle,
}: Props) {
  const { formatMessage } = useIntl();

  const formItems: FormItem[] = [
    {
      key: "uniqueName",
      type: FormItemType.Text,
      label: null,
      placeholder: formatMessage({ id: "common.input.placeholder" }),
      style: { width: 160 },
    },
    {
      key: "statusList",
      type: FormItemType.Single,
      label: null,
      options: [
        WorkerJobStatus.ALL,
        WorkerJobStatus.CONFIRMED,
        WorkerJobStatus.DETAINED,
        WorkerJobStatus.REJECT,
        WorkerJobStatus.ASSIGNED,
        WorkerJobStatus.DECLINED,
      ],
      optionLabel: (val: WorkerJobStatus) =>
        formatMessage({ id: `workflow.worker.status.${val?.toLowerCase()}` }),
      style: { width: 160 },
    },
  ];

  if (isOrientation) {
    const options = [
      { label: OrientationType.ORIENTATION, value: true },
      {
        label: OrientationType.NOT_ORIENTATION,
        value: false,
      },
    ];
    formItems.push({
      key: "assignedFlag",
      type: FormItemType.Single,
      label: isOrientationWithAll
        ? formatMessage({ id: "qa.batch.setting.query.is-orientate" })
        : null,
      options: isOrientationWithAll
        ? [
            {
              label: "all",
              value: "",
            },
            ...options,
          ]
        : options,
      placeholder: formatMessage({
        id: "workflow.worker.orientation-type.if-orientation",
      }),
      optionLabel: (val: Record<string, any>) =>
        formatMessage({
          id: `workflow.worker.orientation-type.${val?.label.toLowerCase()}`,
        }),
      optionValueKey: "value",
      style: { width: isOrientationWithAll ? 80 : 160 },
    });
  }

  return (
    <FilterFormComponent
      formItems={formItems}
      formStyle={{ marginBottom: 0, ...formStyle }}
      formItemStyle={isOrientationWithAll ? { marginRight: 0 } : null}
      initialValue={initialValue}
      onFilterValueChange={onFilterChange}
    />
  );
}

export default WorkforceFilter;
