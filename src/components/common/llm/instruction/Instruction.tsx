import React, { useContext } from 'react';
import ChatContent from '../chat/ChatContent';
import { Content } from '../types';
import LocaleContext from '../locales/context';
import translate from '../locales';
import './Instruction.scss';

interface InstructionProps {
  value: Content;
}
const Instruction = ({ value }: InstructionProps) => {
  const locale = useContext(LocaleContext);
  if (value.length < 1) {
    return null;
  }
  return (
    <div className="llm-instruction">
      <div className="llm-instruction-title">{translate(locale, 'INSTRUCTION_LABEL')}</div>
      <ChatContent content={value} />
    </div>
  );
};
export default Instruction;
