"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PublicShell } from "@/app/PublicShell";
import { PublicWorkspaceContext } from "@/components/ui/SiteHeader";
import { SiteBrand } from "@/components/ui/SiteBrand";
import { SiteFooter } from "@/components/ui/SiteFooter";
import Link from "next/link";
import { AIStudyHelp } from "@/components/learning/AIStudyHelp";
import { GRADE_12_CURRICULUM } from "@/lib/curriculum";
import {
  TEACHER_NAVIGATION,
  STUDENT_NAVIGATION,
  TEACHER_MATERIALS_SUBMENU,
  STUDENT_MATERIALS_SUBMENU,
  type PortalNavItem,
  type NavigationLink,
} from "@/lib/navigation-config";

export type PortalRole = "teacher" | "student";
export type PortalSection =
  | "overview"
  | "classes"
  | "curriculum"
  | "lessons"
  | "materials"
  | "students"
  | "assignments"
  | "journal"
  | "plans"
  | "tutor";

const navigation: Record<PortalRole, PortalNavItem[]> = {
  teacher: TEACHER_NAVIGATION,
  student: STUDENT_NAVIGATION,
};

const materialsSubmenu: Record<PortalRole, NavigationLink[]> = {
  teacher: TEACHER_MATERIALS_SUBMENU,
  student: STUDENT_MATERIALS_SUBMENU,
};

function Navigation({
  role,
  active,
  onNavigate,
}: {
  role: PortalRole;
  active: PortalSection;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const submenuId = useId(),
    curriculumId = useId();
  const selectedSection =
    role === "student" && active === "lessons" ? "classes" : active;
  const [materialsExpanded, setMaterialsExpanded] = useState(
    active === "materials"
  );
  const [curriculumExpanded, setCurriculumExpanded] = useState(
    active === "curriculum"
  );

  function current(href: string) {
    const [urlPath, query] = href.split("?");
    if (pathname !== urlPath) return false;
    const expected = new URLSearchParams(query);
    return ["type", "chuong", "phase"].every(
      (key) => search.get(key) === expected.get(key)
    );
  }

  return (
    <nav className="portal-nav" aria-label="Điều hướng chính">
      {navigation[role].map((item) => {
        if (item.section === "curriculum")
          return (
            <div key={item.href} className="portal-nav-group">
              <button
                type="button"
                className={
                  "portal-material-toggle " +
                  (selectedSection === "curriculum" ? "is-active" : "")
                }
                aria-expanded={curriculumExpanded}
                aria-controls={curriculumId}
                onClick={() => setCurriculumExpanded((value) => !value)}
              >
                {item.label}
                <span aria-hidden="true">{curriculumExpanded ? "−" : "+"}</span>
              </button>
              {curriculumExpanded && (
                <div
                  id={curriculumId}
                  className="portal-subnav"
                  aria-label="Bốn chương Vật lí 12"
                >
                  <Link
                    className="portal-subnav-link"
                    href={item.href}
                    aria-current={current(item.href) ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    Tất cả chương
                  </Link>
                  {GRADE_12_CURRICULUM.map((chapter) => {
                    const href =
                      role === "teacher"
                        ? "/teacher/curriculum?chuong=" + chapter.code
                        : "/student/curriculum/" + chapter.code;
                    return (
                      <Link
                        key={chapter.code}
                        className="portal-subnav-link"
                        href={href}
                        aria-current={
                          current(href) ||
                          pathname === "/teacher/curriculum/" + chapter.code
                            ? "page"
                            : undefined
                        }
                        onClick={onNavigate}
                      >
                        Chương {chapter.number}: {chapter.shortTitle}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );

        if (item.section === "materials")
          return (
            <div key={item.href} className="portal-nav-group">
              <button
                type="button"
                className={
                  "portal-material-toggle " +
                  (selectedSection === "materials" ? "is-active" : "")
                }
                aria-expanded={materialsExpanded}
                aria-controls={submenuId}
                onClick={() => setMaterialsExpanded((value) => !value)}
              >
                {item.label}
                <span aria-hidden="true">{materialsExpanded ? "−" : "+"}</span>
              </button>
              {materialsExpanded && (
                <div
                  id={submenuId}
                  className="portal-subnav"
                  aria-label="Học liệu 3 giai đoạn"
                >
                  {materialsSubmenu[role].map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="portal-subnav-link"
                      aria-current={current(sub.href) ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={
              item.section === selectedSection ? "page" : undefined
            }
            className={item.section === selectedSection ? "is-active" : ""}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="portal-nav-footer">
        <Link href="/hoc-lieu" onClick={onNavigate}>
          Kho học liệu công khai ↗
        </Link>
      </div>
    </nav>
  );
}

function WorkspaceNavigation(props: Parameters<typeof Navigation>[0]) {
  return (
    <Suspense
      fallback={
        <p className="portal-nav-loading" role="status">
          Đang mở điều hướng…
        </p>
      }
    >
      <Navigation {...props} />
    </Suspense>
  );
}

export function PortalShell({
  role,
  active,
  children,
  account,
  publicLibrary = false,
  aiLessonCode,
  floatingTutor = true,
}: {
  role: PortalRole;
  active: PortalSection;
  children: ReactNode;
  account: ReactNode;
  publicLibrary?: boolean;
  aiLessonCode?: string;
  floatingTutor?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopTrigger = useRef<HTMLButtonElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const triggerEl = mobileTrigger.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleDrawerKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0],
        last = controls.at(-1);
      if (!first || !last) return;
      const outside = !drawer.current?.contains(document.activeElement);
      if (
        outside ||
        (event.shiftKey
          ? document.activeElement === first
          : document.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", handleDrawerKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDrawerKey);
      triggerEl?.focus();
    };
  }, [mobileOpen]);

  if (publicLibrary)
    return (
      <PublicShell floatingTutor={floatingTutor} aiLessonCode={aiLessonCode}>
        <div className="public-workspace">
          <PublicWorkspaceContext />
          {children}
        </div>
      </PublicShell>
    );

  const label = sidebarOpen ? "Ẩn menu" : "Hiện menu";
  return (
    <div
      className={`portal-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      data-role={role}
    >
      <a className="skip-link" href="#main-content">
        Đi đến nội dung chính
      </a>

      <header className="portal-topbar" inert={mobileOpen}>
        <div className="topbar-left">
          <button
            ref={desktopTrigger}
            type="button"
            className="menu-toggle desktop-toggle"
            aria-label={label}
            aria-expanded={sidebarOpen}
            aria-controls="portal-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <button
            ref={mobileTrigger}
            type="button"
            className="menu-toggle mobile-toggle"
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            aria-controls="portal-mobile-menu"
            onClick={() => setMobileOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <SiteBrand href={role === "teacher" ? "/teacher" : "/student"} />
        </div>
        <div className="portal-account">{account}</div>
      </header>

      <div className="portal-body">
        <aside
          id="portal-sidebar"
          className="portal-sidebar"
          aria-label="Thanh điều hướng"
          inert={mobileOpen}
        >
          <div className="portal-sidebar-context">
            {role === "teacher" ? "Không gian giáo viên" : "Không gian học sinh"}
          </div>
          <WorkspaceNavigation role={role} active={active} />
        </aside>

        {mobileOpen ? (
          <div
            className="drawer-layer"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setMobileOpen(false);
            }}
          >
            <aside
              ref={drawer}
              id="portal-mobile-menu"
              className="portal-drawer"
              aria-label="Menu di động"
              role="dialog"
              aria-modal="true"
            >
              <div className="drawer-heading">
                <strong>
                  {role === "teacher"
                    ? "Không gian giáo viên"
                    : "Không gian học sinh"}
                </strong>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Đóng menu"
                  onClick={() => setMobileOpen(false)}
                >
                  ×
                </button>
              </div>
              <WorkspaceNavigation
                role={role}
                active={active}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <main id="main-content" className="portal-main" inert={mobileOpen}>
          {children}
        </main>
      </div>
      <SiteFooter compact />
      {floatingTutor && (
        <div inert={mobileOpen}>
          <AIStudyHelp
            key={aiLessonCode || "general"}
            publicLibrary={publicLibrary}
            defaultLessonCode={aiLessonCode}
          />
        </div>
      )}
    </div>
  );
}
