import type { MouseEvent } from "react";
import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Button, Modal } from "antd";
import { useIntl } from "@umijs/max";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import LandmarkOntologyItem from "./LandmarkOntologyItem";
import OntologyEditModal from "./OntologyEditModal";
import type { Category } from "./LandmarkToolConfigModal";
import FormAttribute from "@/pages/job/components/JobTemplateEditor/components/FormAttribute";
import LandmarkToolConfigModal, {
  LandmarkEditType,
} from "./LandmarkToolConfigModal";

export interface Line {
  points: [number | string, number | string];
  color: string;
}
export interface OntologyChild {
  key: string;
  name: string;
  display_name?: string;
  count?: number;
  type?: LandmarkEditType;
  categories?: Category[] | null;
  reference?: string | null;
  lines?: Line[];
  label_config?: string;
  point_label_config?: string;
}

export enum AttrType {
  GROUP = "group",
  POINT = "point",
}

export interface Ontology {
  key?: string;
  class_name: string;
  display_name?: string;
  display_color?: string;
  description?: string;
  children?: OntologyChild[];
}

type Props = {
  type: string;
  ontologies: Ontology[] | Category[];
  options?: {
    colorEnabled?: boolean;
    descriptionEnabled?: boolean;
    descriptionType?: "text" | "richtext";
    sizeEnabled?: boolean;
    limitsEnabled?: boolean;
  };
};

function LandmarkToolConfig(
  { type, ontologies: defaultOntologies = [], options }: Props,
  ref: any
) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [activateItem, setActivateItem] = useState("");
  const [editItem, setEditItem] = useState<Ontology | null>(null);
  const [editGroup, setEditGroup] = useState<OntologyChild | null>(null);
  const [ontologyEditVisible, setOntologyEditVisible] = useState(false);
  const [landmarkEditVisible, setGroupEditVisible] = useState(false);

  const [formEditing, setFormEditing] = useState(false);
  const [editGroupFormKey, setEditGroupFormKey] = useState<{
    className: string;
    groupKey: string;
    editType: AttrType;
  } | null>();
  const [editGroupForm, setEditGroupForm] = useState("");

  const colorEnabled =
    options?.colorEnabled === undefined || options?.colorEnabled; // default is true
  const descriptionEnabled =
    options?.descriptionEnabled === undefined || options?.descriptionEnabled; // default is true
  const descriptionType =
    options?.descriptionType === "richtext" ? "richtext" : "text";
  const sizeEnabled = options?.sizeEnabled === true; // default is false
  const limitsEnabled = options?.limitsEnabled === true;

  useEffect(() => {
    if (Array.isArray(defaultOntologies) && defaultOntologies.length > 0) {
      let list: Ontology[] = [];
      if ((defaultOntologies[0] as Category).range) {
        list = [
          {
            class_name: "Ontology",
            display_name: "Ontology",
            key: `${+new Date()}-${0}`,
            children: [
              {
                name: "default",
                display_name: "default",
                key: `${+new Date()}-0-0`,
                count: (defaultOntologies as Category[]).reduce(
                  (total: number, category: Category) =>
                    total + (category.range[1] - category.range[0] + 1),
                  0
                ),
                type: LandmarkEditType.KEYPOINT,
                categories: defaultOntologies as Category[],
                reference: "",
              },
            ],
          },
        ];
      } else {
        list = (defaultOntologies as Ontology[]).map((o, i) => {
          return {
            ...o,
            key: o.key || `${+new Date()}-${i}`,
            children:
              o.children &&
              o.children.map((child, n) => ({
                ...child,
                name: child.name || (child as any).group_name || "default",
                type:
                  (child.type as string) === "point"
                    ? LandmarkEditType.KEYPOINT
                    : child.type,
                key: child.key || `${+new Date()}-${i}-${n}`,
              })),
          };
        });
      }
      setOntologies(list);
    }
  }, [defaultOntologies]);

  const updateOntology = (
    groupInfo: { className: string; groupKey: string; editType: AttrType },
    config: string
  ) => {
    const { className, groupKey, editType } = groupInfo;
    const newOntologies = [...ontologies];
    const editOntology = newOntologies.find((v) => v.class_name === className);
    const newGroup =
      editOntology && editOntology.children.find((v) => v.key === groupKey);
    if (newGroup) {
      if (editType === AttrType.GROUP) {
        newGroup.label_config = config;
      } else if (editType === AttrType.POINT) {
        newGroup.point_label_config = config;
      }
      setOntologies(newOntologies);
    }
  };

  useImperativeHandle(ref, () => ({
    updateOntology,
    // expose default getData function
    getData: () => {
      if (ontologies.find((v) => !v.children || v.children.length === 0)) {
        const error = formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.group.required",
        });
        throw new Error(error);
      }
      return ontologies;
    },
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

  const handleMouseHover = (itemKey: Ontology["key"]) => {
    setActivateItem(itemKey);
  };

  const handleMouseLeave = () => {
    setActivateItem("");
  };

  const handleDelete = (itemKey: Ontology["key"]) => {
    const newOntologies = ontologies.filter((item) => item.key !== itemKey);
    setOntologies(newOntologies);
  };

  const handleEditClick = (ontology: Ontology) => {
    setEditItem(ontology);
    setOntologyEditVisible(true);
  };

  const handleAddClick = (e: MouseEvent) => {
    e.preventDefault();
    setEditItem({
      class_name: "",
      display_color: "",
      description: "",
      children: [],
    });
    setOntologyEditVisible(true);
  };

  const handleModalOk = (values: Ontology) => {
    let newOntologies: Ontology[];
    if (values.key) {
      // update
      newOntologies = ontologies.map((item) => {
        if (item.key === values.key) {
          return {
            ...item,
            ...values,
          };
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
          children: [],
        },
      ];
    }
    setOntologies(newOntologies);
    setEditItem(null);
    setOntologyEditVisible(false);
  };

  const handleModalCancel = () => {
    setEditItem(null);
    setOntologyEditVisible(false);
  };

  const validate = (ontology: Ontology) => {
    return ontologies.every(
      (o) => o.key === ontology.key || o.class_name !== ontology.class_name
    );
  };

  const handleLandmarkGroup = (
    itemKey: Ontology["key"],
    childItemKey: OntologyChild["key"]
  ) => {
    const ontologyItem = ontologies.find((v) => v.key === itemKey);
    let item = {
      key: `${+new Date()}`,
      name: "",
    };
    if (childItemKey && ontologyItem) {
      item = ontologyItem.children.find((v) => v.key === childItemKey);
    }
    setEditGroup(item);
    setEditItem(ontologyItem);
    setGroupEditVisible(true);
  };

  const handleLandmarkModalCancel = () => {
    setEditGroup(null);
    setEditItem(null);
    setGroupEditVisible(false);
  };

  const handleLandmarkModalOk = (
    childItem: OntologyChild,
    itemKey: Ontology["key"]
  ) => {
    const newChildItem = { ...childItem };
    if (newChildItem.type === LandmarkEditType.KEYPOINT) {
      newChildItem.count = newChildItem.categories.reduce(
        (total: number, category: Category) =>
          total + (category.range[1] - category.range[0] + 1),
        0
      );
    }
    const newOntologies: Ontology[] = [...ontologies];
    const index = newOntologies.findIndex((v) => v.key === itemKey);
    const childIndex = newOntologies[index].children
      ? newOntologies[index].children.findIndex(
          (child) => child.key === newChildItem.key
        )
      : -1;
    if (childIndex >= 0) {
      newOntologies[index].children[childIndex] = newChildItem;
    } else {
      newOntologies[index].children = newOntologies[index].children
        ? [...newOntologies[index].children, newChildItem]
        : [newChildItem];
    }
    setOntologies(newOntologies);
    handleLandmarkModalCancel();
  };

  const handleGroupDelete = (
    itemKey: Ontology["key"],
    itemChildKey: OntologyChild["key"]
  ) => {
    const newOntologies: Ontology[] = [...ontologies];
    const index = newOntologies.findIndex((v) => v.key === itemKey);
    if (index >= 0) {
      newOntologies[index].children = newOntologies[index].children.filter(
        (item: OntologyChild) => item.key !== itemChildKey
      );
    }
  };

  const handleFormCancel = () => {
    setFormEditing(false);
    setEditGroupFormKey(null);
    setEditGroupForm("");
  };

  const handleFormEdit = (
    className: string,
    groupKey: string,
    editType: AttrType,
    defaultAttribute: string = ""
  ) => {
    setEditGroupFormKey({
      className,
      groupKey,
      editType,
    });
    setEditGroupForm(defaultAttribute);
    setFormEditing(true);
  };

  const handleFormSave = (formConfig?: string) => {
    if (formConfig) {
      updateOntology(editGroupFormKey, formConfig);
      handleFormCancel();
    }
  };

  return (
    <>
      <DndProvider backend={HTML5Backend} context={window}>
        {ontologies.map((item, index) => (
          <LandmarkOntologyItem
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
            handleLandmarkGroup={handleLandmarkGroup}
            handleDelete={handleDelete}
            moveOntology={moveOntology}
            handleGroupDelete={handleGroupDelete}
            onFormEdit={handleFormEdit}
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
        visible={ontologyEditVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        colorEnabled={colorEnabled}
        descriptionEnabled={descriptionEnabled}
        descriptionType={descriptionType}
        sizeEnabled={sizeEnabled}
        limitsEnabled={limitsEnabled}
        validate={validate}
      />
      <LandmarkToolConfigModal
        editItem={editItem}
        editGroup={editGroup}
        visible={landmarkEditVisible}
        onOk={handleLandmarkModalOk}
        onCancel={handleLandmarkModalCancel}
      />
      <Modal
        destroyOnClose
        width={960}
        bodyStyle={{ padding: "45px 8px 8px" }}
        visible={formEditing}
        footer={null}
        onCancel={handleFormCancel}
      >
        <FormAttribute
          config={editGroupForm}
          ontologySyncDisabled={false}
          defaultOntology={ontologies}
          onSave={handleFormSave}
        />
      </Modal>
    </>
  );
}

export default forwardRef(LandmarkToolConfig);
