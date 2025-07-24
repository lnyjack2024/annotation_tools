import React from 'react';

import Avatar from './AvatarDropdown';
import SelectLang from '../SelectLang';
import { getAuthority, isPM } from '@/utils/authority';

import styles from './index.less';
import { showMultiLang } from '@/utils/env';
import FileUploadCenter from './FileUploadCenter';

const GlobalHeaderRight: React.FC = () => {
  const roles = (getAuthority() as string[]) || [];
  const isProjectManager = isPM(roles);

  return (
    <div className={styles.right}>
      {isProjectManager && <FileUploadCenter />}
      <Avatar />
      {showMultiLang() && <SelectLang className={styles.action} />}
    </div>
  );
};
export default GlobalHeaderRight;
