import type { HeaderWrapperProps } from '@/components/HeaderContentWrapper/HeaderWrapper';
import HeaderWrapperComponent from '@/components/HeaderContentWrapper/HeaderWrapper';
import type { ContentWrapperProps } from '@/components/HeaderContentWrapper/ContentWrapper';
import ContentWrapperComponent from '@/components/HeaderContentWrapper/ContentWrapper';

export interface HeaderContentWrapperProps
  extends HeaderWrapperProps,
    ContentWrapperProps {}

export default function HeaderContentWrapperComponent({
  title,
  titleIcon,
  backTitle,
  content,
  actions,
  children,
  onBack,
  menuItems,
  defaultSelectedKeys,
}: HeaderContentWrapperProps) {
  return (
    <div>
      <HeaderWrapperComponent
        title={title}
        backTitle={backTitle}
        actions={actions}
        content={content}
        onBack={onBack}
        titleIcon={titleIcon}
      />
      <ContentWrapperComponent
        menuItems={menuItems}
        defaultSelectedKeys={defaultSelectedKeys}
      >
        {children}
      </ContentWrapperComponent>
    </div>
  );
}
