import { useEffect, useState } from "react";
import { message, List, Button, Pagination, Table } from "antd";
import type { TableRowSelection } from "antd/es/table/interface";
import classNames from "classnames";
import { CloseOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";

import MaterialModal from "@/components/MaterialModal";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { mapStatusToErrorMessage } from "@/utils/utils";

import styles from "@/components/styles/common.less";
import FilterFormComponent from "@/components/FilterFormComponent";
import { FormItemType } from "@/types/common";
import type { FormItem } from "@/types/common";
import {
  addInternalWorkers,
  // getInternalTags,
  getInternalWorkers,
  InternalWorkerFilter,
} from "@/services/worker";
import { HttpStatus } from "@/types/http";
// import BPOTagComponent from '@/pages/bpo/components/BPOTagComponent';

interface Props {
  jobId: string;
  projectId: string;
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

enum UserStatus {
  ACTIVE = "ACTIVE",
  TO_BE_ACTIVE = "TO_BE_ACTIVE",
}

export type InternalWorker = {
  id: string;
  uniqueName: string;
  email: string | null;
  tags: { id: string; name: string }[];
  activeStatus: UserStatus;
};

export default function InternalWorkerAddModal({
  projectId,
  jobId,
  visible,
  onClose,
  onSave,
}: Props) {
  const { formatMessage } = useIntl();
  const [total, setTotal] = useState(0);
  const [data, setData] = useState<InternalWorker[]>([]);
  // const [tags, setTags] = useState<InternalWorker[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<InternalWorkerFilter>({
    pageSize: DEFAULT_PAGE_SIZE,
    pageIndex: 0,
  });
  const [selectedData, setSelectedData] = useState<InternalWorker[]>([]);
  const filterFormItems: FormItem[] = [
    {
      key: "uniqueName",
      placeholder: formatMessage({ id: "common.worker.unique-name" }),
      type: FormItemType.Text,
      style: { width: 160 },
    },
    {
      key: "activeStatus",
      placeholder: formatMessage({ id: "common.status" }),
      style: { width: 160 },
      type: FormItemType.Single,
      options: Object.keys(UserStatus),
      optionLabel: (item: string) =>
        formatMessage({ id: `common.user.status.${item.toLowerCase()}` }),
      allowClear: true,
    },
    // {
    //   key: 'tags',
    //   label: (
    //     <span className={styles['filter-label']}>
    //       {formatMessage({ id: 'bpo-job-detail.workforce.columns.tag' })}
    //     </span>
    //   ),
    //   type: FormItemType.Multiple,
    //   options: tags,
    //   optionValueKey: 'id',
    //   optionLabelKey: 'name',
    //   style: { width: 160 },
    // },
  ];

  const WorkerListColumns = [
    {
      title: formatMessage({ id: "common.worker.unique-name" }),
      render: (record: InternalWorker) => {
        return (
          <p style={{ margin: 0, color: "#42526e" }}>
            {record.uniqueName}
            <span style={{ marginLeft: 4, color: "#7a869a" }}>
              {record.email}
            </span>
          </p>
        );
      },
    },
    {
      title: formatMessage({ id: "common.status" }),
      render: (record: InternalWorker) => {
        return (
          <p style={{ margin: 0, color: "#42526e" }}>
            {formatMessage({
              id: `common.user.status.${record.activeStatus.toLowerCase()}`,
            })}
          </p>
        );
      },
    },
    // {
    //   title: formatMessage({ id: 'bpo-worker.table.column.tag' }),
    //   dataIndex: 'tags',
    //   render: (userTags: { id: string; name: string }[]) => (
    //     <div style={{ display: 'flex', alignItems: 'center' }}>
    //       <BPOTagComponent tags={userTags} />
    //     </div>
    //   ),
    // },
  ];

  const handleSave = async () => {
    try {
      const resp = await addInternalWorkers({
        jobId,
        userIds: selectedData.map((item) => item.id),
      });
      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
        return;
      }
      message.success(formatMessage({ id: "common.message.success.update" }));
      onSave();
      onClose();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const confirm = () => {
    handleSave();
  };

  const getList = async () => {
    if (!visible) {
      return;
    }
    setLoading(true);
    try {
      const resp = await getInternalWorkers({
        ...filter,
        projectId,
      });
      if (resp.status === HttpStatus.OK) {
        setData(resp.data.results);
        setTotal(resp.data.totalElements);
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const rowSelection: TableRowSelection<InternalWorker> = {
    selectedRowKeys: selectedData.map((item) => item.id),
    onSelect: (record, selected: boolean) => {
      if (selected) {
        setSelectedData(selectedData.concat([record]));
      } else {
        const newSelectedData = selectedData.filter(
          (item) => item.id !== record.id
        );
        setSelectedData(newSelectedData);
      }
    },
    onSelectAll: (selected, records, changeRows) => {
      if (selected) {
        const addedRecords = changeRows.filter(
          (item) => !selectedData.find((record) => record.id === item.id)
        );
        setSelectedData(selectedData.concat(addedRecords || []));
      } else {
        const filterData = selectedData.filter(
          (item) => !changeRows.find((record) => record.id === item.id)
        );
        setSelectedData(filterData || []);
      }
    },
  };

  const clearAll = () => {
    const cacheJobs = [...selectedData];
    setSelectedData([]);
    message.warning(
      <span>
        {formatMessage(
          { id: "project.detail.analysis.workload.clear-all-tip" },
          { num: cacheJobs.length }
        )}
        <Button
          className={styles["revoke-btn"]}
          type="link"
          onClick={() => {
            setSelectedData(cacheJobs);
            message.destroy();
          }}
        >
          {formatMessage({ id: "common.revoke" })}
        </Button>
      </span>,
      3
    );
  };

  // const getTags = () => {
  //   getInternalTags({ jobId })
  //     .then(resp => {
  //       if (resp.status === HttpStatus.OK) {
  //         setTags(resp.data);
  //       } else {
  //         message.error(mapStatusToErrorMessage(resp));
  //       }
  //     })
  //     .catch(e => message.error(mapStatusToErrorMessage(e)));
  // };

  useEffect(() => {
    if (visible) {
      getList();
    }
  }, [visible, filter]);

  useEffect(() => {
    if (!visible) {
      setFilter({
        pageSize: DEFAULT_PAGE_SIZE,
        pageIndex: 0,
      });
      setSelectedData([]);
    }
    // else {
    // getTags();
    // }
  }, [visible]);

  return (
    <MaterialModal
      width={1100}
      title={formatMessage({ id: "job-detail.workforce.select.internal" })}
      visible={visible}
      onClose={onClose}
      onSave={confirm}
    >
      <FilterFormComponent
        formItems={filterFormItems}
        onFilterValueChange={(filterParams) =>
          setFilter({
            ...filterParams,
            pageIndex: 0,
            pageSize: filter.pageSize,
          })
        }
        initialValue={{}}
        searchMode="click"
      />
      <div className={styles["list-box"]}>
        <Table
          rowKey="id"
          className={classNames("tableStriped", styles.list)}
          style={{ borderTop: "1px solid #F0F0F0", paddingTop: 0 }}
          columns={WorkerListColumns}
          dataSource={data}
          rowSelection={rowSelection}
          loading={loading}
          pagination={false}
        />
        <List
          className={styles["selected-list"]}
          dataSource={selectedData}
          header={
            <div className={styles.header}>
              {formatMessage(
                { id: "job-detail.bpo-workforce.select-tip" },
                { count: selectedData.length }
              )}
              <Button
                type="link"
                className={styles["clear-btn"]}
                onClick={clearAll}
                disabled={selectedData.length === 0}
              >
                {formatMessage({ id: "common.clear" })}
              </Button>
            </div>
          }
          renderItem={(item) => {
            return (
              <div className={styles["select-list-item"]}>
                <CloseOutlined
                  className={styles["close-btn"]}
                  onClick={() =>
                    setSelectedData(
                      selectedData.filter((i) => i.id !== item.id)
                    )
                  }
                />
                <span className={styles.label}>
                  {item.uniqueName || item.email}
                </span>
              </div>
            );
          }}
        />
      </div>
      <Pagination
        className={styles.pagination}
        showTotal={(totalNum) => (
          <>
            {formatMessage(
              { id: "bpo-project-invitation.total" },
              { total: totalNum }
            )}
          </>
        )}
        current={filter.pageIndex + 1}
        total={total}
        pageSize={filter.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        showSizeChanger
        onChange={(page, size) => {
          setFilter({
            ...filter,
            pageIndex: page - 1,
            pageSize: size,
          });
        }}
      />
    </MaterialModal>
  );
}
