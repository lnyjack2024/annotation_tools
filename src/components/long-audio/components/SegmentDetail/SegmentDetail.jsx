import React from 'react';
import { connect } from 'react-redux';
import './SegmentDetail.scss';
import EasyForm from '@appen-china/easy-form';
import LineDetail from './LineDetail/LineDetail';
import { pushLine, setLineRole, setSegmentQAState, setSegmentCategory, setSegmentAttributes, setAttributeFocusInfo } from '../../redux/action';
import { formatTimestamp, SegmentMode, translate, triggerForm, attributeType } from '../../constants';
import { isInput } from '../../redux/reducer/segmentController';
import QAForm from './QAForm/QAForm';
import { isReviewEditable, isAnnotationReadonly } from '../../../../utils/tool-mode';

class SegmentDetail extends React.Component {
  constructor(props) {
    super(props);
    this.segmentRef = React.createRef();
    this.isPreventScroll = false;
  }

  handleButtonClick(e, type) {
    const { currentSegment } = this.props;
    let newRole = null;
    switch (type) {
      case 'prev':
        this.props.setCurrentSegment({ index: currentSegment - 1 });
        break;
      case 'next':
        this.props.setCurrentSegment({ index: currentSegment + 1 });
        break;
      case 'push':
        // eslint-disable-next-line no-restricted-syntax
        for (const value of this.allRoles) {
          if (this.currentRoles.indexOf(value) < 0) {
            newRole = value;
            break;
          }
        }
        this.props.pushLine({
          videoIndex: null,
          segmentIndex: currentSegment,
          role: newRole,
        });
        break;
      default:
        break;
    }
  }

  // eslint-disable-next-line react/no-deprecated
  componentWillMount() {
    // eslint-disable-next-line no-undef
    window.addEventListener('keydown', this.handleKeyDown);
    this.ontologyValidKeys = [];
    const { ontology } = this.props;
    ontology.forEach((value, key) => {
      this.ontologyValidKeys.push(key);
    });
  }

  shouldComponentUpdate(nextProps) {
    const { results, segmentConfig, currentVideo, currentSegment, keyAttribute, toolMode, annotateDisabled } = nextProps;
    const nextCurrentValues = results[currentVideo][currentSegment];
    if (
      currentVideo !== this.props.currentVideo ||
      currentSegment !== this.props.currentSegment ||
      !this.config ||
      annotateDisabled !== this.props.annotateDisabled
    ) {
      this.isPreventScroll = true;
      const { fields } = segmentConfig;
      if (keyAttribute.options.length > 0 && !fields.find((v) => v.name === keyAttribute.name)) {
        fields.unshift(keyAttribute);
      }
      const readonly = isAnnotationReadonly(toolMode) || annotateDisabled;
      this.config = {
        ...segmentConfig,
        fields: fields.map((field) => ({
          ...field,
          readonly: readonly || field.readonly,
          optionType: 'button',
          ...nextCurrentValues && nextCurrentValues.attributes && nextCurrentValues.attributes[field.name] !== undefined && {
            defaultValue: nextCurrentValues.attributes[field.name],
          }
        })),
        footerVisible: false,
      };
    } else {
      this.isPreventScroll = false;
    }
    return true;
  }

  componentDidUpdate(prevProps) {
    if (this.segmentRef.current && this.isPreventScroll) {
      let timer = setTimeout(() => {
        clearTimeout(timer);
        timer = null;
        this.segmentRef.current.scrollTop = 0;
      }, 10);
    }
    if (this.props.focusAttribute?.key) {
      this.handleFocusAttribute();
    }
  }

  handleFocusAttribute = () => {
    const { focusAttribute: { videoIndex, segmentIndex, type, lineIndex, key }, currentVideo, currentSegment } = this.props;
    if (videoIndex === currentVideo && segmentIndex === currentSegment && key) {
      const attributeContainer = document.getElementsByClassName(type === attributeType.line ? `line-attributes-${lineIndex}` : 'segment-attributes')[0];
      if (attributeContainer) {
        let timer = setTimeout(() => {
          clearTimeout(timer);
          timer = null;
          const label = attributeContainer.querySelector(`label[for=${key}]`);
          const attribute = attributeContainer?.querySelector(`#${key}`);
          label?.scrollIntoView();
          attribute?.focus();
          document.documentElement.scroll({ top: 0 });
          this.props.setAttributeFocusInfo();
        }, 10);
      }
    }
  };

  handleKeyDown = (e) => {
    if (isInput()) return;
    const { currentSegment, toolMode, annotateDisabled } = this.props;
    if (e.keyCode === 81) { // q
      e.preventDefault();
      this.props.setCurrentSegment({ index: currentSegment - 1 });
    } else if (e.keyCode === 69) { // e
      e.preventDefault();
      this.props.setCurrentSegment({ index: currentSegment + 1 });
    }
    if (e.keyCode >= 48 && e.key <= 57 && !annotateDisabled) {
      const i = parseInt(e.key, 10);
      if (i >= this.ontologyValidKeys.length) return;
      const role = this.ontologyValidKeys[i];
      this.props.setLineRole({
        videoIndex: null,
        segmentIndex: null,
        lineIndex: 0,
        role,
      });
    }
    if (e.keyCode === 13 && e.ctrlKey && isReviewEditable(toolMode)) {
      e.preventDefault();
      this.props.setSegmentQAState({ qaChecked: true });
      this.props.setCurrentSegment({ index: currentSegment + 1 });
    }
  };

  changeSegmentCategory = (data) => {
    const { segmentConfig, results, currentVideo, currentSegment } = this.props;
    const segment = results[currentVideo][currentSegment];
    const attributes = {
      ...segment.attributes,
      ...data,
    };
    const { updatedValues } = triggerForm(segmentConfig, attributes);
    this.props.setSegmentAttributes({
      videoIndex: currentVideo,
      segmentIndex: currentSegment,
      attributes: updatedValues
    });
  };

  render() {
    const { results, ontology, currentVideo, currentSegment, toolMode } = this.props;
    this.segment = results[currentVideo][currentSegment];
    if (!this.segment) {
      return null;
    }
    this.currentRoles = [];
    this.allRoles = [];
    ontology.forEach((value, key) => {
      this.allRoles.push(key);
    });
    this.segment.content.forEach((value) => {
      this.currentRoles.push(value.role);
    });
    const segment = results[currentVideo][currentSegment];
    return (
      <div className="segment-detail-container" ref={this.segmentRef} key={`${currentVideo}_${currentSegment}_${segment.id}`}>
        <div className="segment-detail-head">
          <div className="segment-detail-index">{currentSegment + 1}</div>
          <div className="segment-detail-timestamp">
            {`${formatTimestamp(segment.start)}~${formatTimestamp(segment.end)}`}
          </div>
          <SegmentDetailChangeButton
            className="segment-detail-change"
            content={translate('next')}
            shortcut="E"
            onClick={(e) => this.handleButtonClick(e, 'next')}
            disabled={currentSegment + 1 === results[currentVideo].length}
            type2="next"
          />
          <SegmentDetailChangeButton
            className="segment-detail-change"
            content={translate('prev')}
            shortcut="Q"
            onClick={(e) => this.handleButtonClick(e, 'prev')}
            disabled={currentSegment === 0}
            type2="prev"
          />
        </div>
        <div className="segment-detail-body">
          {isReviewEditable(toolMode) ? <QAForm /> : null}
          <div className="segment-attributes">
            <EasyForm
              theme="dark"
              autoFocus={false}
              {...this.config && this.config}
              onChange={this.changeSegmentCategory}
            />
          </div>
          {segment.content.map((line, index) => (
            <LineDetail
              /* eslint-disable-next-line react/no-array-index-key */
              key={`line-detail-${index}`}
              line={line}
              currentRoles={this.currentRoles}
              lineIndex={index}
            />
          ))}
        </div>
        {(this.props.overlap) && (
          <button
            className="segment-push-line"
            onClick={(e) => this.handleButtonClick(e, 'push')}
            style={{ display: this.currentRoles.length === this.allRoles.length ? 'none' : 'block' }}
            disabled={isAnnotationReadonly(this.props.toolMode) || this.props.annotateDisabled}
          >
            <div className="add-role-icon"> +</div>
            {translate('addRole')}
          </button>
        )}
      </div>
    );
  }
}

const SegmentDetailChangeButton = ((props) => (
  <button
    className="segment-detail-change"
    type="button"
    onClick={(e) => props.onClick(e, props.type2)}
    style={{ display: props.disabled ? 'none' : 'block' }}
  >
    {props.content}
    <span>
      {` {${props.shortcut}} `}
    </span>
  </button>
));

const mapStateToProps = (state) => ({
  results: state.results,
  ontology: state.ontology,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  currentVideo: state.currentVideo,
  currentSegment: state.currentSegment,
  videos: state.videos,
  toolMode: state.toolMode,
  overlap: state.overlap,
  keyAttribute: state.keyAttribute,
  segmentMode: state.segmentMode,
  annotateDisabled: state.annotateDisabled,
  focusAttribute: state.focusAttribute,
  loadReviewEnabled: state.loadReviewEnabled,
});
const mapDispatchToProps = {
  pushLine,
  setLineRole,
  setSegmentQAState,
  setSegmentCategory,
  setAttributeFocusInfo,
  setSegmentAttributes,
};
export default connect(mapStateToProps, mapDispatchToProps)(SegmentDetail);
