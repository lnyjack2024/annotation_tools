import { useIntl } from "@umijs/max";
import cx from "classnames";
import OntologyChild from "./OntologyChild";
import type { GeneralImageOntology, GeneralImageOntologyChild } from "./types";
import styles from "./styles.less";

interface OntologyItemProps {
  ontologyItem: GeneralImageOntology;
  editType: "ontology" | "child";
  editItem: GeneralImageOntology | null;
  editChild: GeneralImageOntologyChild | null;
  onItemSelected: () => void;
  onChildSelected: (child: GeneralImageOntologyChild) => void;
  onChildAdd: () => void;
}

const OntologyItem: React.FC<OntologyItemProps> = ({
  ontologyItem,
  editType,
  editItem,
  editChild,
  onItemSelected,
  onChildSelected,
  onChildAdd,
}) => {
  const { formatMessage } = useIntl();
  const {
    key,
    class_name,
    display_name,
    display_color,
    children = [],
    multiple,
  } = ontologyItem;
  const itemSelected = editItem && editItem.key === key;
  return (
    <div className={styles.ontology}>
      <div
        className={cx(styles["ontology-info"], {
          [styles.selected]: itemSelected && editType === "ontology",
        })}
        onClick={onItemSelected}
      >
        <div
          className={styles["color-dot"]}
          {...(!multiple && {
            style: {
              backgroundColor: display_color,
              border: "none",
            },
          })}
        />
        {display_name || class_name}
      </div>
      {multiple && (
        <div>
          {children.map((c) => (
            <OntologyChild
              key={c.key}
              child={c}
              selected={
                itemSelected &&
                editType === "child" &&
                editChild &&
                editChild.key === c.key
              }
              onSelected={() => onChildSelected(c)}
            />
          ))}
          <div className={styles.child} onClick={onChildAdd}>
            <div
              className={styles["color-dot"]}
              style={{ borderStyle: "dashed" }}
            />
            <a>{formatMessage({ id: "tool.general-image.child.add" })}</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default OntologyItem;
