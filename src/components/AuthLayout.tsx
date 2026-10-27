import type { ReactNode } from "react";
import Brand from "./Brand";
import Icon from "./Icon";
import { Avatar } from "./ui";

type AuthLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({
  eyebrow = "WELCOME TO JPUS",
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <section className="auth-story" aria-label="JPUS 소개">
        <Brand />
        <div className="auth-story-content">
          <span className="auth-story-label">
            <span /> YOUR SPACE, YOUR PERSONAS
          </span>
          <h2>
            하나의 나로
            <br />
            설명되지 않는
            <br />
            <em>우리의 이야기.</em>
          </h2>
          <p>
            취향도, 관심사도, 이야기하는 모습도.
            <br />
            다양한 페르소나로 나만의 이야기를 나눠보세요.
          </p>
          <div className="auth-personas" aria-hidden="true">
            <div className="auth-persona">
              <Avatar name="오늘" size="lg" />
              <span>오늘의 나</span>
              <Icon name="sparkles" size={16} />
            </div>
            <div className="auth-persona">
              <Avatar name="시선" size="lg" />
              <span>새로운 시선</span>
              <Icon name="message" size={16} />
            </div>
            <div className="auth-persona">
              <Avatar name="다른" size="lg" />
              <span>조금 다른 나</span>
              <Icon name="pen" size={16} />
            </div>
          </div>
        </div>
        <p className="auth-story-footer">
          A little more you. <span>JPUS COMMUNITY</span>
        </p>
      </section>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-panel">
          <header className="auth-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
        <p className="auth-bottom-note">
          <Icon name="users" size={15} /> 나의 다양한 모습을 만나는 공간
        </p>
      </main>
    </div>
  );
}
