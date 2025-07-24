import { useEffect, useState } from "react";
import {
  EditOutlined,
  BulbOutlined,
  CloseCircleOutlined,
  FundOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { Button, Card, Divider, message, Table, Tag } from "antd";
import { history as router, useIntl } from "@umijs/max";

import withRound from "@/components/RoundIcon";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import type { Job } from "@/types/job";
import { BPOFilterStatus, JobStatus, JobType } from "@/types/job";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { dateFormat } from "@/utils/time-util";
import { getBpoJobs } from "@/services/bpo";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";

import globalStyles from "@/global.less";
import styles from "@/pages/bpo/bpo-job/JobList.less";

const RoundFolderOutlined = withRound(FolderOutlined);
const TagStyle = {
  [JobStatus.DRAFT]: {
    color: "#fdb314",
    backgroundColor: "rgba(253, 179, 20, 0.1)",
    Icon: () => <EditOutlined className={styles.icon} />,
  },
  [JobStatus.READY]: {
    color: "#005ff7",
    backgroundColor: "rgba(0, 95, 247, 0.1)",
    icon: "rocket",
  },
  [JobStatus.LAUNCH]: {
    color: "#6b5be5",
    backgroundColor: "rgba(107, 91, 229, 0.1)",
    Icon: () => <BulbOutlined className={styles.icon} />,
  },
  [JobStatus.STARTING_ERROR]: {
    color: "#f56c6c",
    backgroundColor: "rgba(245, 108, 108, 0.1)",
    Icon: () => <CloseCircleOutlined className={styles.icon} />,
  },
  [JobStatus.RUNNING]: {
    color: "#227a7a",
    backgroundColor: "rgba(34, 122, 122, 0.1)",
    Icon: () => <FundOutlined className={styles.icon} />,
  },
  [JobStatus.PAUSE]: {
    color: "#fdb314",
    backgroundColor: "rgba(253, 179, 20, 0.1)",
    Icon: () => <PauseCircleOutlined className={styles.icon} />,
  },
  [JobStatus.FINISHED]: {
    color: "#52c41a",
    backgroundColor: "rgba(82, 196, 26, 0.1)",
    Icon: () => <CheckCircleOutlined className={styles.icon} />,
  },
  [JobStatus.STOPPED]: {
    color: "#3e5270",
    backgroundColor: "rgba(62, 82, 112, 0.1)",
    Icon: () => <StopOutlined className={styles.icon} />,
  },
  [JobStatus.ERROR]: {
    color: "#f56c6c",
    backgroundColor: "rgba(245, 108, 108, 0.1)",
    Icon: () => <CloseCircleOutlined className={styles.icon} />,
  },
  [JobStatus.TEMP_CLOSE]: {
    color: "#fdb314",
    backgroundColor: "rgba(253, 179, 20, 0.1)",
    Icon: () => <StopOutlined className={styles.icon} />,
  },
};

const JobTypes = [JobType.LABEL, JobType.QA];

type BpoJob = {
  id: string;
  jobName: string;
  jobType: string;
  jobStatus: JobStatus;
  createTime: string;
  contact: string;
};

function JobList() {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [filter, setFilter] = useState({});
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const filterFormItems: FormItem[] = [
    {
      key: "jobDisplayId",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-job-list.filter.job-id" })}
        </span>
      ),
      type: FormItemType.Text,
      style: { width: 160 },
      allowClear: true,
    },
    {
      key: "jobName",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-job-list.filter.job-name" })}
        </span>
      ),
      type: FormItemType.Text,
      style: { width: 160 },
      allowClear: true,
    },
    {
      key: "jobType",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-job-list.filter.job-type" })}
        </span>
      ),
      type: FormItemType.Multiple,
      options: JobTypes.map((item) => ({
        label: formatMessage({ id: `${item.toLowerCase()}-job.type` }),
        value: item,
      })),
      optionLabelKey: "label",
      optionValueKey: "value",
      style: { width: 160 },
      allowClear: true,
    },
    {
      key: "status",
      label: (
        <span className={styles["filter-label"]}>
          {formatMessage({ id: "bpo-job-list.filter.job-status" })}
        </span>
      ),
      type: FormItemType.Multiple,
      options: Object.keys(BPOFilterStatus),
      optionLabel: (item) => formatMessage({ id: `job.status.${item}` }),
      style: { width: 320 },
      maxTagCount: 3,
    },
  ];

  const columns = [
    {
      title: formatMessage({ id: "bpo-job-list.filter.job-id" }),
      dataIndex: "jobDisplayId",
      render: (jobDisplayId: string, record: Job) => (
        <Button
          type="link"
          onClick={() => router.push(`/bpo-job/${record.id}`)}
        >
          {jobDisplayId}
        </Button>
      ),
    },
    {
      title: formatMessage({ id: "bpo-job-list.filter.job-name" }),
      dataIndex: "jobName",
      render: (name: string, record: Job) => (
        <span>
          {record.testFlag && (
            <Tag className={styles["test-tag"]} color="#f56c6c">
              {formatMessage({ id: "job-list.table.isTest" })}
            </Tag>
          )}
          {name}
        </span>
      ),
    },
    {
      title: formatMessage({ id: "bpo-job-list.filter.job-type" }),
      dataIndex: "jobType",
      render: (jobType: JobType) =>
        formatMessage({ id: `${jobType.toLowerCase()}-job.type` }),
    },
    {
      title: formatMessage({ id: "bpo-job-list.filter.job-status" }),
      dataIndex: "jobStatus",
      render: (jobStatus: string) => {
        const { color, backgroundColor, Icon } = TagStyle[jobStatus] || {};
        return (
          <Tag style={{ color, backgroundColor }} className={styles.tag}>
            <Icon />
            {formatMessage({ id: `job.status.${jobStatus.toUpperCase()}` })}
          </Tag>
        );
      },
    },
    {
      title: formatMessage({ id: "bpo-job-list.table.column.create-time" }),
      dataIndex: "createdTime",
      render: (createdTime: string) => dateFormat(createdTime),
    },
    {
      title: formatMessage({ id: "bpo-job-list.table.column.contact" }),
      dataIndex: "contactEmail",
    },
    {
      title: formatMessage({ id: "bpo-job-list.table.column.action" }),
      render: (record: BpoJob) => (
        <Button
          className={styles.view}
          type="link"
          onClick={() => router.push(`/bpo-job/${record.id}`)}
        >
          {formatMessage({ id: "common.view" })}
        </Button>
      ),
    },
  ];

  const getList = () => {
    setLoading(true);
    getBpoJobs({
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

  useEffect(() => {
    getList();
  }, [currentPage, filter, pageSize]);

  return (
    <HeaderContentWrapperComponent
      title={
        <>
          <RoundFolderOutlined />
          {formatMessage({ id: "bpo-job-list.title" })}
        </>
      }
    >
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
        <Divider className={styles.divider} />
        <Table
          columns={columns}
          className={globalStyles.tableStriped}
          scroll={{ x: "max-content" }}
          dataSource={data}
          rowKey="id"
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
      </Card>
    </HeaderContentWrapperComponent>
  );
}

export default JobList;
