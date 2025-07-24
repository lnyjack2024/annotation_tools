import React from 'react';
import { Rank, RankingType } from '../types';
import ScoreRank from './ScoreRank';
import MarkRank from './MarkRank';

interface RankItemProps {
  rankingType: RankingType;
  rankingOptions: string[];
  rankEditable: boolean;
  rankEditing: boolean;
  onRankEdit?: () => void;
  rank?: Rank;
  onRankChange?: (rank: Rank) => void;
}

const RankItem: React.FC<RankItemProps> = ({
  rankingType,
  rankingOptions,
  rankEditable,
  rankEditing,
  onRankEdit,
  rank,
  onRankChange,
}) => {
  if (rankingType === RankingType.SCORE) {
    return (
      <ScoreRank
        options={rankingOptions}
        editable={rankEditable}
        editing={rankEditing}
        onEdit={onRankEdit}
        value={rank?.scores}
        onChange={(scores) => {
          if (onRankChange) {
            onRankChange({ ...rank, scores });
          }
        }}
      />
    );
  }

  if (rankingType === RankingType.MARK) {
    return (
      <MarkRank
        options={rankingOptions}
        editable={rankEditable}
        editing={rankEditing}
        onEdit={onRankEdit}
        value={rank?.marks}
        onChange={(marks) => {
          if (onRankChange) {
            onRankChange({ ...rank, marks });
          }
        }}
      />
    );
  }

  return null;
};

export default RankItem;
