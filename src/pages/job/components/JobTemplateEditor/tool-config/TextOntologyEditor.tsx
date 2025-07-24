import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "antd";
import { useIntl } from "@umijs/max";
import randomColor from "randomcolor";
import { cloneDeep } from "lodash";
import TextOntologyItem from "./TextOntologyItem";
import Nestable from "../../../../../components/Nestable/Nestable";
import styles from "./TextOntologyEditor.less";

export type TextOntology = {
  id?: string;
  text: string;
  displayName?: string;
  desc?: string;
  color?: string;
  isEditting?: boolean;
  isAddingItem?: boolean;
  children?: TextOntology[];
};
type Props = {
  type: string;
  ontologies: TextOntology[];
  options?: {
    colorEnabled?: boolean;
    descriptionEnabled?: boolean;
    descriptionType?: "text" | "richtext";
    sizeEnabled?: boolean;
    limitsEnabled?: boolean;
    translationRequiredEnabled?: boolean;
    maxDepth?: number;
  };
};

function TextOntologyEditor(
  { ontologies: defaultOntologies = [], options }: Props,
  ref: any
) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [edittingKey, setEdittingKey] = useState<string>("");
  const [ontologies, setOntologies] = useState<TextOntology[]>(
    defaultOntologies || []
  );
  const colorEnabled =
    options?.colorEnabled === undefined || options?.colorEnabled; // default is true
  const maxDepth = options?.maxDepth || null;

  useEffect(() => {
    let list: TextOntology[] = [];
    if (Array.isArray(defaultOntologies) && defaultOntologies.length > 0) {
      list = defaultOntologies.map((o, i) => {
        if (o.id) {
          return o;
        }
        // if id is missing, give an id to the ontology item by default
        // ensure id in unique
        return { ...o, id: `${+new Date()}-${i}` };
      });

      setOntologies(list);
    }
  }, [defaultOntologies]);

  useImperativeHandle(ref, () => ({
    getData: () => [...ontologies],
  }));

  const updateOntologies = (
    curOntologies: TextOntology[],
    generateType: "delete" | "replace",
    curOntology?: TextOntology,
    ontologyKey?: string
  ) => {
    const tempOntologies = [...curOntologies];
    const curOntologyKey = ontologyKey || curOntology.id;
    for (let index = 0; index < tempOntologies.length; index++) {
      const element = tempOntologies[index];
      if (element.id === curOntologyKey) {
        switch (generateType) {
          case "delete":
            tempOntologies.splice(index, 1);
            break;

          case "replace":
            tempOntologies[index] = cloneDeep(curOntology);
            break;
        }
        break;
      }
      if (element.children && element.children.length > 0) {
        const { newOntologies } = updateOntologies(
          element.children,
          generateType,
          curOntology,
          ontologyKey
        );
        tempOntologies[index].children = [...newOntologies];
      }
    }

    return {
      newOntologies: [...tempOntologies],
      newKey: curOntologyKey,
    };
  };

  const generateNewOntologies = (
    curOntology: TextOntology,
    curOntologies: TextOntology[],
    parentKey?: TextOntology["id"]
  ) => {
    let tempOntologies = [...curOntologies];
    if (parentKey) {
      for (let index = 0; index < tempOntologies.length; index++) {
        const element = tempOntologies[index];
        if (element.id === parentKey) {
          if (tempOntologies[index].children) {
            tempOntologies[index].children.push(curOntology);
          } else {
            tempOntologies[index].children = [curOntology];
          }
          break;
        }
        if (element.children && element.children.length > 0) {
          const { newOntologies } = generateNewOntologies(
            curOntology,
            element.children,
            parentKey
          );
          tempOntologies[index].children = [...newOntologies];
        }
      }
    } else {
      tempOntologies = [...curOntologies, curOntology];
    }
    return {
      newOntologies: [...tempOntologies],
      newKey: curOntology.id,
    };
  };

  // updated item
  const handleEditClick = (ontology: TextOntology) => {
    delete ontology.isAddingItem;
    const { newOntologies } = updateOntologies(ontologies, "replace", ontology);
    setOntologies([...newOntologies]);
    setEdittingKey("");
  };

  const handleDelete = (itemKey: string = "") => {
    const { newOntologies } = updateOntologies(
      ontologies,
      "delete",
      null,
      itemKey
    );
    setOntologies([...newOntologies]);
  };

  const handleAdd = (parentKey?: TextOntology["id"]) => {
    const uniqueKey = `${+new Date()}`;
    const emptyOntology: TextOntology = {
      text: "",
      color: randomColor() || "",
      displayName: "",
      id: uniqueKey,
      isAddingItem: true,
    };
    const { newOntologies, newKey } = generateNewOntologies(
      emptyOntology,
      ontologies,
      parentKey
    );
    setOntologies([...newOntologies]);
    setEdittingKey(newKey);
  };

  // click add first level item button
  const handleAddClick = () => {
    if (edittingKey) {
      return;
    }
    handleAdd();
  };

  const validate = (ontology: TextOntology) => {
    let flag = true;
    const loop = (ontologiesArr: TextOntology[]) => {
      for (let index = 0; index < ontologiesArr.length; index++) {
        const ontologyElement = ontologiesArr[index];
        if (
          ontologyElement.text === ontology.text &&
          ontologyElement.id !== ontology.id
        ) {
          flag = false;
          break;
        }
        if (ontologyElement.children && ontologyElement.children.length) {
          loop(ontologyElement.children);
        }
      }
    };
    loop(ontologies);
    return flag;
  };

  const handleOntologiesChange = (arg: {
    items?: TextOntology[];
    dragItem?: TextOntology;
    targetPath?: number[];
  }) => {
    const { items } = arg;
    setOntologies([...items]);
  };
  const renderItem = ({
    item,
    depth,
  }: {
    collapseIcon: React.ReactNode;
    depth: number;
    handler: React.ReactNode;
    index: number;
    item: any;
  }): React.ReactNode => {
    return (
      <TextOntologyItem
        maxDepth={maxDepth}
        depth={depth}
        key={item.id}
        ontology={item}
        isEditting={edittingKey === item.id}
        colorEnabled={colorEnabled}
        updateEdittingKey={(id: string) => setEdittingKey(id)}
        handleEditClick={handleEditClick}
        handleDelete={handleDelete}
        handleAddItem={(parentKey: TextOntology["id"]) => handleAdd(parentKey)}
        validate={validate}
      />
    );
  };
  return (
    <>
      <div className={styles["ontology-text-wrapper"]}>
        <Nestable
          maxDepth={maxDepth}
          items={ontologies}
          renderItem={renderItem}
          onChange={handleOntologiesChange}
          handler={edittingKey ? <span /> : null}
        />
      </div>
      <Button
        block
        type="dashed"
        onClick={handleAddClick}
        style={{
          cursor: edittingKey ? "not-allowed" : "pointer",
          marginTop: 4,
          marginBottom: 40,
        }}
      >
        {formatMessage({
          id: "labeling-job-create.wizard.configuration.ontology.editor.first-level.add",
        })}
      </Button>
    </>
  );
}

export default forwardRef(TextOntologyEditor);
