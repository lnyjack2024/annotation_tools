import { Card, message, Modal } from "antd";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Dispatch } from "redux";
import { useModel } from "@umijs/max";
import { connect } from "react-redux";
import type { ConnectState } from "@/models/connect";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { Status } from "@/types";
import AccountLogin from "./components/AccountLogin";

import styles from "./style.less";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { checkUserLoginOtherDevice } from "@/services/user";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useIntl } from "@@/plugin-locale/localeExports";

export interface LoginProps {
  dispatch: Dispatch;
  submitting: boolean;
}

function Login({ submitting, dispatch }: LoginProps) {
  const { formatMessage } = useIntl();
  const location = useLocationWithQuery();
  const [userLoginError, setUserLoginError] = useState<ReactNode>();
  const [checking, setChecking] = useState(false);
  const { initialState, setInitialState } = useModel("@@initialState");

  const { name = "" } = location.query;

  const handleLoginSuccess = async () => {
    const currentUser = await initialState?.fetchCurrentUser?.();
    // if (currentUser) {
    setInitialState({
      ...initialState,
      currentUser: currentUser || null,
    });
    // }
  };

  const login = (values: { name: string; password: string }) => {
    setUserLoginError(null);
    dispatch({
      type: "login/login",
      payload: {
        params: values,
        onFail: (resp: Status) => {
          message.error(mapStatusToErrorMessage(resp), 3);
        },
        onSuccess: handleLoginSuccess,
      },
    });
  };

  const handleSubmit = async (formValues: {
    name: string;
    password: string;
  }) => {
    try {
      setChecking(true);
      const resp = await checkUserLoginOtherDevice(formValues);
      if (resp.data) {
        Modal.confirm({
          title: formatMessage({ id: "user.login.other.device.warning" }),
          icon: <ExclamationCircleOutlined />,
          onOk() {
            login(formValues);
          },
          okText: formatMessage({ id: "common.login.confirm" }),
          okType: "danger",
        });
        return;
      }

      login(formValues);
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={styles.main}>
      <Card bordered={false}>
        <AccountLogin
          name={name as string}
          submit={handleSubmit}
          userLoginError={userLoginError}
          submitting={submitting || checking}
          handleValueOnChange={() => setUserLoginError(null)}
        />
      </Card>
    </div>
  );
}

function mapStateToProps({ loading }: ConnectState) {
  return {
    submitting: loading.effects["login/login"] || false,
  };
}

export default connect(mapStateToProps)(Login);
