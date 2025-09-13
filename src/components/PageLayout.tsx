import React from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  actions,
}) => {
  return (
    <div className="container-fluid">
      <div className="page-header-wrapper">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="page-title-wrapper">
            <h1 className="page-title">{title}</h1>
            {description && <p className="page-description">{description}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      </div>
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;