import request from '@/utils/request';
import type { BaseResp } from '@/types/common';
import { useEffect, useState } from 'react';
import { HttpStatus } from '@/types/http';

export type TurnBackGroup = {
  flowName: string;
  flowId: string;
  recordList: number[];
  backList: {
    cycle: number;
    name: string;
  }[];
};

export async function getDataTurnBackGroup(
  projectId: string,
  recordList: number[],
) {
  return request.post<BaseResp<TurnBackGroup[]>>(
    '/task/turn-back/records-group',
    {
      data: {
        projectId,
        recordList,
      },
    },
  );
}

export async function getAuditTurnBackGroup(
  projectId: string,
  recordList: number[],
) {
  return request.post<BaseResp<TurnBackGroup[]>>(
    '/task/turn-back/search-and-group',
    {
      params: {
        projectId,
        recordList,
      },
    },
  );
}

type Props = {
  target: 'audit' | 'data-center';
  projectId: string;
  recordList: number[];
  active?: boolean;
};

export async function turnBackByFlow(
  projectId: string,
  backTo: {
    flowId: string;
    recordList: number[];
    backTo: number;
    forceQA: boolean;
  },
) {
  return request.post('/task/turn-back/records-by-flow', {
    data: {
      projectId,
      backList: [backTo],
    },
  });
}

export function useTurnBackGroup({
  target,
  projectId,
  recordList,
  active = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<TurnBackGroup[]>([]);

  const fetchTurnBackGroup = () => {
    const reqFunc =
      target === 'audit' ? getAuditTurnBackGroup : getDataTurnBackGroup;
    setLoading(true);
    reqFunc(projectId, recordList)
      .then(resp => {
        if (resp.status === HttpStatus.OK) {
          setGroups(resp.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!active) {
      return;
    }
    fetchTurnBackGroup();
  }, [projectId, recordList, active]);

  return {
    turnBackGroups: groups,
    loading,
  };
}
