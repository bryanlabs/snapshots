import Link from "next/link";
import { ChevronRightIcon } from "../icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => (
  <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
    {items.map((item, index) => (
      <div key={index} className="flex items-center">
        {index > 0 && <ChevronRightIcon />}
        {item.href ? (
          <Link
            href={item.href}
            className="hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
        ) : (
          <span className="text-foreground font-medium">{item.label}</span>
        )}
      </div>
    ))}
  </nav>
);
