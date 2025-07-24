import React from 'react';
import { Collapse, Menu, Dropdown } from 'antd';
import classnames from 'classnames';
import { ArrowRightOutlined, CaretRightOutlined, ExclamationCircleFilled, CheckOutlined } from '@ant-design/icons';
import ImagePreview from '../modal/ImagePreview';
import { Warning, Sync, More } from '../icons';
import 'antd/es/collapse/style/index.css';
import './Validator.scss';
import { MissingReviewData, ReviewResult, ValidationType } from '../../keypoint/types';

export interface IWarning {
  warningType: string;
  id: string;
  groupName?: string;
  shapeIds?: (string | number)[];
  data?: MissingReviewData;
  message: string;
  comment?: string;
  frames: number[];
  info?: {
    [key: string]: any;
  };
  blockSubmit?: boolean;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

interface ValidatorProps {
  isEnabled: boolean;
  theme?: Theme;
  validationTypes: {
    [type: string]: string;
  };
  warnings: IWarning[];
  errors?: {
    [type: string]: string;
  };
  containerWidth?: number | string;
  containerHeight?: number | string;
  renderWarningTitle: (warning: IWarning) => React.ReactNode;
  showWarningAction?: (warning: IWarning) => boolean;
  onWarningAction?: (warning: IWarning) => void;
  titleFormatter?: (warningsCount: number) => string;
  checkingMsgFormatter?: () => string;
  onMoreHandleAction: (key: string, warning: IWarning) => void;
  formatMessage: (key: string) => string;
}

interface ValidatorState {
  // checking: boolean;
  previewImg: string;
}

const { Panel } = Collapse;

const menuItems = [
  ReviewResult.APPROVE,
  ReviewResult.REJECT,
  ReviewResult.SUSPEND
];
class Validator extends React.Component<ValidatorProps, ValidatorState> {
  state: ValidatorState = {
    // checking: false,
    previewImg: '',
  };

  // eslint-disable-next-line class-methods-use-this
  renderMore(warning: IWarning) {
    return (
      <Menu onClick={({ key }) => { this.props.onMoreHandleAction(key, warning); }}>
        {!warning.data && (
          <>
            {menuItems.map((key, i) => (
              <Menu.Item key={key}>
                <div
                  className={classnames('validator-menu-label', {
                    'validator-menu-active': ReviewResult.REJECT === key
                  })}
                >
                  <CheckOutlined className="validator-menu-icon" />
                  <span>{this.props.formatMessage(`QC_MENU_${key.toUpperCase()}`)}</span>
                </div>
                <div className="hint">{i + 1}</div>
              </Menu.Item>
            ))}
            <Menu.Divider style={{ backgroundColor: '#636770' }} />
          </>
        )}
        {menuItems.map((key, i) => (
          <Menu.Item key={key}>
            <div
              className={classnames('validator-menu-label', {
                'validator-menu-active': ReviewResult.REJECT === key
              })}
            >
              <CheckOutlined className="validator-menu-icon" />
              <span>{this.props.formatMessage(`QC_MENU_${key.toUpperCase()}`)}</span>
            </div>
            <div className="hint">{i + 1}</div>
          </Menu.Item>
        ))}
        <Menu.Divider style={{ backgroundColor: '#636770' }} />
        <Menu.Item key="delete">
          {this.props.formatMessage('QC_MENU_DELETE')}
        </Menu.Item>
      </Menu>
    );
  };

  renderWarning(warning: IWarning) {
    const { renderWarningTitle, showWarningAction, onWarningAction } = this.props;
    const { frames, warningType, id, groupName, shapeIds, message } = warning;
    return (
      <div
        key={`${warningType}-${frames?.[0]}-${id}-${groupName}-${shapeIds}`}
        className="warning-item"
      >
        <div className="warning-item-content">
          <div className="warning-title">
            <div className="name">
              {renderWarningTitle(warning)}
            </div>
            <div className="action">
              {(showWarningAction && showWarningAction(warning)) && (
                <div
                  className="go"
                  onClick={() => {
                    if (onWarningAction) {
                      onWarningAction(warning);
                    }
                  }}
                >
                  <ArrowRightOutlined />
                </div>
              )}
              {(this.props.isEnabled && warningType === ValidationType.QUALITY) && (
                <Dropdown overlayClassName="validator-menus" overlay={this.renderMore(warning)} trigger={['click']}>
                  <div className="more">
                    <More />
                  </div>
                </Dropdown>
              )}
            </div>
          </div>
          <div className="warning-msg">
            {message}
          </div>
        </div>
        {warning.comment && (
          <div
            className="warning-item-comment"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: warning.comment || '' }}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName === 'IMG') {
                this.setPreviewImg((e.target as HTMLImageElement).src);
              }
            }}
          />
        )}
      </div>
    );
  }

  renderWarnings(type: string) {
    const { validationTypes, warnings, errors = {} } = this.props;
    const typeWarnings = warnings.filter((i) => i.warningType === type);
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
              {typeWarnings.length}
            </span>
          </div>
        )}
      >
        {typeError && <div className="error">{typeError}</div>}
        {typeWarnings.map((warning) => this.renderWarning(warning))}
      </Panel>
    );
  }

  setPreviewImg(src: string) {
    this.setState({
      previewImg: src
    });
  }

  render() {
    const {
      theme = Theme.DARK,
      validationTypes,
      warnings,
      containerWidth = '100%',
      containerHeight = '100%',
      titleFormatter,
      checkingMsgFormatter,
    } = this.props;
    const { previewImg } = this.state;
    return (
      <div
        className={`tool-validator ${theme}`}
        style={{
          width: containerWidth,
          height: containerHeight,
        }}
      >
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
          </div>
        </div>
        <div className="content">
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
        {previewImg && <ImagePreview src={previewImg} maskClosable onClose={() => this.setPreviewImg('')} />}
      </div>
    );
  }
}

export default Validator;
