import type { ReactNode } from 'react';

interface MarkerProps {
  id: string;
  className?: string;
  children: ReactNode;
}

const Marker = ({ id, className, children }: MarkerProps) => (
  <marker
    className={className || 'react-flow__arrowhead'}
    id={id}
    markerWidth="15"
    markerHeight="15"
    viewBox="-10 -10 20 20"
    orient="auto"
    markerUnits="userSpaceOnUse"
    refX="-5"
    refY="0"
  >
    {children}
  </marker>
);

interface MarkerDefinitionsProps {
  id: string;
  color: string;
}

export function MarkerDefinition({ color, id }: MarkerDefinitionsProps) {
  return (
    <svg>
      <defs>
        <Marker id={id}>
          <polyline
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            fill="none"
            // points="-12,-6 0,0 -12,6 -12,-6"
            points="-8,-4 0,0 -8,4"
          />
        </Marker>
      </defs>
    </svg>
  );
}
