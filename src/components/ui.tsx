import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import Icon from "./Icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  fullWidth?: boolean;
};

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

type FormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
};

type NoticeProps = {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "button",
        "button--" + variant,
        "button--" + size,
        fullWidth ? "button--full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={"surface " + className} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function FormField({ label, htmlFor, hint, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && (
        <p id={htmlFor + "-hint"} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Notice({ tone = "error", children, className = "" }: NoticeProps) {
  return (
    <div
      className={"notice notice--" + tone + " " + className}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function LoadingState({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon ?? <Icon name="message" size={24} />}
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = "md" }: AvatarProps) {
  const text = name.trim() || "?";
  const tone =
    [...text].reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0) % 4;

  return (
    <span
      className={"avatar avatar--" + size}
      data-tone={tone}
      aria-hidden="true"
    >
      {[...text][0]}
    </span>
  );
}
