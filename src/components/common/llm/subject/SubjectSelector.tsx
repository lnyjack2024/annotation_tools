import React, { useContext } from 'react';
import { Select } from 'antd';
import './SubjectSelector.scss';
import LocaleContext from '../locales/context';
import translate from '../locales';

interface SubjectSelectorProps {
  disabled?: boolean;
  title?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  disabled,
  title,
  options,
  value,
  onChange,
}) => {
  const locale = useContext(LocaleContext);

  if ((disabled && options.length > 0) || (options.length === 0 && value)) {
    return (
      <div className="llm-subject">
        <div className="llm-subject-title">
          {title || translate(locale, 'SUBJECT_LABEL')}
        </div>
        <div>{value}</div>
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="llm-subject">
      <div className="llm-subject-title">
        {title || translate(locale, 'SUBJECT_LABEL')}
      </div>
      <Select
        className="llm-subject-selector"
        placeholder={translate(locale, 'SUBJECT_PLACEHOLDER')}
        value={value}
        onChange={onChange}
      >
        {options.map((o) => (
          <Select.Option key={o} value={o}>
            {o}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default SubjectSelector;
