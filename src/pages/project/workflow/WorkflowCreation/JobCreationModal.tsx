import React, { useState } from "react";
import { Form, Modal } from "antd";
import { useDispatch, useIntl } from "@umijs/max";
import { FullscreenExitOutlined, ColumnWidthOutlined } from "@ant-design/icons";

import type { Job } from "@/types/job";
import { JobType } from "@/types/job";
import type { Workflow } from "@/types/v3";
import type { JobCategory } from "@/pages/project/workflow/WorkflowCreation/components/JobForm";
import JobForm from "@/pages/project/workflow/WorkflowCreation/components/JobForm";
import JobTypeSelect from "@/pages/project/workflow/WorkflowCreation/JobTypeSelect";
import FlowTurnbackConfig from "@/pages/project/workflow/WorkflowCreation/components/FlowTurnbackConfig";

type Props = {
  workflow: Workflow;
  targetJobType: JobType | null;
  jobIndex?: number;
  onCancel?: () => void;
  onOk?: (newJob: Job, resetFunc: () => void) => void;
  confirmLoading?: boolean;
};

const JobCreationModal: React.FC<Props> = ({
  workflow,
  jobIndex = 0,
  targetJobType,
  onCancel,
  onOk,
  confirmLoading,
}) => {
  const [form] = Form.useForm();
  const { formatMessage } = useIntl();
  const [fullScreen, setFullScreen] = useState(false);
  const dispatch = useDispatch();

  const [step, setStep] = useState(0);
  const [jobCategory, setJobCategory] = useState<JobCategory | "">("");

  const handleCancel = () => {
    setStep(0);
    setJobCategory("");
    form.resetFields();
    onCancel?.();
  };

  return (
    <Modal
      className="custom-modal"
      wrapClassName={fullScreen ? "modal-wrap-fullscreen" : ""}
      visible={targetJobType !== null}
      title={
        <>
          {formatMessage({ id: "job.create.btn" })}
          {fullScreen ? (
            <FullscreenExitOutlined
              style={{
                position: "absolute",
                right: 56,
                top: 20,
                color: "rgb(132, 136, 153)",
                fontSize: 16,
              }}
              onClick={(e) => {
                e.preventDefault();
                setFullScreen(false);
              }}
            />
          ) : (
            <ColumnWidthOutlined
              style={{
                position: "absolute",
                right: 56,
                top: 20,
                color: "rgb(132, 136, 153)",
                fontSize: 16,
              }}
              onClick={(e) => {
                e.preventDefault();
                setFullScreen(true);
              }}
            />
          )}
        </>
      }
      onCancel={handleCancel}
      width={640}
      maskClosable={false}
      footer={null}
    >
      <div style={step === 0 ? undefined : { display: "none" }}>
        <JobTypeSelect
          onNext={(category) => {
            setJobCategory(category);
            if (
              workflow.reworkStrategy === null &&
              targetJobType === JobType.QA
            ) {
              setStep(1);
            } else {
              setStep(2);
            }
          }}
        />
      </div>
      <div style={step === 1 ? undefined : { display: "none" }}>
        <FlowTurnbackConfig
          onSubmit={(option) => {
            dispatch({
              type: "flowCreation/updateFlowTurnbackConfig",
              payload: {
                flow: {
                  ...workflow,
                  reworkStrategy: option,
                },
                onFinish: () => {
                  setStep(2);
                },
              },
            });
          }}
          flow={workflow}
        />
      </div>
      <div style={step === 2 ? undefined : { display: "none" }}>
        <JobForm
          flow={workflow}
          form={form}
          jobCategory={jobCategory}
          jobIndex={jobIndex}
          jobType={targetJobType}
          confirmLoading={confirmLoading}
          onSubmit={(values) => {
            onOk?.(
              {
                ...values,
                testFlag: workflow.testFlag,
                jobType: targetJobType,
              },
              handleCancel
            );
          }}
        />
      </div>
    </Modal>
  );
};

export default JobCreationModal;
