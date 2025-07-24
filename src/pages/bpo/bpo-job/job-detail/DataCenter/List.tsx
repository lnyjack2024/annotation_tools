import { useEffect } from "react";
import type { Dispatch } from "redux";
import { Button, Table, Typography } from "antd";
import {
  ColumnFilterItem,
  TablePaginationConfig,
  TableRowSelection,
} from "antd/es/table/interface";
import { SorterResult } from "antd/lib/table/interface";
import { ColumnProps } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { WorkflowDataRecord } from "@/types/v3";
import ColorPoint from "@/pages/project/components/ColorPoint";
import {
  DATA_STATE_COLORS,
  DataState,
} from "@/pages/project/data-center/components/DataList";
import { FormattedMessage } from "@@/plugin-locale/localeExports";
import { ConnectState } from "@/models/connect";
import { Job } from "@/types/job";
import { openDataPreviewPage } from "@/utils/utils";
import { useAsync } from "@/hooks";
import { getProjectDataConditions } from "@/services/project";

const { Text } = Typography;

type Props = {
  job: Job;
  data: WorkflowDataRecord[];
  finished: boolean;
  selectedData: WorkflowDataRecord[];
  loading: boolean;
  filterParams: Record<string, any>;
  dispatch: Dispatch;
};

enum StageStatus {
  JUDGING = "JUDGING",
  REJECTED = "REJECTED",
  PASSED = "PASSED",
  FAILED = "FAILED",
}

const StageStatusColor = {
  [StageStatus.JUDGING]: "#FDB314",
  [StageStatus.REJECTED]: "#7A869A",
  [StageStatus.PASSED]: "#01B97F",
  [StageStatus.FAILED]: "#F56C6C",
};

export const BPODataStatus = [
  DataState.ACQUIRABLE,
  DataState.WORKING,
  DataState.TO_REWORK,
  DataState.REWORKING,
];

const recordStateFilter: ColumnFilterItem[] = BPODataStatus.map((item) => ({
  value: item,
  text: (
    <FormattedMessage
      id={`project.detail.data-center.data-state.${item.toLowerCase()}`}
    />
  ),
}));

function List({
  job,
  data,
  finished,
  selectedData,
  loading,
  filterParams,
  dispatch,
}: Props) {
  const { formatMessage } = useIntl();
  const selectedRecordIds = selectedData.map((item) => item.recordId);
  const { projectId } = job || {};
  const { data: conditions } = useAsync<any>(
    getProjectDataConditions,
    {
      projectId,
    },
    !!projectId
  );

  const handleSelect = (v: WorkflowDataRecord[]) => {
    dispatch({ type: "bpoJob/updateSelectedData", payload: v });
  };

  const viewDetail = () => {
    dispatch({
      type: "bpoJob/toggleVisible",
      payload: { detailVisible: true },
    });
  };

  const columns: ColumnProps<WorkflowDataRecord>[] = [
    {
      title: formatMessage({ id: "project.detail.data-center.column.record" }),
      dataIndex: "recordId",
      render: (recordId: string) => (
        <span style={{ margin: 0, color: "#42526e" }}>{recordId}</span>
      ),
      fixed: "left",
    },
    {
      title: formatMessage({ id: "data.batch" }),
      dataIndex: "batchNum",
      width: 300,
      render: (batchNum) => {
        const text = conditions?.batchNumName
          ? conditions.batchNumName[batchNum]
          : null;
        return (
          <div className="flex">
            <span>[{batchNum}]</span>
            <Text
              style={{ width: 200, marginLeft: 4 }}
              ellipsis={{ tooltip: text }}
            >
              {text}
            </Text>
          </div>
        );
      },
    },
    {
      title: formatMessage({ id: "common.current-worker" }),
      dataIndex: "contributor",
      render: (contributor) =>
        contributor?.name || formatMessage({ id: "common.nothing-symbol" }),
    },
    ...(finished
      ? [
          {
            title: formatMessage({ id: "bpo-job-data-center.work-count" }),
            dataIndex: "phaseSize",
            render: (phaseSize: number, record: WorkflowDataRecord) => (
              <>
                {phaseSize}
                <Button
                  type="link"
                  style={{ padding: "0 8px" }}
                  onClick={() => {
                    if (record) {
                      handleSelect([record]);
                    }
                    viewDetail();
                  }}
                >
                  {formatMessage({ id: "common.detail" })}
                </Button>
              </>
            ),
          },
          {
            title: formatMessage({ id: "bpo-job-data-center.nr-status" }),
            dataIndex: "nextStageState",
            render: (nextStageState: StageStatus) => (
              <>
                <ColorPoint color={StageStatusColor[nextStageState]} />
                {formatMessage({
                  id: `bpo-job-data-center.nr-status.${nextStageState?.toLowerCase()}`,
                })}
              </>
            ),
          },
        ]
      : [
          {
            title: formatMessage({
              id: "project.detail.data-center.filter.data-status",
            }),
            dataIndex: "state",
            filters: recordStateFilter,
            filteredValue: filterParams.state || [],
            render: (dataState: DataState) => (
              <span>
                <ColorPoint color={DATA_STATE_COLORS[dataState]} />
                {formatMessage({
                  id: `project.detail.data-center.data-state.${dataState?.toLowerCase()}`,
                })}
              </span>
            ),
          },
        ]),
    {
      title: formatMessage({ id: "common.operation" }),
      render: (record) => (
        <>
          <EyeOutlined
            style={{
              fontSize: 20,
              marginRight: 12,
              color: "#227a7a",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!record.flowId) {
                return;
              }
              openDataPreviewPage(projectId, record, "bpo");
            }}
          />
        </>
      ),
      fixed: "right",
    },
  ];

  const rowSelection: TableRowSelection<WorkflowDataRecord> = {
    selectedRowKeys: selectedRecordIds,
    onSelect: (record, selected: boolean) => {
      if (selected) {
        handleSelect([...selectedData, record]);
      } else {
        const newSelectedData = selectedData.filter(
          (item) => item.recordId !== record.recordId
        );
        handleSelect(newSelectedData);
      }
    },
    onSelectAll: (selected, records, changeRows) => {
      if (selected) {
        const addedRecords = changeRows.filter(
          (item) =>
            !selectedData.find((record) => record.recordId === item.recordId)
        );
        handleSelect([...selectedData, ...addedRecords]);
      } else {
        const filterData = selectedData.filter(
          (item) =>
            !changeRows.find((record) => record.recordId === item.recordId)
        );
        handleSelect(filterData);
      }
    },
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    newFilter: Record<string, any>,
    newSorter:
      | SorterResult<WorkflowDataRecord>
      | SorterResult<WorkflowDataRecord>[]
  ) => {
    const { field, order } = newSorter as SorterResult<WorkflowDataRecord>;

    const mappedOrder = order === "descend" ? "DESC" : "ASC";
    const sortInfo = {
      sortField: field,
      sortOrder: mappedOrder,
    };

    dispatch({ type: "bpoJob/updateSorter", payload: sortInfo });
    dispatch({ type: "bpoJob/updateSelectedData", payload: [] });
    dispatch({
      type: "bpoJob/updateFilter",
      payload: {
        ...filterParams,
        ...newFilter,
      },
    });
  };

  const getList = () => {
    dispatch({ type: "bpoJob/getBpoJobData" });
  };

  useEffect(() => {
    getList();
  }, [job?.id, finished, filterParams]);

  return (
    <Table
      rowKey="recordId"
      className="tableStriped"
      style={{ borderTop: "1px solid #F0F0F0" }}
      scroll={{ x: "max-content" }}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      loading={loading}
      pagination={false}
      onChange={handleTableChange}
    />
  );
}

function mapStateToProps({ bpoJob, loading }: ConnectState) {
  return {
    job: bpoJob.job,
    selectedData: bpoJob.selectedData,
    data: bpoJob.data,
    total: bpoJob.total,
    filterParams: bpoJob.filter,
    finished: bpoJob.finished,
    loading: loading.effects["bpoJob/getBpoJobData"],
  };
}

export default connect(mapStateToProps)(List);
