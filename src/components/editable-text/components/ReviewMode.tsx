import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { SoundFilled, CloseOutlined } from '@ant-design/icons';
import { Edit, Validate } from '../../common/icons';
import store from '../store/RootStore';
import localMessage from '../locale';
import cache, { CacheKey } from '../utils-storage';
import { ReviewMode } from '../types';
import { ToolMode } from '../../../utils/tool-mode';

const ReviewModeSwitch = observer(() => {
  const [labelingHovered, setLabelingHovered] = useState(false);
  const [reviewHorvered, setReviewHovered] = useState(false);
  const [showReviewAlert, setShowReviewAlert] = useState(false);
  const autoShowReviewAlert = useRef(true);

  useEffect(() => {
    let hide = false;
    try {
      const s = cache.get(CacheKey.REVIEW_ALERT_HIDE);
      hide = s === 'hide';
    } catch (e) {
      // get error
    }
    setShowReviewAlert(!hide && autoShowReviewAlert.current && store.config.reviewMode === ReviewMode.REVIEW);
  }, [store.config.reviewMode]);

  const closeAlert = (never = false) => {
    autoShowReviewAlert.current = false;
    setShowReviewAlert(false);
    if (never) {
      cache.set(CacheKey.REVIEW_ALERT_HIDE, 'hide');
    }
  };

  const { toolMode } = store.jobProxy || {};
  if (toolMode !== ToolMode.QA_RW && toolMode !== ToolMode.AUDIT_RW) {
    return null;
  }

  const modeLabel = localMessage(toolMode === ToolMode.AUDIT_RW ? 'REVIEW_MODE_AUDIT' : 'REVIEW_MODE_QA');
  return (
    <div className="review-mode">
      <div
        className="review-mode-button"
        style={{
          ...store.config.reviewMode === ReviewMode.LABELING && {
            backgroundColor: '#4A90E2',
            color: '#FFFFFF'
          }
        }}
        onClick={() => store.config.setReviewMode(ReviewMode.LABELING)}
        onMouseEnter={() => setLabelingHovered(true)}
        onMouseLeave={() => setLabelingHovered(false)}
      >
        <Edit />
        <span className="review-mode-text">{localMessage('REVIEW_MODE_LABELING')}</span>
        {labelingHovered && (
          <div className="review-mode-info">
            <p style={{ color: '#FFFFFF' }}>{localMessage('REVIEW_MODE_LABELING')}</p>
            <div>{localMessage('REVIEW_MODE_LABELING_TIP')}</div>
          </div>
        )}
      </div>
      <div
        className="review-mode-button"
        style={{
          ...store.config.reviewMode === ReviewMode.REVIEW && {
            backgroundColor: '#FFE600',
            color: '#363C4D',
          }
        }}
        onClick={() => store.config.setReviewMode(ReviewMode.REVIEW)}
        onMouseEnter={() => setReviewHovered(true)}
        onMouseLeave={() => setReviewHovered(false)}
      >
        <Validate />
        <span className="review-mode-text">{modeLabel}</span>
        {reviewHorvered && (
          <div className="review-mode-info">
            <p style={{ color: '#FFFFFF' }}>{modeLabel}</p>
            <div>{localMessage(toolMode === ToolMode.AUDIT_RW ? 'REVIEW_MODE_AUDIT_TIP' : 'REVIEW_MODE_QA_TIP')}</div>
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
                {localMessage('REVIEW_MODE_ALERT')}
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
            <div>{localMessage(toolMode === ToolMode.AUDIT_RW ? 'REVIEW_MODE_ALERT_INFO_AUDIT' : 'REVIEW_MODE_ALERT_INFO')}</div>
            <div className="footer">
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => closeAlert(true)}
              >
                {localMessage('REVIEW_MODE_ALERT_HIDE')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ReviewModeSwitch;
