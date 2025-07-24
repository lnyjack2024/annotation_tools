import { useState } from "react";
import { Button, Card, message, Modal } from "antd";
import { useIntl } from "@umijs/max";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import type { Workflow } from "@/types/v3";
import type { JobDetailTabs } from "@/pages/project/workflow/components/JobDetailDrawer";
import JobDetailDrawer from "@/pages/project/workflow/components/JobDetailDrawer";
import type { Job } from "@/types/job";
import { JobTenantType } from "@/types/job";

import { mapStatusToErrorMessage } from "@/utils/utils";
import { deleteFlow } from "@/services/workflow";
import { HttpStatus } from "@/types/http";
import WorkflowJobItem from "@/pages/project/workflow/WorkflowJobItem";
import WorkflowTitle from "@/pages/project/workflow/WorkflowTitle";

import styles from "./WorkflowCard.less";

type Props = {
  projectId: string;
  projectDisplayId: string;
  workflow: Workflow;
  onRefresh: (needLoading?: boolean) => void;
  readonly?: boolean;
};

export const getJobType = (job: Job) => {
  if (!job) {
    return null;
  }

  const { bpoFlag } = job;

  if (!bpoFlag) {
    return JobTenantType.PRIVATE;
  }

  return JobTenantType.COMPANY;
};

function WorkflowCard({
  workflow,
  projectId,
  projectDisplayId,
  onRefresh,
  readonly = false,
}: Props) {
  const { formatMessage } = useIntl();
  const [currentJob, setCurrentJob] = useState<Job>(null);
  const [activeTab, setActiveTab] = useState<JobDetailTabs>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const { totalNum, jobs = [] } = workflow || {};
  const isEmptyFlow = jobs.length === 0 && !totalNum;

  const handleFlowDelete = () => {
    setDeleting(true);
    deleteFlow(workflow?.id)
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          message.success(
            formatMessage({ id: "common.message.success.delete" })
          );
          onRefresh();
        } else {
          message.error(mapStatusToErrorMessage(resp));
        }
      })
      .catch((e) => message.error(mapStatusToErrorMessage(e)))
      .finally(() => setDeleting(false));
  };

  const showConfirm = () => {
    Modal.confirm({
      title: formatMessage({ id: "common.confirm.delete" }),
      icon: <ExclamationCircleOutlined />,
      onOk: handleFlowDelete,
    });
  };

  return (
    <Card
      className={styles["workflow-card"]}
      style={{ marginBottom: 24 }}
      bodyStyle={{ borderTop: "1px solid #E5E7ED", padding: 0 }}
      title={
        <WorkflowTitle
          workflow={workflow}
          projectId={projectId}
          projectDisplayId={projectDisplayId}
        />
      }
    >
      {isEmptyFlow ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Button
            loading={deleting}
            disabled={readonly}
            onClick={(e) => {
              e.preventDefault();
              showConfirm();
            }}
          >
            {formatMessage({ id: "workflow.delete" })}
          </Button>
        </div>
      ) : (
        jobs.map((job) => (
          <WorkflowJobItem
            key={job.id}
            job={job}
            readonly={readonly}
            afterJobAction={() => {
              onRefresh();
            }}
            onClick={(tabName) => {
              setCurrentJob(job);
              setActiveTab(tabName);
            }}
          />
        ))
      )}
      <JobDetailDrawer
        visible={!!currentJob}
        initialTab={activeTab}
        jobId={currentJob?.id}
        onClose={() => setCurrentJob(null)}
      />
    </Card>
  );
}

export default WorkflowCard;
