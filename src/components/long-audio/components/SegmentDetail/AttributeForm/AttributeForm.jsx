import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import './AttributeForm.scss';
import { Input, Radio } from 'antd';
import { setLineCategory } from '../../../redux/action';
import { isAnnotationReadonly } from '../../../../../utils/tool-mode';

const AttributeForm = (props) => {
  const { field, value, fieldIndex } = props;

  if (field.type === 'RADIO') {
    return (
      <div className="attribute-form-container">
        <div className="attribute-form-title">{`${field.label}:`}</div>
        <Radio.Group
          value={value}
          buttonStyle="solid"
          className="attribute-form-radio-group"
          onChange={(e) => props.onChange(e)}
          disabled={field.readonly || isAnnotationReadonly(props.toolMode)}
        >
          {field.options.map((option, index) => (
            <Radio.Button
              /* eslint-disable-next-line react/no-array-index-key */
              key={`attribute-form-radio-button-${index}`}
              className="attribute-form-radio-button"
              value={option.value}
            >
              {option.label || option.value}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    );
  } if (field.type === 'TEXTAREA') {
    return (
      <>
        <div className="attribute-form-title">{`${field.label}:`}</div>
        <Input.TextArea
          key={`attribute-form-textarea-${fieldIndex}`}
          className="attribute-form-text"
          value={value}
          autoSize={{ minRows: 1 }}
          onChange={(e) => props.onChange(e)}
          autoComplete="off"
          disabled={field.readonly || isAnnotationReadonly(props.toolMode)}
          onFocus={() => { window.disableLongAudioHotKeys = true; }}
          onBlur={() => { window.disableLongAudioHotKeys = false; }}
          dir={field.isRTL ? 'rtl' : 'ltr'}
        />
      </>
    );
  } if (field.type === 'TEXT') {
    return (
      <>
        <div className="attribute-form-title">{`${field.label}:`}</div>
        <Input
          key={`attribute-form-textarea-${fieldIndex}`}
          className="attribute-form-text"
          value={value}
          onChange={(e) => props.onChange(e)}
          disabled={field.readonly || isAnnotationReadonly(props.toolMode)}
          onFocus={() => { window.disableLongAudioHotKeys = true; }}
          onBlur={() => { window.disableLongAudioHotKeys = false; }}
          dir={field.isRTL ? 'rtl' : 'ltr'}
        />
      </>
    );
  }
  return null;
};

AttributeForm.propTypes = {
  setLineCategory: PropTypes.func,
  onChange: PropTypes.func,
};

const mapStateToProps = (state) => ({
  toolMode: state.toolMode,
});
const mapDispatchToProps = {
  setLineCategory,
};
export default connect(mapStateToProps, mapDispatchToProps)(AttributeForm);
