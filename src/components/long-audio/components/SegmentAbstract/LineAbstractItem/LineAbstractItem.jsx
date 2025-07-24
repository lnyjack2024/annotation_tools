import React, { useState } from 'react';
import { Input, message } from 'antd';
import { connect } from 'react-redux';
import hexToRgba from 'hex-to-rgba';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { setLineText, setAttributeFocusInfo } from '../../../redux/action';
import './LineAbstractItem.scss';
import { defaultColor, attributeType } from '../../../constants';
import { wordCount, copyTextToClipboard } from '../../../../../utils';
import { getFieldDisplayLabel } from '../../../../../utils/form';
import i18n from '../../../locales';

const LineAbstractItem = ((props) => {
  const [isCopied, setIsCopied] = useState(false);

  const color = props.ontology.get(props.line.role)
    ? hexToRgba(props.ontology.get(props.line.role), defaultColor.defaultAlpha)
    : 'transparent';
  const validConfig = props.lineConfig.fields.map((value) => value.name) || [];
  const efOntologyVisible = props.lineConfig.fields.find((v) => v.name === 'ef-ontology')?.visible;

  const handleChangeInput = ((e) => {
    props.setLineText({
      videoIndex: null,
      segmentIndex: props.segmentIndex,
      lineIndex: props.lineIndex,
      text: e.target.value,
    });
  });

  const handleInputClick = (e) => {
    e.stopPropagation();
    props.setCurrentSegment({ index: props.segmentIndex });
    e.target.focus();
  };

  const handleAttributeClick = (e, key) => {
    e.stopPropagation();
    props.setCurrentSegment({ index: props.segmentIndex });
    props.setAttributeFocusInfo({
      segmentIndex: props.segmentIndex,
      type: attributeType.line,
      lineIndex: props.lineIndex,
      key,
    });
  };

  const handleCopyClick = async (e) => {
    e.stopPropagation();
    try {
      await copyTextToClipboard(props.line.text || '');
      message.success(i18n.translate('SEGMENT_COPY_SUCESS'));
      setIsCopied(true);
      const timer = setTimeout(() => {
        clearTimeout(timer);
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      message.success(i18n.translate('SEGMENT_COPY_ERROR'));
    }
  };

  return (
    // eslint-disable-next-line react/jsx-filename-extension
    <div
      className="line-abstract-item-container segment-abstract-row"
      style={{ borderLeft: `6px solid ${color}` }}
    >
      { props.client === 'hw-translation' ? (
        <>
          <Input.TextArea
            className="line-abstract-item-text-input-hw"
            value={props.line.text}
            onClick={(e) => handleInputClick(e)}
            disabled
            autoComplete="off"
            autoSize={{ minRows: 1 }}
          />
        </>
      ) : (
        <>
          <div className="line-abstract-item-head">
            {props.existRole && (
              <LineAbstractRoleTag
                color={color}
                role={props.line.role}
                handleClick={(e) => { handleAttributeClick(e, 'role'); }}
              />
            )}
            {Object.keys(props.line.attributes)
              .filter((k) => (k === 'ef-ontology' && efOntologyVisible !== false) || k !== 'ef-ontology')
              .map((key, index) => (
                (validConfig.indexOf(key) >= 0 &&
                  props.line.attributes[key] !== undefined &&
                  props.line.attributes[key] !== ''
                )
                  ? (
                    <div
                      className="line-abstract-item-category"
                    // eslint-disable-next-line react/no-array-index-key
                      key={`line-abstract-item-category${index}`}
                      onClick={(e) => { handleAttributeClick(e, key); }}
                    >
                      {getFieldDisplayLabel(props.line.attributes[key], props.lineFieldMap[key]) || ' - '}
                    </div>
                  ) : null
              ))}
          </div>
          <div className="line-abstract-item-text">
            <div className="line-abstract-item-text-cnt">
              <div>{wordCount(props.line.text)}</div>
              <div>
                (
                {props.line.text.length}
                )
              </div>
            </div>
            <Input
              className="line-abstract-item-text-input"
              value={props.line.text}
              onChange={(e) => handleChangeInput(e)}
              onClick={(e) => handleInputClick(e)}
              disabled
              autoComplete="off"
              onFocus={() => { window.disableLongAudioHotKeys = true; }}
              onBlur={() => { window.disableLongAudioHotKeys = false; }}
            />
          </div>
        </>
      )}
      <div className="segment-abstract-copy" onClick={handleCopyClick}>
        {isCopied ? <CheckOutlined /> : <CopyOutlined />}
      </div>
    </div>
  );
});

const LineAbstractRoleTag = ((props) => (
  <div className="line-abstract-item-role" onClick={props.handleClick}>
    <div
      className="line-abstract-item-role-color"
      style={{ backgroundColor: props.color }}
    />
    {props.role}
  </div>
));

const mapStateToProps = (state) => ({
  ontology: state.ontology,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  currentSegment: state.currentSegment,
  toolMode: state.toolMode,
  client: state.client,
  lineFieldMap: state.lineFieldMap,
});
const mapDispatchToProps = {
  setLineText,
  setAttributeFocusInfo,
};
export default connect(mapStateToProps, mapDispatchToProps)(LineAbstractItem);
