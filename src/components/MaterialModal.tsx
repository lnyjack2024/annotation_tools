import type { ReactNode } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import type { ModalProps } from "antd/es/modal";
import { useIntl } from "@umijs/max";

import styles from "./MaterialModal.less";

interface Props extends ModalProps {
  width?: number;
  visible: boolean;
  showFooter?: boolean;
  title: string | ReactNode;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saveLoading?: boolean;
  disabled?: boolean;
  isCancelBtnShow?: boolean;
}

function MaterialModal({
  width = 500,
  visible,
  title,
  children,
  showFooter = true,
  onSave,
  onClose,
  saveLoading = false,
  disabled = false,
  isCancelBtnShow = true,
  ...restProps
}: Props) {
  const intl = useIntl();
  const { formatMessage } = intl;
  return (
    <Modal
      width={width}
      visible={visible}
      closable={false}
      destroyOnClose
      title={null}
      footer={null}
      {...restProps}
    >
      <h2 className={styles.title}>
        {title}
        <Button
          type="link"
          icon={<CloseOutlined />}
          className={styles.close}
          onClick={onClose}
        />
      </h2>
      {children}
      {showFooter && (
        <div className={styles.buttons}>
          {isCancelBtnShow && (
            <Button
              className={styles.cancel}
              disabled={disabled}
              onClick={onClose}
            >
              {formatMessage({ id: "common.cancel" })}
            </Button>
          )}
          <Button
            className={styles.save}
            type="primary"
            loading={saveLoading}
            disabled={disabled}
            onClick={() => {
              if (onSave) {
                onSave();
              }
            }}
          >
            {formatMessage({ id: "common.ok" })}
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default MaterialModal;
