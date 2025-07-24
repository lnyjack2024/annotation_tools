import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import './LayoutWrapper.scss';

interface LayoutWrapperProps {
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  loadingDelay?: number;
  children: React.ReactNode;
  onMouseDown?: (e: React.MouseEvent) => void;
}

const LayoutWrapper = ({
  className,
  style,
  loading = false,
  loadingDelay = 300,
  children,
  onMouseDown,
}: LayoutWrapperProps) => {
  const timer = useRef<number>();
  const [shouldLoading, setShouldLoading] = useState(false);

  useEffect(() => {
    if (loadingDelay <= 0) {
      // no delay, do immediately
      setShouldLoading(loading);
    } else if (loading) {
      // if loading, set timer to show as loading
      timer.current = window.setTimeout(() => {
        setShouldLoading(loading);
      }, loadingDelay);
    } else if (timer.current) {
      window.clearTimeout(timer.current);
      setShouldLoading(false);
    }
  }, [loading]);

  return (
    <div
      className={cx('app-layout-wrapper', className)}
      style={style}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={onMouseDown}
    >
      {shouldLoading && <div className="app-loading" />}
      {children}
    </div>
  );
};

export default LayoutWrapper;
