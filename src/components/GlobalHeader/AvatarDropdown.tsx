import { LogoutOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Menu, Spin, Avatar, message } from "antd";
import { FormattedMessage, useModel } from "@umijs/max";
import { connect } from "react-redux";
import React, { useState } from "react";

import type { ConnectProps } from "@/models/connect";
import HeaderDropdown from "../HeaderDropdown";
import UserInfo from "@/components/GlobalHeader/UserInfo";
import ResetOldPasswordModal from "@/components/ModifyPasswordModal";

import styles from "./index.less";
import { setNewPassword } from "@/services/user";
import { HttpStatus } from "@/types/http";
import { mapStatusToErrorMessage } from "@/utils/utils";

const AvatarDropdown: React.FC<ConnectProps<unknown>> = ({ dispatch }) => {
  const { initialState } = useModel("@@initialState");
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { name } = initialState?.currentUser || {};

  const onMenuClick = (event: any) => {
    const { key } = event;

    if (key === "logout") {
      if (dispatch) {
        dispatch({
          type: "login/logout",
        });
      }
    } else if (key === "modify") {
      setVisible(true);
    }
  };

  const reset = async (values: Record<string, any>) => {
    setUpdating(true);
    try {
      const resp = await setNewPassword({ ...values, name });
      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
      } else {
        setVisible(false);
        message.success("Update Successfully");
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      <Menu.Item key="modify">
        <LockOutlined />
        <FormattedMessage
          id="common.modify.password"
          defaultMessage="modify password"
        />
      </Menu.Item>
      <Menu.Item key="logout">
        <LogoutOutlined />
        <FormattedMessage id="menu.account.logout" defaultMessage="logout" />
      </Menu.Item>
    </Menu>
  );

  return (
    <span>
      {name ? (
        <HeaderDropdown overlay={menuHeaderDropdown}>
          <span className={`${styles.action} ${styles.account}`}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              className={styles.avatar}
              alt="avatar"
            />
            <UserInfo name={name} />
          </span>
        </HeaderDropdown>
      ) : (
        <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
      )}
      <ResetOldPasswordModal
        visible={visible}
        confirmLoading={updating}
        resetPassword={reset}
        onCancel={() => setVisible(false)}
      />
    </span>
  );
};

export default connect()(AvatarDropdown);
