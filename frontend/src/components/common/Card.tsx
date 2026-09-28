import React from "react";

export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm ${className}`}
    >
      {header && (
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
