import type { ReactNode } from "react";
import React, { useState } from "react";
import { Link, Outlet, useModel } from "@umijs/max";
import { Button, message, Result } from "antd";
import Authorized from "@/utils/Authorized";
import type { BasicLayoutProps as ProLayoutProps } from "@ant-design/pro-components";
import ModifyPasswordModal from "@/components/ModifyPasswordModal";
import useLocationWithQuery from "@/hooks/useLocationWithQuery";
import { setNewPassword } from "@/services/user";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { HttpStatus } from "@/types/http";
import EmailVerifyModal from "@/components/EmailVerifyModal";
import { enableEmailAuth } from "@/utils";

const noMatch = (
  <Result
    status="403"
    title="403"
    subTitle="Sorry, you are not authorized to access this page."
    extra={
      <Button type="primary">
        <Link to="/user/login">Go Login</Link>
      </Button>
    }
  />
);

interface GlobalLayoutProp {
  children: ReactNode;
  route: ProLayoutProps["route"] & {
    authority: string[];
  };
}

const GlobalLayout: React.FC<GlobalLayoutProp> = (props) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const [loading, setLoading] = useState(false);

  const { children } = props;

  const reset = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const resp = await setNewPassword({
        ...values,
        name: initialState?.currentUser?.name,
      });

      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
      } else {
        await fetchCurrentUser();
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    const currentUser = await initialState?.fetchCurrentUser?.();

    if (currentUser) {
      setInitialState({
        ...initialState,
        currentUser,
      });
    }
  };

  const { isRequiredUpdatedPassword, emailAuthFlag, email } =
    initialState?.currentUser || {};

  return (
    <>
      <Authorized authority={undefined} noMatch={noMatch}>
        <Outlet />
      </Authorized>
      <ModifyPasswordModal
        visible={isRequiredUpdatedPassword}
        forceModify
        confirmLoading={loading}
        resetPassword={reset}
      />
      <EmailVerifyModal
        visible={
          !isRequiredUpdatedPassword && !!emailAuthFlag && enableEmailAuth()
        }
        emailAuthFlag={emailAuthFlag}
        email={email}
        fetchCurrentUser={fetchCurrentUser}
      />
    </>
  );
};

export default GlobalLayout;
