import {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
} from "react";
import { useIntl } from "@umijs/max";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button, Modal } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import OntologyEditModal from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditModal";
import GeneralImageOntologyItemEditor from "@/pages/job/components/JobTemplateEditor/tool-config/GeneralImageOntologyItemEditor";
import FormAttribute from "@/pages/job/components/JobTemplateEditor/components/FormAttribute";
import styles from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditor.less";

interface DragItem {
  index: number;
  type: string;
}

export interface GeneralImageOntologyChild {
  name: string;
  count?: number;
  min_count?: number;
  max_count?: number;
  label_config?: string;
  label_config_point?: string;
  // legacy tool config
  type?: string;
  edges?: number;
  // current tool config
  tools?: {
    type: string;
    edges?: number | null;
    point_color?: string[];
    edge_color?: string[];
    edge_bold?: boolean[];
  }[];
}

interface GeneralImageOntology {
  key?: string;
  class_name: string;
  display_name?: string;
  display_color: string;
  label_config?: string;
  children?: GeneralImageOntologyChild[];
}

/**
 * general image ontology child item
 */
const GeneralImageOntologyChildItem = ({
  ontologyChild,
  onChange,
  handleEditClick,
  handleDelete,
}: {
  ontologyChild: GeneralImageOntologyChild;
  onChange: (ontologyChild: GeneralImageOntologyChild) => void;
  handleEditClick: (ontologyChild: GeneralImageOntologyChild) => void;
  handleDelete: (name: GeneralImageOntologyChild["name"]) => void;
}) => {
  const { formatMessage } = useIntl();
  const [hovered, setHovered] = useState(false);
  const [formEditing, setFormEditing] = useState(false);
  const [formType, setFormType] = useState("");
  const handleFormOpen = (type: "shape" | "point") => {
    setFormType(type);
    setFormEditing(true);
  };
  const handleFormSave = (config: string) => {
    const data = { ...ontologyChild };
    if (formType === "shape") {
      data.label_config = config;
    } else if (formType === "point") {
      data.label_config_point = config;
    }
    onChange(data);
    setFormEditing(false);
  };
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#FAFAFC",
          padding: "8px 8px 8px 16px",
          margin: "4px 0 4px 36px",
        }}
        onMouseOver={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) => e.preventDefault()}
      >
        <div>
          {`${formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.item.name",
          })}: ${ontologyChild.name}`}
        </div>
        <div>
          {hovered && !formEditing && (
            <>
              <span
                style={{ margin: "0 6px", cursor: "pointer" }}
                onClick={() => handleFormOpen("point")}
              >
                {formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.attributes.point.title",
                })}
              </span>
              <span
                style={{ margin: "0 6px", cursor: "pointer" }}
                onClick={() => handleFormOpen("shape")}
              >
                {formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.attributes.title",
                })}
              </span>
              <span style={{ padding: "0 6px" }}>
                <EditOutlined onClick={() => handleEditClick(ontologyChild)} />
              </span>
              <span style={{ padding: "0 6px" }}>
                <DeleteOutlined
                  onClick={() => handleDelete(ontologyChild.name)}
                />
              </span>
            </>
          )}
        </div>
      </div>
      <Modal
        destroyOnClose
        width={960}
        bodyStyle={{ padding: "45px 8px 8px" }}
        visible={formEditing}
        footer={null}
        onCancel={() => setFormEditing(false)}
      >
        <FormAttribute
          config={
            formType === "shape"
              ? ontologyChild.label_config
              : ontologyChild.label_config_point
          }
          ontologySyncDisabled
          onSave={handleFormSave}
        />
      </Modal>
    </>
  );
};

/**
 * general image ontology item
 */
const GeneralImageOntologyItem = ({
  index,
  ontology,
  onChange,
  handleEditClick,
  handleDelete,
  moveOntology,
}: {
  index: number;
  ontology: GeneralImageOntology;
  onChange: (ontology: GeneralImageOntology) => void;
  handleEditClick: (ontology: GeneralImageOntology) => void;
  handleDelete: (key: GeneralImageOntology["key"]) => void;
  moveOntology: (dragIndex: number, hoverIndex: number) => void;
}) => {
  const { formatMessage } = useIntl();
  const [editItem, setEditItem] = useState<GeneralImageOntologyChild | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [formEditing, setFormEditing] = useState(false);

  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: "VIDEO-ONTOLOGY",
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveOntology(dragIndex, hoverIndex);
      // eslint-disable-next-line no-param-reassign
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: "VIDEO-ONTOLOGY",
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => ({ index }),
  });
  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  const handleCancel = () => {
    setVisible(false);
    setEditItem(null);
  };

  const handleOk = (allValues: GeneralImageOntologyChild) => {
    const children: GeneralImageOntologyChild[] = ontology.children
      ? [...ontology.children]
      : [];
    if (editItem) {
      // update
      const childIndex = children.findIndex((c) => c.name === editItem.name);
      if (childIndex >= 0) {
        children[childIndex] = { ...children[childIndex], ...allValues };
      }
    } else {
      // create
      children.push(allValues);
    }
    onChange({ ...ontology, children });
    handleCancel();
  };

  const hanldeChildChange = (ontologyChild: GeneralImageOntologyChild) => {
    const children: GeneralImageOntologyChild[] = ontology.children
      ? [...ontology.children]
      : [];
    if (ontologyChild.name) {
      const childIndex = children.findIndex(
        (c) => c.name === ontologyChild.name
      );
      if (childIndex >= 0) {
        children[childIndex] = { ...ontologyChild };
      }
    }
    onChange({ ...ontology, children });
  };

  const handleChildEditClick = (ontologyChild: GeneralImageOntologyChild) => {
    setEditItem(ontologyChild);
    setVisible(true);
  };

  const handleChildDelete = (name: GeneralImageOntologyChild["name"]) => {
    const children = ontology.children?.filter((c) => c.name !== name);
    onChange({ ...ontology, children });
  };

  const handleFormSave = (config: string) => {
    onChange({ ...ontology, label_config: config });
    setFormEditing(false);
  };

  return (
    <div ref={ref} style={{ opacity }}>
      <div
        className={styles["ontology-item"]}
        onMouseOver={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) => e.preventDefault()}
      >
        <div>
          <span
            className={styles.color}
            style={{ background: ontology.display_color }}
          />
          <span className={styles.name}>
            {ontology.display_name
              ? `${ontology.display_name} (${ontology.class_name})`
              : ontology.class_name}
          </span>
        </div>
        <div>
          {hovered && (
            <>
              <span
                style={{ padding: "0 6px", cursor: "pointer" }}
                onClick={() => setFormEditing(true)}
              >
                {formatMessage({
                  id: "labeling-job-create.wizard.configuration.ontology.attributes.title",
                })}
              </span>
              <span
                style={{ padding: "0 6px" }}
                onClick={() => setVisible(true)}
              >
                <PlusCircleOutlined />
              </span>
              <span style={{ padding: "0 6px" }}>
                <EditOutlined onClick={() => handleEditClick(ontology)} />
              </span>
              <span style={{ padding: "0 6px" }}>
                <DeleteOutlined onClick={() => handleDelete(ontology.key)} />
              </span>
            </>
          )}
        </div>
      </div>
      {ontology.children?.map((child) => (
        <GeneralImageOntologyChildItem
          key={child.name}
          ontologyChild={child}
          onChange={hanldeChildChange}
          handleEditClick={handleChildEditClick}
          handleDelete={handleChildDelete}
        />
      ))}
      <Modal
        destroyOnClose
        width={960}
        bodyStyle={{ padding: "45px 8px 8px" }}
        visible={formEditing}
        footer={null}
        onCancel={() => setFormEditing(false)}
      >
        <FormAttribute
          config={ontology.label_config}
          ontologySyncDisabled
          onSave={handleFormSave}
        />
      </Modal>
      <Modal
        visible={visible}
        width={720}
        title={formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.item.edit",
        })}
        footer={null}
        onCancel={handleCancel}
      >
        <GeneralImageOntologyItemEditor
          item={editItem}
          defaultColor={ontology.display_color}
          onCancel={handleCancel}
          onSave={handleOk}
          validateName={(value) => {
            if (!value || !ontology.children || ontology.children.length <= 0) {
              return true;
            }
            const exists = ontology.children.find(
              (c) => c.name === value && value !== editItem?.name
            );
            if (!exists) {
              return true;
            }
            return false;
          }}
        />
      </Modal>
    </div>
  );
};

/**
 * general image tool config
 */
const GeneralImageToolConfig = forwardRef(
  (
    {
      ontologies: defaultOntologies,
    }: {
      ontologies: GeneralImageOntology[];
    },
    ref: any
  ) => {
    const { formatMessage } = useIntl();
    const [ontologies, setOntologies] = useState<GeneralImageOntology[]>([]);
    const [editItem, setEditItem] = useState<GeneralImageOntology | null>(null);

    useEffect(() => {
      let list: GeneralImageOntology[] = [];
      if (Array.isArray(defaultOntologies) && defaultOntologies.length > 0) {
        list = defaultOntologies.map((o, i) => {
          if (o.key) return o;
          return { ...o, key: `${+new Date()}-${i}` };
        });
      }
      setOntologies(list);
    }, [defaultOntologies]);

    useImperativeHandle(ref, () => ({
      getData: () => ontologies,
    }));

    const moveOntology = useCallback(
      (dragIndex, hoverIndex) => {
        const dragItem = ontologies[dragIndex];
        const dragItemRemoved = [
          ...ontologies.slice(0, dragIndex),
          ...ontologies.slice(dragIndex + 1),
        ];
        const dragItemInserted = [
          ...dragItemRemoved.slice(0, hoverIndex),
          dragItem,
          ...dragItemRemoved.slice(hoverIndex),
        ];
        setOntologies(dragItemInserted);
      },
      [ontologies]
    );

    const handleChange = (ontology: GeneralImageOntology) => {
      const newOntologies = [...ontologies];
      if (ontology.key) {
        const index = newOntologies.findIndex((o) => o.key === ontology.key);
        if (index >= 0) {
          newOntologies[index] = { ...ontology };
        }
      }
      setOntologies(newOntologies);
    };

    const handleEditClick = (ontology: GeneralImageOntology) => {
      // only affects class_name, display_name, display_color
      setEditItem({
        key: ontology.key,
        class_name: ontology.class_name,
        display_name: ontology.display_name,
        display_color: ontology.display_color,
      });
    };

    const handleDelete = (itemKey: string = "") => {
      const newOntologies = ontologies.filter((item) => item.key !== itemKey);
      setOntologies(newOntologies);
    };

    const handleModalOk = (values: GeneralImageOntology) => {
      const newOntologies = [...ontologies];
      if (values.key) {
        // update
        const index = newOntologies.findIndex((o) => o.key === values.key);
        if (index >= 0) {
          newOntologies[index].class_name = values.class_name;
          newOntologies[index].display_name = values.display_name;
          newOntologies[index].display_color = values.display_color;
        }
      } else {
        // insert new
        newOntologies.push({ ...values, key: `${+new Date()}` });
      }
      setOntologies(newOntologies);
      setEditItem(null);
    };

    const validate = (ontology: GeneralImageOntology) => {
      return ontologies.every(
        (o) => o.key === ontology.key || o.class_name !== ontology.class_name
      );
    };

    return (
      <>
        <DndProvider backend={HTML5Backend} context={window}>
          {ontologies.map((o, i) => (
            <GeneralImageOntologyItem
              key={o.class_name}
              index={i}
              ontology={o}
              onChange={handleChange}
              handleEditClick={handleEditClick}
              handleDelete={handleDelete}
              moveOntology={moveOntology}
            />
          ))}
        </DndProvider>
        <Button
          block
          type="dashed"
          onClick={() => setEditItem({ class_name: "", display_color: "" })}
        >
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.editor.add",
          })}
        </Button>
        <OntologyEditModal
          ontology={editItem}
          visible={!!editItem}
          descriptionEnabled={false}
          onOk={(values) => handleModalOk(values as GeneralImageOntology)}
          onCancel={() => setEditItem(null)}
          validate={(o) => validate(o as GeneralImageOntology)}
        />
      </>
    );
  }
);

export default GeneralImageToolConfig;
