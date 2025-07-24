import type { MouseEvent } from "react";
import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import OntologyItem from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyItem";
import OntologyEditModal from "@/pages/job/components/JobTemplateEditor/tool-config/OntologyEditModal";

export type Ontology = {
  key?: string;
  class_name: string;
  display_name?: string;
  display_color?: string;
  description?: string;
  attributes?: string;
  default_size?: {
    // for lidar cuboid
    width: number;
    height: number;
    length: number;
    threshold?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minLength?: number;
    maxLength?: number;
  };
  limits?: {
    // for plss
    shapeType: "polygon" | "rectangle" | "line" | "dot";
    operator: "eq" | "ne" | "gt" | "ge" | "lt" | "le";
    count: number;
  }[];
};

type Props = {
  type: string;
  ontologies: Ontology[];
  options?: {
    colorEnabled?: boolean;
    descriptionEnabled?: boolean;
    descriptionType?: "text" | "richtext";
    sizeEnabled?: boolean;
    limitsEnabled?: boolean;
  };
};

function OntologyEditor(
  { type, ontologies: defaultOntologies = [], options }: Props,
  ref: any
) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [ontologies, setOntologies] = useState<Ontology[]>(
    defaultOntologies || []
  );
  const [activateItem, setActivateItem] = useState("");
  const [editItem, setEditItem] = useState<Ontology | null>(null);

  const colorEnabled =
    options?.colorEnabled === undefined || options?.colorEnabled; // default is true
  const descriptionEnabled =
    options?.descriptionEnabled === undefined || options?.descriptionEnabled; // default is true
  const descriptionType =
    options?.descriptionType === "richtext" ? "richtext" : "text";
  const sizeEnabled = options?.sizeEnabled === true; // default is false
  const limitsEnabled = options?.limitsEnabled === true;

  useEffect(() => {
    let list: Ontology[] = [];
    if (Array.isArray(defaultOntologies) && defaultOntologies.length > 0) {
      list = defaultOntologies.map((o, i) => {
        if (o.key) return o;
        // if key is missing, give a key to the ontology item by default
        // ensure key in unique
        return { ...o, key: `${+new Date()}-${i}` };
      });

      setOntologies(list);
    }
  }, [defaultOntologies]);

  useImperativeHandle(ref, () => ({
    // expose default getData function
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

  const handleMouseHover = (itemKey: string = "") => {
    setActivateItem(itemKey);
  };

  const handleMouseLeave = () => {
    setActivateItem("");
  };

  const handleDelete = (itemKey: string = "") => {
    const newOntologies = ontologies.filter((item) => item.key !== itemKey);
    setOntologies(newOntologies);
  };

  const handleEditClick = (ontology: Ontology) => {
    setEditItem(ontology);
  };

  const handleAddClick = (e: MouseEvent) => {
    e.preventDefault();
    setEditItem({
      class_name: "",
      display_color: "",
      description: "",
    });
  };

  const handleModalOk = (values: Ontology) => {
    let newOntologies: Ontology[];
    if (values.key) {
      // update
      newOntologies = ontologies.map((item) => {
        if (item.key === values.key) {
          return values;
        }

        return item;
      });
    } else {
      // insert new
      newOntologies = [
        ...ontologies,
        {
          ...values,
          key: `${+new Date()}`,
        },
      ];
    }
    setOntologies(newOntologies);
    setEditItem(null);
  };

  const handleModalCancel = () => {
    setEditItem(null);
  };

  const validate = (ontology: Ontology) => {
    return ontologies.every(
      (o) => o.key === ontology.key || o.class_name !== ontology.class_name
    );
  };

  return (
    <>
      <DndProvider backend={HTML5Backend} context={window}>
        {ontologies.map((item, index) => (
          <OntologyItem
            key={item.key}
            index={index}
            ontology={item}
            activateItem={activateItem}
            colorEnabled={colorEnabled}
            sizeEnabled={sizeEnabled}
            descriptionType={descriptionType}
            handleMouseHover={handleMouseHover}
            handleMouseLeave={handleMouseLeave}
            handleEditClick={handleEditClick}
            handleDelete={handleDelete}
            moveOntology={moveOntology}
            dragType={`ONTOLOGY-${type}`}
          />
        ))}
      </DndProvider>
      <Button block type="dashed" onClick={handleAddClick}>
        {formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.editor.add",
        })}
      </Button>
      <OntologyEditModal
        ontology={editItem}
        visible={!!editItem}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        colorEnabled={colorEnabled}
        descriptionEnabled={descriptionEnabled}
        descriptionType={descriptionType}
        sizeEnabled={sizeEnabled}
        limitsEnabled={limitsEnabled}
        validate={validate}
      />
    </>
  );
}

export default forwardRef(OntologyEditor);
