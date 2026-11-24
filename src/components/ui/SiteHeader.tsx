"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteBrand } from "./SiteBrand";
import {
  MATERIALS_HUB_LINK,
  LEARNING_PATH_LINKS,
  LEARNING_PHASE_GROUPS,
  PUBLIC_TOOL_GROUPS,
  PUBLIC_TOOL_LINKS,
} from "@/lib/navigation-config";
import { NavItemLink } from "./NavItemLink";
import styles from "./SiteChrome.module.css";

function HeaderNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const phaseMenu = useRef<HTMLDetailsElement>(null);
  const toolsMenu = useRef<HTMLDetailsElement>(null);
  const toolsActive = PUBLIC_TOOL_LINKS.some((item) => pathname === item.href.split(/[?#]/)[0]);
  const phaseActive = LEARNING_PATH_LINKS.some((item) => pathname === item.href.split(/[?#]/)[0]);

  useEffect(() => {
    if (open)
      navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (
        toolsMenu.current &&
        !toolsMenu.current.contains(event.target as Node)
      )
        toolsMenu.current.open = false;
      if (
        phaseMenu.current &&
        !phaseMenu.current.contains(event.target as Node)
      )
        phaseMenu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={styles.mobileMenu}
        aria-label={open ? "Đóng menu" : "Mở menu"}
        aria-expanded={open}
        aria-controls="public-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        Menu <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <nav
        ref={navigation}
        id="public-navigation"
        className={styles.navigation}
        data-open={open}
        aria-label="Điều hướng công khai"
        onClick={(event) => {
          if ((event.target as Element).closest("a")) {
            setOpen(false);
            if (toolsMenu.current) toolsMenu.current.open = false;
            if (phaseMenu.current) phaseMenu.current.open = false;
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          if (open) {
            setOpen(false);
            trigger.current?.focus();
          } else if (toolsMenu.current?.open) {
            toolsMenu.current.open = false;
            toolsMenu.current.querySelector("summary")?.focus();
          } else if (phaseMenu.current?.open) {
            phaseMenu.current.open = false;
            phaseMenu.current.querySelector("summary")?.focus();
          }
        }}
      >
        <Link
          href={MATERIALS_HUB_LINK.href}
          className={styles.navLink}
          aria-current={pathname === MATERIALS_HUB_LINK.href ? "page" : undefined}
        >
          {MATERIALS_HUB_LINK.label}
        </Link>

        <details
          className={styles.toolsMenu}
          ref={phaseMenu}
        >
          <summary className={styles.navLink} data-active={phaseActive}>
            3 giai đoạn học tập <span aria-hidden="true">⌄</span>
          </summary>
          <div className={styles.toolsLinks}>
            {LEARNING_PHASE_GROUPS.map((group) => (
              <div key={group.id} className={styles.toolsGroup}>
                <p className={styles.toolsGroupLabel} role="presentation">
                  {group.label}
                  <span aria-hidden="true"> · {group.description}</span>
                </p>
                {group.links.map((item) => (
                  <NavItemLink key={item.label} item={item} current={pathname === item.href} />
                ))}
              </div>
            ))}
          </div>
        </details>

        <details className={styles.toolsMenu} ref={toolsMenu}>
          <summary className={styles.navLink} data-active={toolsActive}>
            Công cụ <span aria-hidden="true">⌄</span>
          </summary>
          <div className={styles.toolsLinks}>
            {PUBLIC_TOOL_GROUPS.map((group) => (
              <div key={group.id} className={styles.toolsGroup}>
                <p className={styles.toolsGroupLabel} role="presentation">
                  {group.label}
                  <span aria-hidden="true"> · {group.description}</span>
                </p>
                {group.links.map((item) => (
                  <NavItemLink key={item.label} item={item} current={pathname === item.href} />
                ))}
              </div>
            ))}
          </div>
        </details>

        <div className={styles.account}>
          <Link
            className="btn small"
            href="/login"
            aria-current={pathname === "/login" ? "page" : undefined}
          >
            Đăng nhập
          </Link>
          <Link
            className="btn primary small"
            href="/register"
            aria-current={pathname === "/register" ? "page" : undefined}
          >
            Đăng ký
          </Link>
        </div>
      </nav>
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <SiteBrand />
        <HeaderNavigation key={pathname} pathname={pathname} />
      </div>
    </header>
  );
}

export function PublicWorkspaceContext() {
  const pathname = usePathname();
  const current = [
    MATERIALS_HUB_LINK,
    ...LEARNING_PATH_LINKS,
    ...PUBLIC_TOOL_LINKS,
  ].find((item) => item.status !== "planned" && item.href.split(/[?#]/)[0] === pathname);
  return (
    <nav className="breadcrumbs" aria-label="Đường dẫn trang">
      <Link href="/">Trang chủ</Link>
      <span aria-hidden="true">/</span>
      {pathname !== "/hoc-lieu" && (
        <>
          <Link href="/hoc-lieu">Kho học liệu</Link>
          <span aria-hidden="true">/</span>
        </>
      )}
      <strong aria-current="page">{current?.label ?? "Học liệu"}</strong>
    </nav>
  );
}
