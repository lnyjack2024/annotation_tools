import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import DataSelectFootBar from "@/pages/project/data-center/components/DataSelectFootBar";
import { WorkflowDataRecord } from "@/types/v3";
import { Button, message } from "antd";
import { PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { ConnectState } from "@/models/connect";
import { useEffect, useState } from "react";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { Dispatch } from "redux";
import { getBPOAllFilteredIds } from "@/services/bpo";
import { Job } from "@/types/job";

type Props = {
  filterParams: Record<string, any>;
  total: number;
  job: Job;
  data: WorkflowDataRecord[];
  selectedData: WorkflowDataRecord[];
  dispatch: Dispatch;
  finished: boolean;
};

const recordReg = /[,\s]/g;

function FootBar({
  finished,
  filterParams,
  job,
  total,
  data,
  selectedData,
  dispatch,
}: Props) {
  const { formatMessage } = useIntl();
  const [selectedAll, setSelectedAll] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const { projectId, id: jobId, flowId, qaCycleOrder } = job || {};

  const handleSelect = (v: WorkflowDataRecord[]) => {
    dispatch({ type: "bpoJob/updateSelectedData", payload: v });
  };

  const selectAll = () => {
    setBtnLoading(true);
    getBPOAllFilteredIds({
      ...filterParams,
      recordIds: filterParams?.recordIds
        ? filterParams?.recordIds.trim().split(recordReg)
        : [],
      pageSize: undefined,
      pageIndex: undefined,
      projectId,
      jobId,
      flowId,
      cycle: qaCycleOrder || 0,
      finished,
    })
      .then((resp) => {
        setSelectedAll(true);
        handleSelect(resp.data.map((item: string) => ({ recordId: item })));
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setBtnLoading(false));
  };

  useEffect(() => {
    if (selectedData.length === 0) {
      setSelectedAll(false);
    }
  }, [selectedData]);

  return (
    <DataSelectFootBar
      barVisible={true}
      columns={[
        {
          title: formatMessage({
            id: "project.detail.data-center.column.record",
          }),
          dataIndex: "recordId",
          render: (recordId: string) => (
            <span style={{ margin: 0, color: "#42526e" }}>{recordId}</span>
          ),
        },
      ]}
      selectedData={selectedData}
      onDeselect={(record: WorkflowDataRecord) => {
        handleSelect(
          selectedData.filter((item) => item.recordId !== record.recordId)
        );
      }}
      disabled={selectedAll}
      onClear={() => {
        handleSelect([]);
      }}
      selectAllButton={
        data.length > 0 && (
          <Button
            loading={btnLoading}
            style={{ marginRight: 16 }}
            onClick={selectAll}
          >
            {formatMessage({ id: "common.select-all-filter" })}
          </Button>
        )
      }
      pagination={{
        total,
        pageSize: filterParams.pageSize,
        onChange: (page: number, pageSize?: number) =>
          dispatch({
            type: "bpoJob/updateFilter",
            payload: {
              ...filterParams,
              pageSize,
              pageIndex: page - 1,
            },
          }),
        current: filterParams.pageIndex + 1,
        showTotal: (val) =>
          formatMessage({ id: "common.total.items" }, { items: val }),
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
      }}
      actions={
        selectedData.length > 0 && (
          <div>
            <Button
              type="primary"
              style={{ marginRight: 12 }}
              onClick={() =>
                dispatch({
                  type: "bpoJob/toggleVisible",
                  payload: { exportVisible: true },
                })
              }
            >
              {formatMessage({ id: "common.export" })}
            </Button>
          </div>
        )
      }
    />
  );
}

function mapStateToProps({ bpoJob }: ConnectState) {
  return {
    selectedData: bpoJob.selectedData,
    data: bpoJob.data || [],
    job: bpoJob.job,
    total: bpoJob.total,
    finished: bpoJob.finished,
    filterParams: bpoJob.filter,
  };
}

export default connect(mapStateToProps)(FootBar);
