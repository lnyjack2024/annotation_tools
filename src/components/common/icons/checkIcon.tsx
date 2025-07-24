import type { MouseEventHandler } from 'react';
import React from 'react';

const CheckIcon = ({ onClick }: { onClick?: MouseEventHandler<SVGElement> }) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ cursor: 'pointer' }}
    onClick={onClick}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM11.5583 15.094L15.7703 9.254C15.8463 9.148 15.7703 9 15.6403 9H14.7023C14.4963 9 14.3043 9.1 14.1843 9.266L11.0403 13.626L9.61625 11.65C9.49625 11.482 9.30225 11.384 9.09825 11.384H8.16025C8.03025 11.384 7.95425 11.532 8.03025 11.638L10.5243 15.094C10.7783 15.448 11.3043 15.448 11.5583 15.094Z"
      fill="#99A0B2"
    />
  </svg>
);

export default CheckIcon;
