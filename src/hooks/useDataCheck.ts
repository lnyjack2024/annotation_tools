import { useState } from 'react';

import { dataCheck } from '@/services/project';
import { HttpStatus } from '@/types/http';
import type { DataType } from '@/types/dataset';
import type { DataCheckTarget } from '@/types/v3';

export type CheckedDataGroup = {
  dataType: DataType;
  recordNum: number;
  recordIds: number[];
  dataRecordIds: string[];
  groupId: string;
};

type CheckedData = {
  invalid: number;
  validGroups: CheckedDataGroup[];
};

type Params = {
  projectId: string;
  recordIds: number[];
  dataCheckTarget: DataCheckTarget;
  onSuccess?: (result: Record<string, any>) => void;
};

export function useDataCheck({
  projectId,
  recordIds,
  dataCheckTarget,
  onSuccess,
}: Params) {
  const [loading, setLoading] = useState(false);
  const [checkedData, setCheckedData] = useState<CheckedData>({
    invalid: 0,
    validGroups: [],
  });

  const checkSelectedRecords = () => {
    setLoading(true);
    dataCheck({ projectId, recordIds, dataTarget: dataCheckTarget })
      .then(resp => {
        if (resp.status === HttpStatus.OK) {
          const result = resp.data.reduce<CheckedData>(
            (acc, cur) => {
              if (!cur.dataType) {
                acc.invalid = cur.recordNum;
              } else {
                acc.validGroups.push(cur);
              }

              return acc;
            },
            {
              invalid: 0,
              validGroups: [],
            },
          );
          setCheckedData(result);
          onSuccess?.(result);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    checkSelectedRecords,
    checkedData,
    loading,
  };
}
