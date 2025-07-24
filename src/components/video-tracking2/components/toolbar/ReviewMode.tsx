import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { SoundFilled, CloseOutlined } from '@ant-design/icons';
import { Edit, Validate } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewMode } from '../../types';
import { ToolMode } from '../../../../utils/tool-mode';

// key to store review alert display option
const storageKey = 'video-tracking-review-alert';

const ReviewModeSwitch = observer(() => {
  const [labelingHovered, setLabelingHovered] = useState(false);
  const [reviewHorvered, setReviewHovered] = useState(false);
  const [showReviewAlert, setShowReviewAlert] = useState(false);
  const autoShowReviewAlert = useRef(true);

  useEffect(() => {
    let hide = false;
    try {
      const s = localStorage.getItem(storageKey);
      hide = s === 'hide';
    } catch (e) {
      // get error
    }
    setShowReviewAlert(!hide && autoShowReviewAlert.current && store.config.reviewMode === ReviewMode.REVIEW);
  }, []);

  const closeAlert = (never = false) => {
    autoShowReviewAlert.current = false;
    setShowReviewAlert(false);
    if (never) {
      localStorage.setItem(storageKey, 'hide');
    }
  };

  if (store.jobProxy?.toolMode !== ToolMode.QA_RW) {
    return null;
  }
  return (
    <div className="review-mode">
      <div
        className="review-mode-button"
        style={{
          ...store.config.reviewMode === ReviewMode.LABELING && {
            backgroundColor: '#4A90E2',
          }
        }}
        onClick={() => store.config.setReviewMode(ReviewMode.LABELING)}
        onMouseEnter={() => setLabelingHovered(true)}
        onMouseLeave={() => setLabelingHovered(false)}
      >
        <Edit />
        <span className="review-mode-text">{i18n.translate('REVIEW_MODE_LABELING')}</span>
        {labelingHovered && (
          <div className="review-mode-info">
            <p style={{ color: '#FFFFFF' }}>{i18n.translate('REVIEW_MODE_LABELING')}</p>
            <div>{i18n.translate('REVIEW_MODE_LABELING_TIP')}</div>
          </div>
        )}
      </div>
      <div
        className="review-mode-button"
        style={{
          ...store.config.reviewMode === ReviewMode.REVIEW && {
            backgroundColor: '#FFE600',
            color: '#3D424D',
          }
        }}
        onClick={() => store.config.setReviewMode(ReviewMode.REVIEW)}
        onMouseEnter={() => setReviewHovered(true)}
        onMouseLeave={() => setReviewHovered(false)}
      >
        <Validate />
        <span className="review-mode-text">{i18n.translate('REVIEW_MODE_QA')}</span>
        {reviewHorvered && (
          <div className="review-mode-info">
            <p style={{ color: '#FFFFFF' }}>{i18n.translate('REVIEW_MODE_QA')}</p>
            <div>{i18n.translate('REVIEW_MODE_QA_TIP')}</div>
          </div>
        )}
        {showReviewAlert && (
          <div
            className="review-mode-popover"
            onMouseEnter={() => setReviewHovered(false)}
          >
            <div className="title">
              <span>
                <SoundFilled
                  style={{
                    fontSize: 16,
                    color: '#4A90E2',
                    marginRight: 4,
                  }}
                />
                {i18n.translate('REVIEW_MODE_ALERT')}
              </span>
              <span>
                <CloseOutlined
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                  }}
                  onClick={() => closeAlert()}
                />
              </span>
            </div>
            <div>{i18n.translate('REVIEW_MODE_ALERT_INFO')}</div>
            <div className="footer">
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => closeAlert(true)}
              >
                {i18n.translate('REVIEW_MODE_ALERT_HIDE')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ReviewModeSwitch;
