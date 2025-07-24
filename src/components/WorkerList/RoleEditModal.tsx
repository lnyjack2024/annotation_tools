import { useIntl } from "@umijs/max";
import { Checkbox } from "antd";
import MaterialModal from "@/components/MaterialModal";
import { Role } from "@/types/auth";
import { useEffect, useState } from "react";
import { User } from "@/types/user";

type Props = {
  roles: Role[];
  user: User;
  onClose: () => void;
  onUpdate: (v: number[]) => void;
};

function RoleEditModal({ roles, user, onClose, onUpdate }: Props) {
  const { formatMessage } = useIntl();
  const [selectedValue, setSelectedValue] = useState<number[]>([]);

  useEffect(() => {
    setSelectedValue(user?.role || []);
  }, [user]);

  return (
    <MaterialModal
      title={formatMessage({ id: "menu.project-admin.access-control" })}
      visible={!!user}
      onClose={onClose}
      onSave={() => onUpdate(selectedValue)}
      disabled={selectedValue.length === 0}
    >
      <Checkbox.Group
        value={selectedValue}
        onChange={(v) => setSelectedValue(v as number[])}
      >
        {roles.map((item) => (
          <Checkbox key={item.id} value={item.id}>
            {formatMessage({ id: `common.role.${item.name}` })}
          </Checkbox>
        ))}
      </Checkbox.Group>
    </MaterialModal>
  );
}

export default RoleEditModal;
