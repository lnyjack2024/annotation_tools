import { useEffect, useState } from "react";
import { Card, Table, Button, Divider, message } from "antd";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import type { TableRowSelection } from "antd/es/table/interface";

import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import { pathToRegexp } from "path-to-regexp";

import type { ConnectState } from "@/models/connect";
import { Job } from "@/types/job";
import { HttpStatus } from "@/types/http";
import BpoWorkerAddModal from "@/pages/bpo/bpo-job/job-detail/components/BpoWorkerAddModal";
import {
  getBpoJobWorkers,
  resetBpoJobWorkers,
  revokeBpoJobWorkers,
} from "@/services/bpo";
import { dateFormat } from "@/utils/time-util";
import {
  deprecatedWorker,
  formatOptOutWorker,
  mapStatusToErrorMessage,
} from "@/utils/utils";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";

import globalStyles from "@/global.less";
import workForceStyles from "@/pages/bpo/bpo-job/job-detail/Workforce/index.less";
import styles from "@/pages/bpo/bpo-job/JobList.less";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

interface Props {
  job: Job;
}

export enum BpoWorkerStatus {
  CONFIRMED = "CONFIRMED",
  ASSIGNED = "ASSIGNED",
  REJECT = "REJECT",
  DETAINED = "DETAINED",
  DECLINED = "DECLINED",
}

export const revokeWorkerStatus = [
  BpoWorkerStatus.ASSIGNED,
  BpoWorkerStatus.CONFIRMED,
  BpoWorkerStatus.DETAINED,
];

const COLORS = {
  [BpoWorkerStatus.CONFIRMED]: "#52c41a",
  [BpoWorkerStatus.ASSIGNED]: "#5187f3",
  [BpoWorkerStatus.REJECT]: "#e356e1",
  [BpoWorkerStatus.DETAINED]: "#fdb314",
  [BpoWorkerStatus.DECLINED]: "#f56c6c",
};

function Workforce({ job }: Props) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const [selectedRows, setSelectedRows] = useState([]);
  const [visible, setVisible] = useState({ workforce: false, batchQa: false });
  const [filter, setFilter] = useState({});
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // const [disableBatchQa, setDisableBatchQa] = useState(false);

  // const isQAJob = job?.jobType === JobType.QA;
  const pathSegments = pathToRegexp(`/bpo-job/:jobId/:tab`).exec(
    location.pathname
  );
  const [, id] = pathSegments;
  const jobId = job?.id || id;

  const getList = () => {
    setLoading(true);
    getBpoJobWorkers({
      jobId,
      pageIndex: currentPage - 1,
      pageSize,
      ...filter,
    })
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setData(resp.data.results);
          setTotal(resp.data.totalElements);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  const resetWorkers = (workerIds?: string[]) => {
    setLoading(true);
    resetBpoJobWorkers(
      jobId,
      workerIds ||
        selectedRows
          .filter((item) => item.status === BpoWorkerStatus.DECLINED)
          .map((item) => item.workerId)
    )
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          message.success(
            formatMessage({ id: "common.message.success.operation" })
          );
          getList();
          setSelectedRows([]);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  const revokeWorkers = (workerIds?: string[]) => {
    setLoading(true);
    revokeBpoJobWorkers(
      jobId,
      workerIds ||
        selectedRows
          .filter((item) => revokeWorkerStatus.includes(item.status))
          .map((item) => item.workerId)
    )
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          message.success(
            formatMessage({ id: "common.message.success.operation" })
          );
          getList();
          setSelectedRows([]);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  const filterFormItems: FormItem[] = [
    {
      key: "uniqueName",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-worker.table.column.name" })}
        </span>
      ),
      type: FormItemType.Text,
      style: { width: 160 },
    },
    {
      key: "statusList",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-job-detail.workforce.filter.status" })}
        </span>
      ),
      type: FormItemType.Multiple,
      options: Object.keys(BpoWorkerStatus),
      optionLabel: (status) =>
        formatMessage({
          id: `bpo-job-detail.workforce.columns.status.${status.toLowerCase()}`,
        }),
      style: { width: 160 },
    },
  ];

  const columns = [
    {
      title: formatMessage({ id: "bpo-job-detail.workforce.columns.contact" }),
      dataIndex: "uniqueName",
      render: (uniqueName: string, record: Record<string, any>) =>
        formatOptOutWorker(uniqueName, record.workerId),
    },
    {
      title: formatMessage({ id: "bpo-job-detail.workforce.columns.add-time" }),
      dataIndex: "assignTime",
      render: (assignTime: string) => dateFormat(assignTime),
    },
    {
      title: formatMessage({ id: "bpo-job-detail.workforce.columns.status" }),
      dataIndex: "status",
      render: (status: string) => (
        <span>
          <i
            className={workForceStyles["status-point"]}
            style={{
              backgroundColor: COLORS[status],
            }}
          />
          {formatMessage({
            id: `bpo-job-detail.workforce.columns.status.${status.toLowerCase()}`,
          })}
        </span>
      ),
    },
    {
      title: formatMessage({ id: "common.operation" }),
      render: (record: Record<string, any>) => (
        <>
          {revokeWorkerStatus.includes(record.status) && (
            <Button
              type="link"
              className={workForceStyles.action}
              onClick={() => revokeWorkers([record.workerId])}
            >
              {formatMessage({
                id: "bpo-job-detail.workforce.columns.action.disable",
              })}
            </Button>
          )}
          {record.status === BpoWorkerStatus.DECLINED && (
            <Button
              type="link"
              className={`${workForceStyles.action} ${workForceStyles.disable}`}
              onClick={() => resetWorkers([record.workerId])}
            >
              {formatMessage({
                id: "bpo-job-detail.workforce.columns.action.enable",
              })}
            </Button>
          )}
        </>
      ),
    },
  ];

  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys: selectedRows.map((item) => item.workerId),
    onChange: (selectedRowKeys, rows) => setSelectedRows(rows),
    getCheckboxProps: (record: any) => ({
      disabled:
        record.status === BpoWorkerStatus.REJECT ||
        record.workerEmail === deprecatedWorker,
    }),
  };

  useEffect(() => {
    getList();
  }, [currentPage, job?.id, filter, pageSize]);

  return (
    <div className={workForceStyles.box}>
      <div className={workForceStyles["add-worker"]}>
        {/*<Button*/}
        {/*  style={{ marginRight: 8 }}*/}
        {/*  disabled={disableBatchQa}*/}
        {/*  onClick={() => setVisible({ ...visible, batchQa: true })}*/}
        {/*>*/}
        {/*  {formatMessage({ id: 'qa.batch.setting.create' })}*/}
        {/*</Button>*/}
        <Button
          type="primary"
          onClick={() => setVisible({ ...visible, workforce: true })}
        >
          {formatMessage({ id: "job-detail.workforce.add" })}
        </Button>
      </div>
      <Card
        bordered={false}
        className={`${globalStyles["with-shadow"]} ${styles.list}`}
      >
        <FilterFormComponent
          formItems={filterFormItems}
          formStyle={{ marginBottom: 0 }}
          formItemStyle={{ marginBottom: 15 }}
          initialValue={filter}
          onFilterValueChange={(newFilter) => {
            setFilter(newFilter);
            setCurrentPage(1);
          }}
          searchMode="click"
        />
        <Divider className={workForceStyles.divider} />
        <div className={workForceStyles["table-actions"]}>
          <div className={workForceStyles["btn-group"]}>
            <Button
              danger
              ghost
              disabled={
                selectedRows.filter((item) =>
                  revokeWorkerStatus.includes(item.status)
                ).length === 0
              }
              onClick={() => revokeWorkers()}
            >
              {formatMessage({
                id: "bpo-job-detail.workforce.columns.action.disable",
              })}
            </Button>
            <Button
              className={workForceStyles.btn}
              type="primary"
              disabled={
                selectedRows.filter(
                  (item) => item.status === BpoWorkerStatus.DECLINED
                ).length === 0
              }
              onClick={() => resetWorkers()}
            >
              {formatMessage({
                id: "bpo-job-detail.workforce.columns.action.enable",
              })}
            </Button>
          </div>
          {selectedRows.length > 0 && (
            <p className={workForceStyles.statistics}>
              {formatMessage(
                { id: "bpo-worker.table.statistics" },
                {
                  approvedNum: selectedRows.length,
                  totalNum: total,
                }
              )}
            </p>
          )}
        </div>
        <Divider className={workForceStyles["divider-two"]} />
        <Table
          columns={columns}
          className={globalStyles.tableStriped}
          scroll={{ x: "max-content" }}
          dataSource={data}
          rowSelection={rowSelection}
          rowKey="workerId"
          pagination={{
            total,
            pageSize,
            current: currentPage,
            onChange: (num, size) => {
              setCurrentPage(num);
              setPageSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          loading={loading}
        />
        <BpoWorkerAddModal
          visible={visible.workforce}
          jobId={job?.id}
          onClose={() => {
            setVisible({ ...visible, workforce: false });
            getList();
          }}
        />
        {/*<WorkerBatchModal*/}
        {/*  isBPO*/}
        {/*  visible={visible.batchQa}*/}
        {/*  jobId={jobId}*/}
        {/*  onSave={() => {*/}
        {/*    setVisible({ ...visible, batchQa: false });*/}
        {/*    getList();*/}
        {/*  }}*/}
        {/*  onClose={() => setVisible({ ...visible, batchQa: false })}*/}
        {/*  isQAJob={isQAJob}*/}
        {/*  setDisableBatchQa={setDisableBatchQa}*/}
        {/*/>*/}
      </Card>
    </div>
  );
}

function mapStateToProps({ bpoJob, loading }: ConnectState) {
  return {
    job: bpoJob.job,
    workers: bpoJob.workers,
    totalWorkers: bpoJob.totalWorkers,
    workerEmails: bpoJob.workerEmails,
    loading:
      (loading.effects["jobDetail/getWorkers"] &&
        !loading.effects["jobDetail/getJob"]) ||
      false,
    deleting: loading.effects["jobDetail/removeWorkers"],
  };
}

export default connect(mapStateToProps)(Workforce);
