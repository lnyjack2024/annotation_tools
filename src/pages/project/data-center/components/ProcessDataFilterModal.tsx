import { Form, Select } from "antd";
import { useIntl } from "@umijs/max";
import MaterialModal from "@/components/MaterialModal";
import { useEffect, useState } from "react";
import { JobType } from "@/types/job";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddFilter: (filter: string) => void;
}

interface WorkflowJob {
  name: string;
  type: JobType;
  workers: string[];
  results: string[];
}

interface JobFilter {
  name: string;
  worker: string[];
  qaResult: string[];
}

interface Workflow {
  id: string;
  name: string;
  jobs: WorkflowJob[];
}

const workflows: any[] = [];

for (let i = 0; i < 5; i += 1) {
  const jobs = [];
  for (let j = i * 5; j < 5 * i + 5; j += 1) {
    jobs.push({
      name: `${j === i * 5 ? "标注任务" : "质检任务"}${j}`,
      type: j === i * 5 ? JobType.LABEL : JobType.QA,
      workers: [
        "5540166@qq.com",
        "5540167@qq.com",
        "5540168@qq.com",
        "5540169@qq.com",
      ],
      results: ["results1", "results2"],
    });
  }

  workflows.push({
    name: `工作流程${i}`,
    id: i,
    jobs,
  });
}

function ProcessDataFilterModal({ visible, onAddFilter, onClose }: Props) {
  const { formatMessage } = useIntl();
  const [workflow, setWorkflow] = useState<Workflow>(null);
  const [jobsFilter, setJobsFilter] = useState<JobFilter[]>([]);

  const saveFilter = () => {
    const finalFilter = `${workflow.name};${jobsFilter
      .filter((item) => item.worker.length > 0 || item.qaResult.length > 0)
      .map(
        (item) => item.name + item.worker.join(",") + item.qaResult.join(",")
      )
      .join(";")}`;
    onAddFilter(finalFilter);
    onClose();
  };

  useEffect(() => {
    if (workflow) {
      setJobsFilter(
        workflow.jobs.map((item) => ({
          name: item.name,
          worker: [],
          qaResult: [],
        }))
      );
    }
  }, [workflow]);

  return (
    <MaterialModal
      title={formatMessage({
        id: "project.detail.data-center.filter.process-data.title",
      })}
      width={536}
      destroyOnClose
      visible={visible}
      onSave={saveFilter}
      onClose={onClose}
    >
      <Form layout="vertical">
        <Form.Item
          label={
            <span style={{ color: "#42526e" }}>
              {formatMessage({
                id: "project.detail.data-center.filter.process-data.workflow",
              })}
            </span>
          }
          initialValue={workflow}
        >
          <Select
            value={workflow?.id}
            onChange={(value) => {
              setWorkflow(workflows.find((item) => item.id === value));
            }}
          >
            {workflows.map((item) => (
              <Select.Option key={item.id} value={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {workflow?.jobs?.map((item, index) => (
          <Form.Item
            key={item.name}
            label={<span style={{ color: "#42526e" }}>{item.name}</span>}
          >
            <Form.Item noStyle>
              <Select
                style={{ width: 240, marginRight: 8 }}
                mode="multiple"
                onChange={(value: string[]) =>
                  setJobsFilter(
                    jobsFilter.map((filter, filterIndex) => ({
                      ...filter,
                      worker: filterIndex === index ? value : filter.worker,
                    }))
                  )
                }
                placeholder={formatMessage({
                  id: "project.detail.data-center.filter.process-data.worker-placeholder",
                })}
              >
                {item.workers.map((worker: string) => (
                  <Select.Option key={worker} value={worker}>
                    {worker}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item noStyle>
              {item.type === JobType.QA && (
                <Select
                  style={{ width: 240 }}
                  mode="multiple"
                  placeholder={formatMessage({
                    id: "project.detail.data-center.filter.process-data.qa-placeholder",
                  })}
                  onChange={(value: string[]) =>
                    setJobsFilter(
                      jobsFilter.map((filter, filterIndex) => ({
                        ...filter,
                        qaResult:
                          filterIndex === index ? value : filter.qaResult,
                      }))
                    )
                  }
                >
                  {item.results.map((result: string) => (
                    <Select.Option key={result} value={result}>
                      {result}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Form.Item>
          </Form.Item>
        ))}
      </Form>
    </MaterialModal>
  );
}

export default ProcessDataFilterModal;
