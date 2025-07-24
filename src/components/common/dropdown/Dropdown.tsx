import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CaretDownOutlined, CheckOutlined } from '@ant-design/icons';
import cx from 'classnames';
import './Dropdown.scss';

export enum MenuItemType {
  ITEM = 'item',
  TITLE = 'title',
}

export interface MenuItem {
  label: string;
  type?: MenuItemType;
  value?: any;
  disabled?: boolean;
  active?: boolean;
  render?: (label: string, index: number, item: MenuItem) => React.ReactNode;
}

const Dropdown = ({ children, className, style, menuStyle, arrow, showIcon, closeAfterClick = true, triggerArea = 'element', disabled, active, menu, onClick }: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  arrow?: boolean;
  showIcon?: boolean;
  closeAfterClick?: boolean;
  triggerArea?: 'element' | 'arrow';
  disabled?: boolean;
  active?: boolean;
  menu: string[] | MenuItem[];
  onClick: (item: string, index: number, menuItem: MenuItem) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const menus = useMemo<MenuItem[]>(() => {
    if (typeof menu[0] === 'string') {
      return (menu as string[]).map((i) => ({ label: i } as MenuItem));
    }
    return (menu as MenuItem[]).map((i) => i);
  }, [menu]);

  useEffect(() => {
    const mousedown = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as HTMLElement)) {
        return;
      }
      setDropdownVisible(false);
    };
    window.addEventListener('mousedown', mousedown);
    return () => {
      window.removeEventListener('mousedown', mousedown);
    };
  }, []);

  const openDropdown = (e: React.MouseEvent) => {
    if (!disabled) {
      e.stopPropagation();
      setDropdownVisible(!dropdownVisible);
    }
  };

  return (
    <div
      ref={ref}
      style={style}
      className={cx(className, 'dropdown-button', {
        'dropdown-button--active': active,
        'dropdown-button--disabled': disabled,
      })}
      {...triggerArea === 'element' && {
        onClick: openDropdown,
      }}
    >
      {children}
      {arrow && (
        <div
          className="dropdown-icon"
          {...triggerArea === 'arrow' && {
            onClick: openDropdown,
          }}
        >
          <CaretDownOutlined
            style={{
              transform: dropdownVisible ? 'rotate(180deg)' : '',
            }}
          />
        </div>
      )}
      {dropdownVisible && (
        <div className="dropdown-menu" style={menuStyle}>
          {menus.map((m, i) => (m.type === MenuItemType.TITLE ? (
            <div key={m.label} className="dropdown-menu-title">
              {m.render ? m.render(m.label, i, m) : m.label}
            </div>
          ) : (
            <div
              key={m.value || m.label}
              className={cx('dropdown-menu-item', {
                active: m.active,
                disabled: m.disabled,
              })}
              onClick={(e) => {
                if (!m.disabled) {
                  e.stopPropagation();
                  onClick(m.label, i, m);
                  if (closeAfterClick) {
                    setDropdownVisible(false);
                  }
                }
              }}
            >
              {showIcon && (
                <span className="dropdown-menu-item-icon">
                  {m.active && <CheckOutlined />}
                </span>
              )}
              {m.render ? m.render(m.label, i, m) : m.label}
            </div>
          )))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
