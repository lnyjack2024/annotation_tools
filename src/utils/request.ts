/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import type { ResponseError } from "umi-request";
import Request, { extend } from "umi-request";
import progressMiddleware from "umi-request-progress";
import { notification } from "antd";
import { throttle } from "lodash";
import { formatMessage, getDvaApp } from "@umijs/max";
import { getAPIGatewayPrefix } from "@/utils/env";

const { isCancel } = Request;

const throttledNotification = throttle(
  (errMsg: string) => {
    notification.warn({
      message: formatMessage({ id: "error.message.toomany" }),
      description: errMsg,
    });
  },
  4000,
  {
    trailing: true,
  }
);

/**
 * 异常处理程序
 */
const errorHandler = (
  error: ResponseError<{ status: number; message: string }>
): Response | { status: number; message: string } => {
  if (isCancel(error)) {
    throw error;
  }
  const { response, data } = error;
  const codeMessage = {
    401: formatMessage({ id: "error.message.unauth" }),
    403: formatMessage({ id: "error.message.forbidden" }),
    404: formatMessage({ id: "error.message.notfound" }),
    500: formatMessage({ id: "error.message.internal-error" }),
  };
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status } = response;
    if (status === 400) {
      return data;
    }
    if (status === 401) {
      if (!response.url.includes("logout")) {
        /* eslint-disable no-underscore-dangle */
        const { pathname } = window.location;
        const redirect =
          pathname === "/" || pathname === "/user/account-switch"
            ? null
            : window.location.href;
        getDvaApp()._store.dispatch({
          type: "login/logout",
          payload: { redirect: redirect ? btoa(redirect) : null },
        });
      }
    } else if (status === 403) {
      notification.warning({
        message: formatMessage(
          { id: "error.message.title" },
          { title: `${status}` }
        ),
        description: formatMessage({ id: "error.message.forbidden" }),
        duration: 4,
      });
    } else if (status === 404) {
      notification.warning({
        message: formatMessage(
          { id: "error.message.title" },
          { title: `${status}` }
        ),
        description: formatMessage({ id: "error.message.notfound" }),
        duration: 4,
      });
    } else if (status === 429) {
      throttledNotification(errorText);
    } else {
      notification.error({
        message: formatMessage(
          { id: "error.message.title" },
          { title: `${status}` }
        ),
        description:
          (data &&
            formatMessage({
              id: `${data.status}`,
              defaultMessage: errorText,
            })) ||
          errorText,
      });
    }
  } else if (!response) {
    notification.error({
      description: formatMessage({ id: "error.message.network" }),
      message: formatMessage({ id: "error.message.network.message" }),
    });
  }

  throw error;
};

/**
 * 配置request请求时的默认参数
 */
const request = extend({
  errorHandler, // 默认错误处理
  credentials: "include", // 默认请求是否带上cookie
  prefix: getAPIGatewayPrefix(),
});

// trim query parameters
request.use(async (ctx, next) => {
  const { req } = ctx;

  const { params } = req.options;
  Object.keys(params).forEach((key) => {
    if (typeof params[key] === "string") {
      params[key] = params[key].trim();
    }
  });

  await next();
});

request.use(progressMiddleware, { core: true });

export default request;
