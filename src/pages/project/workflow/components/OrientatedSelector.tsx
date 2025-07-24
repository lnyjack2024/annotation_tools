import type { ForwardedRef } from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "@umijs/max";
import { Card, Spin, Table, Button, message } from "antd";
import {
  CloudDownloadOutlined,
  RightCircleOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { TableRowSelection } from "antd/lib/table/interface";
import cx from "classnames";

import {
  getJobWorkersV3,
  getLabelWorkerList,
  getLabelWorkerListByQaJob,
  uploadWorkerBatchData,
} from "@/services/job";
import { safeFetch, simpleProxy, formatLocal } from "@/utils";
import { useAsync } from "@/hooks";
import WorkforceFilter from "../JobWorkforce/WorkforceFilter";
import MaterialModal from "@/components/MaterialModal";
import { DelayUploader } from "@/pages/job/components/WorkerUploader";
import type {
  JobWorkersV3ResultItem,
  LabelingWorker,
  LabelWorkerListByQaResult,
  Page,
} from "@/types";
import {
  cardHeadStyle,
  filterStyle,
  genOptions,
  getStatusColor,
  initSelectedInfo,
  pageInitOptions,
  qaCols,
  reducer,
  workerCols,
} from "./utils";
import styles from "./JobDetailDrawer.less";
import { getBpoJobWorkers } from "@/services/bpo";

interface OrientatedSelectorProps {
  jobId: string;
  selectedJobId: string;
  isPublic?: boolean;
  isBPO?: boolean;
  setUpdated: (status?: boolean) => void;
  onClear: () => Promise<void>;
  afterUploaded: () => void;
}
interface RefProps {
  map: Map<string, string[]>;
  clearAll: () => void;
  fetchJobWorkers: () => Promise<void>;
}

function _OrientatedSelector(
  {
    jobId,
    selectedJobId,
    isPublic,
    setUpdated,
    isBPO = false,
    onClear,
    afterUploaded,
  }: OrientatedSelectorProps,
  ref: ForwardedRef<RefProps>
) {
  const { formatMessage } = useIntl();
  const [file, setFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [filter, setFilter] = useState({
    jobId,
    isPublic,
    statusList: "ALL",
    ...pageInitOptions,
  });
  const [workerSelectorFilter, setWorkerSelectorFilter] = useState({
    qaJobId: jobId,
    targetJobId: selectedJobId,
    isPublic,
    statusList: "ALL",
    assignedFlag: "",
    ...pageInitOptions,
  });
  const [workJob, setWorkJob] = useState<JobWorkersV3ResultItem>(null);
  const {
    data,
    loading,
    fetchData: fetchJobWorkers,
  } = useAsync<Page<JobWorkersV3ResultItem>>(
    isBPO ? getBpoJobWorkers : getJobWorkersV3,
    genOptions(filter)
  );
  const [selectedInfo, dispatch] = useReducer(reducer, { ...initSelectedInfo });

  const workerColumns = workerCols.concat({
    title: <FormattedMessage id="workflow.worker.column.orientation.by" />,
    dataIndex: "qaWorkerUniqueName",
    width: 120,
    render: (qaWorkerUniqueName: string, record) => {
      const isSelected = selectedInfo.keys.includes(
        record.labelWorkerUniqueName
      );
      const name = isSelected
        ? workJob?.uniqueName
        : qaWorkerUniqueName || null;
      return name ? (
        <span>
          <EyeOutlined style={{ marginRight: 4 }} />
          {name}
        </span>
      ) : (
        simpleProxy(name)
      );
    },
  });
  const {
    data: workers,
    loading: workersLoading,
    fetchData: fetchLabelWorkerList,
  } = useAsync<Page<LabelingWorker>>(
    getLabelWorkerList,
    genOptions(workerSelectorFilter),
    !!workJob?.workerId,
    { results: [] }
  );
  const { data: labelWorker, fetchData: fetchLabelWorker } =
    useAsync<LabelWorkerListByQaResult>(
      getLabelWorkerListByQaJob,
      {
        isPublic,
        qaJobId: jobId,
        workerId: selectedJobId,
      },
      true,
      []
    );
  const map = useMemo(
    () =>
      labelWorker.reduce(
        (result, { workerUniqueName: key, targetWorkerList }) =>
          result.set(
            key,
            targetWorkerList
              .filter((item) => item.jobId === selectedJobId)
              .map(({ workerUniqueName }) => workerUniqueName)
          ),
        new Map()
      ),
    [labelWorker]
  );

  const qaColumns = qaCols.concat({
    title: <FormattedMessage id="workflow.worker.column.orientation.num" />,
    dataIndex: "labelQAMappingNum",
    width: 90,
    render: (labelQAMappingNum, record) => {
      const num = map.get(record.uniqueName)?.length;
      return (
        <div
          style={{
            textAlign: "center",
            color: getStatusColor(num),
          }}
        >
          {formatLocal(num)}
        </div>
      );
    },
  });
  useEffect(() => {
    if (workJob) {
      const keys = map.get(workJob.uniqueName) || [];
      dispatch({
        type: "init",
        payload: {
          keys,
          items: workers.results.filter((x) =>
            keys.includes(x.labelWorkerUniqueName)
          ),
        },
      });
    }
  }, [workJob]);

  useImperativeHandle(ref, () => {
    return {
      map,
      clearAll,
      fetchJobWorkers,
    };
  });
  function closeUpload() {
    setFile(null);
    setShowUpload(false);
  }

  async function updateAfterUpload() {
    await Promise.all([
      fetchJobWorkers(),
      fetchLabelWorkerList(),
      fetchLabelWorker(),
      afterUploaded(),
    ]);
    closeUpload();
    message.success(formatMessage({ id: "qa.batch.setting.success" }));
  }

  async function onSaveUpload() {
    setUploading(true);
    if (onClear) {
      await onClear();
    }
    await safeFetch({
      params: { qaJobId: jobId, targetJobId: selectedJobId, isPublic, file },
      api: uploadWorkerBatchData,
      onSuccess: updateAfterUpload,
      onError: () =>
        message.error(
          formatMessage({ id: "job.form.upload.error" }, { name: file.name })
        ),
    });
    setUploading(false);
  }

  const closeFailModal = () => {
    setFailMessage("");
  };

  function clearAll() {
    dispatch({
      type: "clear",
    });
    map.clear();
  }

  const clear = () => {
    const cacheSelectorInfo = { ...selectedInfo };
    map.set(workJob?.uniqueName, []);
    dispatch({
      type: "clear",
    });
    setUpdated(true);
    message.warning(
      <span>
        {formatMessage(
          { id: "project.detail.analysis.workload.clear-all-tip" },
          { num: cacheSelectorInfo.items.length } // actually handled ones
        )}
        <Button
          type="link"
          onClick={() => {
            dispatch({
              type: "reset",
              payload: cacheSelectorInfo,
            });
            message.destroy();
          }}
        >
          {formatMessage({ id: "common.revoke" })}
        </Button>
      </span>,
      3
    );
  };

  const rowSelection: TableRowSelection<LabelingWorker> = {
    selectedRowKeys: selectedInfo.keys,
    onSelect: (record, selected) => {
      let [items, keys] = [
        selectedInfo.items.filter(
          (item) => item.labelWorkerUniqueName !== record.labelWorkerUniqueName
        ),
        selectedInfo.keys.filter((key) => key !== record.labelWorkerUniqueName),
      ];
      if (selected) {
        items = [...selectedInfo.items, record];
        keys = selectedInfo.keys.concat(
          items
            .map((x) => x.labelWorkerUniqueName)
            .filter((x) => !selectedInfo.keys.includes(x))
        );
      }
      dispatch({
        type: "select",
        payload: {
          keys,
          items,
        },
      });

      map.set(workJob?.uniqueName, keys);
      setUpdated(true);
    },
    onSelectAll: (selected, records, changeRows) => {
      let [items, keys] = [[] as LabelingWorker[], [] as string[]];
      if (selected) {
        items = selectedInfo.items.concat(
          changeRows.filter(
            (item) =>
              !selectedInfo.items.find(
                (record) =>
                  record.labelWorkerUniqueName === item.labelWorkerUniqueName
              )
          )
        );
        keys = selectedInfo.keys.concat(
          items
            .map((x) => x.labelWorkerUniqueName)
            .filter((x) => !selectedInfo.keys.includes(x))
        );
      }

      dispatch({
        type: "select",
        payload: {
          keys,
          items,
        },
      });
      map.set(workJob?.uniqueName, keys);
      setUpdated(true);
    },
    getCheckboxProps: (record) => {
      let disabled = false;
      if (workJob) {
        disabled = [...map.entries()]
          .filter(([k]) => k !== workJob.uniqueName)
          .some(([, list = []]) => list.includes(record.labelWorkerUniqueName));
      }
      return {
        disabled,
      };
    },
  };

  return (
    <>
      <div className={cx(styles["orientated-selector"], "flex-space-between")}>
        <Card
          className="ant-card-body-bottom0 flex-1"
          title={formatMessage({ id: "qa.batch.setting.worker.orientate" })}
          headStyle={cardHeadStyle()}
        >
          <WorkforceFilter
            isOrientationWithAll
            isOrientation={false}
            initialValue={filter}
            formStyle={filterStyle}
            onFilterChange={setFilter}
          />
          <Table
            rowKey="id"
            scroll={{ x: "max-content" }}
            rowClassName={(record) =>
              cx({ "ant-table-row-selected": record.id === workJob?.id })
            }
            columns={qaColumns}
            dataSource={data.results}
            loading={loading}
            onRow={(record) => {
              return {
                onClick: () => setWorkJob(record),
              };
            }}
            pagination={{
              total: data.totalElements,
              pageSize: filter.pageSize,
              onChange: (page, pageSize) =>
                setFilter({
                  ...filter,
                  pageSize,
                  pageIndex: page - 1,
                }),
              current: filter.pageIndex + 1,
              showQuickJumper: true,
            }}
          />
        </Card>
        <RightCircleOutlined
          className={styles["middle-circle"]}
          style={{ color: getStatusColor(selectedInfo.keys.length) }}
        />
        <Card
          className="ant-card-body-bottom0 flex-1"
          title={
            <Button
              type="link"
              size="small"
              className="pull-right"
              onClick={() => setShowUpload(true)}
            >
              {formatMessage({ id: "qa.batch.setting.uploadCSV" })}
              <UploadOutlined style={{ marginLeft: 10 }} />
            </Button>
          }
          headStyle={cardHeadStyle(620)}
        >
          <WorkforceFilter
            isOrientationWithAll
            initialValue={workerSelectorFilter}
            formStyle={filterStyle}
            onFilterChange={setWorkerSelectorFilter}
          />
          <Table
            rowKey="labelWorkerUniqueName"
            scroll={{ x: "max-content" }}
            columns={workerColumns}
            dataSource={workers.results}
            rowSelection={rowSelection}
            loading={workersLoading}
            pagination={{
              total: workers.totalElements,
              pageSize: workerSelectorFilter.pageSize,
              onChange: (page, pageSize) =>
                setWorkerSelectorFilter({
                  ...workerSelectorFilter,
                  pageSize,
                  pageIndex: page - 1,
                }),
              current: workerSelectorFilter.pageIndex + 1,
              showQuickJumper: true,
            }}
          />
          <Button
            type="link"
            danger
            hidden={!selectedInfo.keys.length}
            className={styles.clear}
            onClick={clear}
          >
            {formatMessage({ id: "common.clear.selection" })}
          </Button>
        </Card>
      </div>
      <MaterialModal
        width={760}
        visible={showUpload}
        title={formatMessage({ id: "qa.batch.setting" })}
        onClose={closeUpload}
        onSave={onSaveUpload}
      >
        {formatMessage({ id: "job-detail.workforce.add.qa-worker-list" })}
        <a href={"/templates/worker-batch-sample.csv"}>
          <Button type="link" icon={<CloudDownloadOutlined />}>
            <FormattedMessage id="job-detail.workforce.download-template" />
          </Button>
        </a>
        <Spin spinning={uploading}>
          <DelayUploader onFileUpdate={setFile} />
        </Spin>
      </MaterialModal>

      <MaterialModal
        visible={!!failMessage}
        title={formatMessage({ id: "qa.batch.setting.fail" })}
        onClose={closeFailModal}
        onSave={closeFailModal}
        isCancelBtnShow={false}
      >
        <p className={styles.error}>{failMessage}</p>
      </MaterialModal>
    </>
  );
}

export const OrientatedSelector = forwardRef(_OrientatedSelector);
