import { useCallback, useEffect, useState } from "react";
import { TablePaginationConfig } from "antd/lib/table/interface";

import { mapStatusToErrorMessage, PAGE_SIZE_OPTIONS } from "@/utils";
import { useIntl } from "@umijs/max";
import { HttpStatus } from "@/types";
import { message } from "antd";
import { BaseResp } from "@/types/common";

export interface PaginationProps extends TablePaginationConfig {
  pageSize: number;
  pageNum?: number;
  total?: number;
  defaultCurrent?: number;
  isWide?: boolean;
  setPageSize?: (pageSize: number) => void;
  setPageNum?: (pageNum: number) => void;
}

export const INITIAL_NUM = 1;
export const INITIAL_SIZE = 10;

export function useGetSetPagination(
  initialNum = 1,
  initialSize = INITIAL_SIZE,
  total = 0,
  isWide = false
) {
  const { formatMessage } = useIntl();

  const [pageNum, setPageNum] = useState(initialNum);
  const [pageSize, setPageSize] = useState(isWide ? 5 : initialSize);

  function onShowSizeChange(current: number, ps: number) {
    setPageSize(ps);
  }

  const pagination = {
    showQuickJumper: true,
    total,
    defaultCurrent: initialNum,
    pageSize,
    pageSizeOptions: isWide
      ? ["5"].concat(PAGE_SIZE_OPTIONS)
      : PAGE_SIZE_OPTIONS,
    showSizeChanger: true,
    showTotal: (val: number) =>
      formatMessage({ id: "common.total.items" }, { items: val }),
    onChange: setPageNum,
    onShowSizeChange,
  };

  const resetPageNum = useCallback(() => {
    setPageNum(INITIAL_NUM);
  }, []);

  const resetPageSize = useCallback(() => {
    setPageSize(INITIAL_SIZE);
  }, []);

  const resetPageOptions = useCallback(() => {
    setPageNum(INITIAL_NUM);
    setPageSize(INITIAL_SIZE);
  }, []);

  return {
    pagination,
    pageNum,
    pageSize,
    setPageNum,
    setPageSize,
    resetPageNum,
    resetPageSize,
    resetPageOptions,
  };
}

export function useCommonListPageFetch<Params, Result>(
  apiFetchFn: (data: Params) => Promise<BaseResp<Result>>,
  initSearchParams: Params = {} as Params,
  initData = {},
  isWide = false
) {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<Params>(initSearchParams);
  const [data, setData] = useState<Result>(initData as Result);
  const [refreshId, setRefreshId] = useState(0);
  // TODO: total
  const {
    pagination,
    pageNum,
    pageSize,
    setPageNum,
    setPageSize,
    resetPageOptions,
  } = useGetSetPagination(
    INITIAL_NUM,
    isWide ? 5 : INITIAL_SIZE,
    (data as any)?.totalElements || 0,
    isWide
  );

  useEffect(() => {
    async function getList(options: Params, pn: number, ps: number) {
      setLoading(true);
      try {
        const params = {
          ...options,
          pageSize: ps,
          pageNo: pn - 1,
          pageIndex: pn - 1,
        };
        const res = await apiFetchFn(params);
        if (res.status === HttpStatus.OK) {
          setData(res.data);
        } else {
          message.error(mapStatusToErrorMessage(res));
        }
      } catch (e) {
        console.log(apiFetchFn, e);
      } finally {
        setLoading(false);
      }
    }

    getList(searchParams, pageNum, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pageNum, pageSize, refreshId]);

  function onResetSearchParams() {
    setSearchParams(initSearchParams);
  }

  function refresh() {
    setRefreshId(refreshId + 1);
  }

  function setMemoSearchParams(params: Params & { sortOrder?: string }) {
    // api
    if (params.sortOrder) {
      params.sortOrder = params.sortOrder === "ascend" ? "asc" : "desc";
    }
    setSearchParams((old) => ({
      ...old,
      ...params,
    }));
  }

  return {
    data,
    pagination,
    searchParams,
    pageNum,
    loading,
    setData,
    onResetSearchParams,
    setMemoSearchParams,
    setPageSize,
    setPageNum,
    resetPageOptions,
    refresh,
  };
}
