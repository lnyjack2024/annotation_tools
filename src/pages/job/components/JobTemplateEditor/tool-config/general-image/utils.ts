import type { Styles } from './types';

export function isStyleCustomized(styles: Styles) {
  return (
    styles.fill_color !== undefined ||
    styles.point_color !== undefined ||
    styles.points_color !== undefined ||
    styles.point_type !== undefined ||
    styles.points_type !== undefined ||
    styles.edge_color !== undefined ||
    styles.edges_color !== undefined ||
    styles.edge_type !== undefined ||
    styles.edges_type !== undefined ||
    styles.edge_bold !== undefined ||
    styles.edges_bold !== undefined
  );
}
