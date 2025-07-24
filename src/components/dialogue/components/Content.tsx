import React from 'react';
import { observer } from 'mobx-react';
import { toJS } from 'mobx';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Instruction from '../../common/llm/instruction/Instruction';
import ChatItem, { ChatItemType } from '../../common/llm/chat/ChatItem';
import store from '../store';
import i18n from '../locales';

const Content: React.FC = observer(() => (
  <>
    <Instruction value={toJS(store.instruction)} />
    {store.dialogue.map((dialogueItem) => {
      const selected = dialogueItem.id === store.selectedDialogueItem?.id;
      const valueEditable = !store.readonly && (!dialogueItem.original || store.editable);
      return (
        <ChatItem
          key={dialogueItem.id}
          type={dialogueItem.type}
          label={dialogueItem.type === ChatItemType.A ? 'B' : 'A'}
          value={toJS(dialogueItem.value)}
          onValueChange={(value) => store.updateDialogueItem(dialogueItem, value)}
          originalValue={toJS(dialogueItem.originalValue)}
          error={selected && store.hasError}
          selected={selected}
          onSelect={() => store.selectDialogueItem(dialogueItem)}
          valueEditable={valueEditable}
          valueEditing={selected && store.isEditing}
          onValueEdit={() => store.editDialogueItem(dialogueItem)}
          {...dialogueItem.type === ChatItemType.A && {
            rankingType: store.rankingType,
            rankingOptions: toJS(store.rankingOptions),
            rankEditable: !store.readonly && store.ranking,
            rankEditing: selected && store.isRanking,
            onRankEdit: () => store.rankDialogueItem(dialogueItem),
            rank: toJS(dialogueItem.rank),
            onRankChange: (rank) => store.saveRank(dialogueItem, rank),
            attributesEditable: !store.readonly,
            itemAttributesConfig: store.itemAttributesConfig,
            attributesEditing: selected && store.isItemAttributesEditing,
            attributes: toJS(dialogueItem.attributes),
            onItemAttributesEdit: () => store.onItemAttributesEdit(dialogueItem),
            onItemAttributesChange: (attributes) => store.saveItemAttributes(dialogueItem, attributes),
            onItemAttributesDelete: () => store.deleteItemAttributes(dialogueItem),
          }}
        />
      );
    })}
    {store.initialized && !store.readonly && store.addible && (
      <ChatItem
        type={store.nextDialogueItemType}
        label={store.nextDialogueItemType === ChatItemType.A ? 'B' : 'A'}
        error={store.isAdding && store.hasError}
        selected={store.isAdding}
        valueEditing={store.isAdding}
        noValueContent={(
          <div className="llm-chat-item-content-container">
            <Button
              style={{ marginTop: store.canAddDialogueItem ? 4 : 0 }}
              disabled={!store.canAddDialogueItem}
              icon={<PlusOutlined />}
              onClick={store.addDialogueItem}
            >
              {i18n.translate('CHAT_ITEM_ADD')}
            </Button>
            {!store.canAddDialogueItem && (
              <div
                style={{
                  fontSize: 12,
                  color: '#99A0B2',
                  marginTop: 4,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'inherit',
                }}
              >
                {i18n.translate('CHAT_ITEM_MEET_LIMIT')}
              </div>
            )}
          </div>
        )}
      />
    )}
  </>
));

export default Content;
