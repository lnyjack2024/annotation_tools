import React from 'react';
import { connect } from 'react-redux';
import Validator from '../../../common/validator/Validator';
import { translate, formatTimestamp } from '../../constants';
import { isAnnotationReadonly } from '../../../../utils/tool-mode';
import { setCurrentSegment } from '../../redux/action';
import './Validation.scss';

const WarningNameHeight = 28;
const ValidationTypes = {
  custom: 'custom',
};
const ValidationTypeTitles = {
  [ValidationTypes.custom]: translate('VALIDATION_CUSTOM'),
};

class Validation extends React.Component {
  state = {
    warnings: [],
    errors: {},
  };

  get hasValidation() {
    return this.props.scriptCheck;
  }

  runScriptValidation = async (resultLink) => {
    const scriptResults = [];
    let hasScriptError = false;
    try {
      const validateResults = await this.props.jobProxy.validateContent?.(resultLink, this.props.jobProxy.flowData) || [];
      validateResults.forEach((result) => {
        const out = JSON.parse(result?.data?.out_str || '{}');
        if (result?.status_code === 200 && Array.isArray(out)) {
          out.forEach((item) => {
            scriptResults.push({
              id: item.id,
              message: item.message,
              frames: item.frames,
              info: { ...item.info },
              blockSubmit: item.blockSubmit,
            });
          });
        } else {
          hasScriptError = true;
        }
      });
    } catch (error) {
      hasScriptError = true;
      console.log('script validation error', error);
    }
    return { scriptResults, hasScriptError };
  };

  handleValidate = async () => {
    // generate result link
    let resultLink = '';
    if (typeof this.props.jobProxy.reviewFrom === 'string') {
      resultLink = this.props.jobProxy.reviewFrom;
    }
    if (!isAnnotationReadonly(this.props.jobProxy.toolMode)) {
      try {
        resultLink = await this.props.saveResult();
      } catch (e) {
        resultLink = '';
      }
    }

    // run script validation
    const { scriptResults, hasScriptError } = this.props.scriptCheck ?
      await this.runScriptValidation(resultLink) :
      { scriptResults: [], hasScriptError: false };

    const warnings = Array.from({ length: this.props.allResults.length }).map(() => []);

    [...scriptResults].forEach((warning) => {
      const { frames, info = {} } = warning;

      let videoIndex = 0; // default video index is 0
      if (info.videoIndex !== undefined && Number(info.videoIndex) >= 0) {
        // if video index provided in info, use it
        videoIndex = Number(info.videoIndex);
      } else if (Array.isArray(frames) && frames.length > 0 && Number(frames[0]) >= 0) {
        // if video index not provided, try to get from frames
        videoIndex = Number(frames[0]);
      }

      warnings[videoIndex].push({
        ...warning,
        type: ValidationTypes.custom,
      });
    });

    this.setState({
      warnings,
      errors: {
        [ValidationTypes.custom]: (hasScriptError) ? translate('VALIDATION_CUSTOM_ERROR') : '',
      },
    });

    return {
      hasCustomError: false,
      blockSubmitErrors: warnings.map((videoWarnings) => videoWarnings.filter((warning) => warning.type === ValidationTypes.custom && warning.blockSubmit === true)),
    };
  };

  handleAction = (warning) => {
    const segResultIndex = this.props.allResults[this.props.currentVideo].findIndex((r) => r.id === warning.id);
    if (segResultIndex < 0) {
      return;
    }
    this.props.setCurrentSegment({ index: segResultIndex });
  };

  renderWarningTitle = (warning) => {
    const currentResults = this.props.allResults[this.props.currentVideo];
    const segResultIndex = currentResults.findIndex((r) => r.id === warning.id);
    if (segResultIndex < 0) {
      return translate('VALIDATION_ITEM_INVALID');
    }
    const { start, end, content } = currentResults[segResultIndex];
    return (
      <>
        <div className="seg-bar">
          {content.map((c, i) => {
            const color = c.role === 'none' ? 'rgba(255, 255, 255, 0.6)' : this.props.ontology.get(c.role);
            const radiusLT = i === 0;
            const radiusLB = i === content.length - 1;
            return (
              <div
                key={c.role}
                className="seg-bar-item"
                style={{
                  background: color,
                  height: WarningNameHeight / content.length,
                  ...radiusLT && { borderTopLeftRadius: '2px' },
                  ...radiusLB && { borderBottomLeftRadius: '2px' },
                }}
              />
            );
          })}
        </div>
        <span className="seg-index">{segResultIndex + 1}</span>
        <span className="seg-time">
          {`${(end - start).toFixed(3)}s (${formatTimestamp(start)}-${formatTimestamp(end)})`}
        </span>
      </>
    );
  };

  render() {
    const { allResults, currentVideo } = this.props;
    const { warnings, errors } = this.state;
    return this.hasValidation && (
      <div className="audio-validation">
        <Validator
          containerWidth={420}
          containerHeight="calc(100% - 282px)"
          validationTypes={ValidationTypeTitles}
          warnings={warnings[currentVideo] || []}
          errors={errors}
          onValidate={this.handleValidate}
          renderWarningTitle={this.renderWarningTitle}
          showWarningAction={(w) => allResults[currentVideo].findIndex((r) => r.id === w.id) >= 0}
          onWarningAction={this.handleAction}
          titleFormatter={(count) => `${count} ${translate('VALIDATION_TITLE')}`}
          checkingMsgFormatter={() => translate('VALIDATION_CHECKING')}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  scriptCheck: state.scriptCheck,
  ontology: state.ontology,
  allResults: state.results,
  currentVideo: state.currentVideo,
});
const mapDispatchToProps = {
  setCurrentSegment,
};
export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Validation);
