import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import EasyForm, { utils as formUtils } from '@appen-china/easy-form';
import { FieldControlType } from '@appen-china/easy-form/es/types';
import { translate, validateForm } from '../../constants';
import * as actions from '../../redux/action';
import { isEasyformSelectDropdown } from '../../../../utils';
import { getFieldDisplayLabel } from '../../../../utils/form';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';
import './GlobalAttributes.scss';

class GlobalAttributes extends React.Component {
  container = React.createRef();

  state = {
    editing: true,
    fieldsMap: {},
  };

  get readonly() {
    return isAnnotationReadonly(this.props.toolMode);
  }

  componentDidMount() {
    window.addEventListener('mousedown', this.handleClick);
    this.setState({ editing: !this.readonly });
    this.updateFiledsMap();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentVideo !== this.props.currentVideo) {
      this.setState({ editing: !this.readonly });
    }
    if (!isEqual(prevProps.globalConfig, this.props.globalConfig)) {
      this.updateFiledsMap();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.handleClick);
  }

  updateFiledsMap() {
    const { fields = [] } = this.props.globalConfig || {};
    const map = {};
    fields.forEach((field) => {
      const { name, label, type, valueType, options = [] } = field;
      const newField = { name, type, label };
      if (type === FieldControlType.RADIO || type === FieldControlType.SELECT || type === FieldControlType.CHECKBOX || type === FieldControlType.CASCADER) {
        // has options
        newField.options = formUtils.parseOptions(options, valueType);
      }
      map[name] = newField;
    });
    this.setState({ fieldsMap: map });
  }

  handleClick = (e) => {
    if (isEasyformSelectDropdown(e.target)) {
      e.stopPropagation();
      return;
    }
    const video = this.props.videos[this.props.currentVideo];
    if (!this.readonly && this.container.current && video) {
      if (this.container.current.contains(e.target)) {
        if (!this.state.editing) {
          video.attributes = { ...video.defaultAttributes, ...video.originAttributes, ...video.attributes };
          this.setState({ editing: true });
        }
      } else if (this.state.editing) {
        const isValid = validateForm(this.props.globalConfig, video.attributes);
        // collapse
        if (isValid) {
          this.setState({ editing: false });
        }
      }
    }
  };

  handleChange = (value) => {
    this.props.setVideoAttributes({ index: this.props.currentVideo, attributes: value });
  };

  renderAttrs(attributes) {
    const allValues = [];
    Object.keys(attributes).forEach((fieldName) => {
      const field = this.state.fieldsMap[fieldName];
      const fieldValue = attributes[fieldName];
      if (fieldValue !== undefined && fieldValue !== '') {
        if (field?.options) {
          const displayValue = getFieldDisplayLabel(fieldValue, field);
          allValues.push(displayValue);
        } else {
          allValues.push(fieldValue.toString());
        }
      }
    });
    return allValues.join('; ');
  }

  render() {
    const { videos, currentVideo, globalConfig } = this.props;

    if (!globalConfig || !globalConfig.fields || globalConfig.fields.length === 0) {
      // no global config
      return null;
    }

    const video = videos[currentVideo];
    if (!video || !video.ready) {
      // no video, or video not ready
      return null;
    }

    const { attributes = {} } = video;
    const fields = globalConfig.fields.map((f) => ({
      ...f,
      ...attributes[f.name] !== undefined && {
        defaultValue: attributes[f.name],
      },
    }));

    return (
      <div ref={this.container} className="global-attributes-container">
        <div className="header">
          {translate('GLOBAL_ATTR_TITLE')}
        </div>
        <div className="content">
          {this.state.editing ? (
            <>
              <div style={{ color: '#FFFFFF' }}>{translate('GLOBAL_ATTR_SUBTITLE')}</div>
              <EasyForm
                theme="dark"
                autoFocus={false}
                fields={fields}
                conditions={globalConfig.conditions}
                effects={globalConfig.effects}
                rules={globalConfig.rules}
                onChange={this.handleChange}
              />
            </>
          ) : this.renderAttrs(attributes)}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  toolMode: state.toolMode,
  videos: state.videos,
  currentVideo: state.currentVideo,
  globalConfig: state.globalConfig,
});
const mapDispatchToProps = {
  setVideoAttributes: actions.setVideoAttributes,
};
export default connect(mapStateToProps, mapDispatchToProps)(GlobalAttributes);
