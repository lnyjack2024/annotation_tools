import { InfoCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Table,
  message,
  Popover,
  Radio,
  Divider,
  InputNumber,
  Spin,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";
import MaterialModal from "@/components/MaterialModal";
import {
  getJob,
  getWorkersSample,
  updateQaGlobalSample,
  updateWorkerSample,
} from "@/services/job";
import EditTag from "@/pages/job/job-detail/Qa/components/EditTag";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import {
  deprecatedWorker,
  formatOptOutWorker,
  mapStatusToErrorMessage,
} from "@/utils/utils";
import { HttpStatus } from "@/types/http";
import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import BatchEditRateModal from "@/pages/job/job-detail/Qa/components/BatchEditRateModal";
import globalStyles from "@/global.less";
import type { TableRowSelection } from "antd/lib/table/interface";
import type { RadioChangeEvent } from "antd/es/radio";
import useDebounce from "@/hooks/useDebounce";

interface Worker {
  workerId: string;
  workerEmail: string;
  sampleRate: number;
  qaJobId: string;
}

export interface SampleRateSettingModalProps {
  onClose: () => void;
  visible: boolean;
  jobId: string;
  isMultiWorkerPerRow?: boolean;
}

function SampleRateSettingModal({
  visible,
  onClose,
  jobId,
  isMultiWorkerPerRow = false,
}: SampleRateSettingModalProps) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Worker[]>([]);
  const [rateMode, setRateMode] = useState<boolean>();
  const [globalSampleRate, setGlobalSampleRate] = useState<number>();
  const [filter, setFilter] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState([]);
  const [batchMode, setBatchMode] = useState<"batch" | "all">();

  const handleChange = (workerId: string, value: number) => {
    const worker = workers.find((item) => item.workerId === workerId);
    if (worker.sampleRate === value) {
      return;
    }

    setUpdating([...updating, workerId]);
    updateWorkerSample([{ ...worker, qaJobId: jobId, sampleRate: value }])
      .then((res) => {
        if (res.status === HttpStatus.OK) {
          setWorkers(
            workers.map((item) => ({
              ...item,
              sampleRate: item.workerId === workerId ? value : item.sampleRate,
            }))
          );
          message.success(
            formatMessage({ id: "common.message.success.update" })
          );
        } else {
          message.error(mapStatusToErrorMessage(res));
        }
      })
      .finally(() => {
        setUpdating(updating.filter((id) => id !== workerId));
      });
  };

  const pageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const getPreconditionWorkers = () => {
    setLoading(true);
    setSelectedWorkers([]);
    getWorkersSample(jobId, currentPage - 1, pageSize, filter)
      .then((res) => {
        if (res.status === HttpStatus.OK) {
          const { totalElements, results } = res.data;
          setWorkers(results || []);
          setTotalCount(totalElements);
        } else {
          message.error(mapStatusToErrorMessage(res));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const validate = (v: number) => {
    return Number.isInteger(v) && v >= 0 && v <= 100;
  };

  const handleModeChange = (event?: RadioChangeEvent) => {
    if (!validate(globalSampleRate)) {
      return;
    }
    const value = event ? event.target.value : rateMode;
    setRateMode(value);
    setLoading(true);
    updateQaGlobalSample(jobId, globalSampleRate, value)
      .then((resp) => {
        if (resp.status !== HttpStatus.OK) {
          message.error(mapStatusToErrorMessage(resp));
          if (event) {
            setRateMode(!value);
          }
        }
      })
      .catch((err) => {
        message.error(mapStatusToErrorMessage(err));
        if (event) {
          setRateMode(!value);
        }
      })
      .finally(() => setLoading(false));
  };

  const updateGlobalRate = useDebounce(handleModeChange, 1000);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.all([
        getJob(jobId),
        getWorkersSample(jobId, currentPage - 1, pageSize, filter),
      ])
        .then((resp) => {
          const [jobData, workerData] = resp;
          if (workerData.status === HttpStatus.OK) {
            const { totalElements, results } = workerData.data;
            setWorkers(results || []);
            setTotalCount(totalElements);
          } else {
            message.error(mapStatusToErrorMessage(workerData));
          }
          if (jobData.status === HttpStatus.OK) {
            const { globalSampleRate: totalSampleRate, globalSampleSwitchOn } =
              jobData.data;
            setRateMode(globalSampleSwitchOn);
            setGlobalSampleRate(+totalSampleRate);
          } else {
            message.error(mapStatusToErrorMessage(jobData));
          }
        })
        .catch((e) => message.error(mapStatusToErrorMessage(e)))
        .finally(() => setLoading(false));
    }
  }, [jobId, visible]);

  useEffect(() => {
    if (visible) {
      getPreconditionWorkers();
    }
  }, [pageSize, currentPage, filter]);

  const columns = [
    {
      title: formatMessage({ id: "job-detail.workforce.col.email" }),
      dataIndex: "workerEmail",
      render: (workerEmail: string, record: Worker) =>
        formatOptOutWorker(workerEmail, record.workerId),
    },
    {
      title: formatMessage({ id: "job-detail.workforce.col.name" }),
      dataIndex: "workerName",
      render: (workerName: string, record: Worker) =>
        formatOptOutWorker(workerName, record.workerId),
    },
    {
      title: (
        <span>
          {formatMessage({ id: "job.qa.set-rate.sample-rate" })}
          <Popover
            content={
              <div className="color-grey-6">
                <div style={{ wordBreak: "break-all" }}>
                  <div>
                    {formatMessage({
                      id: "qa-job-create.data-selection.extra",
                    })}
                  </div>
                </div>
              </div>
            }
          >
            <InfoCircleOutlined
              className="color-grey-9"
              style={{ marginLeft: "8px" }}
            />
          </Popover>
        </span>
      ),
      render: (row: Worker) => (
        <EditTag
          disabled={row.workerEmail === deprecatedWorker}
          loading={!!updating.find((id) => id === row.workerId)}
          value={row.sampleRate}
          onSubmit={(value) => handleChange(row.workerId, value)}
        />
      ),
    },
  ];

  const filterFormItems: FormItem[] = [
    {
      key: "emailsOrNames",
      type: FormItemType.Text,
      placeholder: formatMessage({ id: "job.qa.rate-search-placeholder" }),
    },
  ];

  const rowSelection: TableRowSelection<Worker> = {
    selectedRowKeys: selectedWorkers.map((item) => item.workerId),
    onChange: (selectedRowKeys, rows: any[]) => setSelectedWorkers(rows),
    getCheckboxProps: (record) => ({
      disabled: record.workerEmail === deprecatedWorker,
    }),
  };

  return (
    <MaterialModal
      title={
        <>
          {formatMessage({ id: "job.qa.setSampleRate" })}
          <Tooltip title={formatMessage({ id: "job.qa.setSampleRate.tip" })}>
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </>
      }
      visible={visible}
      width={800}
      onClose={onClose}
      onSave={onClose}
      showFooter={false}
    >
      <Spin spinning={loading}>
        <Radio.Group
          value={rateMode}
          style={{ display: "block", marginBottom: 16 }}
          onChange={handleModeChange}
        >
          <div>
            <Radio
              value
              style={{
                display: "inline-block",
                height: 32,
                // lineHeight: '32px',
                color: !rateMode ? "#7a869a" : "#3e5270",
              }}
            >
              {formatMessage({ id: "job.qa.set-rate.all" })}
              <InputNumber
                style={{ width: 160, margin: "0 8px" }}
                min={0}
                max={100}
                precision={0}
                disabled={!rateMode}
                value={Number(globalSampleRate)}
                onChange={(value) => {
                  setGlobalSampleRate(+value);
                  updateGlobalRate();
                }}
              />
              %
            </Radio>
          </div>
          <Divider style={{ margin: "16px 0" }} />
          <div>
            <Radio
              value={false}
              style={{
                display: "inline-block",
                height: 32,
                // lineHeight: '32px',
                color: rateMode ? "#7a869a" : "#3e5270",
              }}
              disabled={isMultiWorkerPerRow}
            >
              {formatMessage({ id: "job.qa.set-rate.customized" })}
            </Radio>
            <Button
              style={{ float: "right" }}
              onClick={() => setBatchMode("all")}
              disabled={rateMode || isMultiWorkerPerRow}
            >
              {formatMessage({ id: "job.qa.set-rate.modify-all" })}
            </Button>
          </div>
        </Radio.Group>
        <FilterFormComponent
          formItems={filterFormItems}
          formStyle={{ marginBottom: 0 }}
          formItemStyle={{ marginBottom: 15 }}
          initialValue={filter}
          onFilterValueChange={(newFilter) => {
            setFilter(newFilter);
            setCurrentPage(1);
          }}
        />
        <Divider style={{ margin: 0 }} />
        <Table
          rowKey="workerId"
          scroll={{ y: 440 }}
          className={globalStyles.tableStriped}
          columns={columns}
          dataSource={workers}
          rowSelection={rowSelection}
          pagination={{
            total: totalCount,
            pageSize,
            current: currentPage,
            onChange: pageChange,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (total) =>
              formatMessage({ id: "common.total.items" }, { items: total }),
          }}
        />
        <div style={{ marginTop: -48 }}>
          <Button
            type="primary"
            onClick={() => setBatchMode("batch")}
            disabled={selectedWorkers.length === 0}
          >
            {formatMessage({ id: "job.qa.set-rate.modify-batch" })}
          </Button>
        </div>
        {(rateMode || isMultiWorkerPerRow) && (
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "calc(100% - 100px)",
              top: 100,
              background: "white",
              opacity: 0.4,
              zIndex: 1,
              cursor: "not-allowed",
            }}
          />
        )}
        <BatchEditRateModal
          visible={!!batchMode}
          totalNum={batchMode === "all" ? totalCount : selectedWorkers.length}
          mode={batchMode}
          jobId={jobId}
          workers={batchMode === "all" ? [] : selectedWorkers}
          onClose={() => {
            setBatchMode(null);
          }}
          onRefresh={() => {
            getPreconditionWorkers();
          }}
        />
      </Spin>
    </MaterialModal>
  );
}

export default SampleRateSettingModal;
