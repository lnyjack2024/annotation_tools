import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import Dropdown from '../../../common/dropdown/Dropdown';
import { ReviewApprove, ReviewReject, ReviewSuspend } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewMode, ReviewResult } from '../../types';

const ReviewTool = observer(() => {
  const types = useMemo(() => store.review.reviewResultTypes.map((type, index) => {
    let icon = <ReviewApprove />;
    let name = i18n.translate('REVIEW_APPROVE');
    if (type === ReviewResult.REJECT) {
      icon = <ReviewReject />;
      name = i18n.translate('REVIEW_REJECT');
    } else if (type === ReviewResult.SUSPEND) {
      icon = <ReviewSuspend />;
      name = i18n.translate('REVIEW_SUSPEND');
    }
    return { type, hotkey: index + 1, icon, name };
  }), [store.review.reviewResultTypes]);

  if (!store.reviewable || store.config.reviewMode !== ReviewMode.REVIEW) {
    return null;
  }

  const selectedIndex = types.findIndex((i) => i.type === store.review.selectedReviewResultType);
  const menu = types.map(({ type, hotkey, icon, name }) => ({
    label: name,
    value: type,
    active: type === store.review.selectedReviewResultType,
    render: () => (
      <div className="create-tool-tool-item__label">
        <span className="create-tool-tool-item__shortcut">
          {hotkey}
        </span>
        <span className="create-tool-tool-item__icon tool-icon">
          {icon}
        </span>
        <span className="create-tool-tool-item__name">
          {name}
        </span>
      </div>
    ),
  }));
  return (
    <div className="create-tool">
      {i18n.translate('COMMON_CREATE')}
      <span onClick={() => store.review.setAddMode(true)}>
        <Dropdown
          className={cx('create-tool-selector', {
            active: store.review.addMode,
          })}
          arrow
          triggerArea="arrow"
          menu={menu}
          onClick={(n, i, item) => store.review.activateReview(item.value)}
        >
          {menu[selectedIndex]?.render()}
        </Dropdown>
      </span>
    </div>
  );
});

export default ReviewTool;
