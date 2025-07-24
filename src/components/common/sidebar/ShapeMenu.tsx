import React, { useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import './ShapeMenu.scss';

interface ShapeMenuProps {
  position: { x: number; y: number };
  items: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
  }[][];
  onClose: () => void;
}

const ShapeMenu = ({ position, items, onClose }: ShapeMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(position);

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', listener);
    return () => {
      window.removeEventListener('mousedown', listener);
    };
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      const { top, height, left, width } = menuRef.current.getBoundingClientRect();
      let { x, y } = position;
      if (left + width > window.innerWidth) {
        x = window.innerWidth - width;
      }
      if (top + height > window.innerHeight) {
        y = window.innerHeight - height;
      }
      setPos({ x, y });
    } else {
      setPos(position);
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="shape-menu"
      style={{ top: pos.y, left: pos.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((sectionItems, index) => (
        <div key={sectionItems[0]?.label}>
          {index !== 0 && <div className="divider" />}
          {sectionItems.map((item) => (
            <div
              key={item.label}
              className={cx('shape-menu-item', {
                disabled: item.disabled,
              })}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ShapeMenu;
