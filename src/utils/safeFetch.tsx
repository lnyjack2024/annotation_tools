import { Button, message } from "antd";
import { history } from "@umijs/max";
import { IntlFormatters } from "react-intl";

import { HttpStatus } from "@/types";
import type { Status } from "@/types";
import { mapStatusToErrorMessage } from "./utils";

type SafeFetchParams = {
  params?: any;
  api: (params?: any) => Promise<Status>;
  onSuccess?: (data?: any) => void;
  onFail?: (res: any) => void;
  onError?: (error: any) => void;
  onFinally?: () => void;
};

export async function safeFetch({
  params,
  api,
  onSuccess,
  onFail,
  onError,
  onFinally,
}: SafeFetchParams) {
  try {
    const res = await api(params);
    if (res.status === HttpStatus.OK) {
      if (onSuccess instanceof Function) {
        onSuccess(res.data);
      }
    } else {
      if (onFail instanceof Function) {
        onFail(res);
      } else {
        message.error(mapStatusToErrorMessage(res));
      }
    }
  } catch (e) {
    console.error("error", e);
    if (onError instanceof Function) {
      onError(e);
    }
  } finally {
    if (onFinally instanceof Function) {
      onFinally();
    }
  }
}

interface GenerateSafeReportParams
  extends Pick<SafeFetchParams, "api" | "params"> {
  cb: () => void;
  ft: IntlFormatters["formatMessage"];
}
export function generateSafeReport({
  cb,
  api,
  ft,
  params,
}: GenerateSafeReportParams) {
  return () =>
    safeFetch({
      api,
      params,
      onSuccess: () => {
        message.success(
          <span>
            {ft({ id: "data.export.tip1" })}
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => history.push("/file-center")}
            >
              {ft({ id: "file.center.title" })}
            </Button>
            {ft({ id: "data.export.tip2" })}
          </span>
        );
        cb();
      },
    });
}
