import React, { useEffect, useState } from "react";
import { Card, Table, message, Dropdown, Menu, Button, Typography } from "antd";
import { useIntl, history as router } from "@umijs/max";
import { connect } from "react-redux";
import type { Dispatch } from "redux";
import type {
  ColumnFilterItem,
  TableRowSelection,
  TablePaginationConfig,
} from "antd/es/table/interface";
import type { ColumnProps } from "antd/es/table";

import DataCenterFilter from "@/pages/project/data-center/components/DataCenterFilter";
import DataAssignModal from "@/pages/project/data-center/components/data-assign/DataAssignModal";
import DataReleaseModal from "@/pages/project/data-center/components/data-release/DataReleaseModal";
import { getProjectDataConditions } from "@/services/project";
import {
  mapStatusToErrorMessage,
  openDataPreviewPage,
  queryToSearch,
} from "@/utils/utils";
import DataProcess from "@/pages/project/data-center/components/DataProcess";
import { DataType } from "@/types/dataset";
import type { WorkflowDataRecord } from "@/types/v3";
import ColorPoint from "@/pages/project/components/ColorPoint";
import { FormattedMessage } from "@@/plugin-locale/localeExports";
import type { SorterResult } from "antd/lib/table/interface";
import { EllipsisOutlined, EyeOutlined } from "@ant-design/icons";
import DataLocationColumn from "@/pages/project/data-center/components/DataLocationColumn";
import type { ConnectState } from "@/models/connect";
import {
  BigDataProcess,
  DataCenterModalVisible,
  FilterParam,
} from "@/pages/project/models/dataCenter";
import DataExecMenu from "@/pages/project/data-center/components/DataExecMenu";
import DataListFootBar from "@/pages/project/data-center/components/DataListFootBar";
import DataTurnBackModal from "@/pages/project/components/DataTurnBackModal";
import DataActionProgress from "@/pages/project/data-center/components/DataActionProgress";
// import { RecordAuditStatus } from '@/types/dataAudit';
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import DataDeleteModal from "@/pages/project/data-center/components/DataDeleteModal";

const { Text } = Typography;

type Props = {
  dispatch: Dispatch;
  projectId: string;
  bigDataProgress: BigDataProcess;
  data: WorkflowDataRecord[];
  selectedData: WorkflowDataRecord[];
  projectDisplayId: string;
  filterParams: FilterParam;
  modalVisible: DataCenterModalVisible;
  loading: boolean;
  isReadonly: boolean;
};

export enum DataState {
  UNPUBLISHED = "UNPUBLISHED", // 未发布
  ACQUIRABLE = "ACQUIRABLE", // 待领取
  READY = "READY", // 已发布
  TO_REWORK = "TO_REWORK", // 待修订
  REWORKING = "REWORKING", // 修订中
  WORKING = "WORKING", // 未完成
  COMPLETED = "COMPLETED", // 已完成
  HALTED = "HALTED", // 已锁定
}

export const FreeStatus = [
  DataState.WORKING,
  DataState.REWORKING,
  DataState.TO_REWORK,
];
export const TurnBackStatus = [
  DataState.WORKING,
  DataState.ACQUIRABLE,
  DataState.REWORKING,
  DataState.TO_REWORK,
  DataState.COMPLETED,
];
export const LockStatus = [
  DataState.READY,
  DataState.WORKING,
  DataState.ACQUIRABLE,
  DataState.REWORKING,
  DataState.TO_REWORK,
  DataState.COMPLETED,
];
export const UnlockStatus = [DataState.HALTED];

export enum DataOriState {
  DELETED = "DELETED", // 已删除
}

export const DATA_STATE_COLORS = {
  [DataState.READY]: "#C8CCD4",
  [DataState.ACQUIRABLE]: "#7A869A",
  [DataState.COMPLETED]: "#01B97F",
  [DataState.HALTED]: "#6B5BE5",
  [DataState.REWORKING]: "#F56C6C",
  [DataState.TO_REWORK]: "#F56C6C",
  [DataState.WORKING]: "#FDB314",
};

type FilterDataStructure = {
  label: string;
  value: string;
};

type Condition = {
  batchNumName: Record<string, string>;
  batchNums: number[];
  flowDatas: (FilterDataStructure & {
    jobs: FilterDataStructure[];
  })[];
};

const dataTypeFilter: ColumnFilterItem[] = Object.keys(DataType).map(
  (item) => ({
    value: item,
    text: (
      <FormattedMessage
        id={`project.detail.data-center.data-type.${item?.toLowerCase()}`}
      />
    ),
  })
);

const recordStateFilter: ColumnFilterItem[] = Object.values(DataState)
  .filter(
    (item) => item !== DataState.UNPUBLISHED && item !== DataState.REWORKING
  )
  .map((item) => ({
    value: item,
    text: (
      <FormattedMessage
        id={`project.detail.data-center.data-state.${item.toLowerCase()}`}
      />
    ),
  }));

const DataList: React.FC<Props> = ({
  projectId,
  selectedData,
  bigDataProgress,
  data,
  projectDisplayId,
  filterParams,
  dispatch,
  modalVisible,
  loading,
  isReadonly,
}) => {
  const { formatMessage } = useIntl();
  const [conditions, setConditions] = useState<Condition>(null);
  const location = useLocationWithQuery();

  const selectedRecordIds = selectedData.map((item) => item.recordId);
  const inBigDataProcess =
    bigDataProgress[projectId] && bigDataProgress[projectId].progress !== 1;

  const batchNumsFilter = Object.entries(conditions?.batchNumName || {}).map(
    ([k, v]) => ({
      value: k,
      text: (
        <span>
          <span style={{ marginRight: 4 }}>[{k}]</span>
          <span>{v}</span>
        </span>
      ),
    })
  );

  const toggleVisible = (payload: Record<string, boolean>) => {
    dispatch({ type: "dataCenter/updateVisible", payload });
  };

  const columns: ColumnProps<WorkflowDataRecord>[] = [
    {
      title: formatMessage({ id: "project.detail.data-center.column.record" }),
      render: (record) => (
        <div
          onClick={() => {
            dispatch({
              type: "dataCenter/updateSelectedRecord",
              payload: record,
            });
            router.replace({
              pathname: `/projects/${projectId}/${record.recordId}/record-detail`,
              search: queryToSearch(location.query),
            });
          }}
        >
          <a style={{ margin: 0 }}>{record.recordId}</a>
        </div>
      ),
      width: 100,
      fixed: "left",
    },
    {
      title: formatMessage({ id: "data.batch" }),
      dataIndex: "batchNum",
      filters: batchNumsFilter,
      filterMultiple: true,
      filteredValue: filterParams.batchNumList || [],
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
      title: formatMessage({
        id: "project.detail.data-center.filter.data-type",
      }),
      dataIndex: "dataType",
      width: 200,
      filters: dataTypeFilter,
      filteredValue: filterParams.dataType ? [filterParams.dataType] : [],
      filterMultiple: false,
      render: (dataType: DataType) =>
        formatMessage({
          id: `project.detail.data-center.data-type.${dataType?.toLowerCase()}`,
        }),
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.filter.current-node",
      }),
      render: (record) => (
        <DataLocationColumn
          record={record}
          onClick={(e) => {
            e.preventDefault();
            router.push({
              pathname: `/workflows/${record.flowId}/detail`,
              search: queryToSearch({
                projectId,
                projectDisplayId,
              }),
            });
          }}
        />
      ),
    },
    {
      title: formatMessage({ id: "common.current-worker" }),
      dataIndex: "contributor",
      width: 200,
      render: (contributor) => contributor?.name,
    },
    {
      title: formatMessage({
        id: "project.detail.data-center.filter.data-status",
      }),
      dataIndex: "state",
      width: 100,
      filters: recordStateFilter,
      filteredValue: filterParams.state,
      render: (dataState: DataState) => (
        <span>
          <ColorPoint color={DATA_STATE_COLORS[dataState]} />
          {formatMessage({
            id: `project.detail.data-center.data-state.${dataState?.toLowerCase()}`,
          })}
        </span>
      ),
    },
    {
      title: formatMessage({ id: "common.operation" }),
      width: 200,
      render: (record) => (
        <>
          <EyeOutlined
            style={{
              fontSize: 20,
              marginRight: 12,
              color: record.flowId ? "#227a7a" : "#DCDFE3",
              cursor: record.flowId ? "pointer" : "not-allowed",
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!record.flowId) {
                return;
              }
              openDataPreviewPage(projectId, record);
            }}
          />
          <Dropdown
            placement="bottomRight"
            trigger={["hover"]}
            overlay={
              <Menu style={{ textAlign: "center" }} disabled={inBigDataProcess}>
                <DataExecMenu
                  record={record}
                  projectId={projectId}
                  readonly={isReadonly}
                />
              </Menu>
            }
          >
            <EllipsisOutlined style={{ cursor: "pointer", fontSize: 20 }} />
          </Dropdown>
        </>
      ),
      fixed: "right",
    },
  ];

  const rowSelection: TableRowSelection<WorkflowDataRecord> = {
    selectedRowKeys: selectedRecordIds,
    onSelect: (record, selected: boolean) => {
      if (selected) {
        dispatch({
          type: "dataCenter/updateSelectedData",
          payload: selectedData.concat([record]),
        });
      } else {
        const newSelectedData = selectedData.filter(
          (item) => item.recordId !== record.recordId
        );
        dispatch({
          type: "dataCenter/updateSelectedData",
          payload: newSelectedData,
        });
      }
    },
    onSelectAll: (selected, records, changeRows) => {
      if (selected) {
        const addedRecords = changeRows.filter(
          (item) =>
            !selectedData.find((record) => record.recordId === item.recordId)
        );
        dispatch({
          type: "dataCenter/updateSelectedData",
          payload: selectedData.concat(addedRecords || []),
        });
      } else {
        const filterData = selectedData.filter(
          (item) =>
            !changeRows.find((record) => record.recordId === item.recordId)
        );
        dispatch({
          type: "dataCenter/updateSelectedData",
          payload: filterData || [],
        });
      }
    },
  };

  async function getList() {
    dispatch({
      type: "dataCenter/getList",
      payload: {
        projectId,
      },
    });
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, any>,
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
    dispatch({
      type: "dataCenter/updateSorter",
      payload: sortInfo,
    });

    dispatch({
      type: "dataCenter/updateFilters",
      payload: {
        ...filterParams,
        ...filters,
        dataType: filters.dataType?.[0],
        batchNumList: filters.batchNum || [],
      },
    });
  };

  const getConditions = async (id: string) => {
    try {
      const resp = await getProjectDataConditions({ projectId: id });
      const { flowDatas } = resp.data;
      setConditions({
        ...resp.data,
        flowDatas: flowDatas.map((flow) => ({
          ...flow,
          label: flow.flowName,
          value: flow.flowId,
          jobs: Object.keys(flow.jobs || {}).map((key) => ({
            value: key,
            label: flow.jobs[key],
          })),
        })),
      });
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  useEffect(() => {
    if (modalVisible.dataMgmtVisible) {
      return;
    }
    getConditions(projectId);
  }, [projectId, modalVisible.dataMgmtVisible]);

  useEffect(() => {
    if (modalVisible.dataMgmtVisible || modalVisible.assignModalVisible) {
      return;
    }
    getList();
  }, [
    filterParams,
    modalVisible.dataMgmtVisible,
    modalVisible.assignModalVisible,
  ]);

  const deselect = (recordIds: number[]) => {
    dispatch({
      type: "dataCenter/updateSelectedData",
      payload: selectedData.filter(
        (item) => recordIds.indexOf(item.recordId) === -1
      ),
    });
  };

  return (
    <>
      <h3 style={{ margin: "16px 0", color: "#42526e" }}>
        {formatMessage({ id: "project.detail.data-center.list" })}
      </h3>
      {inBigDataProcess && (
        <div
          style={{
            height: 40,
            lineHeight: "40px",
            padding: "0 16px",
            color: "#ba4745",
            background: "#FDE2E2",
          }}
        >
          {formatMessage({ id: "project.detail.data-center.big-data.action" })}
          <Button
            type="link"
            style={{ float: "right", marginTop: 4 }}
            onClick={() => toggleVisible({ progressModalVisible: true })}
          >
            {formatMessage({ id: "common.view" })}
          </Button>
        </div>
      )}
      <Card
        bordered={false}
        className="with-shadow"
        bodyStyle={{ marginBottom: 100 }}
        headStyle={{ color: "#42526e" }}
        title={null}
      >
        <DataCenterFilter
          projectId={projectId}
          value={filterParams}
          conditions={conditions}
          onSearch={(newFilter: any) => {
            dispatch({
              type: "dataCenter/updateFilters",
              payload: {
                ...newFilter,
                pageIndex: 0,
                pageSize: filterParams.pageSize,
              },
            });
            dispatch({
              type: "dataCenter/updateSelectedData",
              payload: [],
            });
          }}
          onReset={() =>
            dispatch({
              type: "dataCenter/updateFilters",
              payload: {},
            })
          }
        />
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
        <DataAssignModal
          visible={modalVisible.assignModalVisible}
          onCancel={() => toggleVisible({ assignModalVisible: false })}
          selectedRecordIds={selectedRecordIds}
          projectId={projectId}
          deselect={deselect}
          handleDataAssignSuccess={() => {
            toggleVisible({ assignModalVisible: false });
            dispatch({
              type: "dataCenter/updateSelectedData",
              payload: [],
            });
          }}
        />
        <DataReleaseModal
          visible={modalVisible.releaseModalVisible}
          selectedRecordIds={selectedRecordIds}
          projectId={projectId}
          onRefresh={getList}
          onClose={() => toggleVisible({ releaseModalVisible: false })}
        />
        <DataActionProgress projectId={projectId} onRefresh={getList} />
        <DataTurnBackModal
          visible={modalVisible.turnBackNewModalVisible}
          projectId={projectId}
          recordList={selectedRecordIds}
          onCancel={() => toggleVisible({ turnBackNewModalVisible: false })}
          onRefresh={() => {
            dispatch({
              type: "dataCenter/updateSelectedData",
              payload: [],
            });
            getList();
          }}
        />
        <DataListFootBar
          readonly={isReadonly || inBigDataProcess}
          columns={columns.slice(0, 5)}
          projectId={projectId}
        />
        <DataProcess
          visible={!!modalVisible.processDataId}
          projectId={projectId}
          recordId={modalVisible.processDataId}
          onClose={() =>
            dispatch({
              type: "dataCenter/updateVisible",
              payload: { processDataId: null },
            })
          }
        />
        <DataDeleteModal
          visible={modalVisible.deleteModalVisible}
          recordIds={selectedRecordIds}
          projectId={projectId}
          dispatch={dispatch}
          onClose={() => toggleVisible({ deleteModalVisible: false })}
          onComplete={() => {
            toggleVisible({ deleteModalVisible: false });
            getList();
          }}
        />
      </Card>
    </>
  );
};

function mapStateToProps({ dataCenter, projectAccess, loading }: ConnectState) {
  return {
    filterParams: dataCenter.filter,
    selectedData: dataCenter.selectedData,
    data: dataCenter.data,
    modalVisible: dataCenter.modalVisible,
    bigDataProgress: dataCenter.bigDataProgress,
    loading: loading.effects["dataCenter/getList"],
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(DataList);
