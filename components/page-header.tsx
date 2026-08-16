import Link from "next/link";
import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: {
    href: string;
    label: string;
  };
  children?: ReactNode;
};

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-normal text-[#070b21]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm font-medium text-[#766b64]">{description}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        {children}
        {action ? (
          <Link className="btn-primary" href={action.href}>
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
