import React, { useState } from "react";
import { Modal, Radio, Form } from "antd";
import { useIntl } from "@umijs/max";
import type { TenantPM } from "@/types/project";
import type { RadioChangeEvent } from "antd/es/radio";
import ProjectManagerSelect from "@/pages/super-management/project-admin/components/ProjectManagerSelect";
import { ProjectAccessLevel } from "@/types/project";

type Props = {
  visible: boolean;
  pms: TenantPM[];
  onCancel: () => void;
  onOk: (name: string, status: string) => void;
};

const AccessConfigModal: React.FC<Props> = ({
  visible = false,
  pms,
  onCancel,
  onOk,
}) => {
  const { formatMessage } = useIntl();
  const [userName, setUserName] = useState<null | string>(null);
  const [userNameError, setUserNameError] = useState(null);
  const [access, setAccess] = useState<null | ProjectAccessLevel>(null);
  const [accessError, setAccessError] = useState(null);

  const handleAccessChange = (event: RadioChangeEvent) => {
    event.preventDefault();
    const { value } = event.target;
    setAccessError(null);
    setAccess(value);
  };

  const handleOk = () => {
    if (!userName) {
      setUserNameError(
        formatMessage({ id: "project-access.model.form.user-error" })
      );
    }
    if (!access) {
      setAccessError(
        formatMessage({ id: "project-access.model.form.access-error" })
      );
    }

    if (userName && access) {
      onOk(userName, access);
    }
  };

  return (
    <Modal
      title={formatMessage({ id: "project-list.card.access" })}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      maskClosable={false}
    >
      <Form.Item
        label={formatMessage({ id: "project-access.model.form.user" })}
        validateStatus={userNameError ? "error" : "success"}
        help={userNameError}
      >
        <ProjectManagerSelect
          pms={pms}
          onChange={(name) => {
            setUserNameError(null);
            setUserName(name);
          }}
        />
      </Form.Item>
      <Form.Item
        label={formatMessage({ id: "project-access.model.form.access" })}
        validateStatus={accessError ? "error" : "success"}
        help={accessError}
      >
        <Radio.Group onChange={handleAccessChange}>
          <Radio value={ProjectAccessLevel.VIEW}>
            {formatMessage({ id: "access.VIEW" })}
          </Radio>
          <Radio value={ProjectAccessLevel.UPDATE}>
            {formatMessage({ id: "access.UPDATE" })}
          </Radio>
        </Radio.Group>
      </Form.Item>
    </Modal>
  );
};

export default AccessConfigModal;
