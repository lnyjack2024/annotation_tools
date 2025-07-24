import type { Status } from '@/types';
import { HttpStatus } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { message as $message } from 'antd';
import isEqual from 'lodash/isEqual';

import { usePrevious } from './usePrevious';
import { mapStatusToErrorMessage } from '@/utils/utils';

interface ServiceFunc {
  (...params: any): Promise<Status>;
}

export function useAsync<Result>(
  service: ServiceFunc,
  params: any = null,
  autoRun = true,
  initialValue = {},
) {
  const [loading, setLoading] = useState<boolean>(false);
  const ref = useRef<boolean>(false);
  const [data, setData] = useState<Result>(initialValue as Result);
  const previousParamsRef = usePrevious<typeof params>(params);

  const fetchData = useCallback(
    async function getData(_params?: any) {
      setLoading(true);
      try {
        const res = await service(_params || params);
        if (res.status === HttpStatus.OK) {
          setData(res.data);
        } else {
          $message.error(mapStatusToErrorMessage(res));
        }
      } catch (error) {
        console.log('error', error);
      } finally {
        setLoading(false);
      }
    },
    [params, service],
  );

  useEffect(() => {
    if (!autoRun || (ref.current && isEqual(previousParamsRef, params))) return;
    ref.current = true;

    fetchData();
  }, [previousParamsRef, params, autoRun]);

  return { loading, data, fetchData };
}
