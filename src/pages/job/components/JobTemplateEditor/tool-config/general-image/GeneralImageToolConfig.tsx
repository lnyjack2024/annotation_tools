import React, { useState, useEffect, useImperativeHandle, useRef } from "react";
import { useIntl } from "@umijs/max";
import randomColor from "randomcolor";
import { nanoid } from "nanoid";
import OntologyItem from "./OntologyItem";
import OntologyItemEditor from "./OntologyItemEditor";
import type { OntologyItemEditorHandle } from "./OntologyItemEditor";
import OntologyChildEditor from "./OntologyChildEditor";
import type { OntologyChildEditorHandle } from "./OntologyChildEditor";
import { Tool } from "./types";
import type { GeneralImageOntology, GeneralImageOntologyChild } from "./types";
import styles from "./styles.less";

interface GeneralImageToolConfigHandle {
  getData: () => GeneralImageOntology[];
}

interface GeneralImageToolConfigProps {
  ontologies: GeneralImageOntology[];
}

/**
 * general image tool config
 */
const GeneralImageToolConfig = React.forwardRef<
  GeneralImageToolConfigHandle,
  GeneralImageToolConfigProps
>(({ ontologies: defaultOntologies }, ref) => {
  const { formatMessage } = useIntl();
  const [ontologies, setOntologies] = useState<GeneralImageOntology[]>([]);
  const [editType, setEditType] = useState<"ontology" | "child">("ontology");
  const [editItem, setEditItem] = useState<GeneralImageOntology | null>(null);
  const [editChild, setEditChild] = useState<GeneralImageOntologyChild | null>(
    null
  );
  const itemEditor = useRef<OntologyItemEditorHandle>();
  const childEditor = useRef<OntologyChildEditorHandle>();

  useEffect(() => {
    // fix default ontologies
    const list: GeneralImageOntology[] = [];
    if (Array.isArray(defaultOntologies) && defaultOntologies.length > 0) {
      defaultOntologies.forEach((o) => {
        const ontology = { ...o };
        if (!ontology.key) {
          // add key
          ontology.key = nanoid();
        }
        if (ontology.multiple === undefined) {
          // for legacy data, default set to true
          ontology.multiple = true;
        }
        if (ontology.children) {
          const children: GeneralImageOntologyChild[] = [];
          ontology.children.forEach((c) => {
            const child = { ...c };
            if (!child.key) {
              // add key for child
              child.key = nanoid();
            }
            if (!child.display_color) {
              // for legacy data, use ontology display_color for child
              child.display_color = ontology.display_color;
            }
            if (!child.tools && child.type) {
              // legacy data
              const allTools = child.type.split(",").map((tool) => ({
                type: tool,
                edges: child.edges,
              }));
              delete child.type;
              delete child.edges;
              children.push(
                ...allTools.map((tool, k) => ({
                  ...child,
                  key: nanoid(),
                  count: 1,
                  name:
                    allTools.length === 1 || k === 0
                      ? child.name
                      : `${child.name} ${k + 1}`,
                  tools: [tool],
                }))
              );
            } else {
              children.push(child);
            }
          });
          ontology.children = children;
        }
        list.push(ontology);
      });
    }
    setOntologies(list);
    if (list.length > 0) {
      setEditType("ontology");
      setEditItem(list[0]);
      setEditChild(null);
    }
  }, [defaultOntologies]);

  useImperativeHandle(ref, () => ({
    getData: () => ontologies,
  }));

  /**
   * validate new ontology class name
   * @param key
   * @param ontologyClass
   */
  const validateOntologyClass = (key: string, ontologyClass: string) =>
    ontologies.every((o) => o.key === key || o.class_name !== ontologyClass);

  /**
   * validate new ontology child name
   * @param key
   * @param childName
   */
  const validateChildName = (key: string, childName: string) => {
    if (!editItem || !editItem.children) {
      return true;
    }
    return editItem.children.every(
      (o) => o.key === key || o.name !== childName
    );
  };

  /**
   * validate editing status
   */
  const validateEditor = () => {
    if (editType === "ontology" && editItem && itemEditor.current) {
      // ontology item editing
      return itemEditor.current.validate();
    }
    if (editType === "child" && editChild && childEditor.current) {
      // ontology child editing
      return childEditor.current.validate();
    }
    return Promise.resolve(true);
  };

  const selectItem = async (item: GeneralImageOntology, skipCheck = false) => {
    const passed = skipCheck || (await validateEditor());
    if (passed) {
      setEditType("ontology");
      setEditItem(item);
      setEditChild(null);
    }
  };

  const selectChild = async (
    item: GeneralImageOntology,
    child: GeneralImageOntologyChild,
    skipCheck = false
  ) => {
    const passed = skipCheck || (await validateEditor());
    if (passed) {
      setEditType("child");
      setEditItem(item);
      setEditChild(child);
    }
  };

  const addItem = async () => {
    const passed = await validateEditor();
    if (passed) {
      const color = randomColor();
      const newOntologyItem: GeneralImageOntology = {
        key: nanoid(),
        class_name: formatMessage({ id: "tool.general-image.new-ontology" }),
        display_color: color,
        multiple: false,
        children: [
          {
            key: nanoid(),
            name: formatMessage({ id: "tool.general-image.new-child" }),
            count: 1, // set to 1
            display_color: color,
            tools: [{ type: Tool.RECTANGLE }],
          },
        ],
      };
      setOntologies([...ontologies, newOntologyItem]);
      selectItem(newOntologyItem, true);
    }
  };

  const addChild = async (item: GeneralImageOntology) => {
    const passed = await validateEditor();
    if (passed) {
      const newOntologyChild = {
        key: nanoid(),
        name: formatMessage({ id: "tool.general-image.new-child" }),
        display_color: item.display_color, // use item color as default
        tools: [{ type: Tool.RECTANGLE }],
      };
      const newOntologies = [...ontologies];
      const index = newOntologies.findIndex((o) => o.key === item.key);
      if (index >= 0) {
        if (!newOntologies[index].children) {
          newOntologies[index].children = [];
        }
        newOntologies[index].children.push(newOntologyChild);
      }
      setOntologies(newOntologies);
      selectChild(item, newOntologyChild, true);
    }
  };

  const updateItem = (item: GeneralImageOntology) => {
    const newOntologies = [...ontologies];
    const index = newOntologies.findIndex((o) => o.key === item.key);
    if (index >= 0) {
      newOntologies[index] = { ...item };
      // reselect ontology item
      selectItem(newOntologies[index]);
    }
    setOntologies(newOntologies);
  };

  const updateChild = (child: GeneralImageOntologyChild) => {
    const newOntologies = [...ontologies];
    const index = newOntologies.findIndex((o) => o.key === editItem.key);
    if (index >= 0) {
      const childIndex = newOntologies[index].children.findIndex(
        (c) => c.key === child.key
      );
      if (childIndex >= 0) {
        newOntologies[index].children[childIndex] = { ...child };
        // reselect ontology child
        selectChild(editItem, newOntologies[index].children[childIndex]);
      }
    }
    setOntologies(newOntologies);
  };

  const deleteItem = (itemKey: string) => {
    const newOntologies = [...ontologies];
    const index = newOntologies.findIndex((o) => o.key === itemKey);
    if (index >= 0) {
      newOntologies.splice(index, 1);
    }
    setOntologies(newOntologies);
    const nextOntology = newOntologies[Math.max(index, 0)];
    selectItem(nextOntology, true);
  };

  const deleteChild = (childKey: string) => {
    const newOntologies = [...ontologies];
    const index = newOntologies.findIndex((o) => o.key === editItem.key);
    if (index >= 0) {
      const childIndex = newOntologies[index].children.findIndex(
        (c) => c.key === childKey
      );
      if (childIndex >= 0) {
        newOntologies[index].children.splice(childIndex, 1);
      }
    }
    setOntologies(newOntologies);
    selectItem(editItem, true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {ontologies.map((o) => (
          <OntologyItem
            key={o.key}
            ontologyItem={o}
            editType={editType}
            editItem={editItem}
            editChild={editChild}
            onItemSelected={() => selectItem(o)}
            onChildSelected={(child) => selectChild(o, child)}
            onChildAdd={() => addChild(o)}
          />
        ))}
        <div className={styles.add} onClick={addItem}>
          <a>{formatMessage({ id: "tool.general-image.ontology.add" })}</a>
        </div>
      </div>
      <div className={styles.editor}>
        {editType === "ontology" && editItem && (
          <OntologyItemEditor
            ref={itemEditor}
            ontologyItem={editItem}
            onChange={updateItem}
            onDelete={deleteItem}
            validateOntologyClass={validateOntologyClass}
          />
        )}
        {editType === "child" && editChild && (
          <OntologyChildEditor
            ref={childEditor}
            child={editChild}
            onChange={updateChild}
            onDelete={deleteChild}
            validateChildName={validateChildName}
          />
        )}
      </div>
    </div>
  );
});

export default GeneralImageToolConfig;
