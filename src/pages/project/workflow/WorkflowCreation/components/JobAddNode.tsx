import type { ReactNode } from 'react';
import React from 'react';
import type { NodeProps } from 'react-flow-renderer';
import { Handle, Position } from 'react-flow-renderer';
import { CustomHandleStyles, HandleId } from './LabelJobNode';

const JobAddNode: React.FC<NodeProps<ReactNode>> = ({ data }) => {
  return (
    <div>
      {data}
      <Handle
        type="target"
        position={Position.Left}
        id={HandleId.Left}
        style={CustomHandleStyles}
      />
    </div>
  );
};

export default JobAddNode;
