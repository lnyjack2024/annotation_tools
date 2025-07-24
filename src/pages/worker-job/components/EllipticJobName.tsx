import type { CSSProperties } from 'react';
import React from 'react';
import { Button, Tooltip } from 'antd';
import { textTruncate } from '@/utils/string-util';

type Props = {
  jobName: string | null;
  onClick: () => void;
  maxLength?: number;
  btnStyle?: CSSProperties;
};

const EllipticJobName: React.FC<Props> = ({
  jobName,
  onClick,
  maxLength = 48,
  btnStyle = undefined,
}) => {
  if (!jobName) {
    return null;
  }

  return jobName.length <= maxLength ? (
    <Button type="link" onClick={onClick} style={btnStyle}>
      {jobName}
    </Button>
  ) : (
    <Tooltip placement="bottom" title={jobName}>
      <Button type="link" onClick={onClick} style={btnStyle}>
        {textTruncate(jobName, maxLength)}
      </Button>
    </Tooltip>
  );
};

export default EllipticJobName;
