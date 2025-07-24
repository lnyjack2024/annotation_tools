import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { Tooltip, Slider, Row, Col, Modal, InputNumber, Radio, Space } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import { setVideoSpeed, setPlayMode } from '../../redux/action';
import { playMode } from '../../constants';
import { Setting } from '../../../common/icons';
import i18n from '../../locales';
import './index.scss';

const catchPreferencesKey = 'long_audio_preferences';

interface PreferencesProps {
  setVideoSpeedFun: (data: {speed: number}) => void;
  setPlayModeFun: (data: {value: string}) => void;
}

interface Preferences {
  speed?: number;
  playMode?: string;
}

export const playModeMessage:{[key:string]: () => string} = {
  regionPlay: () => i18n.translate('PLAY_MODE_TIP_REGION_PLAY'),
  regionLoop: () => i18n.translate('PLAY_MODE_TIP_REGION_LOOP'),
  overallLoop: () => i18n.translate('PLAY_MODE_TIP_OVERALL'),
};

const PreferencesPanel = (props: PreferencesProps) => {
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    speed: 1,
    playMode: 'regionPlay'
  });

  const { setVideoSpeedFun, setPlayModeFun } = props;

  useEffect(() => {
    const catchData = localStorage.getItem(catchPreferencesKey);
    if (catchData) {
      handlePreferences(JSON.parse(catchData));
    }
  }, []);

  const handlePreferences = (data: Preferences) => {
    const newPreferences = {
      ...preferences,
      ...data,
    };
    setVideoSpeedFun({ speed: newPreferences.speed || 1 });
    setPlayModeFun({ value: newPreferences.playMode || 'regionPlay' });
    setPreferences(newPreferences);
    localStorage.setItem(catchPreferencesKey, JSON.stringify(newPreferences));
  };

  return (
    <>
      <Tooltip placement="bottom" title={i18n.translate('PREFERENCES_TITLE')}>
        <div
          className={cx('icon-button', {
            'icon-button--active': visible,
          })}
          onClick={() => setVisible(true)}
        >
          <Setting />
        </div>
      </Tooltip>
      <Modal
        title={i18n.translate('PREFERENCES_TITLE')}
        visible={visible}
        width={480}
        onOk={() => setVisible(false)}
        onCancel={() => setVisible(false)}
        wrapClassName="preferences_modal"
        footer={null}
      >
        <div className="preferences-settings">
          <div className="preferences-settings-item">
            <div className="preferences-settings-item-title">
              <div>{i18n.translate('PREFERENCES_PLAY')}</div>
              <div className="reset" onClick={() => handlePreferences({ speed: 1, playMode: 'regionPlay' })}>
                <RedoOutlined />
              </div>
            </div>

            <div className="preferences-settings-item-content">
              <div style={{ marginBottom: 6 }}>{i18n.translate('PREFERENCES_PLAY_SPEED')}</div>
              <Row gutter={12} align="middle">
                <Col span={10}>
                  <Slider
                    min={0.25}
                    max={4}
                    step={0.25}
                    value={preferences.speed}
                    onChange={(v: number) => handlePreferences({ speed: v })}
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={0.25}
                    max={4}
                    step={0.25}
                    value={preferences.speed}
                    onChange={(v) => handlePreferences({ speed: v as number })}
                    onFocus={() => { (window as any).disableLongAudioHotKeys = true; }}
                    onBlur={() => { (window as any).disableLongAudioHotKeys = false; }}
                  />
                </Col>
              </Row>
              <div style={{ margin: '20px 0 6px' }}>{i18n.translate('PREFERENCES_PLAY_MODE')}</div>
              <Radio.Group
                size="small"
                className="preferences-play-mode"
                value={preferences.playMode}
                onChange={(e) => { handlePreferences({ playMode: e.target.value }); }}
              >
                <Space direction="vertical">
                  {playMode.map((m) => (<Radio key={m} value={m}>{playModeMessage[m]()}</Radio>))}
                </Space>
              </Radio.Group>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

const mapDispatchToProps = {
  setVideoSpeedFun: setVideoSpeed,
  setPlayModeFun: setPlayMode,
};

export default connect(null, mapDispatchToProps)(PreferencesPanel);
