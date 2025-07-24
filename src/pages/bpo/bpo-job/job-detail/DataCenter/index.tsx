import { Radio, Card, RadioChangeEvent } from "antd";
import { useIntl } from "@umijs/max";
import { connect } from "react-redux";
import Filter from "./Filter";
import List from "./List";
import FootBar from "./FootBar";
import { ConnectState } from "@/models/connect";
import type { Dispatch } from "redux";
import WorkCountDetailModal from "@/pages/bpo/bpo-job/job-detail/DataCenter/WorkCountDetailModal";
import DataReleaseModal from "@/pages/project/data-center/components/data-release/DataReleaseModal";
import DataExport from "@/pages/bpo/bpo-job/job-detail/DataCenter/DataExport";
import { Job } from "@/types/job";
import { WorkflowDataRecord } from "@/types/v3";
import { useEffect } from "react";

type Props = {
  job: Job;
  selectedData: WorkflowDataRecord[];
  finished: boolean;
  dispatch: Dispatch;
  visible: Record<string, boolean>;
};

enum DataStatus {
  FINISHED = "FINISHED",
  UNFINISHED = "UNFINISHED",
}

function DataCenter({ finished, job, selectedData, dispatch, visible }: Props) {
  const { formatMessage } = useIntl();

  const updateFinished = (e: RadioChangeEvent) => {
    dispatch({
      type: "bpoJob/toggleFinished",
      payload: e.target.value === DataStatus.FINISHED,
    });
  };

  const close = () => {
    dispatch({
      type: "bpoJob/toggleVisible",
      payload: { releaseVisible: false },
    });
  };

  const refresh = () => {
    dispatch({ type: "bpoJob/getBpoJobData" });
  };

  useEffect(() => {
    dispatch({ type: "bpoJob/resetDataState" });
  }, [job?.id, finished]);

  return (
    <div>
      <Radio.Group
        style={{ marginBottom: 24 }}
        value={finished ? DataStatus.FINISHED : DataStatus.UNFINISHED}
        onChange={updateFinished}
      >
        <Radio.Button value={DataStatus.UNFINISHED}>
          {formatMessage({
            id: "bpo-job-detail.monitor.qa.progress.unworkedRows",
          })}
        </Radio.Button>
        <Radio.Button value={DataStatus.FINISHED}>
          {formatMessage({
            id: "project.detail.data-center.data-state.completed",
          })}
        </Radio.Button>
      </Radio.Group>
      <Card bordered={false} className="with-shadow">
        <Filter />
        <List />
        <FootBar />
      </Card>
      <WorkCountDetailModal />
      <DataReleaseModal
        visible={visible.releaseVisible}
        role="bpo"
        onClose={close}
        projectId={job?.projectId}
        jobId={job?.id}
        selectedRecordIds={selectedData?.map((i) => i.recordId)}
        onRefresh={refresh}
      />
      <DataExport />
    </div>
  );
}

function mapStateToProps({ bpoJob }: ConnectState) {
  return {
    job: bpoJob.job,
    finished: bpoJob.finished,
    selectedData: bpoJob.selectedData,
    visible: bpoJob.visible,
  };
}

export default connect(mapStateToProps)(DataCenter);
