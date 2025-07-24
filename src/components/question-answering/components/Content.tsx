import React from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import cx from 'classnames';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Instruction from 'src/components/common/llm/instruction/Instruction';
import Answers from './answers';
import ChatItem, { ChatItemType } from '../../common/llm/chat/ChatItem';
import store from '../store';
import i18n from '../locales';

const Content: React.FC = observer(() => (
  <>
    <Instruction value={toJS(store.instruction)} />
    <ChatItem
      dragging={store.isDraggingAnswer}
      type={ChatItemType.Q}
      label="Q"
      value={toJS(store.question)}
    />
    <Answers />
    {store.initialized && !store.readonly && store.addible && (
      <ChatItem
        dragging={store.isDraggingAnswer}
        type={ChatItemType.A}
        label="A"
        error={store.isAddingAnswer && store.hasError}
        selected={store.isAddingAnswer}
        valueEditing={store.isAddingAnswer}
        noValueContent={(
          <div>
            <Button
              style={{ marginTop: store.canAddAnswer ? 4 : 0 }}
              disabled={!store.canAddAnswer}
              icon={<PlusOutlined />}
              onClick={store.addAnswer}
            >
              {i18n.translate('CHAT_ITEM_ADD')}
            </Button>
            {!store.canAddAnswer && (
              <div style={{ fontSize: 12, color: '#99A0B2', marginTop: 4 }}>
                {i18n.translate('CHAT_ITEM_MEET_LIMIT')}
              </div>
            )}
          </div>
        )}
        {...store.answers.length > 0 && {
          prefix: (
            <div
              className={cx('chat-item-sorter', {
                sortable: store.sortable,
              })}
            />
          ),
        }}
      />
    )}
  </>
));

export default Content;
