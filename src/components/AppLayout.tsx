import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { getMe } from "../api/auth";
import { getPersonas } from "../api/persona";
import Brand from "./Brand";
import Icon from "./Icon";
import { Avatar } from "./ui";

const navigation = [
  { to: "/", label: "피드", icon: "home" },
  { to: "/posts", label: "글쓰기", icon: "pen" },
  { to: "/persona", label: "나의 페르소나", icon: "users" },
] as const;

export default function AppLayout() {
  const { pathname } = useLocation();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: personas } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
  });
  const persona = personas?.find(
    (item) => item.id === Number(localStorage.getItem("personaId")),
  );
  const section = pathname.startsWith("/persona")
    ? "나의 페르소나"
    : pathname === "/posts"
      ? "새 이야기"
      : "커뮤니티";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-caption">MY SPACE</div>
        <nav className="main-nav" aria-label="주 메뉴">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to !== "/persona"}
              className={({ isActive }) =>
                "nav-item " + (isActive ? "nav-item--active" : "")
              }
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              <span className="nav-indicator" aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <Icon name="sparkles" size={19} />
          </span>
          <p>
            하나의 계정,
            <br />
            <strong>다양한 나의 모습.</strong>
          </p>
          <span>오늘은 어떤 나로 이야기할까요?</span>
          <Link to="/persona">
            페르소나 둘러보기 <Icon name="arrow-up-right" size={14} />
          </Link>
        </div>
        <div className="sidebar-account">
          <Avatar name={me?.nickname ?? "나"} size="sm" />
          <div>
            <strong>{me?.nickname ?? "내 계정"}</strong>
            <span>내 계정</span>
          </div>
          <span className="account-dot" title="로그인됨" />
        </div>
        <p className="sidebar-footer">A little more you. JPUS.</p>
      </aside>
      <div className="app-workspace">
        <header className="topbar">
          <div className="topbar-context">
            <span className="desktop-only">나의 공간</span>
            <span className="topbar-divider desktop-only">/</span>
            <span>{section}</span>
          </div>
          <Link
            to="/persona"
            className="persona-switch"
            aria-label="활동할 페르소나 선택"
          >
            <Avatar name={persona?.displayName ?? "?"} size="sm" />
            <span>
              <small>활동 중인 페르소나</small>
              <strong>{persona?.displayName ?? "페르소나 선택"}</strong>
            </span>
            <Icon name="chevron-down" size={16} />
          </Link>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>JPUS</span>
          <span>저마다의 모습으로, 함께 나누는 이야기.</span>
        </footer>
      </div>
    </div>
  );
}
