import type { RuntimeAntdConfig, RunTimeLayoutConfig } from "@umijs/max";
import { getLocale, setLocale } from "@umijs/max";
import { Button, Result } from "antd";
import type {
  Settings as LayoutSettings,
  MenuDataItem,
} from "@ant-design/pro-components";
import type { CurrentUser } from "@/models/user";
import { history, Link } from "@umijs/max";

import defaultSettings, { primaryColor } from "../config/defaultSettings";
import RightContent from "@/components/GlobalHeader/RightContent";

import unCollapsedLogo from "@/assets/logo_en.png";
import Authorized from "@/utils/Authorized";
import { queryCurrent } from "@/services/user";
import { getUserRoles, setAuthority } from "@/utils/authority";

import logo from "@/assets/logo.png";
import { showLogo } from "@/utils/env";
import { LANGUAGE_LOCALES } from "./types/common";

const LOGIN_PATH = "/user/login";

// export const initialStateConfig = {
//   loading: <PageLoading />,
// };

export const dva = {
  config: {
    onError(e: any) {
      e.preventDefault();
    },
    onReducer: (r: any) => (state: any, action: any) => {
      if (action.type === "login/logout") {
        return r({}, action);
      }
      return r(state, action);
    },
  },
};

export async function getInitialState(): Promise<{
  fetchCurrentUser: () => Promise<CurrentUser | undefined>;
  collapsed?: boolean;
  settings?: Partial<LayoutSettings>;
  currentUser?: CurrentUser;
  fetchUser?: () => Promise<CurrentUser | undefined>;
  uniqueNameModalVisible: boolean;
}> {
  const fetchCurrentUser = async () => {
    try {
      const resp = await queryCurrent();
      const { roles = [] } = resp.data || {};
      const { convertedRoles } = await getUserRoles(roles);
      setAuthority(convertedRoles);
      return resp.data || {};
    } catch (err) {
      history.push(
        `${LOGIN_PATH}?redirect=${btoa(window.location.toString())}`
      );
    }
    return null;
  };

  // 如果是登录页面，不执行
  if (history.location.hash.indexOf("#/user") === -1) {
    const currentUser = await fetchCurrentUser();
    const { uniqueName = null } = currentUser || {};
    return {
      fetchCurrentUser,
      collapsed: false,
      uniqueNameModalVisible: !uniqueName,
      currentUser,
      settings: defaultSettings,
    };
  }

  return {
    fetchCurrentUser,
    collapsed: false,
    uniqueNameModalVisible: false,
    currentUser: null,
    settings: defaultSettings,
  };
}

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

const menuDataRender = (menuList: MenuDataItem[]): MenuDataItem[] => {
  return menuList.map((item) => {
    const localItem = {
      ...item,
      children: item.children ? menuDataRender(item.children) : [],
    };

    return Authorized.check(item.authority, localItem, null) as MenuDataItem;
  });
};

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const { collapsed = false } = initialState || {};

  // umi getLocale的逻辑是 localStorage.getItem('umi_locale') || browserLang || "en-US";
  // 当umi_locale为空，且浏览器语言不为配置内的，右上角的语言选项为空，且代码中getLocale的地方有问题，所以此时setLocale('en-US')
  if (!Object.values(LANGUAGE_LOCALES).includes(getLocale())) {
    setLocale(LANGUAGE_LOCALES.EN_US);
  }
  return {
    className: collapsed && "ant-layout-customize",
    logo: () =>
      collapsed
        ? showLogo() && <img src={logo} alt="logo" />
        : showLogo() && (
            <img src={unCollapsedLogo} alt="logo" style={{ height: 40 }} />
          ),
    onCollapse: (val) => {
      setInitialState({
        ...initialState,
        collapsed: val,
      });
    },
    headerRender: (_, headerDom) => <>{headerDom}</>,
    menuHeaderRender: (logoDom) => logoDom,
    menuItemRender: (menuItemProps, defaultDom) => {
      if (
        menuItemProps.isUrl ||
        menuItemProps.children ||
        !menuItemProps.path ||
        menuItemProps.path === "/"
      ) {
        return defaultDom;
      }
      return (
        <a
          onClick={(e) => {
            e.preventDefault();
            if (window.location.pathname !== menuItemProps.path) {
              history.push(menuItemProps.path);
            }
          }}
        >
          {defaultDom}
        </a>
      );
    },
    breadcrumbRender: null,
    itemRender: (route, params, routes, paths) => {
      const first = routes.indexOf(route) === 0;
      return first ? (
        <Link to={paths.join("/")}>{route.breadcrumbName}</Link>
      ) : (
        <span>{route.breadcrumbName}</span>
      );
    },
    menuDataRender: (menuData) => {
      return menuDataRender(menuData);
    },
    rightContentRender: () => <RightContent />,
    unAccessible: noMatch,
    ...initialState?.settings,
    onPageChange: () => {
      const { location } = history;
      if (
        !initialState?.currentUser &&
        location.hash.indexOf("#/user") === -1
      ) {
        history.push(LOGIN_PATH);
      }
    },
  };
};

export const antd: RuntimeAntdConfig = () => {
  return {
    theme: {
      token: {
        colorPrimary: primaryColor,
        colorLink: primaryColor,
        colorLinkHover: primaryColor,
        borderRadius: 2,
        boxShadow: "none",
        colorBorder: "#e5e7ed",
        colorInfoActive: primaryColor,
      },
    },
  };
};
