import type { ReactNode, ReactElement } from 'react';
import React, { memo, Children } from 'react';
import { Divider, Dropdown, Menu } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

import styles from './index.less';

type ReactElementNode = ReactElement<any>;
export const MoreItemDropDownContainer = memo(({ children }) => {
  const options = Children.toArray(children)?.filter(
    _ => !(_ as JSX.Element)?.props?.hidden,
  );
  return options.length ? (
    <Dropdown
      className="flex-center"
      overlay={
        <Menu>
          {options.map(child => {
            return (
              <Menu.Item key={(child as ReactElementNode).key}>
                {addReactElementProps(child as ReactElementNode)}
              </Menu.Item>
            );
          })}
        </Menu>
      }
    >
      <MoreOutlined />
    </Dropdown>
  ) : null;
});
interface OperationContainerParams {
  children?: JSX.Element | JSX.Element[] | ReactNode;
  moreItems?: JSX.Element | JSX.Element[] | ReactNode;
}

export const OperationContainer = ({
  children,
  moreItems,
}: OperationContainerParams) => (
  <div className={styles.container}>
    {Children.toArray(children)
      .filter(_ => !(_ as JSX.Element)?.props?.hidden)
      ?.map((child, i) => {
        return (
          <div key={(child as ReactElementNode).key}>
            {!!i && <Divider type="vertical" />}
            {addReactElementProps(child as ReactElementNode)}
          </div>
        );
      })}
    <MoreItemDropDownContainer>{moreItems}</MoreItemDropDownContainer>
  </div>
);

export function addReactElementProps(
  child: ReactElementNode,
  props: Record<string, any> = { size: 'small' },
) {
  return React.cloneElement(child, props);
}
