import { Dropdown } from 'antd';
import type { ColorResult } from 'react-color';
import { CompactPicker } from 'react-color';

interface ColorPickerProps {
  width?: number;
  value?: string;
  onChange?: (color: string) => void;
}

/**
 * color picker (can be used in antd form)
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  width = 88,
  value,
  onChange,
}) => {
  const handleColorPickComplete = (color: ColorResult) => {
    if (onChange) {
      onChange(color.hex);
    }
  };

  return (
    <Dropdown
      trigger={['click']}
      overlay={() => (
        <CompactPicker
          styles={{ default: { compact: { width: 280 } } }}
          color={value}
          onChangeComplete={handleColorPickComplete}
        />
      )}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCDFE3',
          borderRadius: 2,
          width,
          height: 32,
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: value,
          }}
        />
      </div>
    </Dropdown>
  );
};

export default ColorPicker;
