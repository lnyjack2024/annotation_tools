import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import './LineDetail.scss';
import EasyForm from '@appen-china/easy-form';
import LineRoleRadio from '../LineRoleRadio/LineRoleRadio';
import LineText from '../LineText/LineText';
import { deleteLine, setLineCategory, setLineAttributes, toppingLine, setLineRole } from '../../../redux/action';
import { triggerForm } from '../../../constants';
import { isAnnotationReadonly } from '../../../../../utils/tool-mode';
import DeleteIcon from '../../common/Icons/DeleteIcon';

const LineDetail = (props) => {
  const { line, lineIndex, lineConfig, currentRoles, toolMode, currentVideo, currentSegment, annotateDisabled } = props;
  const handleButtonClick = (e, type) => {
    switch (type) {
      case 'delete':
        props.deleteLine({
          videoIndex: null,
          segmentIndex: currentSegment,
          lineIndex,
          role: line.role,
        });
        break;
      case 'topping':
        props.toppingLine({
          videoIndex: null,
          segmentIndex: currentSegment,
          lineIndex,
        });
        break;
      default:
        break;
    }
  };
  const [lineFormConfig, setLineFormConfig] = useState({});
  const [hasEfOntology, setHasEfOntology] = useState(false);

  useEffect(() => {
    const { fields } = lineConfig;
    const efOntology = fields.find((f) => f.name === 'ef-ontology');
    setHasEfOntology(!!efOntology);
  }, [lineConfig]);

  useEffect(() => {
    const readonly = isAnnotationReadonly(toolMode) || annotateDisabled;
    const fields = lineConfig.fields.map((v) => ({
      ...v,
      readonly: readonly || v.readonly,
      defaultValue: (v.name === 'role' || v.name === 'ef-ontology') ? line.role : line.attributes[v.name],
      optionType: v.type === 'RADIO' ? 'button' : 'default',
    }));
    setLineFormConfig({
      ...lineConfig,
      fields,
      footerVisible: false,
    });
    changeEfOntology(line.role);
  }, [currentSegment, annotateDisabled, line.role]);

  const changeEfOntology = (role) => {
    if (role !== line.attributes?.['ef-ontology'] && hasEfOntology) {
      const { updatedValues } = triggerForm(lineFormConfig, { ...line.attributes, 'ef-ontology': role });
      props.setLineAttributes({
        videoIndex: currentVideo,
        segmentIndex: currentSegment,
        lineIndex,
        attributes: updatedValues
      });
    }
  };

  const changeLineCategory = (data) => {
    const attributes = {
      ...line.attributes,
      ...data,
    };
    const { updatedValues } = triggerForm(lineFormConfig, attributes);
    const { role, ...values } = updatedValues;

    props.setLineAttributes({
      videoIndex: currentVideo,
      segmentIndex: currentSegment,
      lineIndex,
      attributes: values
    });

    if (role !== undefined) {
      props.setLineRole({
        lineIndex,
        role,
      });
    }
  };

  return (
    <div className={`line-detail-container line-attributes-${lineIndex}`}>
      <button
        className="line-detail-button"
        style={{ display: lineIndex === 0 ? 'none' : 'block' }}
        onClick={(e) => handleButtonClick(e, 'delete')}
        disabled={annotateDisabled}
      >
        <DeleteIcon />
      </button>
      {/* <button
        className="line-detail-button"
        style={{ display: lineIndex === 0 ? 'none' : 'block' }}
        onClick={e => handleButtonClick(e, 'topping')}
      >
        topping
      </button> */}
      <LineRoleRadio
        role={line.role}
        index={lineIndex}
        currentRoles={currentRoles}
      />
      <LineText
        text={line.text}
        lineIndex={lineIndex}
      />
      <EasyForm
        theme="dark"
        autoFocus={false}
        {...lineFormConfig && lineFormConfig}
        onChange={changeLineCategory}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  ontology: state.ontology,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  currentSegment: state.currentSegment,
  toolMode: state.toolMode,
  results: state.results,
  currentVideo: state.currentVideo,
  annotateDisabled: state.annotateDisabled,
});
const mapDispatchToProps = {
  deleteLine,
  toppingLine,
  setLineCategory,
  setLineAttributes,
  setLineRole,
};
export default connect(mapStateToProps, mapDispatchToProps)(LineDetail);
