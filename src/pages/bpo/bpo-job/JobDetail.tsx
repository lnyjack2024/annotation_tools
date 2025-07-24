import { Spin } from "antd";
import React from "react";

import type { Dispatch } from "@umijs/max";
import { Outlet, history as router, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import EditableJobNameTitle from "@/pages/job/job-detail/components/EditableJobNameTitle";
import type { ConnectState } from "@/models/connect";
import JobStatusTag from "@/pages/job/components/JobStatusTag";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { isMatchedLastPathSegment, queryToSearch } from "@/utils/utils";

interface JobDetailProps {
  dispatch: Dispatch;
  children: React.ReactNode;
  job: Job;
  loading?: boolean;
}

const jobTabs = ["overview", "data", "monitor", "workforce"];

function JobDetail({ children, job, loading = false }: JobDetailProps) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const { id, jobName, jobStatus, jobType } = job || {};

  const menuItems = jobTabs
    .filter((item) => jobType !== JobType.QA || item !== "analysis")
    .map((tab: string) => ({
      key: tab,
      title: formatMessage({ id: `job-detail.${tab}` }),
      action: () => {
        router.replace({
          pathname: `/bpo-job/${id}/${tab}`,
          search: queryToSearch(location.query),
        });
      },
    }));

  const activeMenu = [jobTabs.find(isMatchedLastPathSegment)];

  const Title = (
    <>
      <EditableJobNameTitle jobName={jobName || "任务名称"} allowEdit={false} />
      {jobStatus && <JobStatusTag status={jobStatus} />}
    </>
  );

  return (
    <HeaderContentWrapperComponent
      title={Title}
      backTitle={formatMessage({ id: "menu.job" })}
      onBack={() => {
        router.goBack();
      }}
      menuItems={menuItems}
      defaultSelectedKeys={activeMenu}
    >
      <Spin spinning={loading}>
        <Outlet />
      </Spin>
    </HeaderContentWrapperComponent>
  );
}

function mapStateToProps({ bpoJob }: ConnectState) {
  return {
    job: bpoJob.job,
  };
}

export default connect(mapStateToProps)(JobDetail);
