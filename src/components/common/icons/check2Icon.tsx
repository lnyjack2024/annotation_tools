import type { MouseEventHandler } from 'react';
import React from 'react';

const Check2Icon = ({ onClick }: { onClick?: MouseEventHandler<SVGElement> }) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    style={{ cursor: 'pointer' }}
    onClick={onClick}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM11.5583 15.094L15.7703 9.254C15.8463 9.148 15.7703 9 15.6403 9H14.7023C14.4963 9 14.3043 9.1 14.1843 9.266L11.0403 13.626L9.61625 11.65C9.49625 11.482 9.30225 11.384 9.09825 11.384H8.16025C8.03025 11.384 7.95425 11.532 8.03025 11.638L10.5243 15.094C10.7783 15.448 11.3043 15.448 11.5583 15.094Z"
      fill="#9AA0B3"
    />
  </svg>
);

export default Check2Icon;
