import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import type { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import cx from 'classnames';
import { FormConfig } from '@appen-china/easy-form/es/types';
import ChatContent from './ChatContent';
import RankItem from './RankItem';
import AttributesItemConfig from './AttributesItem';
import OriginalValueContent from './OriginalValueContent';
import { Content, Rank, RankingType } from '../types';
import './ChatItem.scss';

export enum ChatItemType {
  Q = 'question',
  A = 'answer',
}

interface ChatItemProps {
  dragging?: boolean;
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
  type: ChatItemType;
  label?: string;
  value?: Content;
  onValueChange?: (value: Content) => void;
  originalValue?: Content;
  error?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  // value
  valueEditable?: boolean;
  valueEditing?: boolean;
  onValueEdit?: () => void;
  noValueContent?: React.ReactNode;
  // rank
  rankingType?: RankingType;
  rankingOptions?: string[];
  rankEditable?: boolean;
  rankEditing?: boolean;
  onRankEdit?: () => void;
  rank?: Rank;
  onRankChange?: (rank: Rank) => void;
  // prefix
  prefix?: React.ReactNode;
  // attributes
  itemAttributesConfig?: FormConfig;
  attributesEditing?: boolean;
  attributesEditable?: boolean;
  attributes?: any
  onItemAttributesEdit?: () => void;
  onItemAttributesDelete?: () => void;
  onItemAttributesChange?: (attributes: any) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  dragging = false,
  draggableProvided,
  draggableSnapshot,
  type,
  label,
  value,
  onValueChange,
  originalValue,
  error = false,
  selected = false,
  onSelect,
  valueEditable = false,
  valueEditing = false,
  onValueEdit,
  noValueContent,
  rankingType,
  rankingOptions = [],
  rankEditable = false,
  rankEditing = false,
  onRankEdit,
  rank,
  onRankChange,
  prefix,
  itemAttributesConfig,
  attributesEditing = false,
  attributesEditable = false,
  attributes,
  onItemAttributesEdit,
  onItemAttributesDelete,
  onItemAttributesChange,
}) => {
  const avatarRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (selected) {
      const item = avatarRef.current?.parentElement;
      const parent = item?.parentElement;
      if (!item || !parent) {
        return;
      }

      const overTop = item.offsetTop - parent.offsetTop < parent.scrollTop;
      const overBottom = (item.offsetTop - parent.offsetTop + item.clientHeight) > (parent.scrollTop + parent.clientHeight);
      const alignWithTop = overTop && !overBottom;
      if (overTop || overBottom) {
        item.scrollIntoView(alignWithTop);
      }
    }
  }, [selected]);

  return (
    <div
      {...draggableProvided?.draggableProps}
      ref={draggableProvided?.innerRef}
      className={cx('llm-chat-item', {
        'llm-q': type === ChatItemType.Q,
        'llm-a': type === ChatItemType.A,
        error,
        selected,
        hovered: hovered || draggableSnapshot?.isDragging,
      })}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        if (!dragging) {
          // not set hovered when dragging
          setHovered(true);
        }
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {prefix}
      <div ref={avatarRef} className="llm-chat-item-avatar">
        {label || (type === ChatItemType.Q ? 'Q' : 'A')}
      </div>
      {(value || valueEditing) ? (
        <div className="llm-chat-item-content-container">
          <div
            className={cx('llm-chat-item-content', {
              editing: valueEditing,
            })}
          >
            <ChatContent
              type={type}
              content={value}
              onContentChange={(newContent) => {
                if (valueEditable && !valueEditing && onValueChange) {
                  onValueChange(newContent);
                }
              }}
            />
          </div>
          {valueEditable && !valueEditing && hovered && (
            <div className="llm-chat-item-content-btns">
              <Button
                size="small"
                type="link"
                icon={<FormOutlined />}
                onClick={(e) => {
                  if (onValueEdit) {
                    e.stopPropagation();
                    onValueEdit();
                  }
                }}
              />
            </div>
          )}
          <OriginalValueContent originalValue={originalValue} value={value} />
          {rankingType && rankingOptions.length > 0 && (
            <RankItem
              rankingType={rankingType}
              rankingOptions={rankingOptions}
              rankEditable={rankEditable && hovered}
              rankEditing={rankEditing}
              onRankEdit={onRankEdit}
              rank={rank}
              onRankChange={onRankChange}
            />
          )}
          {
            itemAttributesConfig && (
              <AttributesItemConfig
                attributesEditing={attributesEditing}
                config={itemAttributesConfig}
                attributesEditable={attributesEditable && hovered}
                attributes={attributes}
                onEdit={onItemAttributesEdit}
                onDelete={onItemAttributesDelete}
                onChange={(val) => {
                  if (onItemAttributesChange) {
                    onItemAttributesChange(val);
                  }
                }}
              />
            )
          }
        </div>
      ) : noValueContent}
    </div>
  );
};

export default ChatItem;
