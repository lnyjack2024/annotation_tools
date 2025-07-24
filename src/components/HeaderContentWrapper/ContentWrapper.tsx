import type { ReactNode } from 'react';
import { Menu } from 'antd';

import globalStyles from '@/global.less';

export interface ContentWrapperProps {
  children: ReactNode;
  menuItems?: { title: string | ReactNode; key: string; action: () => void }[];
  defaultSelectedKeys?: string[];
}

export default function ContentWrapperComponent({
  children,
  menuItems,
  defaultSelectedKeys,
}: ContentWrapperProps) {
  return (
    <>
      {menuItems && (
        <Menu
          className={globalStyles['page-menu']}
          mode="horizontal"
          selectedKeys={defaultSelectedKeys || []}
        >
          {menuItems.map(item => (
            <Menu.Item
              key={item.key}
              onClick={() => {
                item.action();
              }}
            >
              {item.title}
            </Menu.Item>
          ))}
        </Menu>
      )}
      <div className={globalStyles['page-content']}>{children}</div>
    </>
  );
}
