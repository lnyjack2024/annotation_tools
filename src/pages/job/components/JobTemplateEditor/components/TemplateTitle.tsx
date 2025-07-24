import { Input, Form } from 'antd';

type Props = {
  title: string;
  onTitleChange: (val: string) => void;
  error?: string;
};
function TemplateTitle({ title, onTitleChange, error }: Props) {
  return (
    <Form.Item
      {...(error && {
        validateStatus: 'error',
        help: error,
      })}
    >
      <Input
        defaultValue={title}
        value={title}
        onChange={e => onTitleChange(e.target.value)}
      />
    </Form.Item>
  );
}

export default TemplateTitle;
