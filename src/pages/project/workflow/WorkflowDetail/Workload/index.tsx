import { useEffect, useState } from "react";
import { Button, Card, message, Radio } from "antd";
import { pathToRegexp } from "path-to-regexp";

import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import FilterFormComponent from "@/components/FilterFormComponent";
import type { FormItem } from "@/types/common";
import { FormItemType } from "@/types/common";
import { useIntl } from "@@/plugin-locale/localeExports";
import QaWorkloadTable from "@/pages/project/workflow/WorkflowDetail/Workload/QaWorkloadTable";
import LabelWorkloadTable from "@/pages/project/workflow/WorkflowDetail/Workload/LabelWorkloadTable";
import { getFlowJobs } from "@/services/workflow";
import { downloadFile, mapStatusToErrorMessage } from "@/utils/utils";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import { LABEL_DETAIL_BY_JOB, QA_DETAIL_BY_JOB } from "@/utils/constants";
import ProjectBreadcrumb from "@/pages/project/workflow/components/ProjectBreadcrumb";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { ConnectState } from "@/models/connect";
import { connect } from "react-redux";

type Filter = {
  startDate?: string;
  endDate?: string;
  workerName?: string;
};

function Workload({ isReadonly = false }: { isReadonly?: boolean }) {
  const location = useLocationWithQuery();
  const { formatMessage } = useIntl();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job>();
  const [filter, setFilter] = useState<Filter>({});
  const { jobType } = currentJob || {};
  const [, flowId] = pathToRegexp("/workflows/:flowId/jobs/workload").exec(
    location.pathname
  );
  const { projectId, projectDisplayId, flowDisplayId, jobId } = location.query;

  const filterFormItems: FormItem[] = [
    {
      key: "date",
      label: null,
      type: FormItemType.DateRanger,
    },
    {
      key: "workerName",
      label: (
        <span style={{ color: "#42526e" }}>
          {formatMessage({ id: "common.worker" })}
        </span>
      ),
      type: FormItemType.Text,
    },
  ];

  const getJobs = async () => {
    if (!flowId || !projectId) {
      return;
    }
    try {
      const resp = await getFlowJobs(flowId, projectId as string);
      setJobs(resp.data.results[0].jobs);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    }
  };

  const download = () => {
    let url =
      jobType === JobType.LABEL ? LABEL_DETAIL_BY_JOB : QA_DETAIL_BY_JOB;
    url += `?jobId=${currentJob?.id}`;
    Object.keys(filter)
      .filter((key) => !!filter[key])
      .forEach((key) => {
        url += `&${key}=${filter[key]}`;
      });

    downloadFile({
      url,
    });
  };

  useEffect(() => {
    if (jobs.length > 0) {
      setCurrentJob(jobs.find((item) => item.id === jobId) || jobs[0]);
    }
  }, [jobs]);

  useEffect(() => {
    getJobs();
  }, [flowId, projectId]);

  return (
    <HeaderContentWrapperComponent
      backTitle={
        <ProjectBreadcrumb
          projectId={projectId as string}
          projectDisplayId={projectDisplayId as string}
          flowDisplayId={flowDisplayId as string}
        />
      }
      onBack={() => {}}
      title={formatMessage(
        { id: "workflow.detail.job.workload.title" },
        { jobName: currentJob?.jobName }
      )}
    >
      <Radio.Group
        size="large"
        value={currentJob}
        style={{ marginBottom: 24 }}
        onChange={(e) => setCurrentJob(e.target.value)}
      >
        {jobs?.map((item, index) => (
          <Radio.Button value={item} key={item.id}>
            {formatMessage({ id: `${item.jobType?.toLowerCase()}-job.type` })}
            {index || index + 1}
          </Radio.Button>
        ))}
      </Radio.Group>
      <Card title={currentJob?.jobName}>
        <FilterFormComponent
          formItems={filterFormItems}
          formStyle={{ float: "left" }}
          initialValue={filter || {}}
          onFilterValueChange={(v) => {
            const { date, ...rest } = v;
            const newFilter = {
              ...rest,
              startDate: date
                ? date?.[0]?.startOf("day")?.format("YYYY-MM-DD HH:mm:ss")
                : null,
              endDate: date
                ? date?.[1]?.endOf("day")?.format("YYYY-MM-DD HH:mm:ss")
                : null,
            };
            setFilter(newFilter);
          }}
          searchMode="click"
        />
        <Button
          style={{ marginLeft: 16 }}
          onClick={download}
          disabled={isReadonly}
        >
          {formatMessage({ id: "common.export" })}
        </Button>
        {jobType === JobType.LABEL ? (
          <LabelWorkloadTable job={currentJob} filter={filter || {}} />
        ) : (
          <QaWorkloadTable job={currentJob} filter={filter || {}} />
        )}
      </Card>
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ projectAccess }: ConnectState) {
  return {
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(Workload);
