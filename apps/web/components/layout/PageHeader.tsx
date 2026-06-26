import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1">
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 && <span className="text-xs text-gray-600">/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-xs text-gray-500 transition-colors hover:text-[#4D9FFF]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-gray-400">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
