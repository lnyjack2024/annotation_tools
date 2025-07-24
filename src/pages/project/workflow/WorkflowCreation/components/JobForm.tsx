import React from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";
import type { FormInstance } from "antd/es";

import type { Job } from "@/types/job";
import type { JobType } from "@/types/job";
import JobBasicForm from "@/pages/project/workflow/WorkflowCreation/components/JobBasicFormV3";
import type { Workflow } from "@/types/v3";

export type JobCategory = "private-job" | "bpo-job";

type Props = {
  flow: Workflow;
  form: FormInstance;
  jobCategory: JobCategory | "";
  jobType: JobType;
  jobIndex: number;
  confirmLoading?: boolean;
  onSubmit: (values: Job) => void;
};

const JobForm: React.FC<Props> = ({
  flow,
  form,
  jobType,
  jobIndex,
  jobCategory,
  onSubmit,
  confirmLoading = false,
}) => {
  const { formatMessage } = useIntl();
  const isBPO = jobCategory.includes("bpo");

  const defaultJobName = `${flow?.flowName} ${
    jobIndex
      ? formatMessage({ id: "workflow.job.qa.round-name" }, { num: jobIndex })
      : formatMessage({ id: "job-type.labeling" })
  }`;

  return (
    <>
      <JobBasicForm
        jobType={jobType}
        defaultJobName={defaultJobName}
        projectId={flow.projectId}
        isBPO={isBPO}
        form={form}
        isTest={flow.testFlag}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          loading={confirmLoading}
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            form
              .validateFields()
              .then((values) => {
                onSubmit({
                  ...values,
                  strictTiming: true,
                  timeout: values.timeout * 60,
                  bpoFlag: isBPO,
                });
              })
              .catch((err) => {
                console.log(err);
              });
          }}
        >
          {formatMessage({ id: "common.submit" })}
        </Button>
      </div>
    </>
  );
};

export default JobForm;
