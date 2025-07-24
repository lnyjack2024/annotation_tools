import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import { useIntl } from "@umijs/max";
import { TemplateType } from "@/types/template";
import type { TextOntology } from "./TextOntologyEditor";
import TextOntologyEditor from "./TextOntologyEditor";

export interface Category {
  key?: string | number;
  id: string | number;
  text: string;
  displayName?: string;
  color?: string;
  children?: TextOntology[];
}

interface TextToolConfigProps {
  config: {
    labelCategories: Category[];
    connectionCategories: Category[];
    insertionCategories: Category[];
  };
}

const titleStyle = {
  color: "#42526E",
  fontSize: 16,
  marginBottom: 16,
};

export default forwardRef(
  ({ config: initialConfig }: TextToolConfigProps, ref: any) => {
    const intl = useIntl();
    const { formatMessage } = intl;
    const labelRef = useRef<any>();
    const connectionRef = useRef<any>();
    const insertionRef = useRef<any>();
    const [initLabels, setLabels] = useState([]);
    const [initConnections, setConnections] = useState([]);
    const [initInsertions, setInsertions] = useState([]);

    const toOntology = (items: Category[]) =>
      items.map(
        (item) =>
          ({
            id: item.id || item.key,
            ...item,
          } as TextOntology)
      );

    useEffect(() => {
      if (initialConfig) {
        const {
          labelCategories = [],
          connectionCategories = [],
          insertionCategories = [],
        } = initialConfig || {};
        setLabels(toOntology(labelCategories));
        setConnections(toOntology(connectionCategories));
        setInsertions(toOntology(insertionCategories));
      }
    }, [initialConfig]);

    useImperativeHandle(ref, () => ({
      // expose default getData function
      getData: () => {
        const labels = labelRef.current.getData();
        const connections = connectionRef.current.getData();
        const insertions = insertionRef.current.getData();

        return {
          labelCategories: labels,
          connectionCategories: connections,
          insertionCategories: insertions,
        };
      },
    }));

    return (
      <>
        <div style={titleStyle}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.text-annotation.labels",
          })}
        </div>
        <TextOntologyEditor
          ref={labelRef}
          type={`${TemplateType.TEXT}-labels`}
          ontologies={initLabels}
          options={{ descriptionEnabled: false, maxDepth: 5 }}
        />
        <div style={titleStyle}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.text-annotation.connections",
          })}
        </div>
        <TextOntologyEditor
          ref={connectionRef}
          type={`${TemplateType.TEXT}-connections`}
          ontologies={initConnections}
          options={{ descriptionEnabled: false, maxDepth: 5 }}
        />
        <div style={titleStyle}>
          {formatMessage({
            id: "labeling-job-create.wizard.configuration.ontology.text-annotation.insertions",
          })}
        </div>
        <TextOntologyEditor
          ref={insertionRef}
          type={`${TemplateType.TEXT}-insertions`}
          ontologies={initInsertions}
          options={{ descriptionEnabled: false, maxDepth: 5 }}
        />
      </>
    );
  }
);
