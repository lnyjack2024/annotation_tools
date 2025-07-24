import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Tooltip, Switch, Slider, Input, Row, Col } from 'antd';
import { CloseOutlined, RedoOutlined } from '@ant-design/icons';
import cx from 'classnames';
import { Palette } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

const DisplaySettings = observer(() => {
  const { config, updateConfig } = store.shape;

  const [visible, setVisible] = useState(false);
  const [alpha, setAlpha] = useState('');

  useEffect(() => {
    setAlpha(`${config.alpha}%`);
  }, [config, config.alpha]);

  const changeAlpha = () => {
    const num = Number(alpha);
    if (!Number.isNaN(num) && num >= 0 && num <= 100 && num !== config.alpha) {
      const int = parseInt(alpha, 10);
      updateConfig({ alpha: int });
    } else {
      setAlpha(`${config.alpha}%`);
    }
  };

  return (
    <>
      <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_DISPLAY')}>
        <div
          className={cx('icon-button', {
            'icon-button--active': visible,
          })}
          onClick={() => setVisible(!visible)}
        >
          <Palette />
        </div>
      </Tooltip>
      {visible && (
        <div className="toolbar-panel display-panel">
          <div className="title">
            {i18n.translate('DISPLAY_TITLE')}
            <div className="close" onClick={() => setVisible(false)}>
              <CloseOutlined />
            </div>
          </div>
          <div className="item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF' }}>
            {i18n.translate('DISPLAY_SHAPE_STYLE')}
            <div className="reset" onClick={store.shape.resetConfig}>
              <RedoOutlined />
            </div>
          </div>
          <div className="item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {i18n.translate('DISPLAY_CONFIG_FILL')}
            <Switch
              checked={config.fill}
              onChange={(checked) => updateConfig({ fill: checked })}
            />
          </div>
          <div className="item">
            {i18n.translate('DISPLAY_CONFIG_ALPHA')}
            <Row gutter={12} align="middle">
              <Col span={18}>
                <Slider
                  min={0}
                  max={100}
                  disabled={!config.fill}
                  value={config.alpha}
                  onChange={(v: number) => updateConfig({ alpha: v })}
                />
              </Col>
              <Col span={6}>
                <Input
                  size="small"
                  value={alpha}
                  onChange={(e) => {
                    let { value } = e.target;
                    if (value.substr(value.length - 1) === '%') {
                      value = value.substr(0, value.length - 1);
                    }
                    if (!value || /^\d+$/.test(value)) {
                      setAlpha(value);
                    }
                  }}
                  onFocus={() => setAlpha(`${config.alpha}`)}
                  onBlur={changeAlpha}
                  onPressEnter={changeAlpha}
                />
              </Col>
            </Row>
          </div>
          <div className="divider" />
          <div className="item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {i18n.translate('DISPLAY_CONFIG_SHOW_VERTEX')}
            <Switch
              checked={config.showVertex}
              onChange={(checked) => updateConfig({ showVertex: checked })}
            />
          </div>
          <div className="item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {i18n.translate('DISPLAY_CONFIG_SHOW_VERTEX_ORDER')}
            <Switch
              checked={config.showVertexOrder}
              onChange={(checked) => updateConfig({ showVertexOrder: checked })}
            />
          </div>
        </div>
      )}
    </>
  );
});

export default DisplaySettings;
