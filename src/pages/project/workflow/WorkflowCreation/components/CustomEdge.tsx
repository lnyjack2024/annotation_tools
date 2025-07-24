import React from 'react';
import type { EdgeProps } from 'react-flow-renderer';
import { getMarkerEnd, getSmoothStepPath } from 'react-flow-renderer';

const CustomEdge: React.FC<EdgeProps> = props => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    arrowHeadType,
    // markerEndId,
  } = props;

  const [prefix] = id.split('-');

  const edgePath = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    // TODO add comment here
    targetY,
    targetPosition,
    centerY: 100 - +prefix * 20,
  });

  const markerEnd = getMarkerEnd(arrowHeadType, 'edge-marker-red');

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      style={{
        ...style,
        stroke: '#F56C6C',
        strokeDasharray: '6,6',
      }}
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
};

export default CustomEdge;
