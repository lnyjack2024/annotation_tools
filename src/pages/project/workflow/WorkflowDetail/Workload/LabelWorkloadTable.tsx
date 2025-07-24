import { useEffect, useState } from 'react';
import globalStyles from '@/global.less';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/utils/constants';
import { Table } from 'antd';
import type { ColumnProps } from 'antd/es/table';
import type { Job, WorkloadDetail } from '@/types/job';
import { formatOptOutWorker } from '@/utils/utils';
// import { QuestionPercent } from '@/pages/job/job-detail/Monitor/QaStatistics';
import { useIntl } from '@@/plugin-locale/localeExports';
import { getLabelWorkloadDetails } from '@/services/workflow';

interface Props {
  job: Job;
  filter: Record<string, any>;
  role?: 'pm' | 'bpo';
}

const DEFAULT_PAGINATION = {
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

function LabelWorkloadTable({ job, filter, role = 'pm' }: Props) {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const getHourFromSecond = (sec: number) => {
    if (!sec) return 0;

    return (sec / 3600).toFixed(2);
  };

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
      title: formatMessage({ id: 'job-detail.workload.col.annotation-count' }),
      dataIndex: 'labellingNumber',
    },
    {
      title: formatMessage({ id: 'job-detail.workload.col.rework-count' }),
      render: row => (
        <>
          <div>
            {formatMessage(
              { id: 'workflow.detail.job.workload.rework-self' },
              { num: row.reworkNumber },
            )}
          </div>
          <div>
            {formatMessage(
              { id: 'workflow.detail.job.workload.rework-other' },
              { num: row.reworkOtherNumber },
            )}
          </div>
          <div>
            {formatMessage(
              { id: 'workflow.detail.job.workload.other-rework' },
              { num: row.otherReworkNumber },
            )}
          </div>
        </>
      ),
    },
    {
      title: formatMessage({ id: 'workflow.detail.statistic.hour' }),
      render: row => (
        <>
          <div>
            {formatMessage({
              id: 'workflow.detail.job.workload.labeling-hour',
            })}
            <span style={{ color: '#227a7a' }}>
              {getHourFromSecond(row.labellingSeconds)}
            </span>
          </div>
          <div>
            {formatMessage({ id: 'workflow.detail.job.workload.rework-hour' })}
            <span style={{ color: '#f56c6c' }}>
              {getHourFromSecond(row.reworkSeconds)}
            </span>
          </div>
        </>
      ),
    },
    {
      title: formatMessage({ id: 'job-detail.quality.col.rate' }),
      sorter: (a, b) => a.qaPassRate - b.qaPassRate,
      render: row =>
        !row.qaSampledNumber
          ? formatMessage({ id: 'common.nothing-symbol' })
          : `${((row.qaPassedNumber / row.qaSampledNumber) * 100).toFixed(
              2,
            )} %`,
    },
    // {
    //   title: formatMessage({ id: 'job.monitor.qa-question-distributed' }),
    //   dataIndex: 'issueTypes',
    //   render: issueTypes => {
    //     if (!issueTypes) return null;
    //     const issueArr: { name: string; value: any }[] = [];
    //     let allIssues = 0;
    //     Object.keys(issueTypes).forEach(key => {
    //       allIssues += issueTypes[key];
    //       issueArr.push({ name: key, value: issueTypes[key] });
    //     });
    //     issueArr.sort((a, b) => b.value - a.value);
    //     return (
    //       issueArr.length > 0 && (
    //         <>
    //           <QuestionPercent
    //             item={issueArr[0]}
    //             index={0}
    //             totalNum={allIssues}
    //             style={{ marginBottom: 4 }}
    //             labelStyle={{ maxWidth: 100 }}
    //           />
    //           {issueArr.length > 1 && (
    //             <Popover
    //               placement="topRight"
    //               content={
    //                 <div style={{ maxWidth: 500 }}>
    //                   {issueArr.map((item, index) => (
    //                     <QuestionPercent
    //                       item={item}
    //                       index={index}
    //                       totalNum={allIssues}
    //                       // style={{ display: 'inline-block', width: '50%' }}
    //                       labelStyle={{ whiteSpace: 'normal' }}
    //                     />
    //                   ))}
    //                 </div>
    //               }
    //               trigger="hover"
    //             >
    //               <Button type="link" style={{ padding: 0, height: 'auto', color: '#227a7a' }}>
    //                 {formatMessage({ id: 'job.monitor.question.view-all' })}
    //               </Button>
    //             </Popover>
    //           )}
    //         </>
    //       )
    //     );
    //   },
    // },
  ];

  const getData = async () => {
    if (!job?.id) {
      return;
    }
    try {
      setLoading(true);
      const resp = await getLabelWorkloadDetails({
        ...filter,
        ...pagination,
        jobId: job.id,
        role,
      });
      setData(resp.data.results);
      setTotal(resp.data.totalElements);
    } catch (e) {
      console.log(e);
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

export default LabelWorkloadTable;
