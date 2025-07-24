import React from "react";
import { Breadcrumb } from "antd";
import { history, useIntl } from "@umijs/max";

import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { queryToSearch } from "@/utils";

type Props = {
  job: Job;
  projectDisplayId: string;
};

const JobDetailBreadcrumb: React.FC<Props> = ({ job, projectDisplayId }) => {
  const { query } = useLocationWithQuery();
  const { formatMessage } = useIntl();

  const jobDisplayId = job?.jobDisplayId?.split("-")[1] || "";

  return (
    <Breadcrumb>
      <Breadcrumb.Item
        onClick={(e) => {
          e.preventDefault();
          history.push("/projects");
        }}
      >
        {formatMessage({ id: "projectList" })}
      </Breadcrumb.Item>
      <Breadcrumb.Item
        onClick={(e) => {
          e.preventDefault();
          history.push({
            pathname: `/projects/${query.projectId}/jobs`,
            search: queryToSearch(query),
          });
        }}
      >
        {`${formatMessage({ id: "project-details" })} [${projectDisplayId}]`}
      </Breadcrumb.Item>
      <Breadcrumb.Item
        onClick={(e) => {
          e.preventDefault();

          if (job.jobType !== JobType.QA) {
            return;
          }

          history.push({
            pathname: `/job/${job.labelingJobId}/qa`,
            search: queryToSearch({
              ...query,
              isBPO: `${job.bpoFlag}`,
              projectId: job.projectId,
            }),
          });
        }}
      >{`${formatMessage({ id: "menu.job-detail" })} [${
        query.labelJobDisplayId?.toString().split("-")[1] || jobDisplayId
      }]`}</Breadcrumb.Item>
      {job?.jobType === JobType.QA && (
        <Breadcrumb.Item>{`${formatMessage({
          id: "job.monitor.qa-detail",
        })} [${jobDisplayId}]`}</Breadcrumb.Item>
      )}
    </Breadcrumb>
  );
};

export default JobDetailBreadcrumb;
