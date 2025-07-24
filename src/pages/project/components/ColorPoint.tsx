import React from 'react';
import type { CSSProperties } from 'react';

type Props = {
  color: string;
  style?: CSSProperties;
};

const ColorPoint: React.FC<Props> = ({ color, style }) => (
  <i
    style={{
      float: 'left',
      width: 8,
      height: 8,
      borderRadius: '50%',
      marginTop: 7,
      marginRight: 6,
      backgroundColor: color,
      ...style,
    }}
  />
);

export default ColorPoint;
