import MaterialModal from '@/components/MaterialModal';
import { Button, Menu, message, Popconfirm } from 'antd';
import { useIntl } from '@@/plugin-locale/localeExports';
import { HttpStatus, User } from '@/types';
import { useState } from 'react';
import { getAssignedRecordCount } from '@/services/project';
import { mapStatusToErrorMessage } from '@/utils';

type Props = {
  user: User;
  disabled: boolean;
  onDelete: (user: User) => PromiseLike<any>;
};

function SafeDeleteUser({ user, disabled, onDelete }: Props) {
  const { formatMessage } = useIntl();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const checkUserRecords = async () => {
    setDeleting(true);
    try {
      const resp = await getAssignedRecordCount(user.id);
      if (resp.status !== HttpStatus.OK) {
        message.error(mapStatusToErrorMessage(resp));
      }
      if (resp.data === 0) {
        await onDelete(user);
      } else {
        setVisible(true);
        setCount(resp.data);
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const resp = await onDelete(user);
      if (resp.status === HttpStatus.OK) {
        setVisible(false);
        message.success(formatMessage({ id: 'common.message.success.delete' }));
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Popconfirm
        key="deleteUser"
        title={formatMessage(
          { id: 'common.confirm.delete.user' },
          { name: user.uniqueName },
        )}
        onConfirm={checkUserRecords}
      >
        <Menu.Item style={{ textAlign: 'center' }} key="delete">
          <Button type="link" danger disabled={disabled}>
            {formatMessage({ id: 'common.delete' })}
          </Button>
        </Menu.Item>
      </Popconfirm>
      <MaterialModal
        visible={visible}
        title={formatMessage({ id: 'common.delete' })}
        onClose={() => setVisible(false)}
        onSave={handleDelete}
        saveLoading={deleting}
      >
        <p>{formatMessage({ id: 'user.delete.warning' }, { count })}</p>
      </MaterialModal>
    </>
  );
}

export default SafeDeleteUser;
