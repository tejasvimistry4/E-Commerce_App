import React from "react";
import { Link } from "react-router-dom";

export type BreadcrumbSeparatorType = "slash" | "chevron" | "dot" | "arrow";
export type BreadcrumbSize = "xs" | "sm" | "md";
export type BreadcrumbTheme = "light" | "dark" | "purple";

export interface BreadcrumbItem {
  label: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
  active?: boolean;
  className?: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  children?: React.ReactNode;
  separator?: React.ReactNode;
  separatorType?: BreadcrumbSeparatorType;
  size?: BreadcrumbSize;
  theme?: BreadcrumbTheme;
  showHomeIcon?: boolean;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  separatorClassName?: string;
  ariaLabel?: string;
}

export interface BreadcrumbItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  to?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  icon?: React.ReactNode;
  theme?: BreadcrumbTheme;
  className?: string;
  children?: React.ReactNode;
}

export interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  type?: BreadcrumbSeparatorType;
  className?: string;
  theme?: BreadcrumbTheme;
}

export const BreadcrumbSeparator: React.FC<BreadcrumbSeparatorProps> = ({
  children,
  type = "slash",
  className = "",
  theme = "light",
}) => {
  const themeSeparatorColor = {
    light: "text-slate-300",
    dark: "text-slate-600",
    purple: "text-purple-300/80",
  };

  const renderDefaultIcon = () => {
    switch (type) {
      case "chevron":
        return (
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        );
      case "dot":
        return <span className="inline-block w-1 h-1 rounded-full bg-slate-300 mx-1" />;
      case "arrow":
        return <span className="text-slate-400 font-mono">→</span>;
      case "slash":
      default:
        return <span>/</span>;
    }
  };

  return (
    <span
      className={`inline-flex items-center select-none ${themeSeparatorColor[theme]} ${className}`}
      aria-hidden="true"
    >
      {children || renderDefaultIcon()}
    </span>
  );
};

export const BreadcrumbItemComponent: React.FC<BreadcrumbItemProps> = ({
  to,
  href,
  onClick,
  active = false,
  icon,
  theme = "light",
  className = "",
  children,
  ...props
}) => {
  const themeStyles = {
    light: {
      link: "text-slate-500 hover:text-indigo-600",
      active: "text-slate-900 font-bold",
    },
    dark: {
      link: "text-slate-400 hover:text-white",
      active: "text-white font-bold",
    },
    purple: {
      link: "text-indigo-600/80 hover:text-indigo-900",
      active: "text-indigo-950 font-bold",
    },
  };

  const content = (
    <span className="inline-flex items-center gap-1.5 truncate">
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );

  return (
    <li
      className={`inline-flex items-center text-inherit ${className}`}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {active ? (
        <span className={`${themeStyles[theme].active} truncate`}>{content}</span>
      ) : to ? (
        <Link
          to={to}
          onClick={onClick}
          className={`${themeStyles[theme].link} transition-colors font-medium flex items-center`}
        >
          {content}
        </Link>
      ) : href ? (
        <a
          href={href}
          onClick={onClick}
          className={`${themeStyles[theme].link} transition-colors font-medium flex items-center`}
        >
          {content}
        </a>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={`${themeStyles[theme].link} transition-colors font-medium flex items-center cursor-pointer text-left`}
        >
          {content}
        </button>
      ) : (
        <span className={`${themeStyles[theme].active} truncate`}>{content}</span>
      )}
    </li>
  );
};

export const Breadcrumb: React.FC<BreadcrumbProps> & {
  Item: typeof BreadcrumbItemComponent;
  Separator: typeof BreadcrumbSeparator;
} = ({
  items,
  children,
  separator,
  separatorType = "slash",
  size = "xs",
  theme = "light",
  className = "",
  itemClassName = "",
  activeItemClassName = "",
  separatorClassName = "",
  ariaLabel = "Breadcrumb",
}) => {
  const sizeStyles: Record<BreadcrumbSize, string> = {
    xs: "text-xs space-x-2",
    sm: "text-xs sm:text-sm space-x-2.5",
    md: "text-sm space-x-3",
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex items-center ${sizeStyles[size]} flex-wrap gap-y-1 ${className}`}
    >
      <ol className={`flex items-center ${sizeStyles[size]} flex-wrap gap-y-1`}>
        {items
          ? items.map((item, index) => {
              const isLast = index === items.length - 1;
              const isActive = item.active ?? isLast;

              return (
                <React.Fragment key={index}>
                  <BreadcrumbItemComponent
                    to={item.to}
                    href={item.href}
                    onClick={item.onClick}
                    active={isActive}
                    icon={item.icon}
                    theme={theme}
                    className={`${itemClassName} ${isActive ? activeItemClassName : ""} ${item.className || ""}`}
                  >
                    {item.label}
                  </BreadcrumbItemComponent>

                  {!isLast && (
                    <BreadcrumbSeparator
                      type={separatorType}
                      theme={theme}
                      className={separatorClassName}
                    >
                      {separator}
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              );
            })
          : children}
      </ol>
    </nav>
  );
};

Breadcrumb.Item = BreadcrumbItemComponent;
Breadcrumb.Separator = BreadcrumbSeparator;

export default Breadcrumb;
