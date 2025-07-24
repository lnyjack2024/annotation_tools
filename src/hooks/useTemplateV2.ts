import { useEffect, useReducer, useState } from 'react';

import { TemplateType } from '@/types/template';
import type { ProjectTemplate } from '@/types/v3';
import { getTemplateById } from '@/services/template-v3';

type ActionType = {
  type:
    | 'init'
    | 'setTitle'
    | 'setInstruction'
    | 'setContent'
    | 'setJS'
    | 'setCSS'
    | 'setAttributes'
    | 'setOntology'
    | 'setDataType'
    | 'setVersion'
    | 'setIsSupportedByApp'
    | 'setsupportedLowestIOSVersion'
    | 'setSupportedLowestAndroidVersion';
  payload?: any;
};

function reducer(state: ProjectTemplate, action: ActionType): ProjectTemplate {
  switch (action.type) {
    case 'init':
      return action.payload;
    case 'setContent':
      return {
        ...state,
        content: action.payload,
      };
    case 'setTitle':
      return {
        ...state,
        title: action.payload,
      };
    case 'setInstruction':
      return {
        ...state,
        instruction: action.payload,
      };
    case 'setDataType':
      return {
        ...state,
        dataType: action.payload,
      };
    case 'setCSS':
      return {
        ...state,
        css: action.payload,
      };
    case 'setJS':
      return {
        ...state,
        js: action.payload,
      };
    case 'setAttributes':
      return {
        ...state,
        attributes: action.payload,
      };
    case 'setOntology':
      return {
        ...state,
        ontology: action.payload,
      };
    case 'setVersion':
      return {
        ...state,
        version: action.payload,
      };
    case 'setIsSupportedByApp':
      return {
        ...state,
        isSupportedByApp: action.payload,
      };
    case 'setsupportedLowestIOSVersion':
      return {
        ...state,
        supportedLowestIOSVersion: action.payload,
      };
    case 'setSupportedLowestAndroidVersion':
      return {
        ...state,
        supportedLowestAndroidVersion: action.payload,
      };
    default:
      return state;
  }
}

export default function useTemplateV2({ templateId }: { templateId?: string }) {
  const [state, dispatch] = useReducer(reducer, {
    title: '',
    content: '',
    instruction: '',
    type: TemplateType.CUSTOM,
    js: '',
    css: '',
    attributes: '',
    ontology: '',
    isSupportedByApp: false,
    supportedLowestIOSVersion: '',
    supportedLowestAndroidVersion: '',
  } as ProjectTemplate);

  const [loading, setLoading] = useState(false);

  const fetchTemplate = async (id: string) => {
    setLoading(true);
    const resp = await getTemplateById(id);
    dispatch({ type: 'init', payload: resp.data });
    setLoading(false);
  };

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    }
  }, [templateId]);

  return [state, dispatch, loading] as const;
}
