import FilterFormComponent from "@/components/FilterFormComponent";
import { FormItem, FormItemType } from "@/types/common";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { DataState } from "@/pages/project/data-center/components/DataList";
import type { Dispatch } from "redux";
import { ConnectState } from "@/models/connect";
import { BPODataStatus } from "@/pages/bpo/bpo-job/job-detail/DataCenter/List";

type Props = {
  dispatch: Dispatch;
  finished: boolean;
  filterParams: Record<string, any>;
};

function Filter({ dispatch, finished, filterParams }: Props) {
  const { formatMessage } = useIntl();

  const filterChange = (v: Record<string, any>) => {
    dispatch({ type: "bpoJob/updateFilter", payload: v });
    dispatch({ type: "bpoJob/updateSelectedData", payload: [] });
  };

  const formItems: FormItem[] = [
    {
      key: "recordIds",
      type: FormItemType.Text,
      label: formatMessage({ id: "common.column.recordId" }),
      placeholder: formatMessage({ id: "turnback.search.ids" }),
    },
    // {
    //   key: 'uniqueName',
    //   type: FormItemType.Text,
    //   label: formatMessage({ id: 'common.worker.unique-name' }),
    // },
    ...(finished
      ? []
      : [
          {
            key: "state",
            type: FormItemType.Multiple,
            label: formatMessage({
              id: "project.detail.data-center.filter.data-status",
            }),
            options: BPODataStatus,
            optionLabel: (val: DataState) =>
              formatMessage({
                id: `project.detail.data-center.data-state.${val.toLowerCase()}`,
              }),
            style: { minWidth: 160 },
          },
        ]),
  ];

  return (
    <FilterFormComponent
      initialValue={{}}
      value={filterParams}
      onFilterValueChange={filterChange}
      formItems={formItems}
      searchMode="click"
    />
  );
}

function mapStateToProps({ bpoJob }: ConnectState) {
  return {
    filterParams: bpoJob.filter,
    finished: bpoJob.finished,
  };
}

export default connect(mapStateToProps)(Filter);
