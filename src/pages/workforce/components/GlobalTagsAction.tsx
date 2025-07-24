import { message } from 'antd';
import { mapStatusToErrorMessage } from '@/utils/utils';
import { useState } from 'react';
import {
  createBpoUserTags,
  createUserTags,
  deleteBpoUserTags,
  deleteUserTags,
} from '@/services/user';
import { Tag } from '@/pages/bpo/components/BPOTagComponent';
import GlobalTagsModal from '@/pages/bpo/components/GlobalTagsModal';

type Props = {
  tags: Tag[];
  isBpo?: boolean;
  bpoId?: string;
  onRefresh: () => void;
};

function GlobalTagsAction({
  tags,
  onRefresh,
  isBpo = false,
  bpoId = '',
}: Props) {
  const [globalTagsModalVisible, setGlobalTagsModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const addGlobalTag = async (val: string) => {
    setUpdating(true);
    try {
      isBpo ? await createBpoUserTags(val, bpoId) : await createUserTags(val);
      await onRefresh();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  const deleteGlobalTag = async (id: string) => {
    setUpdating(true);
    try {
      isBpo ? await deleteBpoUserTags(id, bpoId) : await deleteUserTags(id);
      await onRefresh();
    } catch (e) {
      message.error(mapStatusToErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/*<Button*/}
      {/*  key="tag"*/}
      {/*  style={{ marginLeft: 8 }}*/}
      {/*  onClick={() => setGlobalTagsModalVisible(true)}*/}
      {/*>*/}
      {/*  {formatMessage({ id: 'bpo-list.bpo.tag.global' })}*/}
      {/*</Button>*/}
      <GlobalTagsModal
        visible={globalTagsModalVisible}
        tags={tags}
        onCancel={() => setGlobalTagsModalVisible(false)}
        addGlobalTag={addGlobalTag}
        deleteGlobalTag={deleteGlobalTag}
        updating={updating}
      />
    </>
  );
}

export default GlobalTagsAction;
