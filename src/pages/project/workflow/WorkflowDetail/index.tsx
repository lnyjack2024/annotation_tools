import React, { useEffect, useState } from "react";
import { Button, Modal, Skeleton } from "antd";
import { useIntl } from "@umijs/max";
import { connect, useDispatch } from "react-redux";
import { pathToRegexp } from "path-to-regexp";

import HeaderContentWrapperComponent from "@/components/HeaderContentWrapper/HeaderContentWrapper";
import FlowDiagram from "@/pages/project/workflow/WorkflowCreation/components/FlowDiagram";
import type { ProjectTemplate, Workflow } from "@/types/v3";
import type { Job } from "@/types/job";
import { JobType } from "@/types/job";

import type { ConnectState } from "@/models/connect";
import ColorPoint from "@/pages/project/components/ColorPoint";
import EmptyFlow from "@/pages/project/workflow/WorkflowCreation/components/EmptyFlow";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import TurnbackConfigModal from "@/pages/project/workflow/WorkflowCreation/components/TurnbackConfigModal";
import JobCreationModal from "@/pages/project/workflow/WorkflowCreation/JobCreationModal";
import type { FlowData } from "@/pages/project/workflow/WorkflowCreation/components/FlowCreationModal";
import FlowCreationModal from "@/pages/project/workflow/WorkflowCreation/components/FlowCreationModal";
import JobDetailDrawer, {
  JobDetailTabs,
} from "@/pages/project/workflow/components/JobDetailDrawer";
import { isTemplateSupportAuditDetails } from "@/utils/utils";
import WorkflowStatistics from "@/pages/project/workflow/WorkflowDetail/WorkflowStatistics";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import FlowDownload from "@/pages/project/workflow/WorkflowDetail/components/FlowDownload";
import ProjectBreadcrumb from "@/pages/project/workflow/components/ProjectBreadcrumb";

import TestTag from "@/pages/project/components/TestTag";

type Props = {
  template: ProjectTemplate | null;
  flow: Workflow | null;
  jobs: Job[];
  jobsWithProgress: Job[];
  loading: boolean;
  creating: boolean;
  isReadonly: boolean;
};

const WorkflowDetail: React.FC<Props> = ({
  flow,
  template,
  jobs,
  jobsWithProgress,
  loading = false,
  creating = false,
  isReadonly = false,
}) => {
  const dispatch = useDispatch();
  const { formatMessage: t } = useIntl();
  const { query, pathname } = useLocationWithQuery();
  const { projectId, projectDisplayId } = query;
  const [, flowId] = pathToRegexp("/workflows/:workflowId/detail").exec(
    pathname
  );

  const [targetJobType, setTargetJobType] = useState<JobType | null>(null);
  const [showTurnbackModal, setShowTurnbackModal] = useState(false);
  const [showFlowConfigModal, setShowFlowConfigModal] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>();

  const templateId = flow?.templateId;
  const labelingJobId = jobs?.[0]?.id;

  const fetchFlowJobs = () => {
    dispatch({
      type: "flowCreation/getFlowJobs",
      payload: {
        flowId,
        projectId,
      },
    });
  };

  useEffect(() => {
    if (flowId && projectId) {
      fetchFlowJobs();
      dispatch({ type: "projectAccess/getProjectAccess", payload: projectId });
    }

    return () => {
      dispatch({ type: "flowCreation/resetFlowJobs" });
    };
  }, [flowId, projectId]);

  useEffect(() => {
    if (templateId) {
      dispatch({
        type: "flowCreation/getFlowTemplate",
        payload: {
          templateId,
        },
      });
    }
  }, [templateId]);

  if (flow === null) {
    return (
      <div
        style={{
          display: "flex",
          height: 280,
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <Skeleton loading={loading} />
      </div>
    );
  }

  return (
    <HeaderContentWrapperComponent
      backTitle={
        <ProjectBreadcrumb
          flowDisplayId={flow?.flowDisplayId}
          projectId={projectId as string}
          projectDisplayId={projectDisplayId as string}
        />
      }
      onBack={() => {}}
      title={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>
            <span>{flow?.flowName}</span>
            {flow?.testFlag && <TestTag style={{ marginLeft: 8 }} />}
          </h3>
          <div>
            <span
              style={{ fontSize: 14, fontWeight: "normal", marginRight: 12 }}
            >
              <ColorPoint color={"green"} style={{ marginTop: 14 }} />
              {t({ id: `workflow.status.${flow.status?.toLowerCase()}` })}
            </span>
            <Button
              style={{ marginRight: 12 }}
              disabled={isReadonly}
              onClick={(e) => {
                e.preventDefault();
                setShowFlowConfigModal(true);
              }}
            >
              {t({ id: "v3.config" })}
            </Button>
            <FlowDownload jobId={labelingJobId} />
          </div>
        </div>
      }
      content={<div />}
      actions={
        <span>
          {t({ id: "v3.template-name" })}
          <span style={{ marginRight: 5 }}>:</span>
          {template?.title}
        </span>
      }
    >
      <div
        style={{
          margin: "-24px -24px 24px -24px",
          height: 320,
          background: "white",
          overflowX: "auto",
        }}
      >
        {jobsWithProgress.length === 0 ? (
          <div style={{ paddingTop: 64, paddingLeft: 48 }}>
            <EmptyFlow
              onClick={(e) => {
                e.preventDefault();
                setTargetJobType(JobType.LABEL);
              }}
            />
          </div>
        ) : (
          <FlowDiagram
            paneMoveable={true}
            height={300}
            readonly={isReadonly}
            jobs={jobsWithProgress}
            workflow={flow}
            onJobCreate={(jobType) => {
              if (isReadonly) {
                return;
              }
              setTargetJobType(jobType);
            }}
            onJobTitleClick={(job) => {
              setSelectedJob(job);
            }}
            onJobDelete={(job) => {
              Modal.confirm({
                title: t({ id: "v3.job-delete.confirm" }),
                icon: <ExclamationCircleOutlined />,
                onOk() {
                  if (isReadonly) {
                    return null;
                  }
                  return new Promise((resolve) => {
                    dispatch({
                      type: "flowCreation/deleteFlowJob",
                      payload: job,
                      // @ts-ignore
                    }).then(resolve);
                  });
                },
              });
            }}
            onTurnbackNodeClick={() => {
              if (isReadonly) {
                return;
              }
              setShowTurnbackModal(true);
            }}
            onQAJobTurnbackChange={(qaJob, backTo) => {
              if (isReadonly) {
                return;
              }
              dispatch({
                type: "flowCreation/updateFlowJob",
                payload: {
                  job: {
                    ...qaJob,
                    backTo,
                  },
                },
              });
            }}
          />
        )}
      </div>
      <FlowCreationModal
        initialFlow={flow}
        projectId={projectId as string}
        visible={showFlowConfigModal}
        onCancel={() => {
          setShowFlowConfigModal(false);
        }}
        onOk={(values: FlowData) => {
          dispatch({
            type: "flowCreation/updateFlowTurnbackConfig",
            payload: {
              flow: {
                ...flow,
                ...values,
              },
              onFinish: () => {
                setShowFlowConfigModal(false);
              },
            },
          });
        }}
      />
      <JobCreationModal
        workflow={flow}
        jobIndex={jobs?.length}
        targetJobType={targetJobType}
        confirmLoading={creating}
        onCancel={() => {
          setTargetJobType(null);
        }}
        onOk={(jobData, resetFunc) => {
          const [labelJob] = jobs;
          const lastJob = jobs[jobs.length - 1];

          dispatch({
            type: "flowCreation/createFlowJob",
            payload: {
              flowJob: {
                ...jobData,
                projectId,
                flowId,
                // TODO handle following warning
                // @ts-ignore
                labelingJobId: labelJob?.id || null,
                preconditionJobId: lastJob?.id || null,
              },
              onFinish: () => {
                resetFunc();
                fetchFlowJobs();
              },
            },
          });
        }}
      />
      <TurnbackConfigModal
        visible={showTurnbackModal}
        flow={flow}
        jobs={jobs}
        onSubmit={(option) => {
          dispatch({
            type: "flowCreation/updateFlowTurnbackConfig",
            payload: {
              flow: {
                ...flow,
                reworkStrategy: option,
              },
              onFinish: () => {
                setShowTurnbackModal(false);
              },
            },
          });
        }}
        onCancel={() => {
          setShowTurnbackModal(false);
        }}
      />
      <JobDetailDrawer
        visible={!!selectedJob}
        initialTab={JobDetailTabs.OVERVIEW}
        jobId={selectedJob?.id}
        isTool={isTemplateSupportAuditDetails(flow?.templateType)}
        onClose={() => {
          setSelectedJob(null);
          fetchFlowJobs();
        }}
      />
      <WorkflowStatistics
        flow={flow}
        jobs={jobs}
        projectId={projectId as string}
      />
    </HeaderContentWrapperComponent>
  );
};

function mapStateToProps({
  projectAccess,
  flowCreation,
  loading,
}: ConnectState) {
  return {
    template: flowCreation.flowTemplate,
    flow: flowCreation.flow,
    jobs: flowCreation.jobs,
    jobsWithProgress: flowCreation.jobsWithProgress,
    loading: loading.effects["flowCreation/getFlowJobs"],
    creating: loading.effects["flowCreation/createFlowJob"],
    isReadonly:
      projectAccess.projectAccess === null ||
      projectAccess.projectAccess === "VIEW",
  };
}

export default connect(mapStateToProps)(WorkflowDetail);
