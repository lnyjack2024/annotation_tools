import { useEffect, useState } from "react";
import { Table, Divider, message } from "antd";
import MaterialModal from "@/components/MaterialModal";
import { useIntl } from "@umijs/max";
import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import { addBpoJobWorkers } from "@/services/bpo";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { HttpStatus } from "@/types/http";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";

import styles from "@/pages/bpo/bpo-job/JobList.less";
import globalStyles from "@/global.less";
import type { TableRowSelection } from "antd/es/table/interface";
// import { getBpoUserList, getBpoUserTags } from '@/services/user';
import { getBpoUserList } from "@/services/user";
// import { GlobalTag } from '@/types/vm';

interface Props {
  isPM?: boolean;
  jobId: string;
  bpoId?: string;
  visible: boolean;
  onClose: () => void;
}

function BpoWorkerAddModal({
  bpoId,
  jobId,
  isPM = false,
  visible,
  onClose,
}: Props) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [filter, setFilter] = useState({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [data, setData] = useState([]);
  // const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const handleAddWorkers = () => {
    setSaveLoading(true);
    addBpoJobWorkers(jobId, selectedKeys)
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          message.success(
            formatMessage({ id: "common.message.success.operation" })
          );
          onClose();
          setSelectedKeys([]);
          setFilter({});
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setSaveLoading(false));
  };

  const getList = () => {
    if (!visible || !jobId) {
      return;
    }
    setLoading(true);
    getBpoUserList({
      bpoId,
      pageSize,
      pageIndex: currentPage - 1,
      role: 4,
      ...filter,
    })
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setData(resp.data.results);
          setTotal(resp.data.totalElements);
          setSelectedKeys([]);
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  // const getTagList = () => {
  //   if (!visible) {
  //     return;
  //   }
  //   getBpoUserTags(bpoId)
  //     .then(resp => {
  //       if (resp.status === HttpStatus.OK) {
  //         setTags(resp.data);
  //       } else {
  //         message.error(mapStatusToErrorMessage(resp));
  //       }
  //     })
  //     .catch(e => message.error(mapStatusToErrorMessage(e)));
  // };

  const filterFormItems: FormItem[] = [
    {
      key: "name",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-worker.table.column.name" })}
        </span>
      ),
      type: FormItemType.Text,
      style: { width: 160 },
    },
    // {
    //   key: 'tags',
    //   label: (
    //     <span className={styles['filter-label']}>
    //       {formatMessage({ id: 'bpo-job-detail.workforce.filter.tag' })}
    //     </span>
    //   ),
    //   type: FormItemType.Multiple,
    //   options: tags,
    //   optionLabelKey: 'name',
    //   optionValueKey: 'id',
    //   style: { width: 160 },
    // },
  ];

  const columns = [
    {
      title: formatMessage({ id: "bpo-job-detail.workforce.columns.contact" }),
      dataIndex: "uniqueName",
    },
    // {
    //   title: formatMessage({ id: 'bpo-job-detail.workforce.columns.tag' }),
    //   dataIndex: 'tags',
    //   render: (items: GlobalTag[]) =>
    //     (items || []).map(tag => (
    //       <Tag
    //         style={{
    //           color: '#227a7a',
    //           backgroundColor: 'rgba(34, 122, 122, 0.08)',
    //           border: '1px solid rgba(34, 122, 122, 0.2)',
    //           borderRadius: 2,
    //         }}
    //       >
    //         {tag.name}
    //       </Tag>
    //     )),
    // },
  ];

  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys: selectedKeys,
    onChange: (selectedRowKeys) => setSelectedKeys(selectedRowKeys as string[]),
    getCheckboxProps: (record: any) => ({
      disabled: !!record.jobAssignStatus,
    }),
  };

  useEffect(() => {
    getList();
  }, [filter, currentPage, pageSize, jobId, visible]);

  // useEffect(() => {
  //   getTagList();
  // }, [visible]);

  return (
    <MaterialModal
      title={formatMessage({ id: "job-detail.workforce.add" })}
      visible={visible}
      width={1080}
      onClose={onClose}
      onSave={handleAddWorkers}
      saveLoading={saveLoading}
      showFooter
    >
      <FilterFormComponent
        formItems={filterFormItems}
        formStyle={{ marginBottom: 0 }}
        formItemStyle={{ marginBottom: 15 }}
        initialValue={filter}
        onFilterValueChange={setFilter}
      />
      <Divider style={{ margin: 0 }} />
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
    </MaterialModal>
  );
}

export default BpoWorkerAddModal;
