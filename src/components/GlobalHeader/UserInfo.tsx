import React from 'react';
import styles from '@/components/GlobalHeader/index.less';

type Props = {
  name: string;
};
const UserInfo: React.FC<Props> = ({ name }) => {
  return <span className={styles.name}>{name}</span>;
};

export default UserInfo;
