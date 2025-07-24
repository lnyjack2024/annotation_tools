import type { MouseEventHandler } from 'react';
import React from 'react';

const DeleteReviewIcon = ({
  onClick,
  style,
}: {
  onClick?: MouseEventHandler<SVGElement>;
  style?: React.CSSProperties;
}) => (
  <svg
    width="20"
    height="20"
    viewBox="-2 -2 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    onClick={onClick}
    style={style}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.55077 0C5.09772 0 4.70127 0.304584 4.58453 0.742337L4.11582 2.5H1V3.5H15V2.5H11.8841L11.4154 0.742337C11.2987 0.304584 10.9022 0 10.4492 0H5.55077ZM10.8492 2.5L10.4492 1H5.55077L5.15077 2.5H10.8492ZM3.09668 14.0624L2.50098 4.53119L3.49903 4.46881L4.09473 14L11.9053 14L12.501 4.46881L13.499 4.53119L12.9033 14.0624C12.8704 14.5894 12.4333 15 11.9053 15H4.09473C3.56666 15 3.12962 14.5894 3.09668 14.0624ZM6 12.5V5.5H7V12.5H6ZM9 5.5V12.5H10V5.5H9Z"
      fill="#99A0B2"
    />
  </svg>
);

export default DeleteReviewIcon;
