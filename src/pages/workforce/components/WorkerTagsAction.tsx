import { useState } from 'react';
import { Button, message } from 'antd';
import { BPOUser, User } from '@/types/user';
import type { GlobalTag } from '@/types/vm';
import BPOTagComponent from '@/pages/bpo/components/BPOTagComponent';
import { EditOutlined } from '@ant-design/icons';
import TagsModal from '@/pages/bpo/components/TagsModal';
import { updateBpoUserTags, updateUserTags } from '@/services/user';
import { mapStatusToErrorMessage } from '@/utils/utils';
import { HttpStatus } from '@/types/http';

type Props = {
  user: User | BPOUser;
  tags: GlobalTag[];
  isBpo?: boolean;
  bpoId?: string;
  onRefresh: () => void;
};

function WorkerTagsAction({
  user,
  tags,
  isBpo = false,
  bpoId = '',
  onRefresh,
}: Props) {
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const updateTags = async (tagIds: string[]) => {
    setUpdating(true);
    try {
      const resp = isBpo
        ? await updateBpoUserTags(tagIds, (user as BPOUser).workerId, bpoId)
        : await updateUserTags(tagIds, user.id);
      if (resp.status === HttpStatus.OK) {
        setTagsModalVisible(false);
        onRefresh();
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <BPOTagComponent tags={user?.tags || []} />
      <Button
        type="link"
        icon={<EditOutlined />}
        onClick={() => setTagsModalVisible(true)}
      />
      <TagsModal
        visible={tagsModalVisible}
        tags={tags}
        selectedTags={user?.tags || []}
        onCancel={() => setTagsModalVisible(false)}
        updateTags={updateTags}
        updating={updating}
      />
    </div>
  );
}

export default WorkerTagsAction;
