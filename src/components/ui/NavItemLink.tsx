import Link from "next/link";
import type { NavigationLink } from "@/lib/navigation-config";

/**
 * Một mục menu. Mục `planned` KHÔNG phải liên kết: hiển thị văn bản rõ ràng
 * "Đang xây dựng" để không có link chết và không giả vờ có chức năng.
 */
export function NavItemLink({
  item,
  current,
  className,
  onNavigate,
}: {
  item: NavigationLink;
  current?: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  if (item.status === "planned") {
    return (
      <span className={`nav-planned ${className ?? ""}`} aria-disabled="true">
        {item.label}
        <span className="nav-planned-badge">Đang xây dựng</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      className={className}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
}
