import { Button, message } from "antd";
import { useIntl } from "@umijs/max";
import { CopyToClipboard } from "react-copy-to-clipboard";
import MaterialModal from "@/components/MaterialModal";
import { OperationType } from "@/components/WorkerList";

type Props = {
  type?: OperationType;
  visible: boolean;
  username: string;
  password: string;
  onClose: () => void;
};

function AddUserSuccessModal({
  visible,
  type = OperationType.CREATE,
  onClose,
  username,
  password,
}: Props) {
  const { formatMessage } = useIntl();

  return (
    <MaterialModal
      visible={visible}
      onClose={onClose}
      showFooter={false}
      title={formatMessage({
        id:
          type === OperationType.RESET
            ? "common.message.success.reset"
            : "common.message.success.add",
      })}
    >
      <div style={{ height: 140, textAlign: "center" }}>
        <p style={{ color: "#42526e" }}>
          {type === OperationType.RESET
            ? formatMessage(
                { id: "common.reset.password.success" },
                { username }
              )
            : formatMessage(
                { id: "common.add.username.success" },
                { username }
              )}
        </p>
        <CopyToClipboard
          text={formatMessage(
            { id: "common.username.copy.text" },
            { username, password }
          )}
          onCopy={() =>
            message.success(
              formatMessage({ id: "worker.actions.copy-success" })
            )
          }
        >
          <Button type="primary">
            {formatMessage({ id: "common.username.copy" })}
          </Button>
        </CopyToClipboard>
      </div>
    </MaterialModal>
  );
}

export default AddUserSuccessModal;
