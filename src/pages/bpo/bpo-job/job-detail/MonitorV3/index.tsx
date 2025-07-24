import { connect } from "react-redux";
import type { ConnectState } from "@/models/connect";
import type { Job } from "@/types/job";
import { Card, Col, Row } from "antd";
import FlowJobProgress from "@/pages/project/workflow/WorkflowDetail/components/FlowJobProgress";
import FlowJobEfficiency from "@/pages/project/workflow/WorkflowDetail/components/FlowJobEfficiency";
import FlowJobHistogram from "@/pages/project/workflow/WorkflowDetail/components/FlowJobHistogram";
import BpoWorkloadV3 from "../components/BpoWorkloadV3";

interface Props {
  job: Job;
}

function MonitorV3({ job }: Props) {
  return (
    <>
      <Card>
        <Row>
          <Col
            span={12}
            style={{ borderRight: "1px solid #dcdfe3", padding: 24 }}
          >
            <FlowJobProgress job={job} role="bpo" />
          </Col>
          <Col span={12} style={{ padding: 24 }}>
            <FlowJobEfficiency job={job} role="bpo" />
          </Col>
        </Row>
      </Card>
      <FlowJobHistogram job={job} role="bpo" />
      <BpoWorkloadV3 job={job} />
    </>
  );
}

function mapStateToProps({ bpoJob, loading }: ConnectState) {
  return {
    job: bpoJob.job,
    loading:
      (loading.effects["jobDetail/getWorkers"] &&
        !loading.effects["jobDetail/getJob"]) ||
      false,
  };
}

export default connect(mapStateToProps)(MonitorV3);
