import React from 'react';
import { Collapse } from 'antd';
import { ArrowRightOutlined, CaretRightOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Warning, Up, Sync } from '../icons';
import 'antd/es/collapse/style/index.css';
import './Validator.scss';

interface IWarning {
  type: string;
  id: string;
  message: string;
  frames: number[];
  info?: {
    [key: string]: any;
  };
  blockSubmit?: boolean;
}

interface ValidatorProps {
  validationTypes: {
    [type: string]: string;
  };
  warnings: IWarning[];
  errors?: {
    [type: string]: string;
  };
  containerWidth?: number | string;
  containerHeight?: number | string;
  onValidate: () => Promise<unknown>;
  renderWarningTitle: (warning: IWarning) => React.ReactNode;
  showWarningAction?: (warning: IWarning) => boolean;
  onWarningAction?: (warning: IWarning) => void;
  titleFormatter?: (warningsCount: number) => string;
  checkingMsgFormatter?: () => string;
}

interface ValidatorState {
  checking: boolean;
  open: boolean;
}

const { Panel } = Collapse;

class Validator extends React.Component<ValidatorProps, ValidatorState> {
  state: ValidatorState = {
    checking: false,
    open: false,
  };

  handleSync = async () => {
    this.setState({ checking: true });

    await Promise.all([
      this.props.onValidate(),
      new Promise((resolve) => {
        setTimeout(resolve, 300);
      }),
    ]);

    this.setState({ checking: false });
  };

  renderWarning(warning: IWarning) {
    const { renderWarningTitle, showWarningAction, onWarningAction } = this.props;
    const { type, id, message } = warning;
    return (
      <div
        key={`${type}-${id}`}
        className="warning-item"
      >
        <div className="warning-title">
          <div className="name">
            {renderWarningTitle(warning)}
          </div>
          {showWarningAction && showWarningAction(warning) && (
            <div
              className="action"
              onClick={() => {
                if (onWarningAction) {
                  onWarningAction(warning);
                }
              }}
            >
              <ArrowRightOutlined />
            </div>
          )}
        </div>
        <div className="warning-msg">
          {message}
        </div>
      </div>
    );
  }

  renderWarnings(type: string) {
    const { validationTypes, warnings, errors = {} } = this.props;
    const typeWarnings = warnings.filter((i) => i.type === type);
    const typeError = errors[type];
    return (typeWarnings.length > 0 || typeError) && (
      <Panel
        key={type}
        header={validationTypes[type]}
        extra={(
          <div>
            {typeError && (
              <ExclamationCircleFilled style={{ color: 'rgba(220, 70, 36)', marginRight: 4 }} />
            )}
            <span className="result-count">
              {warnings.length}
            </span>
          </div>
        )}
      >
        {typeError && <div className="error">{typeError}</div>}
        {typeWarnings.map((warning) => this.renderWarning(warning))}
      </Panel>
    );
  }

  render() {
    const {
      validationTypes,
      warnings,
      containerWidth = '100%',
      containerHeight = '100%',
      titleFormatter,
      checkingMsgFormatter,
    } = this.props;

    return (
      <div
        className="tool-validator"
        style={{
          width: containerWidth,
          height: this.state.open ? containerHeight : 32,
        }}
      >
        <div
          className="content"
          style={{
            visibility: this.state.open ? 'visible' : 'hidden',
          }}
        >
          <Collapse
            ghost
            expandIcon={(p) => (
              <CaretRightOutlined
                style={{
                  ...p.isActive ? {
                    top: 11,
                    transform: 'rotate(90deg)',
                  } : {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                }}
              />
            )}
          >
            {Object.keys(validationTypes).map((type) => this.renderWarnings(type))}
          </Collapse>
        </div>
        <div className="header">
          <div
            style={{
              backgroundColor: warnings.length > 0 ? 'rgba(220, 70, 36, 0.5)' : 'transparent'
            }}
          >
            <div>
              <Warning />
              <span style={{ paddingLeft: 8 }}>
                {titleFormatter ? titleFormatter(warnings.length) : `${warnings.length} Warning(s)`}
              </span>
            </div>
            <div>
              {this.state.checking && (
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', paddingRight: 4 }}>
                  {checkingMsgFormatter ? checkingMsgFormatter() : 'Checking...'}
                </div>
              )}
              <div className="icon-button" onClick={this.handleSync}>
                <Sync />
              </div>
              <div
                className="icon-button"
                style={{
                  transform: this.state.open ? 'rotate(180deg)' : '',
                }}
                onClick={() => this.setState((stat) => ({ open: !stat.open }))}
              >
                <Up />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Validator;
