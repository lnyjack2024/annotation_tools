import React from 'react';
import type { CSSProperties } from 'react';

import styles from '@/pages/job/job-detail/Monitor/components/CycleDetail.less';
import { COLORS } from '@/utils/utils';

type Props = {
  issue: { name: string; value: number };
  issueIndex: number;
  totalNum: number;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
};

const IssueTypePercent: React.FC<Props> = ({
  issue,
  issueIndex,
  labelStyle,
  style,
  totalNum,
}) => {
  return (
    <div className={styles['question-label']} style={style}>
      <p className={styles['question-percent']}>
        <i
          className={styles['question-point']}
          style={{ background: COLORS[issueIndex % COLORS.length] }}
        />
        {((issue.value / totalNum) * 100)?.toFixed(2)}%
      </p>
      <p
        className={styles['question-category']}
        title={issue.name}
        style={labelStyle}
      >
        {issue.name}
      </p>
    </div>
  );
};

export default IssueTypePercent;
