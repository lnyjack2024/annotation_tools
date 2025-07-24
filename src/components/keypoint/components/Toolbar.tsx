import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import screenfull from 'screenfull';
import { Tooltip, Slider, Popover, Row, Col, Divider, Button } from 'antd';
import {
  UndoOutlined, RedoOutlined, ArrowsAltOutlined, ShrinkOutlined, AppstoreOutlined,
  SaveOutlined, QuestionOutlined, PictureOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { AttributesMode } from '../store/SettingsStore';
import Dropdown, { MenuItemType, MenuItem } from '../../common/dropdown/Dropdown';
import formatMessage from '../locales';
import { Attributes, Labels, Contrast, Edit, Validate, Warning } from '../../common/icons';
import rootStore from '../store/RootStore';
import './Toolbar.scss';

interface Props {
  readonly?: boolean;
  isReview: boolean;
  isPreview: boolean;
  initialDataLength: number;
  onAttributesModeChanges: (activeMode: AttributesMode, type: string) => void;
  onSizeChange: () => void,
  onFilterChange: () => void,
  onLabelModeChange: () => void;
  onGridVisibleChange: () => void,
  onSave: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  setReview: () => void;
  handleChangeDrawMode: (mode: boolean) => void;
}

const defaultFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  lightness: 0,
  hue: 0,
  rescale: 1,
};

const Toolbar = ({
  readonly = false,
  isReview,
  isPreview,
  initialDataLength,
  onAttributesModeChanges,
  onSizeChange,
  onFilterChange,
  onLabelModeChange,
  onGridVisibleChange,
  onSave,
  handleUndo,
  handleRedo,
  setReview,
  handleChangeDrawMode,
}: Props) => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    rootStore.setting.handleFiltersChange(filters);
    onFilterChange();
  }, [filters]);

  useEffect(() => {
    if (screenfull.isEnabled) {
      screenfull.on('change', initScreenStatus);
    }
    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', initScreenStatus);
      }
    };
  }, []);

  const initScreenStatus = () => {
    rootStore.setting.setFullScreen(!rootStore.setting.isFullScreen);
  };

  const handleScreenFull = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  };

  const handleAttributesModeChange = (mode: string, _: number, item: MenuItem) => {
    const [type, value] = item.value!.split('-');
    rootStore.setting.setActiveAttributesMode(value as AttributesMode, type);
    onAttributesModeChanges(value as AttributesMode, type);
  };

  const handlePointSizeChange = (size: number) => {
    rootStore.setting.setPointSize(size);
    onSizeChange();
  };

  const handleLineWidthChange = (width: number) => {
    rootStore.setting.setLineWidth(width);
    onSizeChange();
  };

  const FilterContent = (
    <Row style={{ width: 300 }} gutter={16} align="middle">
      <Col span={24} style={{ textAlign: 'right' }}>
        <Button type="link" style={{ color: '#f5f5f5' }} icon={<ReloadOutlined />} onClick={() => setFilters(defaultFilters)}>
          {formatMessage('FILTER_RESET')}
        </Button>
      </Col>
      <Col span={6}>
        {formatMessage('FILTER_BRIGHTNESS')}
      </Col>
      <Col span={18}>
        <Slider
          className="landmark-slider"
          min={-100}
          max={100}
          step={1}
          value={filters.brightness}
          onChange={(v: number) => setFilters({ ...filters, brightness: v })}
        />
      </Col>
      <Col span={6}>
        {formatMessage('FILTER_CONTRAST')}
      </Col>
      <Col span={18}>
        <Slider
          className="landmark-slider"
          min={-100}
          max={100}
          step={1}
          value={filters.contrast}
          onChange={(v: number) => setFilters({ ...filters, contrast: v })}
        />
      </Col>
      <Col span={6}>
        {formatMessage('FILTER_SATURATION')}
      </Col>
      <Col span={18}>
        <Slider
          className="landmark-slider"
          min={-100}
          max={100}
          step={1}
          value={filters.saturation}
          onChange={(v: number) => setFilters({ ...filters, saturation: v })}
        />
      </Col>
      <Col span={6}>
        {formatMessage('FILTER_LIGHTNESS')}
      </Col>
      <Col span={18}>
        <Slider
          className="landmark-slider"
          min={-100}
          max={100}
          step={1}
          value={filters.lightness}
          onChange={(v: number) => setFilters({ ...filters, lightness: v })}
        />
      </Col>
      <Col span={6}>
        {formatMessage('FILTER_HUE')}
      </Col>
      <Col span={18}>
        <Slider
          className="landmark-slider"
          min={-180}
          max={180}
          step={1}
          value={filters.hue}
          onChange={(v: number) => setFilters({ ...filters, hue: v })}
        />
      </Col>
      <Col span={6}>
        {formatMessage('FILTER_RESCALE')}
      </Col>
      <Col span={18}>
        <Slider
          className="landmark-slider"
          min={1}
          max={5}
          step={0.01}
          value={filters.rescale}
          onChange={(v: number) => setFilters({ ...filters, rescale: v })}
        />
      </Col>
    </Row>
  );

  const HelpContent = (
    <Row style={{ width: 400 }} gutter={16} align="top">
      <Col span={24}>
        <Divider plain><b>{formatMessage('HELP_TITLE_POINTS')}</b></Divider>
      </Col>
      <Col span={10} className="help-buttons">
        <span className="help-button">Delete</span>
        {' / '}
        <span className="help-button">Backspace</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_POINTS_DELETE')}</Col>
      {/* <Col span={10} className="help-buttons">
        <span className="help-button">V</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_POINTS_VISIBLE')}</Col> */}
      {/* <Col span={10} className="help-buttons">
        <span className="help-button">A</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_POINTS_ADJUST')}</Col> */}
      {/* <Col span={10} className="help-buttons">
        <span className="help-button">C</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_POINTS_SMOOTH')}</Col> */}
      <Col span={10} className="help-buttons">
        <span className="help-button">O</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_SHAPE_EDIT')}</Col>
      <Col span={10} className="help-buttons">
        <span className="help-button">P</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_GROUP_EDIT')}</Col>
      {/* <Col span={10} className="help-buttons">
        <span className="help-button">R</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_POINTS_CIRCLE')}</Col> */}
      {/* <Col span={10} className="help-buttons">
        <span className="help-button">Ctrl</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_POINTS_FORCE')}</Col> */}
      <Col span={24}>
        <Divider plain><b>{formatMessage('HELP_TITLE_EDITOR')}</b></Divider>
      </Col>
      <Col span={10} className="help-buttons">
        <span className="help-button">Ctrl + Z</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_UNDO')}</Col>
      <Col span={10} className="help-buttons">
        <span className="help-button">Ctrl + Y</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_REDO')}</Col>
      {/* <Col span={10} className="help-buttons">
        <span className="help-button">M</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_GRID')}</Col> */}
      <Col span={10} className="help-buttons">
        <span className="help-button">F</span>
      </Col>
      <Col span={14}>{formatMessage('HELP_FULLSCREEN')}</Col>
      <Col span={10} className="help-buttons">
        <span className="help-button">Space</span>
      </Col>
      <Col span={14}>{formatMessage('SPACE_CONTROL')}</Col>
    </Row>
  );

  const ReviewModeContent = (
    <div className="mode-tips">
      <div className="title">{formatMessage('REVIEW_MODE_TIPS_TITLE')}</div>
      <p>{formatMessage('REVIEW_MODE_TIPS_1')}</p>
      <p />
      <p>{formatMessage('REVIEW_MODE_TIPS_2')}</p>
      <p>{formatMessage('REVIEW_MODE_TIPS_3')}</p>
      <p>{formatMessage('REVIEW_MODE_TIPS_4')}</p>
    </div>
  );

  const AnnotationModeContent = (
    <div className="mode-tips">
      <div className="title">{formatMessage('ANNOTATION_MODE_TIPS_TITLE')}</div>
      <p>{formatMessage('ANNOTATION_MODE_TIPS_1')}</p>
    </div>
  );

  return (
    <div className="toolbar">
      <div>
        {rootStore.review.isEnabled && (
          <div className="mode-box">
            <div className="mode-button">
              <Popover overlayClassName="landmark-popover" content={AnnotationModeContent} placement="bottomRight">
                <div
                  className={cx('icon-button', {
                    'icon-button--active': rootStore.review.drawMode,
                    'icon-button--disabled': !rootStore.review.isEditable,
                  })}
                  onClick={() => { handleChangeDrawMode(true); }}
                >
                  <Edit />
                </div>
              </Popover>
              <Popover overlayClassName="landmark-popover" content={ReviewModeContent} placement="bottomRight">
                <div
                  className={cx('icon-button', {
                    'icon-button--active': !rootStore.review.drawMode,
                  })}
                  onClick={() => { handleChangeDrawMode(false); }}
                >
                  <Validate />
                </div>
              </Popover>
            </div>
            {!rootStore.review.drawMode && (
              <div className="mode-tip">
                <span className="anticon anticon-picture mode-tip-icon">
                  <Warning />
                </span>
                {formatMessage('TOOLBAR_MODE_TIP')}
              </div>
            )}
            <div className="divider" />
          </div>
        )}
        <div
          className={cx('icon-button', {
            'icon-button--disabled': rootStore.undo.undoDisabled || readonly
          })}
          onClick={handleUndo}
        >
          <Tooltip
            title={formatMessage('TOOLBAR_UNDO', { values: { shortcut: 'Ctrl+Z' } })}
            placement="bottom"
          >
            <UndoOutlined />
          </Tooltip>
        </div>
        <div
          className={cx('icon-button', {
            'icon-button--disabled': rootStore.undo.redoDisabled || readonly
          })}
          onClick={handleRedo}
        >
          <Tooltip
            title={formatMessage('TOOLBAR_REDO', { values: { shortcut: 'Ctrl+Y' } })}
            placement="bottom"
          >
            <RedoOutlined />
          </Tooltip>
        </div>
        <div className="divider" />
        <div className="slider-container">
          <span>{formatMessage('TOOLBAR_POINT_RADIUS')}</span>
          <Slider className="landmark-slider" min={1} max={10} step={1} value={rootStore.setting.pointSize} onChange={handlePointSizeChange} />
        </div>
        <div className="slider-container">
          <span>{formatMessage('TOOLBAR_LINE_WIDTH')}</span>
          <Slider className="landmark-slider" min={0} max={5} step={1} value={rootStore.setting.lineWidth} onChange={handleLineWidthChange} />
        </div>
      </div>
      <div>
        <div
          className={cx('icon-button', {
            'icon-button--disabled': !initialDataLength,
            'icon-button--active': isReview,
          })}
          onClick={setReview}
        >
          <Tooltip
            title={formatMessage('VERSION_CONTRAST')}
            placement="bottom"
          >
            <span className="anticon anticon-picture">
              <Contrast />
            </span>
          </Tooltip>
        </div>
        <div className="icon-button">
          <Popover
            overlayClassName="landmark-popover"
            content={FilterContent}
            placement="bottomRight"
            trigger="click"
            visible={filtersVisible}
            onVisibleChange={(visible) => setFiltersVisible(visible)}
          >
            <Tooltip
              title={formatMessage('TOOLBAR_FILTERS')}
              placement="bottom"
            >
              <PictureOutlined />
            </Tooltip>
          </Popover>
        </div>
        <Dropdown
          arrow
          showIcon
          style={{ paddingRight: 6, height: '100%' }}
          menu={[
            { label: 'Points:', type: MenuItemType.TITLE },
            ...Object.values(AttributesMode).map((mode) => ({
              label: `${mode.substring(0, 1).toUpperCase()}${mode.substring(1)}`,
              value: `keypoint-${mode}`,
              active: mode === rootStore.setting.activePointAttributesMode,
            })),
            { label: 'Objects:', type: MenuItemType.TITLE },
            ...Object.values(AttributesMode).map((mode) => ({
              label: `${mode.substring(0, 1).toUpperCase()}${mode.substring(1)}`,
              value: `object-${mode}`,
              active: mode === rootStore.setting.activeAttributesMode,
            })),
          ]}
          onClick={handleAttributesModeChange}
        >
          <div
            className={cx('icon-button', {
              'icon-button--active': rootStore.setting.activeAttributesMode !== AttributesMode.HIDE,
            })}
            style={{ paddingRight: 0, paddingTop: '2px', fontSize: '20px' }}
          >
            <Attributes />
          </div>
        </Dropdown>
        <div
          className={cx('icon-button', {
            'icon-button--active': rootStore.setting.labelMode,
          })}
          style={{ lineHeight: '18px' }}
          onClick={() => {
            rootStore.setting.setLabelMode(!rootStore.setting.labelMode);
            onLabelModeChange();
          }}
        >
          <Labels />
        </div>
        {/* <div
          className={cx('icon-button', {
            'icon-button--active': rootStore.setting.isGridVisible
          })}
          onClick={() => {
            rootStore.setting.setGridVisible(!rootStore.setting.isGridVisible);
            onGridVisibleChange();
          }}
        >
          <Tooltip
            title={formatMessage(rootStore.setting.isGridVisible ? 'TOOLBAR_GRID_HIDE' : 'TOOLBAR_GRID_SHOW', { values: { shortcut: 'G' } })}
            placement="bottom"
          >
            <AppstoreOutlined />
          </Tooltip>
        </div> */}
        <div className="divider" />
        <div
          className={cx('icon-button', {
            'icon-button--disabled': isPreview
          })}
          onClick={onSave}
        >
          <Tooltip
            title={formatMessage('TOOLBAR_SAVE', { values: { shortcut: 'S' } })}
            placement="bottom"
          >
            <SaveOutlined />
          </Tooltip>
        </div>
        <div className="icon-button">
          <Popover overlayClassName="landmark-popover" content={HelpContent} placement="bottomRight">
            <QuestionOutlined />
          </Popover>
        </div>
        <div className="icon-button" onClick={handleScreenFull}>
          <Tooltip
            title={formatMessage(rootStore.setting.isFullScreen ? 'TOOLBAR_FULLSCREEN_EXIST' : 'TOOLBAR_FULLSCREEN_ENTER', { values: { shortcut: 'F' } })}
            placement="bottom"
          >
            {rootStore.setting.isFullScreen ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default observer(Toolbar);
