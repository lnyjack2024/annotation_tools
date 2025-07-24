import { useEffect, useState } from "react";
import { Button, message, Table } from "antd";
import { FormattedMessage, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { Dispatch } from "@umijs/max";
import type {
  TablePaginationConfig,
  TableRowSelection,
} from "antd/es/table/interface";
import type { ColumnProps } from "antd/es/table";
import type { SorterResult } from "antd/lib/table/interface";

import type { WorkerJob, Job } from "@/types";
import { WorkerJobStatus, HttpStatus, JobType } from "@/types";
import WorkforceFilter from "@/pages/project/workflow/JobWorkforce/WorkforceFilter";
import DataSelectFootBar from "@/pages/project/data-center/components/DataSelectFootBar";
// import WorkerBatchModal from '@/pages/project/workflow/components/WorkerBatchModal';
import type { ConnectState } from "@/models/connect";
import type {
  Sort,
  WorkerListFilter,
} from "@/pages/project/workflow/models/jobDetail";
import {
  detainWorker,
  getJob,
  resetWorkers,
  revokeWorkers,
  unDetainWorker,
} from "@/services/job";
import { OperationContainer } from "@/components/Operation";
import {
  // formatLocal,
  mapStatusToErrorMessage,
  PAGE_SIZE_OPTIONS,
} from "@/utils";

interface Props {
  job: Job;
  loading: boolean;
  readonly: boolean;
  workerList: WorkerJob[];
  total: number;
  filter: WorkerListFilter;
  sorter: Sort;
  dispatch: Dispatch;
}

function getActionsDisabled(data: WorkerJob[]) {
  let actionsDisabled = {
    ENABLE: false,
    DISABLE: false,
    DETAIN: false,
    REVERT: false,
  };

  data.forEach((item) => {
    switch (item.status) {
      case WorkerJobStatus.ASSIGNED:
        actionsDisabled = {
          ...actionsDisabled,
          ENABLE: true,
          DETAIN: true,
          REVERT: true,
        };
        break;
      case WorkerJobStatus.CONFIRMED:
        actionsDisabled = { ...actionsDisabled, ENABLE: true, REVERT: true };
        break;
      case WorkerJobStatus.DECLINED:
        actionsDisabled = {
          ...actionsDisabled,
          DISABLE: true,
          DETAIN: true,
          REVERT: true,
        };
        break;
      case WorkerJobStatus.DETAINED:
        actionsDisabled = { ...actionsDisabled, ENABLE: true, DETAIN: true };
        break;
      case WorkerJobStatus.REJECT:
        actionsDisabled = {
          ENABLE: true,
          DETAIN: true,
          REVERT: true,
          DISABLE: true,
        };
        break;
      default:
        break;
    }
  });

  return actionsDisabled;
}

function WorkforceList({
  job,
  workerList,
  filter,
  sorter,
  total,
  dispatch,
  loading,
  readonly,
}: Props) {
  const { formatMessage } = useIntl();
  // const [workerBatchModalVisible, setWorkerBatchModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<WorkerJob[]>([]);
  const [isMulWorker, setIsMulWorker] = useState(false);
  // const [disableBatchQa, setDisableBatchQa] = useState(false);

  const { id } = job || {};
  const actionsDisabled = getActionsDisabled(selectedData);
  // const isQAJob = job?.jobType === JobType.QA;

  const getList = () => {
    if (!id) {
      return;
    }
    dispatch({
      type: "jobDetailDrawer/getJobWorkerList",
      payload: {
        jobId: id,
      },
    });
  };

  const reset = async (worker?: WorkerJob) => {
    const execData = worker ? [worker] : selectedData;

    try {
      await resetWorkers(
        id,
        execData.map((w) => w.workerId)
      );
      setSelectedData([]);
      message.success(
        formatMessage({ id: "common.message.success.operation" })
      );
      getList();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const revoke = async (worker?: WorkerJob) => {
    const execData = worker ? [worker] : selectedData;
    try {
      await revokeWorkers(
        id,
        execData.map((w) => w.workerId)
      );
      setSelectedData([]);
      message.success(
        formatMessage({ id: "common.message.success.operation" })
      );
      getList();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const detain = async (worker?: WorkerJob) => {
    const execData = worker ? [worker] : selectedData;
    try {
      await detainWorker(
        execData.map((w) => w.workerId),
        id
      );
      setSelectedData([]);
      message.success(
        formatMessage({ id: "common.message.success.operation" })
      );
      getList();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const unDetain = async (worker?: WorkerJob) => {
    const execData = worker ? [worker] : selectedData;
    try {
      await unDetainWorker(
        execData.map((w) => w.workerId),
        id
      );
      setSelectedData([]);
      message.success(
        formatMessage({ id: "common.message.success.operation" })
      );
      getList();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const WorkerListColumns: ColumnProps<WorkerJob>[] = [
    {
      title: <FormattedMessage id="common.user.nickname" />,
      render: (record) => (
        <>
          <div style={{ margin: 0, color: "#42526e", fontWeight: "bold" }}>
            {record.uniqueName}
          </div>
          <div
            style={{ marginLeft: 0, fontWeight: "normal", color: "#7a869a" }}
          >
            {record.workerEmail}
          </div>
        </>
      ),
    },
    {
      title: <FormattedMessage id="common.status" />,
      width: 130,
      render: (record) => (
        <FormattedMessage
          id={`workflow.worker.status.${(
            record.status || record.labelWorkerStatus
          )?.toLowerCase()}`}
        />
      ),
    },

    // {
    //   title: <FormattedMessage id="workflow.worker.column.orientation.num" />,
    //   dataIndex: 'labelQAMappingNum',
    //   width: 90,
    //   render: (labelQAMappingNum: number, record) => (
    //     <span style={{ marginLeft: 4, color: '#227a7a' }}>
    //       {formatLocal(labelQAMappingNum)}
    //     </span>
    //   ),
    // },
    {
      title: <FormattedMessage id="common.operation" />,
      width: 90,
      render: (record) => {
        const disabled = getActionsDisabled([record]);
        const moreItems = [
          <Button
            type="link"
            key="detained"
            hidden={disabled.DETAIN}
            onClick={() => detain(record)}
          >
            {formatMessage({ id: "workflow.worker.status.detained" })}
          </Button>,
          <Button
            type="link"
            key="revert"
            hidden={disabled.REVERT}
            onClick={() => unDetain(record)}
          >
            {formatMessage({ id: "workflow.worker.revert-data" })}
          </Button>,
        ];
        return (
          <OperationContainer moreItems={moreItems}>
            <Button
              type="link"
              danger={!disabled.ENABLE}
              hidden={disabled.ENABLE}
              onClick={() => reset(record)}
            >
              {formatMessage({ id: "bpo-list.bpo.operation.activate" })}
            </Button>
            <Button
              type="link"
              hidden={disabled.DISABLE}
              onClick={() => revoke(record)}
            >
              {formatMessage({ id: "job-detail.workforce.revoke" })}
            </Button>
          </OperationContainer>
        );
      },
    },
  ];
  if (job?.jobType !== JobType.QA || isMulWorker) {
    WorkerListColumns.splice(2, 1);
  }

  const getLabelingJob = async () => {
    const { labelingJobId } = job;
    try {
      const resp = await getJob(labelingJobId);
      if (resp.status === HttpStatus.OK) {
        const isMul = resp.data.workerNum > 1;
        setIsMulWorker(isMul);
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  useEffect(() => {
    if (!job || job?.jobType !== JobType.QA) {
      return;
    }
    getLabelingJob();
  }, [job]);

  useEffect(() => {
    getList();
  }, [job, filter, sorter]);

  useEffect(
    () => () => {
      dispatch({ type: "jobDetailDrawer/clearFilter" });
    },
    []
  );

  const actions = () => {
    return (
      <>
        <Button
          disabled={!selectedData.length || actionsDisabled.ENABLE || readonly}
          type="ghost"
          onClick={() => reset()}
          style={{ marginRight: 12 }}
        >
          <FormattedMessage id="bpo-list.bpo.operation.activate" />
        </Button>
        <Button
          disabled={!selectedData.length || actionsDisabled.DISABLE || readonly}
          type="ghost"
          danger
          onClick={() => revoke()}
          style={{ marginRight: 12 }}
        >
          <FormattedMessage id="job-detail.workforce.revoke" />
        </Button>
        <Button
          style={{ marginRight: 12 }}
          type="ghost"
          onClick={() => detain()}
          disabled={!selectedData.length || actionsDisabled.DETAIN || readonly}
        >
          <FormattedMessage id="workflow.worker.status.detained" />
        </Button>
        <Button
          type="ghost"
          disabled={!selectedData.length || actionsDisabled.REVERT || readonly}
          onClick={() => unDetain()}
        >
          <FormattedMessage id="workflow.worker.revert-data" />
        </Button>
      </>
    );
  };

  const handleDeselect = (record: WorkerJob) => {
    setSelectedData(
      selectedData.filter((item) => item.workerId !== record.workerId)
    );
  };

  const rowSelection: TableRowSelection<WorkerJob> = {
    selectedRowKeys: selectedData.map((item) => item.workerId),
    onSelect: (record, selected: boolean) => {
      if (selected) {
        setSelectedData(selectedData.concat([record]));
      } else {
        const newSelectedData = selectedData.filter(
          (item) => item.workerId !== record.workerId
        );
        setSelectedData(newSelectedData);
      }
    },
    onSelectAll: (selected, records, changeRows) => {
      if (selected) {
        const addedRecords = changeRows.filter(
          (item) =>
            !selectedData.find((record) => record.workerId === item.workerId)
        );
        setSelectedData(selectedData.concat(addedRecords || []));
      } else {
        const filterData = selectedData.filter(
          (item) =>
            !changeRows.find((record) => record.workerId === item.workerId)
        );
        setSelectedData(filterData || []);
      }
    },
  };

  const updateFilter = (newFilter: Record<string, any>) => {
    dispatch({
      type: "jobDetailDrawer/saveFilter",
      payload: { newFilter },
    });
  };

  const handleTableChange = (
    pageParam: TablePaginationConfig,
    filterParam: any,
    newSorter: SorterResult<WorkerJob> | SorterResult<WorkerJob>[]
  ) => {
    const { field, order } = newSorter as SorterResult<WorkerJob>;

    const mappedOrder = order === "descend" ? "DESC" : "ASC";
    const sortInfo = {
      sortField: field,
      sortOrder: mappedOrder,
    };

    dispatch({
      type: "jobDetailDrawer/saveSorter",
      payload: {
        newSorter: sortInfo,
      },
    });
  };

  return (
    <div>
      <div style={{ display: "flex" }}>
        <WorkforceFilter
          isOrientation={false}
          onFilterChange={updateFilter}
          initialValue={filter}
        />
        {/*{isQAJob && (*/}
        {/*  <Button*/}
        {/*    type="primary"*/}
        {/*    disabled={disableBatchQa}*/}
        {/*    style={{ marginLeft: 16, marginBottom: 16 }}*/}
        {/*    onClick={() => setWorkerBatchModalVisible(true)}*/}
        {/*  >*/}
        {/*    {formatMessage({*/}
        {/*      id: `qa.batch.setting.${workerList?.length ? 'edit' : 'create'}`,*/}
        {/*    })}*/}
        {/*  </Button>*/}
        {/*)}*/}
      </div>
      <Table
        rowKey="workerId"
        rowClassName="table-narrow-row"
        style={{ borderTop: "1px solid #F0F0F0", paddingBottom: 136 }}
        columns={WorkerListColumns}
        dataSource={workerList}
        rowSelection={rowSelection}
        loading={loading}
        pagination={false}
        onChange={handleTableChange}
      />
      <DataSelectFootBar
        style={{ position: "absolute", left: 0, bottom: 0, width: "100%" }}
        barVisible={true}
        columns={WorkerListColumns.slice(0, 2)}
        actions={actions()}
        pagination={{
          total,
          pageSize: filter.pageSize,
          onChange: (page: number, pageSize?: number) =>
            updateFilter({
              pageSize,
              pageIndex: page - 1,
            }),
          current: filter.pageIndex + 1,
          showTotal: (val) =>
            formatMessage({ id: "common.total.items" }, { items: val }),
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
        selectedData={selectedData}
        onDeselect={handleDeselect}
        onClear={() => {
          setSelectedData([]);
        }}
      />
      {/*<WorkerBatchModal*/}
      {/*  jobId={id}*/}
      {/*  isQAJob={isQAJob}*/}
      {/*  onClose={() => setWorkerBatchModalVisible(false)}*/}
      {/*  visible={workerBatchModalVisible}*/}
      {/*  onSave={getList}*/}
      {/*  setDisableBatchQa={setDisableBatchQa}*/}
      {/*/>*/}
    </div>
  );
}

function mapStateToProps({ loading, jobDetailDrawer }: ConnectState) {
  return {
    loading: loading.effects["jobDetailDrawer/getJobWorkerList"],
    job: jobDetailDrawer.job,
    workerList: jobDetailDrawer.workerList,
    total: jobDetailDrawer.total,
    filter: jobDetailDrawer.filter,
    sorter: jobDetailDrawer.sorter,
  };
}

export default connect(mapStateToProps)(WorkforceList);
