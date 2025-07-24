import React, { useContext } from 'react';
import { Button } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import cx from 'classnames';
import { Rank } from '../types';
import LocaleContext from '../locales/context';
import translate from '../locales';

interface MarkRankProps {
  options: string[];
  editable: boolean;
  editing: boolean;
  onEdit?: () => void;
  value?: Rank['marks'];
  onChange: (value: Rank['marks']) => void;
}

const MarkRank: React.FC<MarkRankProps> = ({
  options,
  editable,
  editing,
  onEdit,
  value,
  onChange,
}) => {
  const locale = useContext(LocaleContext);
  return (
    <div className="llm-chat-item-content-rank">
      {editing ? options.map((o) => (
        <span
          key={o}
          className={cx('llm-chat-item-content-rank-tag', {
            active: value?.includes(o),
          })}
          onClick={(e) => {
            e.stopPropagation();
            const set = new Set(value);
            if (set.has(o)) {
              set.delete(o);
            } else {
              set.add(o);
            }
            onChange(Array.from(set));
          }}
        >
          {o}
        </span>
      )) : (
        <>
          {options.map((o) => (value?.includes(o)
            ? (
              <span
                key={o}
                className="llm-chat-item-content-rank-tag outline"
              >
                {o}
              </span>
            )
            : null
          ))}
          {(!value || value.length === 0) && (
            <span>{translate(locale, 'CHAT_RANK_EMPTY')}</span>
          )}
          {editable && (
            <Button
              size="small"
              type="link"
              icon={<FormOutlined />}
              onClick={(e) => {
                if (onEdit) {
                  e.stopPropagation();
                  onEdit();
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MarkRank;
