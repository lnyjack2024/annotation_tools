import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import hexToRgba from 'hex-to-rgba';
import { Input, Popover } from 'antd';
import { isEqual } from 'lodash';
import LineAbstractItem from '../LineAbstractItem/LineAbstractItem';
import { defaultColor, formatTimestamp, translate, attributeType } from '../../../constants';
import QAAcceptIcon from '../../common/Icons/QAAcceptIcon';
import QARejectIcon from '../../common/Icons/QARejectIcon';
import { isRework, isQA } from '../../../../../utils/tool-mode';
import { setAttributeFocusInfo } from '../../../redux/action';
import { getFieldDisplayLabel } from '../../../../../utils/form';
import './SegmentAbstractItem.scss';

class SegmentAbstractItem extends React.Component {
  constructor(props) {
    super(props);
    this.rowRef = React.createRef();
  }

  componentDidMount() {
    this.getRowHeight();
  }

  componentDidUpdate(prevProps) {
    if (
      !isEqual(prevProps.segment?.content, this.props.segment?.content) ||
      !isEqual(prevProps.segment?.attributes, this.props.segment?.attributes)
    ) {
      this.getRowHeight();
    }
  }

  getRowHeight = () => {
    const height = this.segmentAbstractItemBox?.offsetHeight;
    this.props.onUpdate(height);
  };

  handleContainerClick = (e) => {
    this.props.setCurrentSegment({ index: this.props.segmentIndex });
  };

  handleAttributeClick = (e, key) => {
    e.stopPropagation();
    this.props.setCurrentSegment({ index: this.props.segmentIndex });
    this.props.setAttributeFocusInfo({
      segmentIndex: this.props.segmentIndex,
      type: attributeType.segment,
      key,
    });
  };

  render() {
    const { currentSegment, ontology, segmentConfig, segmentFieldMap, segment, segmentIndex, toolMode, setCurrentSegment } = this.props;
    const color = ontology.get(segment.content[0].role)
      ? hexToRgba(ontology.get(segment.content[0].role), defaultColor.defaultAlpha)
      : 'transparent';
    const validConfig = segmentConfig.fields.map((value) => value.name);

    return (
      // eslint-disable-next-line react/jsx-filename-extension
      <div
        onClick={(e) => this.handleContainerClick(e)}
        className={`segment-abstract-item-container ${currentSegment === segmentIndex ? 'segment-abstract-item-container-current' : ''}`}
        id={`segment-abstract-item-${segmentIndex}`}
        ref={(r) => { this.segmentAbstractItemBox = r; }}
      >
        <div className="segment-abstract-item" style={{ borderLeft: `6px solid ${color}` }}>
          {/* <div
            style={{ background: color }}
            className="segment-abstract-item-color"
          /> */}
          <div className="segment-abstract-item-index">{segmentIndex + 1}</div>
          {this.props.client !== 'hw-translation' && (
            <div className="segment-abstract-item-timestamp">{`${(segment.end - segment.start).toFixed(3)}s (${formatTimestamp(segment.start)}~${formatTimestamp(segment.end)})`}</div>
          )}
          <div className="segment-abstract-item-qa-state">
            {(segment.qaChecked === undefined || !(isQA(toolMode) || isRework(toolMode))) ? null : (
              <Popover
                overlayStyle={{
                  maxWidth: '30%'
                }}
                mouseEnterDelay={0}
                mouseLeaveDelay={0}
                trigger="hover"
                color="#2D2A34FF"
                content={
                  segment.qaChecked === false ?
                    (
                      <div style={{ fontSize: '15px', color: 'white' }}>
                        <span style={{ fontSize: '18px', color: 'white', fontWeight: 'bolder' }}>{translate('qaReject')}</span>
                        <br />
                        <span style={{ fontWeight: 'bolder' }}>{`${translate('reason')}: `}</span>
                        <span>{segment.qaReason || ''}</span>
                        <br />
                        <span style={{ fontWeight: 'bolder' }}>{`${translate('comment')}: `}</span>
                        <span>{segment.qaComment || ''}</span>
                      </div>
                    ) : <div style={{ fontSize: '15px', color: 'white' }}>{translate('qaAccept')}</div>
                }
              >
                {segment.qaChecked === true ? <QAAcceptIcon style={{ width: '22px', cursor: 'pointer' }} /> : <QARejectIcon style={{ width: '22px', cursor: 'pointer' }} />}
              </Popover>
            )}
          </div>
        </div>
        <div
          className="segment-abstract-attributes segment-abstract-row"
          style={{ borderLeft: `6px solid ${color}` }}
        >
          {
            this.props.client !== 'hw-translation' ? (
              <>
                {Object.keys(segment.attributes).map((key, index) => (
                  (
                    (validConfig.indexOf(key) >= 0 || this.props.keyAttribute.name === key) &&
                    segment.attributes[key] !== undefined
                  )
                    ? (
                      <div
                        className="segment-abstract-attributes-item"
                        /* eslint-disable-next-line react/no-array-index-key */
                        key={`segment-abstract-item-attributes${index}`}
                        onClick={(e) => { this.handleAttributeClick(e, key); }}
                      >
                        <p className="text">
                          {getFieldDisplayLabel(segment.attributes[key], segmentFieldMap[key]) || ' - '}
                        </p>
                      </div>
                    ) : null
                ))}
              </>
            ) : (
              <Input.TextArea
                className="segment-abstract-item-attributes-hw"
                value={segment.attributes.source}
                disabled
                autoComplete="off"
                autoSize={{ minRows: 1 }}
              />
            )
          }
        </div>
        {segment.content.map((value, index) => (
          <LineAbstractItem
            /* eslint-disable-next-line react/no-array-index-key */
            key={`lineAbstractItem${index}`}
            line={value}
            lineIndex={index}
            segmentIndex={segmentIndex}
            setCurrentSegment={setCurrentSegment}
            existRole={this.props.ontology && this.props.ontology.size > 0}
          />
        ))}
      </div>
    );
  }
};

SegmentAbstractItem.protoTypes = {
  ontology: PropTypes.arrayOf(PropTypes.object),
  segmentConfig: PropTypes.arrayOf(PropTypes.object),
  lineConfig: PropTypes.arrayOf(PropTypes.object),
  currentSegment: PropTypes.number,
  segment: PropTypes.object,
  segmentIndex: PropTypes.number,
};

const mapStateToProps = (state) => ({
  ontology: state.ontology,
  segmentConfig: state.segmentConfig,
  lineConfig: state.lineConfig,
  currentSegment: state.currentSegment,
  toolMode: state.toolMode,
  keyAttribute: state.keyAttribute,
  client: state.client,
  segmentFieldMap: state.segmentFieldMap,
  loadReviewEnabled: state.loadReviewEnabled,
});
const mapDispatchToProps = {
  // setCurrentSegment,
  setAttributeFocusInfo,
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(SegmentAbstractItem);
