import globalStyles from '@/global.less';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/utils/constants';
import { message, Table } from 'antd';
import type { ColumnProps } from 'antd/es/table';
import type { Job, WorkloadDetail } from '@/types/job';
import { formatOptOutWorker, mapStatusToErrorMessage } from '@/utils/utils';
import { useEffect, useState } from 'react';
import { useIntl } from '@@/plugin-locale/localeExports';
import { getQaWorkloadDetails } from '@/services/workflow';

interface Props {
  job: Job;
  filter: Record<string, any>;
  role?: 'bpo' | 'pm';
}

const DEFAULT_PAGINATION = {
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

function QaWorkloadTable({ job, filter, role = 'pm' }: Props) {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const columns: ColumnProps<WorkloadDetail>[] = [
    {
      title: formatMessage({ id: 'job-detail.quality.col.worker' }),
      dataIndex: 'workerName',
      render: (workerName, row) => {
        const displayName = workerName || row.workerEmail;
        return formatOptOutWorker(displayName, row.workerId);
      },
    },
    {
      title: formatMessage({
        id: 'project.detail.analysis.workload.QA.column.row',
      }),
      dataIndex: 'qaItems',
    },
    {
      title: formatMessage({ id: 'job-detail.quality.col.total' }),
      dataIndex: 'qaNumber',
    },
    {
      title: formatMessage({ id: 'workflow.detail.job.workload.qa-result' }),
      render: row => (
        <>
          <div>
            {formatMessage({ id: 'workflow.detail.job.workload.qa-passed' })}
            <span style={{ color: '#227a7a' }}>{row.qaPassedNumber}</span>
          </div>
          <div>
            {formatMessage({ id: 'workflow.detail.job.workload.qa-rejected' })}
            <span style={{ color: '#f56c6c' }}>{row.qaRejectedNumber}</span>
          </div>
        </>
      ),
    },
    {
      title: formatMessage({ id: 'job.monitor.qa-spend' }),
      dataIndex: 'qaHours',
    },
    {
      title: formatMessage({ id: 'job-detail.quality.col.nrRate' }),
      render: row => `${(row?.nrQaRatio * 100).toFixed(2)} %`,
    },
  ];

  const getData = async () => {
    if (!job?.id) {
      return;
    }
    try {
      setLoading(true);
      const resp = await getQaWorkloadDetails({
        ...filter,
        ...pagination,
        jobId: job.id,
        role,
      });
      setData(resp.data.results);
      setTotal(resp.data.totalElements);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination(DEFAULT_PAGINATION);
  }, [filter]);

  useEffect(() => {
    getData();
  }, [job, pagination, filter]);

  return (
    <Table
      className={globalStyles.tableStriped}
      loading={loading}
      rowKey="jobId"
      columns={columns}
      dataSource={data}
      pagination={{
        total,
        pageSize: pagination.pageSize,
        onChange: (page: number, pageSize?: number) =>
          setPagination({
            pageSize,
            pageIndex: page - 1,
          }),
        current: pagination.pageIndex + 1,
        showTotal: val =>
          formatMessage({ id: 'common.total.items' }, { items: val }),
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
      }}
    />
  );
}

export default QaWorkloadTable;
