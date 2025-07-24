import { useRef } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Divider, Button } from "antd";
import { useIntl } from "@umijs/max";
import type { DropTargetMonitor } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";
import type { Ontology, OntologyChild } from "./LandmarkToolConfig";
import { AttrType } from "./LandmarkToolConfig";
import type { Category } from "./LandmarkToolConfigModal";
import { LandmarkEditType } from "./LandmarkToolConfigModal";
import styles from "./LandmarkOntologyItem.less";
import pointSvg from "@/assets/icons/keypoints.svg";
import rectangleSvg from "@/assets/icons/rectangle.svg";

interface DragItem {
  index: number;
  type: string;
}

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
  handleLandmarkGroup: (
    key: Ontology["key"],
    childKey?: OntologyChild["key"]
  ) => void;
  handleDelete: (key: Ontology["key"]) => void;
  handleGroupDelete: (
    itemKey: Ontology["key"],
    key: OntologyChild["key"]
  ) => void;
  onFormEdit: (
    className: Ontology["class_name"],
    key: OntologyChild["key"],
    type: AttrType,
    attributes?: string
  ) => void;
}

function LandmarkOntologyItem({
  index,
  ontology,
  activateItem,
  colorEnabled,
  descriptionType,
  dragType,
  moveOntology,
  handleMouseHover,
  handleMouseLeave,
  handleEditClick,
  handleLandmarkGroup,
  handleDelete,
  handleGroupDelete,
  onFormEdit,
}: OntologyItemProps) {
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
      <div className={styles["ontology-label"]}>
        <div style={{ width: "30%" }}>
          {colorEnabled && (
            <span
              className={styles.color}
              style={{ background: ontology.display_color }}
            />
          )}
          <span className={styles.name}>{ontology.class_name}</span>
          <span className={styles.name}>{ontology.display_name}</span>
        </div>
        <div style={{ width: "50%" }}>
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
        <div style={{ width: "20%", textAlign: "right" }}>
          {activateItem === ontology.key && (
            <>
              <PlusCircleOutlined
                onClick={(e) => {
                  e.preventDefault();
                  handleLandmarkGroup(ontology.key);
                }}
              />
              <Divider type="vertical" />
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
      <div className={styles["ontology-groups"]}>
        {Array.isArray(ontology.children) &&
          ontology.children.map((group: OntologyChild) => (
            <div className="ontology-group" key={group.key}>
              <img
                className="icon"
                src={
                  group.type === LandmarkEditType.KEYPOINT
                    ? pointSvg
                    : rectangleSvg
                }
              />
              <div className="name">
                {formatMessage({
                  id: "labeling-job-create.wizard.configuration.landmark.group.title.name",
                })}
                ：{group.name}
              </div>
              <div className="description">
                {group.type === LandmarkEditType.KEYPOINT && (
                  <>
                    {formatMessage({
                      id: "labeling-job-create.wizard.configuration.ontology.title.group.total",
                    })}
                    ：
                    {group.categories.reduce(
                      (total: number, category: Category) =>
                        total + (category.range[1] - category.range[0] + 1),
                      0
                    )}
                  </>
                )}
              </div>
              <div className="action-box">
                {group.type === LandmarkEditType.KEYPOINT && (
                  <>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        onFormEdit(
                          ontology.class_name,
                          group.key,
                          AttrType.POINT,
                          group.point_label_config
                        );
                      }}
                    >
                      {formatMessage({
                        id: "labeling-job-create.wizard.configuration.landmark.group.points-attributes",
                      })}
                    </Button>
                    <Divider type="vertical" />
                  </>
                )}
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    onFormEdit(
                      ontology.class_name,
                      group.key,
                      AttrType.GROUP,
                      group.label_config
                    );
                  }}
                >
                  {formatMessage({
                    id: "labeling-job-create.wizard.configuration.landmark.group.group-attributes",
                  })}
                </Button>
                <Divider type="vertical" />
                <EditOutlined
                  onClick={(e) => {
                    e.preventDefault();
                    handleLandmarkGroup(ontology.key, group.key);
                  }}
                />
                <Divider type="vertical" />
                <DeleteOutlined
                  onClick={(e) => {
                    e.preventDefault();
                    handleGroupDelete(ontology.key, group.key);
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default LandmarkOntologyItem;
