import React, { useEffect } from 'react';
import type { NodeProps } from 'react-flow-renderer';
import { Handle, Position, useUpdateNodeInternals } from 'react-flow-renderer';

import type { JobNodeData } from './LabelJobNode';
import { CustomHandleStyles, CustomNodeStyles, HandleId } from './LabelJobNode';
import JobNodeBody from './JobNodeBody';
import { JobType } from '@/types/job';
import { TurnbackStrategy } from './FlowTurnbackConfig';

const QAJobNode: React.FC<NodeProps<JobNodeData>> = ({ data }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const { workflow, id, order, qaTurnbackMap } = data;
  const { reworkStrategy } = workflow;

  const isTurnbackEnabled = reworkStrategy !== TurnbackStrategy.NOT_TURN_BACK;

  useEffect(() => {
    updateNodeInternals(id);
  }, [reworkStrategy, qaTurnbackMap]);

  return (
    <div
      style={{
        ...CustomNodeStyles,
        height: 80,
        padding: 0,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 0, height: 0 }}
      />

      <JobNodeBody jobType={JobType.QA} data={data} />

      {isTurnbackEnabled && (
        <Handle
          type="source"
          position={Position.Top}
          id={HandleId.Top}
          style={{
            ...CustomHandleStyles,
            left: 260 / 4,
          }}
        />
      )}

      {order in qaTurnbackMap &&
        qaTurnbackMap[order].map((sourceOrder, idx) => (
          <Handle
            key={sourceOrder}
            type="target"
            position={Position.Top}
            id={`${HandleId.Top}${sourceOrder}`}
            style={{
              ...CustomHandleStyles,
              width: 0,
              height: 0,
              left: 95 + idx * 30,
            }}
          />
        ))}

      <Handle
        type="source"
        position={Position.Right}
        id={HandleId.Right}
        style={CustomHandleStyles}
      />
    </div>
  );
};

export default QAJobNode;
