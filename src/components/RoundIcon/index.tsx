import React from 'react';

import styles from './styles.less';

const withRound =
  (WrappedComponent: React.FC<Record<string, any>>) =>
  ({ isColorful = false, ...restProps }: Record<string, any>) => {
    return (
      <WrappedComponent
        className={`${styles.icon} ${isColorful ? styles.colorful : ''}`}
        {...restProps}
      />
    );
  };

export default withRound;
