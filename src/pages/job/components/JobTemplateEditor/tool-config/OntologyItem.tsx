import { useRef } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Divider, Typography } from "antd";
import type { DropTargetMonitor } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";
import { useIntl } from "@umijs/max";
import type { Ontology } from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor";
import styles from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor.less";

interface OntologyItemProps {
  index: number;
  ontology: Ontology;
  activateItem: string;
  colorEnabled: boolean;
  sizeEnabled: boolean;
  descriptionType: "text" | "richtext";
  dragType: string;
  moveOntology: (dragIndex: number, hoverIndex: number) => void;
  handleMouseHover: (key: Ontology["key"]) => void;
  handleMouseLeave: () => void;
  handleEditClick: (ontology: Ontology) => void;
  handleDelete: (key: Ontology["key"]) => void;
}

interface DragItem {
  index: number;
  type: string;
}

const { Text } = Typography;

export default ({
  index,
  ontology,
  activateItem,
  colorEnabled,
  sizeEnabled,
  descriptionType,
  dragType,
  moveOntology,
  handleMouseHover,
  handleMouseLeave,
  handleEditClick,
  handleDelete,
}: OntologyItemProps) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: dragType,
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action
      moveOntology(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      // eslint-disable-next-line no-param-reassign
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: dragType,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => ({ index }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  const nullText = formatMessage({
    id: "labeling-job-create.wizard.configuration.ontology.editor.size.null",
  });
  return (
    <div
      ref={ref}
      className={styles["ontology-item"]}
      style={{ opacity }}
      onMouseOver={(e) => {
        e.preventDefault();
        handleMouseHover(ontology.key);
      }}
      onMouseLeave={(e) => {
        e.preventDefault();
        handleMouseLeave();
      }}
      onFocus={(e) => e.preventDefault()}
    >
      <div style={{ width: "30%" }}>
        {colorEnabled && (
          <span
            className={styles.color}
            style={{ background: ontology.display_color }}
          />
        )}
        <span className={styles.name}>{ontology.class_name}</span>
        {sizeEnabled && (
          <div className={styles.size}>
            <Text type="secondary">
              {formatMessage(
                {
                  id: "labeling-job-create.wizard.configuration.ontology.editor.size.label",
                },
                {
                  length:
                    ontology.default_size?.length >= 0
                      ? `${ontology.default_size.length}m`
                      : nullText,
                  width:
                    ontology.default_size?.width >= 0
                      ? `${ontology.default_size.width}m`
                      : nullText,
                  height:
                    ontology.default_size?.height >= 0
                      ? `${ontology.default_size.height}m`
                      : nullText,
                }
              )}
            </Text>
            <br />
            {ontology.default_size?.threshold >= 0 && (
              <Text type="secondary">
                {formatMessage(
                  {
                    id: "labeling-job-create.wizard.configuration.ontology.editor.threshold.label",
                  },
                  {
                    threshold: ontology.default_size?.threshold * 100,
                  }
                )}
              </Text>
            )}
            {(ontology.default_size?.minWidth >= 0 ||
              ontology.default_size?.maxWidth >= 0 ||
              ontology.default_size?.minHeight >= 0 ||
              ontology.default_size?.maxHeight >= 0 ||
              ontology.default_size?.minLength >= 0 ||
              ontology.default_size?.maxLength >= 0) && (
              <>
                <Text type="secondary">
                  {formatMessage(
                    {
                      id: "labeling-job-create.wizard.configuration.ontology.editor.max-size.label",
                    },
                    {
                      length:
                        ontology.default_size?.maxLength >= 0
                          ? `${ontology.default_size.maxLength}m`
                          : nullText,
                      width:
                        ontology.default_size?.maxWidth >= 0
                          ? `${ontology.default_size.maxWidth}m`
                          : nullText,
                      height:
                        ontology.default_size?.maxHeight >= 0
                          ? `${ontology.default_size.maxHeight}m`
                          : nullText,
                    }
                  )}
                </Text>
                <br />
                <Text type="secondary">
                  {formatMessage(
                    {
                      id: "labeling-job-create.wizard.configuration.ontology.editor.min-size.label",
                    },
                    {
                      length:
                        ontology.default_size?.minLength >= 0
                          ? `${ontology.default_size.minLength}m`
                          : nullText,
                      width:
                        ontology.default_size?.minWidth >= 0
                          ? `${ontology.default_size.minWidth}m`
                          : nullText,
                      height:
                        ontology.default_size?.minHeight >= 0
                          ? `${ontology.default_size.minHeight}m`
                          : nullText,
                    }
                  )}
                </Text>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{ width: "62%" }}>
        {descriptionType === "text" ? (
          ontology.description
        ) : (
          <div
            className={styles["rich-text-container"]}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: ontology.description }}
          />
        )}
      </div>
      <div style={{ width: "8%", textAlign: "right" }}>
        {activateItem === ontology.key && (
          <>
            <EditOutlined
              onClick={(e) => {
                e.preventDefault();
                handleEditClick(ontology);
              }}
            />
            <Divider type="vertical" />
            <DeleteOutlined
              onClick={(e) => {
                e.preventDefault();
                handleDelete(ontology.key);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
