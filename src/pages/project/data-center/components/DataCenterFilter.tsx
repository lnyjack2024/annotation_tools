import React from "react";
import { useIntl } from "@umijs/max";
import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import { DataState } from "@/pages/project/data-center/components/DataList";
import { DataType } from "@/types/dataset";
import { FilterParam } from "@/pages/project/models/dataCenter";
// import { DataAuditSheet, RecordAuditStatus } from '@/types/dataAudit';

type Props = {
  projectId: string;
  value: FilterParam;
  conditions: Record<string, any>;
  onSearch: (filter: any) => void;
  onReset: () => void;
};

const DataCenterFilter: React.FC<Props> = ({
  value,
  conditions,
  onSearch,
  onReset,
}) => {
  const { formatMessage } = useIntl();
  const names = Object.entries(conditions?.batchNumName || []).map(
    ([key, value]) => ({
      value: key,
      label: value,
    })
  );

  const formItems: FormItem[] = [
    {
      key: "recordIds",
      type: FormItemType.Text,
      label: formatMessage({ id: "common.column.recordId" }),
      placeholder: formatMessage({ id: "turnback.search.ids" }),
    },
    {
      key: "batchNumList",
      type: FormItemType.Multiple,
      label: formatMessage({ id: "data.batch" }),
      options: names,
      optionLabelKey: "label",
      optionValueKey: "value",
      optionLabel: (name) => (
        <div>
          <span style={{ marginRight: 4 }}>[{name.value}]</span>
          <span>{name.label}</span>
        </div>
      ),
      style: { minWidth: 160 },
      showSearch: false,
    },
    {
      key: "flowJob",
      type: FormItemType.CascaderMultiple,
      label: formatMessage({
        id: "project.detail.data-center.filter.current-node",
      }),
      options: conditions?.flowDatas || [],
      fieldNames: {
        label: "label",
        value: "value",
        children: "jobs",
      },
      showSearch: {
        render: (inputValue: string, path: any[]) => {
          const content = path.map((item) => item.label).join(" / ");
          return <span title={content}>{content}</span>;
        },
      },
    },
    {
      key: "dataType",
      type: FormItemType.Single,
      label: formatMessage({
        id: "project.detail.data-center.filter.data-type",
      }),
      options: Object.keys(DataType),
      optionLabel: (val: DataState) =>
        formatMessage({
          id: `project.detail.data-center.data-type.${val?.toLowerCase()}`,
        }),
      style: { minWidth: 160 },
    },
    {
      key: "state",
      type: FormItemType.Multiple,
      label: formatMessage({
        id: "project.detail.data-center.filter.data-status",
      }),
      options: Object.values(DataState).filter(
        (item) => item !== DataState.UNPUBLISHED && item !== DataState.REWORKING
      ),
      optionLabel: (val: DataState) =>
        formatMessage({
          id: `project.detail.data-center.data-state.${val.toLowerCase()}`,
        }),
      style: { minWidth: 160 },
    },
    // {
    //   key: 'auditState',
    //   type: FormItemType.Multiple,
    //   label: formatMessage({
    //     id: 'project.detail.data-center.filter.audit-status',
    //   }),
    //   options: Object.values(RecordAuditStatus),
    //   optionLabel: (val: RecordAuditStatus) =>
    //     formatMessage({ id: `job-detail.audit.record.status.${val}` }),
    //   style: { minWidth: 160 },
    // },
    // {
    //   key: 'auditBillIds',
    //   type: FormItemType.Multiple,
    //   label: formatMessage({
    //     id: 'project.detail.data-center.filter.audit-num',
    //   }),
    //   options: conditions?.auditData || [],
    //   optionValueKey: 'id',
    //   optionLabelKey: 'displayName',
    //   optionFilterProp: 'label',
    //   optionLabel: (audit: DataAuditSheet) => (
    //     <div>
    //       <span style={{ marginRight: 4 }}>{audit.auditNum}</span>
    //       <span style={{ marginRight: 4 }}>[{audit.displayName}]</span>
    //       <span>
    //         {formatMessage({
    //           id: `job-detail.audit.status.${audit.auditStatus}`,
    //         })}
    //       </span>
    //     </div>
    //   ),
    //   style: { width: 250 },
    // },
  ];

  const filterChange = (val: Record<string, any>) => {
    onSearch({
      ...val,
      jobIdList: val.flowJob
        ?.map((item: string[]) => item[1])
        .filter((item: string) => !!item),
      flowIdList: val.flowJob?.map((item: string[]) => item[0]),
    });
  };

  return (
    <div>
      <FilterFormComponent
        formItems={formItems}
        formStyle={{ marginBottom: 0 }}
        buttonStyle={{ marginBottom: 16, marginRight: 120 }}
        initialValue={{}}
        value={value}
        onFilterValueChange={filterChange}
        onReset={onReset}
        searchMode="click"
      />
    </div>
  );
};

export default DataCenterFilter;
