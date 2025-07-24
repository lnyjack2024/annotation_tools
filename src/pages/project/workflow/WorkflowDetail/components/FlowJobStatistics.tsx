import { Card, Col, Row, Button } from "antd";
import { useIntl, history as router } from "@umijs/max";
import { pathToRegexp } from "path-to-regexp";

import type { Job } from "@/types/job";
import FlowJobProgress from "@/pages/project/workflow/WorkflowDetail/components/FlowJobProgress";
import FlowJobEfficiency from "@/pages/project/workflow/WorkflowDetail/components/FlowJobEfficiency";
import FlowJobHistogram from "@/pages/project/workflow/WorkflowDetail/components/FlowJobHistogram";
import type { Workflow } from "@/types/v3";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";

interface Props {
  job: Job;
  flow: Workflow;
}

function FlowJobStatistics({ job, flow }: Props) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const [, flowId] = pathToRegexp("/workflows/:flowId/detail").exec(
    location.pathname
  );
  const { projectId, projectDisplayId } = location.query;

  const jump = () => {
    router.push(
      `/workflows/${flowId}/jobs/workload?projectId=${projectId}&projectDisplayId=${projectDisplayId}&flowDisplayId=${flow?.flowDisplayId}&jobId=${job?.id}`
    );
  };

  return (
    <>
      <Card
        title={job?.jobName}
        extra={
          <Button type="link" style={{ padding: 0 }} onClick={jump}>
            {formatMessage({ id: "job.monitor.label.detail" })}
          </Button>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Row>
          <Col
            span={12}
            style={{ borderRight: "1px solid #dcdfe3", padding: 24 }}
          >
            <FlowJobProgress
              job={job}
              projectId={projectId as string}
              flowId={flow?.id || flowId}
            />
          </Col>
          <Col span={12} style={{ padding: 24 }}>
            <FlowJobEfficiency job={job} />
          </Col>
        </Row>
      </Card>
      <FlowJobHistogram job={job} />
    </>
  );
}

export default FlowJobStatistics;
