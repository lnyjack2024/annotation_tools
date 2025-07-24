import React, { useState } from "react";
import { Modal, Form } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import type { TenantPM } from "@/types/project";
import ProjectManagerSelect from "@/pages/super-management/project-admin/components/ProjectManagerSelect";

type Props = {
  visible: boolean;
  users: TenantPM[];
  onCancel: () => void;
  onOk: (email: string) => void;
};

const AdminChangeModal: React.FC<Props> = ({
  visible = false,
  users,
  onCancel,
  onOk,
}) => {
  const { formatMessage } = useIntl();
  const [userName, setUserName] = useState<null | string>(null);
  const [userNameError, setUserNameError] = useState(null);

  const showConfirm = () => {
    Modal.confirm({
      title: formatMessage({ id: "project-access.model.admin.warning" }),
      icon: <ExclamationCircleOutlined />,
      onOk() {
        onOk(userName);
      },
      okText: formatMessage({ id: "common.ok" }),
      cancelText: formatMessage({ id: "common.cancel" }),
    });
  };

  const handleOk = () => {
    if (!userName) {
      setUserNameError(
        formatMessage({ id: "project-access.model.form.user-error" })
      );
    }

    if (userName) {
      showConfirm();
    }
  };

  return (
    <>
      <Modal
        title={formatMessage({ id: "project-list.card.access" })}
        visible={visible}
        onCancel={onCancel}
        onOk={handleOk}
        maskClosable={false}
        okText={formatMessage({ id: "common.confirm" })}
      >
        <Form.Item
          label={formatMessage({ id: "project-access.model.form.user" })}
          validateStatus={userNameError ? "error" : "success"}
          help={userNameError}
        >
          <ProjectManagerSelect
            pms={users}
            onChange={(email) => {
              setUserNameError(null);
              setUserName(email);
            }}
          />
        </Form.Item>
      </Modal>
    </>
  );
};

export default AdminChangeModal;
