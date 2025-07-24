import MaterialModal from "@/components/MaterialModal";
import { Button } from "antd";
import { useIntl } from "@umijs/max";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  disabled: boolean;
  job: { jobId: string; jobName: string };
};

function ClearWorkerModal({ job, visible, onClose, onSave, disabled }: Props) {
  const { formatMessage } = useIntl();

  return (
    <MaterialModal
      visible={visible}
      title={formatMessage({ id: "common.prompt" })}
      showFooter={false}
      onClose={onClose}
    >
      <span style={{ color: "#42526e" }}>
        {formatMessage(
          { id: "workflow.worker.orientation.clear.tip" },
          { jobName: job?.jobName }
        )}
      </span>
      <div style={{ textAlign: "right", marginTop: 18 }}>
        <Button
          style={{ marginRight: 12 }}
          disabled={disabled}
          onClick={onClose}
        >
          {formatMessage({ id: "common.cancel" })}
        </Button>
        <Button danger loading={disabled} onClick={onSave}>
          {formatMessage({ id: "common.clear-all" })}
        </Button>
      </div>
    </MaterialModal>
  );
}

export default ClearWorkerModal;
