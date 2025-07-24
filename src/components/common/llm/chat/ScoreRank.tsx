import React, { useContext } from 'react';
import { Button, Rate } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { Rank } from '../types';
import LocaleContext from '../locales/context';
import translate from '../locales';

interface ScoreRankProps {
  options: string[];
  editable: boolean;
  editing: boolean;
  onEdit?: () => void;
  value?: Rank['scores'];
  onChange: (value: Rank['scores']) => void;
}

const ScoreRank: React.FC<ScoreRankProps> = ({
  options,
  editable,
  editing,
  onEdit,
  value,
  onChange,
}) => {
  const locale = useContext(LocaleContext);
  const missValue = options.some((o) => value?.[o] === undefined);
  return (
    <div className="llm-chat-item-content-rank">
      {(editing || missValue) ? options.map((o) => (
        <div key={o} onClick={(e) => e.stopPropagation()}>
          <span style={{ color: '#F56C6C', paddingRight: 2 }}>*</span>
          <span style={{ paddingRight: 12 }}>
            {o}
          </span>
          <Rate
            value={value?.[o]}
            onChange={(v) => onChange({ ...value, [o]: v })}
          />
        </div>
      )) : (
        <>
          {options.map((o) => (
            <span key={o} style={{ paddingRight: 12 }}>
              {`${o}: ${value?.[o] === undefined ? '' : translate(locale, 'CHAT_RANK_SCORE', { values: { score: value[o] } })}`}
            </span>
          ))}
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

export default ScoreRank;
