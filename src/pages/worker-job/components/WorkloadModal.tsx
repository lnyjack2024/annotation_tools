import { Modal, Spin } from "antd";
import { useEffect, useState } from "react";
import { useIntl } from "@umijs/max";

import LabelWorkloadTable from "@/pages/worker-job/components/LabelWorkloadTable";
import { getTaskWorkload } from "@/services/task";
import type { LabelWorkload, QAWorkload } from "@/types/job";
import { HttpStatus } from "@/types/http";
import QAWorkloadTable from "@/pages/worker-job/components/QAWorkloadTable";
import { JobType } from "@/types/job";

type Props = {
  jobId: string;
  visible: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  jobType?: JobType;
};

function WorkloadModal({ jobId, visible, onOk, onCancel, jobType }: Props) {
  const { formatMessage } = useIntl();
  const [workload, setWorkload] = useState<QAWorkload | LabelWorkload>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (!jobId) {
      setLoading(false);
      return;
    }
    getTaskWorkload(jobId, jobType)
      .then((resp) => {
        if (resp.status === HttpStatus.OK) {
          setWorkload(resp.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jobId]);

  return (
    <Modal
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      title={formatMessage({ id: "menu.tasks.workload" })}
      width={640}
      footer={null}
    >
      <Spin spinning={loading}>
        {jobType === JobType.LABEL ? (
          <LabelWorkloadTable workload={workload as LabelWorkload} />
        ) : (
          <QAWorkloadTable workload={workload as QAWorkload} />
        )}
      </Spin>
    </Modal>
  );
}

export default WorkloadModal;
