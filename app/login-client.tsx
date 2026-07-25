"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = "teacher" | "student";
type Mode = "login" | "signup";

const errorMessages: Record<string, string> = {
  google_not_configured: "구글 로그인이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.",
  google_failed: "구글 로그인에 실패했습니다. 다시 시도해 주세요.",
  kakao_not_configured: "카카오 로그인이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.",
  kakao_failed: "카카오 로그인에 실패했습니다. 다시 시도해 주세요.",
};

export default function LoginClient() {
  const [role, setRole] = useState<Role>("student");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorKey = params.get("error");
    if (errorKey) setError(errorMessages[errorKey] ?? "로그인 중 문제가 발생했습니다.");
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitState("sending");
    setError(null);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { email, password } : { email, password, name, role, code };
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다.");
      setSubmitState("idle");
    }
  };

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="loginBrand"><span>√</span><div><b>수학성장지도</b><small>Math Path Lab</small></div></div>

        <div className="roleTabs" role="tablist" aria-label="계정 유형">
          <button type="button" role="tab" aria-selected={role === "student"} className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>학생</button>
          <button type="button" role="tab" aria-selected={role === "teacher"} className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")}>선생님</button>
        </div>

        <span className="loginBadge">{role === "teacher" ? "학원·학부모 관리자" : "학생 전용"}</span>
        <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
        <p>{role === "teacher" ? "학생 관리, 학습 진단 결과, 오답 제출 자료를 확인하려면 로그인해 주세요." : "선생님이 등록해 둔 이메일과 같은 이메일로 가입하면 내 학습 페이지와 자동으로 연결돼요."}</p>

        {error && <div className="loginErrorBanner">{error}</div>}

        <form className="loginForm" onSubmit={submit}>
          {mode === "signup" && <label>이름<input required value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></label>}
          <label>이메일<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>비밀번호<input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" /></label>
          {mode === "signup" && role === "teacher" && <label>선생님 가입 코드<input required value={code} onChange={(e) => setCode(e.target.value)} /></label>}
          <button className="loginButton" type="submit" disabled={submitState === "sending"}>{submitState === "sending" ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}</button>
        </form>

        <button type="button" className="loginModeToggle" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}>
          {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>

        <div className="loginDivider"><span>또는</span></div>

        <div className="snsButtons">
          <a className="loginButton sns google" href={`/api/auth/google?role=${role}`}>구글로 계속하기</a>
          <a className="loginButton sns kakao" href={`/api/auth/kakao?role=${role}`}>카카오로 계속하기</a>
        </div>

        {role === "student" && <div className="studentLoginGuide"><b>학생이신가요?</b><span>아직 선생님이 이메일을 등록하지 않았다면, 가입 후 "연동 대기" 화면이 보여요. 선생님께 같은 이메일로 등록해 달라고 요청해 주세요.</span></div>}
      </section>
    </main>
  );
}
