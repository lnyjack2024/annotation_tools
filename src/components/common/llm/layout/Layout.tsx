import React from 'react';
import cx from 'classnames';
import { isAppenCloud } from 'src/utils';
import AppenLogo from '../../AppenLogo';
import Save from './toolbar/Save';
import './Layout.scss';

interface FragmentProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

interface SaveProps {
  disabled: boolean;
  onSave: () => void;
  title?: string;
}

interface LayoutProps {
  saveProps: SaveProps;
}

export default ({ className, style, children, saveProps }: FragmentProps & LayoutProps) => (
  <>
    <div className="llm-toolbar">
      {isAppenCloud() && (
        <AppenLogo fillOpacity={1} />
      )}
      <div
        className={cx('llm-tool-bar-operate', className)}
        style={style}
      >
        <div className="divider" />
        <Save {...saveProps} />
      </div>

    </div>
    <div
      className={cx('llm-layout', className)}
      style={style}
    >
      {children}
    </div>
  </>
);

export const MainContent = ({ className, style, children }: FragmentProps) => (
  <div
    className={cx('llm-main-content', className)}
    style={style}
  >
    {children}
  </div>
);

export const SidePanel = ({ className, style, children }: FragmentProps) => (
  <div
    className={cx('llm-side-panel', className)}
    style={style}
  >
    {children}
  </div>
);

export const InputArea = ({ className, style, children }: FragmentProps) => (
  <div
    className={cx('llm-input-area', className)}
    style={style}
  >
    {children}
  </div>
);
