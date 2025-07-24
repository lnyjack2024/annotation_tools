import DocumentTitle from "react-document-title";
import React from "react";
import { Link, Outlet, useIntl } from "@umijs/max";
import { connect } from "react-redux";
import { getMenuData, getPageTitle } from "@ant-design/pro-components";

import SelectLang from "@/components/SelectLang";
import type { MenuDataItem } from "@ant-design/pro-components";
import type { Route } from "@ant-design/pro-components/lib/typings";
import type { ConnectProps, ConnectState } from "@/models/connect";

import styles from "./UserLayout.less";
import logo from "../assets/logo_en.png";
import { showMultiLang, showLogo } from "@/utils/env";

export interface UserLayoutProps extends ConnectProps<unknown> {
  breadcrumbNameMap: Record<string, MenuDataItem>;
  route: {
    routes: Route[];
  };
}

const UserLayout: React.FC<UserLayoutProps> = (props) => {
  const { formatMessage } = useIntl();
  const {
    route = {
      routes: [],
    },
  } = props;
  const { routes = [] } = route;
  const { children } = props;
  const { breadcrumb } = getMenuData(routes);

  return (
    <DocumentTitle
      title={getPageTitle({
        pathname: window.location.pathname,
        breadcrumb,
        formatMessage,
        title: "",
      })}
    >
      <div className={styles.container}>
        {showMultiLang() && (
          <div className={styles.lang}>
            <SelectLang className={styles.m10} />
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.header}>
              <Link to="/">
                {showLogo() && (
                  <img alt="logo" className={styles.logo} src={logo} />
                )}
              </Link>
            </div>
            <div className={styles.desc}>Data with a human touch</div>
          </div>
          <Outlet />
        </div>
      </div>
    </DocumentTitle>
  );
};

export default connect(({ settings }: ConnectState) => ({
  ...settings,
}))(UserLayout);
