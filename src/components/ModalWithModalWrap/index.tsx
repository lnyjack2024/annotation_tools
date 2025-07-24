import type { FC } from 'react';
import type { ModalProps } from 'antd';
import { Modal } from 'antd';

import styles from './index.less';

type ModalWithModalWrapProps = {
  hasTable?: boolean;
  children: JSX.Element | JSX.Element[];
} & ModalProps &
  ModalWrapProps;
function findTableNode(node: JSX.Element) {
  return /list|table/gi.test(node.type.name);
}

type ModalWrapProps = {
  reducedHeight?: number | 'auto';
};

// 236 -> bottom: 40px
export const ModalWrap: FC<ModalWrapProps> = ({
  reducedHeight = 236,
  children,
}) => {
  return (
    <div
      className={styles.modelWrap}
      style={{
        height:
          reducedHeight === 'auto'
            ? `calc(100vh - ${reducedHeight}px)`
            : 'auto',
      }}
    >
      {children}
    </div>
  );
};

export const ModalWithModalWrap = ({
  children,
  reducedHeight,
  hasTable = true,
  ...props
}: ModalWithModalWrapProps) => {
  const tableNode = Array.isArray(children)
    ? children.find(findTableNode)
    : findTableNode(children)
    ? children
    : null;
  const isTableEmpty =
    tableNode?.props?.dataSource?.length || tableNode?.props?.data?.length;
  return (
    <Modal
      {...props}
      style={{ top: 40, bottom: 40, minWidth: 800, maxWidth: 1200 }}
    >
      {isTableEmpty === 0 && !hasTable ? (
        children
      ) : (
        <ModalWrap reducedHeight={reducedHeight}>{children}</ModalWrap>
      )}
    </Modal>
  );
};
