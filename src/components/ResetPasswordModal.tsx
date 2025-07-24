import { useIntl } from "@umijs/max";
import { Button } from "antd";
import MaterialModal from "@/components/MaterialModal";
import { User } from "@/types/user";
import { resetPassword } from "@/services/user";

type Props = {
  visible: boolean;
  user: User;
  onSuccess: (user: User) => void;
  onClose: () => void;
};

function ResetPasswordModal({ visible, user, onSuccess, onClose }: Props) {
  const { formatMessage } = useIntl();
  const { uniqueName } = user || {};

  const reset = async () => {
    const resp = await resetPassword({ name: uniqueName });
    onSuccess(resp.data);
  };

  return (
    <MaterialModal
      visible={visible}
      title={formatMessage({ id: "common.reset.password" })}
      onClose={onClose}
      showFooter={false}
    >
      <p
        style={{
          color: "#42526e",
        }}
      >
        {formatMessage({ id: "user.reset.password" }, { username: uniqueName })}
      </p>
      <div style={{ textAlign: "right" }}>
        <Button style={{ marginRight: 8 }} onClick={onClose}>
          {formatMessage({ id: "common.cancel" })}
        </Button>
        <Button danger onClick={reset}>
          {formatMessage({ id: "common.reset.confirm" })}
        </Button>
      </div>
    </MaterialModal>
  );
}

export default ResetPasswordModal;
