import cx from 'classnames';
import type { GeneralImageOntologyChild } from './types';
import styles from './styles.less';

interface OntologyChildProps {
  child: GeneralImageOntologyChild;
  selected: boolean;
  onSelected: () => void;
}

const OntologyChild: React.FC<OntologyChildProps> = ({
  child,
  selected,
  onSelected,
}) => (
  <div
    className={cx(styles.child, {
      [styles.selected]: selected,
    })}
    onClick={onSelected}
  >
    <div
      className={styles['color-dot']}
      style={{
        backgroundColor: child.display_color,
        border: 'none',
      }}
    />
    {child.name}
  </div>
);

export default OntologyChild;
