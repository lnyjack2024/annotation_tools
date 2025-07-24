import React, { useEffect } from "react";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Checkbox, Input, Tooltip, InputNumber, Form } from "antd";
import type { FormInstance } from "antd/lib/form";
import { FormattedMessage, useIntl } from "@umijs/max";
import {
  DEFAULT_JOB_TIMEOUT,
  DEFAULT_RECORD_NUM,
  DEFAULT_WORKER_NUM,
  EDITOR_IMG_UPLOAD_API,
} from "@/utils/constants";
import { JobType } from "@/types/job";
import { JobTimeoutValidator, NoPureSpaceValidator } from "@/utils/validator";
import BPOSelect from "@/pages/job/JobCreationWizard/components/BPOSelect";
import TinymceEditor from "@/components/TinymceEditor";

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 10 },
    md: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
    md: { span: 16 },
  },
};

type Props = {
  projectId: string;
  defaultJobName: string;
  isTest?: boolean;
  isBPO: boolean;
  isRunning?: boolean;
  jobType?: JobType;
  form: FormInstance;
};

const JobBasicFormV3: React.FC<Props> = ({
  projectId,
  defaultJobName,
  isBPO,
  isRunning = false,
  jobType,
  form,
}) => {
  const { formatMessage } = useIntl();

  useEffect(() => {
    form.setFieldsValue({ jobName: defaultJobName });
  }, [defaultJobName]);

  return (
    <Form
      {...formItemLayout}
      form={form}
      initialValues={{
        recordNum: DEFAULT_RECORD_NUM,
        workerNum: DEFAULT_WORKER_NUM,
        timeout: DEFAULT_JOB_TIMEOUT,
      }}
    >
      <Form.Item
        name="jobName"
        label={formatMessage({
          id: "labeling-job-create.wizard.overview.form.job-name",
        })}
        rules={[
          {
            max: 128,
            message: formatMessage({
              id: "labeling-job-create.wizard.overview.form.job-name-error.len",
            }),
          },
          {
            required: true,
            message: formatMessage({
              id: "labeling-job-create.wizard.overview.form.job-name-error",
            }),
          },
          {
            validator: NoPureSpaceValidator,
          },
        ]}
        initialValue={defaultJobName}
      >
        <Input disabled={isRunning} />
      </Form.Item>
      <Form.Item
        name="timeout"
        label={formatMessage({ id: "job-create.timeout.label" })}
        rules={[
          {
            required: true,
            message: formatMessage({
              id: "labeling-job-create.wizard.overview.form.timeout-error",
            }),
          },
          {
            validator: JobTimeoutValidator,
          },
        ]}
      >
        <Input
          placeholder={formatMessage({ id: "job-create.timeout.placeholder" })}
          addonAfter={
            <div style={{ width: 64 }}>
              <FormattedMessage id="common.unit.minute" />
            </div>
          }
        />
      </Form.Item>
      {jobType === JobType.QA && (
        <>
          <Form.Item
            label={formatMessage({ id: "job.qa.create.form.sampleRate" })}
          >
            <Form.Item
              noStyle
              name="globalSampleRate"
              rules={[
                {
                  required: true,
                  message: formatMessage({
                    id: "labeling-job-create.wizard.overview.form.sampleRate.error",
                  }),
                },
              ]}
              initialValue={100}
            >
              <InputNumber
                min={0}
                max={100}
                precision={0}
                disabled={isRunning}
              />
            </Form.Item>
            <span style={{ marginLeft: 10 }}>%</span>
          </Form.Item>
          <Form.Item
            name="qaModifiable"
            valuePropName="checked"
            initialValue={false}
            label={formatMessage({ id: "job.qa.create.form.qaModifiable" })}
          >
            <Checkbox disabled={isRunning} />
          </Form.Item>
          <Form.Item
            name="showWorkerName"
            label={
              <span>
                {formatMessage({
                  id: "labeling-job-create.wizard.overview.form.showWorkerName",
                })}
                <Tooltip
                  title={formatMessage({
                    id: "labeling-job-create.wizard.overview.form.showWorkerName-tip",
                  })}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox />
          </Form.Item>
        </>
      )}
      <Form.Item
        name="contactEmail"
        label={formatMessage({
          id: "labeling-job-create.wizard.complete.form.email",
        })}
        rules={[
          {
            message: formatMessage({
              id: "labeling-job-create.wizard.complete.form.email-error",
            }),
            required: true,
            type: "email",
          },
        ]}
      >
        <Input />
      </Form.Item>
      {jobType !== JobType.QA && (
        <Form.Item
          name="description"
          label={formatMessage({
            id: "labeling-job-create.wizard.complete.form.description",
          })}
          initialValue={null}
          rules={[
            {
              required: true,
              message: formatMessage({
                id: "labeling-job-create.wizard.complete.form.description.error",
              }),
            },
          ]}
        >
          <TinymceEditor height={400} imageApi={EDITOR_IMG_UPLOAD_API} />
        </Form.Item>
      )}
      {isBPO && (
        <Form.Item
          name="bpoId"
          label={formatMessage({
            id: `job-detail.bpo-workforce.select-title.company`,
          })}
          rules={[
            {
              required: true,
              message: formatMessage({
                id: `job-detail.bpo-workforce.select-error.company`,
              }),
            },
          ]}
        >
          <BPOSelect width={"100%"} projectId={projectId} />
        </Form.Item>
      )}
    </Form>
  );
};
export default JobBasicFormV3;
