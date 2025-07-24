import React from 'react';
import i18n from '../../locales';
import { Tool } from '../../types';

interface ToolNameProps {
  tool: Tool;
}

const ToolName = ({ tool }: ToolNameProps) => {
  let toolName = '';

  switch (tool) {
    case Tool.RECTANGLE: {
      toolName = i18n.translate('TOOL_RECTANGLE');
      break;
    }
    case Tool.POLYGON: {
      toolName = i18n.translate('TOOL_POLYGON');
      break;
    }
    case Tool.LINE: {
      toolName = i18n.translate('TOOL_LINE');
      break;
    }
    case Tool.DOT: {
      toolName = i18n.translate('TOOL_DOT');
      break;
    }
    default:
  }
  return (
    <span>{toolName}</span>
  );
};

export default ToolName;
