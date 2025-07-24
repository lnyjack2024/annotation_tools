import React, { useEffect } from 'react';
import type { NodeProps } from 'react-flow-renderer';
import type { CSSProperties } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'react-flow-renderer';

import JobNodeBody from '@/pages/project/workflow/WorkflowCreation/components/JobNodeBody';
import type { Job } from '@/types/job';
import { JobType } from '@/types/job';
import type { Workflow } from '@/types/v3';

export const CustomNodeStyles: CSSProperties = {
  background: 'white',
  color: '#3E5270',
  padding: 10,
  lineHeight: 1.2,
  border: '1px solid #DCDFE3',
  borderRadius: 5,
  cursor: 'default',
};

export const CustomHandleStyles: CSSProperties = {
  width: 6,
  height: 6,
  border: '1px solid #A0AABC',
  background: 'white',
};

export enum HandleId {
  Left = 'left',
  Top = 'top',
  Right = 'right',
}

export type JobNodeData = {
  id: string;
  order?: number;
  onJobTitleClick?: (job: Job) => void;
  onJobDelete?: (job: Job) => void;
  onQAJobTurnbackChange?: (job: Job, backTo: number) => void;
  job: Job;
  flowId: string;
  workflow: Workflow;
  isLastJob: boolean;
  qaTurnbackMap?: Record<number, number[]>;
};

const LabelJobNode: React.FC<NodeProps<JobNodeData>> = ({ data }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const { id, flowId } = data;

  useEffect(() => {
    updateNodeInternals(id);
  }, [flowId]);

  return (
    <div
      style={{
        ...CustomNodeStyles,
        height: 80,
        padding: 0,
      }}
    >
      <JobNodeBody jobType={JobType.LABEL} data={data} />

      <Handle
        type="target"
        position={Position.Top}
        id={HandleId.Top}
        style={{ width: 0, height: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={HandleId.Right}
        style={CustomHandleStyles}
      />
    </div>
  );
};

export default LabelJobNode;
