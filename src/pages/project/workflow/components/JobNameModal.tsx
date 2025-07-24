import { useIntl } from "@umijs/max";
import { Input } from "antd";
import { useEffect, useState } from "react";
import MaterialModal from "@/components/MaterialModal";

interface Props {
  submitting: boolean;
  visible: boolean;
  defaultJobName: string;
  onClose: () => void;
  onSave: (jobName: string) => void;
}

function JobNameModal({
  submitting,
  visible,
  defaultJobName = "",
  onClose,
  onSave,
}: Props) {
  const { formatMessage } = useIntl();
  const [jobName, setJobName] = useState(defaultJobName);

  useEffect(() => {
    setJobName(defaultJobName);
  }, [visible]);

  return (
    <MaterialModal
      visible={visible}
      title={formatMessage({ id: "common.rename" })}
      onClose={onClose}
      onSave={() => onSave(jobName)}
      saveLoading={submitting}
    >
      <p style={{ margin: "8px 0", color: "#42526e" }}>
        {formatMessage({ id: "jobName" })}
      </p>
      <Input value={jobName} onChange={(e) => setJobName(e.target.value)} />
    </MaterialModal>
  );
}

export default JobNameModal;
