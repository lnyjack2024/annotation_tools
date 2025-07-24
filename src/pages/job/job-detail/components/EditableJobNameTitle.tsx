import React, { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';

type Props = {
  jobName: string;
  allowEdit?: boolean;
  onSave?: (
    updatedJobName: string,
    setLoading?: (loading: boolean) => void,
    setEditMode?: (editMode: boolean) => void,
  ) => void;
};

function isEmptyValue(val: string): boolean {
  if (val && val.trim()) {
    return true;
  }

  return false;
}

const EditableJobNameTitle: React.FC<Props> = ({
  jobName,
  allowEdit = false,
  onSave,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedName, setEditedName] = useState(jobName);

  useEffect(() => {
    setEditedName(jobName);
  }, [jobName]);

  const handleSave = () => {
    if (onSave && isEmptyValue(editedName)) {
      onSave(editedName, setLoading, setEditMode);
    }
  };

  return (
    <>
      <span style={{ verticalAlign: 'middle', paddingRight: 5 }}>
        {editMode ? (
          <Input
            style={{
              width: 320,
              boxShadow: 'none',
              ...(!isEmptyValue(editedName) && { borderColor: '#df3636' }),
            }}
            disabled={loading}
            defaultValue={editedName}
            onChange={e => setEditedName(e.target.value)}
            onPressEnter={handleSave}
          />
        ) : (
          <span>{jobName}</span>
        )}
      </span>
      {allowEdit &&
        (editMode ? (
          <>
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={handleSave}
              loading={loading}
              style={{ color: '#0ead68' }}
            />
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={() => setEditMode(false)}
              disabled={loading}
              style={{ color: '#df3636' }}
            />
          </>
        ) : (
          <Button
            type="link"
            icon={<EditOutlined />}
            style={{ marginRight: 8 }}
            onClick={e => {
              e.preventDefault();
              setEditMode(true);
            }}
          />
        ))}
    </>
  );
};

export default EditableJobNameTitle;
