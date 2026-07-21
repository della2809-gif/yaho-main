"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MistakeArchive } from "./mistake-archive";

type View = "diagnosis" | "roadmap" | "mistakes" | "academy";
type StageKey = "초등" | "중등" | "고등";
type CurriculumGroup = {
  grade: string;
  subtitle: string;
  score: number;
  state: string;
  apply2026: string;
  areas: { domain: string; color: number; topics: string[] }[];
};

const curriculum: Record<StageKey, CurriculumGroup[]> = {
  초등: [
    { grade: "초1–2", subtitle: "초등 1~2학년군", score: 96, state: "완료", apply2026: "2022 개정 적용", areas: [
      { domain: "수와 연산", color: 0, topics: ["네 자리 이하의 수", "덧셈과 뺄셈", "곱셈의 기초"] },
      { domain: "변화와 관계", color: 1, topics: ["물체·무늬·수의 규칙"] },
      { domain: "도형과 측정", color: 2, topics: ["입체·평면도형", "양의 비교", "시각과 시간", "길이"] },
      { domain: "자료와 가능성", color: 3, topics: ["분류하기", "표와 그래프"] },
    ] },
    { grade: "초3–4", subtitle: "초등 3~4학년군", score: 91, state: "완료", apply2026: "2022 개정 적용", areas: [
      { domain: "수와 연산", color: 0, topics: ["큰 수", "자연수 사칙계산", "분수", "소수"] },
      { domain: "변화와 관계", color: 1, topics: ["규칙을 수·식으로 표현", "두 양의 관계"] },
      { domain: "도형과 측정", color: 2, topics: ["각과 삼각형", "사각형·다각형", "원의 구성", "평면도형의 이동", "길이·시간·들이·무게"] },
      { domain: "자료와 가능성", color: 3, topics: ["그림그래프", "막대그래프", "꺾은선그래프"] },
    ] },
    { grade: "초5–6", subtitle: "초등 5~6학년군", score: 82, state: "보완", apply2026: "2022 개정 적용", areas: [
      { domain: "수와 연산", color: 0, topics: ["혼합 계산", "약수와 배수", "분수의 계산", "소수의 계산"] },
      { domain: "변화와 관계", color: 1, topics: ["대응 관계", "비와 비율", "백분율"] },
      { domain: "도형과 측정", color: 2, topics: ["합동과 대칭", "입체도형", "넓이", "원주와 원의 넓이", "겉넓이와 부피"] },
      { domain: "자료와 가능성", color: 3, topics: ["평균", "띠·원그래프", "자료 탐구", "가능성"] },
    ] },
  ],
  중등: [
    { grade: "중1", subtitle: "중학교 1학년", score: 72, state: "학습 중", apply2026: "2022 개정 적용", areas: [
      { domain: "수와 연산", color: 0, topics: ["소인수분해", "정수와 유리수"] },
      { domain: "변화와 관계", color: 1, topics: ["문자의 사용과 식", "일차방정식", "좌표와 그래프", "정비례·반비례"] },
      { domain: "도형과 측정", color: 2, topics: ["기본 도형", "작도와 합동", "평면도형", "입체도형"] },
      { domain: "자료와 가능성", color: 3, topics: ["자료의 정리와 해석"] },
    ] },
    { grade: "중2", subtitle: "중학교 2학년", score: 18, state: "예정", apply2026: "2022 개정 적용", areas: [
      { domain: "수와 연산", color: 0, topics: ["유리수와 순환소수"] },
      { domain: "변화와 관계", color: 1, topics: ["식의 계산", "일차부등식", "연립일차방정식", "일차함수"] },
      { domain: "도형과 측정", color: 2, topics: ["삼각형의 성질", "사각형의 성질", "도형의 닮음"] },
      { domain: "자료와 가능성", color: 3, topics: ["경우의 수", "확률"] },
    ] },
    { grade: "중3", subtitle: "중학교 3학년", score: 0, state: "예정", apply2026: "2026년은 2015 개정", areas: [
      { domain: "수와 연산", color: 0, topics: ["제곱근과 실수"] },
      { domain: "변화와 관계", color: 1, topics: ["다항식의 곱셈·인수분해", "이차방정식", "이차함수"] },
      { domain: "도형과 측정", color: 2, topics: ["피타고라스 정리", "삼각비", "원의 성질"] },
      { domain: "자료와 가능성", color: 3, topics: ["대푯값과 산포도", "상관관계"] },
    ] },
  ],
  고등: [
    { grade: "공통 과목", subtitle: "고1 중심 · 기본수학은 대체 이수", score: 0, state: "필수 기반", apply2026: "고1~2 적용", areas: [
      { domain: "공통수학1", color: 0, topics: ["다항식", "방정식과 부등식", "경우의 수", "행렬"] },
      { domain: "공통수학2", color: 1, topics: ["도형의 방정식", "집합과 명제", "함수와 그래프"] },
      { domain: "대체 공통", color: 3, topics: ["기본수학1", "기본수학2"] },
    ] },
    { grade: "일반 선택", subtitle: "수학의 주요 학문 영역", score: 0, state: "선택", apply2026: "고2부터 적용", areas: [
      { domain: "대수", color: 0, topics: ["지수함수와 로그함수", "삼각함수", "수열"] },
      { domain: "미적분Ⅰ", color: 1, topics: ["함수의 극한과 연속", "미분", "적분"] },
      { domain: "확률과 통계", color: 3, topics: ["경우의 수", "확률", "통계"] },
    ] },
    { grade: "진로 선택", subtitle: "심화 학습·진로 연계", score: 0, state: "진로별", apply2026: "학교 편성에 따라", areas: [
      { domain: "심화 수학", color: 0, topics: ["미적분Ⅱ", "기하"] },
      { domain: "응용 수학", color: 1, topics: ["경제 수학", "인공지능 수학", "직무 수학"] },
    ] },
    { grade: "융합 선택", subtitle: "체험·융합·탐구 중심", score: 0, state: "융합", apply2026: "학교 편성에 따라", areas: [
      { domain: "문화·데이터", color: 2, topics: ["수학과 문화", "실용 통계"] },
      { domain: "탐구", color: 3, topics: ["수학과제 탐구"] },
    ] },
    { grade: "고3 전환 과정", subtitle: "2026학년도 고등학교 3학년", score: 0, state: "전환기", apply2026: "2015 개정 적용", areas: [
      { domain: "일반·진로 선택", color: 2, topics: ["수학Ⅰ", "수학Ⅱ", "미적분", "확률과 통계", "기하"] },
      { domain: "2027년 이후", color: 3, topics: ["2022 개정 과목 체계로 전환"] },
    ] },
  ],
};

const subjectSuggestions = Array.from(new Set(Object.values(curriculum).flat().flatMap((group) => group.areas.map((area) => area.domain))));
const topicSuggestionsByDomain = new Map<string, string[]>();
Object.values(curriculum).flat().forEach((group) => group.areas.forEach((area) => {
  topicSuggestionsByDomain.set(area.domain, Array.from(new Set([...(topicSuggestionsByDomain.get(area.domain) ?? []), ...area.topics])));
}));
const allTopicSuggestions = Array.from(new Set([...topicSuggestionsByDomain.values()].flat()));

type Student = { id: string; name: string; grade: string; score: number; trend: string; risk: string; color: string; sortOrder?: number; email?: string; linked?: boolean };
type AcademyProfile = { academyName: string; branchName: string; className: string; teacherName: string; teacherRole: string };
type StudentSession = Pick<Student, "id" | "name" | "grade" | "color" | "score" | "trend" | "risk">;
type Submission = { id: string; studentId: string; fileName: string; contentType: string; fileSize: number; note: string; subject: string; topic: string; status: string; createdAt: string; student: { id: string; name: string; grade: string } | null };

const initialProfile: AcademyProfile = { academyName: "매쓰온 수학학원", branchName: "중등관", className: "A반", teacherName: "한수진", teacherRole: "원장 · 관리자" };
const initialStudents: Student[] = [
  { id: "gah-001", name: "김가희", grade: "중1", score: 72, trend: "+8", risk: "부호 계산", color: "#5368e8" },
  { id: "seo-002", name: "박서준", grade: "중1", score: 84, trend: "+3", risk: "좌표", color: "#32b99a" },
  { id: "hae-003", name: "이하은", grade: "중1", score: 61, trend: "−4", risk: "분수 계산", color: "#ef7866" },
  { id: "min-004", name: "정민우", grade: "중1", score: 77, trend: "+6", risk: "문자식", color: "#e3a82b" },
  { id: "you-005", name: "최유진", grade: "중1", score: 89, trend: "+2", risk: "없음", color: "#7c66cf" },
];
const gradeOptions = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];
const newStudent: Student = { id: "", name: "", grade: "초1", score: 0, trend: "0", risk: "없음", color: "#5368e8", email: "" };

const navItems: { key: View; icon: string; label: string; desc: string }[] = [
  { key: "diagnosis", icon: "◉", label: "학습 진단", desc: "현재 위치" },
  { key: "roadmap", icon: "⌁", label: "교육과정 지도", desc: "초1부터 고3까지" },
  { key: "mistakes", icon: "✎", label: "오답 분석", desc: "사진으로 진단" },
  { key: "academy", icon: "▦", label: "학원 관리", desc: "반·학생 관리" },
];

export default function DashboardClient({ mode }: { mode: "teacher" | "student" }) {
  const [view, setView] = useState<View>("diagnosis");
  const [stage, setStage] = useState<StageKey>("중등");
  const [selectedTopic, setSelectedTopic] = useState("정수와 유리수");
  const [studentId, setStudentId] = useState("gah-001");
  const [profile, setProfile] = useState<AcademyProfile>(initialProfile);
  const [studentList, setStudentList] = useState<Student[]>(initialStudents);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [studentSession, setStudentSession] = useState<StudentSession | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [studentSessionState, setStudentSessionState] = useState<"loading" | "ready" | "pending">(mode === "student" ? "loading" : "ready");
  const [studentPortalView, setStudentPortalView] = useState<"diagnosis" | "mistakes" | "archive">("diagnosis");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const currentStudent = useMemo(() => studentList.find((item) => item.id === studentId) ?? studentList[0] ?? null, [studentId, studentList]);
  const editingStudent = useMemo(() => studentList.find((item) => item.id === editingStudentId) ?? null, [editingStudentId, studentList]);
  const deletingStudent = useMemo(() => studentList.find((item) => item.id === deletingStudentId) ?? null, [deletingStudentId, studentList]);

  useEffect(() => {
    let active = true;
    if (mode === "student") {
      fetch("/api/student-session")
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("invalid")))
        .then((data) => {
          if (!active) return;
          if (data.pending) { setPendingName(data.name ?? ""); setStudentSessionState("pending"); }
          else { setStudentSession(data.student); setStudentSessionState("ready"); }
        })
        .catch(() => { if (active) setStudentSessionState("pending"); });
      fetch("/api/submissions")
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((data) => { if (active) setStudentSubmissions(data.submissions ?? []); })
        .catch(() => undefined);
      return () => { active = false; };
    }
    fetch("/api/config")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("load failed")))
      .then((data) => {
        if (!active) return;
        if (data.settings) setProfile(data.settings);
        if (data.students?.length) setStudentList(data.students);
      })
      .catch(() => setSaveState("error"));
    fetch("/api/submissions").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { if (active) setSubmissions(data.submissions ?? []); }).catch(() => undefined);
    return () => { active = false; };
  }, [mode]);

  const persist = async (payload: { settings?: AcademyProfile; student?: Student }) => {
    setSaveState("saving");
    try {
      const response = await fetch("/api/config", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("save failed");
      const data = await response.json();
      setProfile(data.settings);
      setStudentList(data.students);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  };

  const createStudent = async (student: Student) => {
    setSaveState("saving");
    try {
      const response = await fetch("/api/config", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ student }) });
      if (!response.ok) throw new Error("create failed");
      const data = await response.json();
      setStudentList(data.students);
      setStudentId(data.students.at(-1)?.id ?? studentId);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
      return true;
    } catch { setSaveState("error"); return false; }
  };

  const deleteStudent = async (id: string) => {
    setSaveState("saving");
    try {
      const response = await fetch("/api/config", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error("delete failed");
      const data = await response.json();
      setStudentList(data.students);
      if (id === studentId) setStudentId(data.students[0]?.id ?? "");
      setSaveState("saved");
      setDeletingStudentId(null);
      window.setTimeout(() => setSaveState("idle"), 1800);
    } catch { setSaveState("error"); }
  };

  const onImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (image) URL.revokeObjectURL(image);
    setSelectedFile(file);
    setImage(URL.createObjectURL(file));
    setAnalyzed(false);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const refreshSubmissions = () => fetch("/api/submissions").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setSubmissions(data.submissions ?? [])).catch(() => setSaveState("error"));

  const refreshStudentSubmissions = () => {
    void fetch("/api/submissions")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setStudentSubmissions(data.submissions ?? []))
      .catch(() => undefined);
  };

  if (mode === "student") {
    if (studentSessionState === "loading") return <main className="studentOnlyState"><div><span>√</span><b>학생 페이지를 확인하고 있어요…</b></div></main>;
    if (studentSessionState === "pending" || !studentSession) return <main className="studentOnlyState invalid"><div><span>!</span><h1>아직 선생님이 계정을 연결하지 않았어요.</h1><p>{pendingName ? `${pendingName}님, ` : ""}선생님께 회원가입할 때 사용한 이메일을 학생 명단에 등록해 달라고 요청해 주세요.</p><button className="loginButton secondary" onClick={() => void logout()}>로그아웃</button></div></main>;
    return <main className="studentPortal"><header className="studentPortalHeader"><div className="logo"><span>√</span><div><b>수학성장지도</b><small>나의 수학 학습실</small></div></div><nav className="studentPortalNav" aria-label="학생 메뉴"><button className={studentPortalView === "diagnosis" ? "active" : ""} onClick={() => setStudentPortalView("diagnosis")}><i>◉</i>학습 진단</button><button className={studentPortalView === "mistakes" ? "active" : ""} onClick={() => setStudentPortalView("mistakes")}><i>✎</i>오답 분석</button><button className={studentPortalView === "archive" ? "active" : ""} onClick={() => setStudentPortalView("archive")}><i>▤</i>오답노트</button></nav><div className="studentPortalUser"><span style={{ background: studentSession.color }}>{studentSession.name.slice(-1)}</span><div><b>{studentSession.name}</b><small>{studentSession.grade} · 학생 전용</small></div><button className="logoutIconButton" onClick={() => void logout()} aria-label="로그아웃">⏻</button></div></header>{studentPortalView === "diagnosis" ? <StudentDiagnosis student={studentSession} onMistakes={() => setStudentPortalView("mistakes")} /> : studentPortalView === "mistakes" ? <Mistakes image={image} file={selectedFile} analyzed={analyzed} fileInput={fileInput} onImage={onImage} onAnalyze={() => setAnalyzed(true)} canSubmit studentName={studentSession.name} /> : <div className="content"><MistakeArchive mode="student" submissions={studentSubmissions} onRefresh={refreshStudentSubmissions} fileUrlFor={(id) => `/api/submissions/${id}/file`} /></div>}<nav className="studentBottomNav" aria-label="학생 모바일 메뉴"><button className={studentPortalView === "diagnosis" ? "active" : ""} onClick={() => setStudentPortalView("diagnosis")}><i>◉</i><span>학습 진단</span></button><button className={studentPortalView === "mistakes" ? "active" : ""} onClick={() => setStudentPortalView("mistakes")}><i>✎</i><span>오답 분석</span></button><button className={studentPortalView === "archive" ? "active" : ""} onClick={() => setStudentPortalView("archive")}><i>▤</i><span>오답노트</span></button></nav></main>;
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="logo"><span>√</span><div><b>수학성장지도</b><small>Math Path Lab</small></div></div>
        <button className="academyName editTarget" onClick={() => setProfileOpen(true)} aria-label="학원 정보 수정"><span className="academyAvatar">{profile.academyName.charAt(0)}</span><div><b>{profile.academyName}</b><small>{profile.branchName} · {profile.className}</small></div><span className="editGlyph">✎</span></button>
        <nav className="sideNav" aria-label="서비스 메뉴">
          <p>LEARNING</p>
          {navItems.slice(0, 3).map((item) => <button key={item.key} className={view === item.key ? "selected" : ""} onClick={() => setView(item.key)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.desc}</small></div></button>)}
          <p>ACADEMY</p>
          {navItems.slice(3).map((item) => <button key={item.key} className={view === item.key ? "selected" : ""} onClick={() => setView(item.key)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.desc}</small></div></button>)}
        </nav>
        <div className="curriculumBadge"><span>2022</span><div><b>개정 교육과정 반영</b><small>초1–고3 성취기준 체계</small></div></div>
        <button className="teacher editTarget" onClick={() => setProfileOpen(true)} aria-label="선생님 정보 수정"><span>{profile.teacherName.charAt(0)}</span><div><b>{profile.teacherName} 선생님</b><small>{profile.teacherRole}</small></div><span className="editGlyph">✎</span></button>
        <button className="logoutButton" onClick={() => void logout()}>로그아웃</button>
      </aside>

      <section className="mainPanel">
        <header className="topHeader">
          <div className="mobileLogo">√ 수학성장지도</div>
          <div className="studentPicker">{currentStudent ? <><span style={{ background: currentStudent.color }}>{currentStudent.name.slice(-1)}</span><div><small>현재 학생</small><select value={currentStudent.id} onChange={(e) => setStudentId(e.target.value)}>{studentList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></> : <button className="emptyPicker" onClick={() => setAddingStudent(true)}>＋ 학생 추가</button>}</div>
          <div className="headerActions">{saveState !== "idle" && <span className={`saveStatus ${saveState}`}>{saveState === "saving" ? "저장 중…" : saveState === "saved" ? "저장 완료" : "저장 연결 확인 필요"}</span>}<button aria-label="검색">⌕</button><button aria-label="알림">♢<i /></button><span className="term">2026 여름학기</span></div>
        </header>

        {view === "diagnosis" && (currentStudent ? <Diagnosis student={currentStudent} onRoadmap={() => setView("roadmap")} /> : <EmptyStudents onAdd={() => setAddingStudent(true)} />)}
        {view === "roadmap" && <Roadmap stage={stage} setStage={setStage} selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic} />}
        {view === "mistakes" && <Mistakes image={image} file={selectedFile} analyzed={analyzed} fileInput={fileInput} onImage={onImage} onAnalyze={() => setAnalyzed(true)} />}
        {view === "academy" && <Academy profile={profile} students={studentList} submissions={submissions} onRefreshSubmissions={() => void refreshSubmissions()} onSelect={(id) => { setStudentId(id); setView("diagnosis"); }} onAdd={() => setAddingStudent(true)} onEdit={setEditingStudentId} onDelete={setDeletingStudentId} onEditProfile={() => setProfileOpen(true)} />}
      </section>
      {profileOpen && <ProfileEditor profile={profile} onClose={() => setProfileOpen(false)} onSave={async (next) => { const ok = await persist({ settings: next }); if (ok) setProfileOpen(false); }} />}
      {editingStudent && <StudentEditor student={editingStudent} onClose={() => setEditingStudentId(null)} onSave={async (next) => { const ok = await persist({ student: next }); if (ok) setEditingStudentId(null); }} />}
      {addingStudent && <StudentEditor student={newStudent} isNew onClose={() => setAddingStudent(false)} onSave={async (next) => { const ok = await createStudent(next); if (ok) setAddingStudent(false); }} />}
      {deletingStudent && <DeleteStudentDialog student={deletingStudent} onClose={() => setDeletingStudentId(null)} onDelete={() => void deleteStudent(deletingStudent.id)} />}
    </main>
  );
}

function ProfileEditor({ profile, onClose, onSave }: { profile: AcademyProfile; onClose: () => void; onSave: (profile: AcademyProfile) => Promise<void> }) {
  const [draft, setDraft] = useState(profile);
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave(draft); };
  return <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="editModal" onSubmit={submit} aria-label="학원 및 선생님 정보 수정"><div className="modalHead"><div><small>기본 정보</small><h2>학원 정보 수정</h2></div><button type="button" onClick={onClose} aria-label="닫기">×</button></div><div className="formGrid"><label className="wide">학원 이름<input required value={draft.academyName} onChange={(e) => setDraft({ ...draft, academyName: e.target.value })} /></label><label>관·지점 이름<input required value={draft.branchName} onChange={(e) => setDraft({ ...draft, branchName: e.target.value })} /></label><label>반 이름<input required value={draft.className} onChange={(e) => setDraft({ ...draft, className: e.target.value })} /></label><label>선생님 이름<input required value={draft.teacherName} onChange={(e) => setDraft({ ...draft, teacherName: e.target.value })} /></label><label>직책·권한<input required value={draft.teacherRole} onChange={(e) => setDraft({ ...draft, teacherRole: e.target.value })} /></label></div><div className="modalActions"><button type="button" onClick={onClose}>취소</button><button type="submit">변경사항 저장</button></div></form></div>;
}

function StudentEditor({ student, isNew = false, onClose, onSave }: { student: Student; isNew?: boolean; onClose: () => void; onSave: (student: Student) => Promise<void> }) {
  const [draft, setDraft] = useState(student);
  const submit = (event: FormEvent) => { event.preventDefault(); void onSave(draft); };
  return <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="editModal studentEditModal" onSubmit={submit} aria-label={isNew ? "학생 추가" : "학생 정보 수정"}><div className="modalHead"><div><small>학생 관리</small><h2>{isNew ? "새 학생 추가" : "학생 정보 수정"}</h2></div><button type="button" onClick={onClose} aria-label="닫기">×</button></div><div className="studentIdentity"><span style={{ background: draft.color }}>{draft.name.slice(-1) || "+"}</span><p><b>{draft.name || "학생 이름"}</b><small>초등학교 1학년부터 고등학교 3학년까지 등록할 수 있어요.</small></p></div><div className="formGrid"><label className="wide">학생 이름<input required autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>학년<select value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value })}>{gradeOptions.map((grade) => <option key={grade}>{grade}</option>)}</select></label><label>개념 정복도<input type="number" min="0" max="100" value={draft.score} onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })} /></label><label>최근 변화<input value={draft.trend} onChange={(e) => setDraft({ ...draft, trend: e.target.value })} placeholder="예: +8" /></label><label>취약 개념<input value={draft.risk} onChange={(e) => setDraft({ ...draft, risk: e.target.value })} /></label><label className="wide">학생 로그인 이메일<input type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="student@example.com" /><small className="fieldHint">이 이메일로 학생이 회원가입하면 자동으로 이 학생과 연결돼요.</small></label></div><div className="modalActions"><button type="button" onClick={onClose}>취소</button><button type="submit">{isNew ? "학생 추가하기" : "학생 정보 저장"}</button></div></form></div>;
}

function DeleteStudentDialog({ student, onClose, onDelete }: { student: Student; onClose: () => void; onDelete: () => void }) {
  return <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="editModal deleteDialog" role="alertdialog" aria-labelledby="delete-title"><div className="deleteIcon">!</div><h2 id="delete-title">{student.name} 학생을 삭제할까요?</h2><p>학원 관리 목록에서 학생 정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p><div className="modalActions"><button type="button" onClick={onClose}>취소</button><button type="button" className="dangerButton" onClick={onDelete}>학생 삭제</button></div></div></div>;
}

function EmptyStudents({ onAdd }: { onAdd: () => void }) {
  return <div className="content emptyStudents"><div><span>＋</span><h1>등록된 학생이 없습니다.</h1><p>학생을 추가하면 학습 진단과 교육과정 위치를 관리할 수 있어요.</p><button className="primary" onClick={onAdd}>첫 학생 추가하기</button></div></div>;
}

function StudentDiagnosis({ student, onMistakes }: { student: StudentSession; onMistakes: () => void }) {
  const stableConcepts = Math.round(student.score * 0.47);
  const needsReview = student.risk === "없음" ? 0 : 1;
  return <div className="content studentDiagnosisPage">
    <div className="pageTitle"><div><p>나의 학습 진단 · {student.grade}</p><h1>{student.name}의 수학은 지금<br /><em>{student.grade} 과정 {student.score}%</em> 지점이에요.</h1><span>오답과 확인 문제를 바탕으로 현재 이해도와 다음 학습 방향을 보여줘요.</span></div><button className="primary" onClick={onMistakes}>오답 분석 시작하기 →</button></div>
    <div className="metricGrid studentMetrics"><article><span className="metricIcon blue">⌁</span><div><small>전체 개념 정복도</small><strong>{student.score}<i>%</i></strong><p className="up">최근 변화 {student.trend}</p></div></article><article><span className="metricIcon green">✓</span><div><small>안정적으로 이해한 개념</small><strong>{stableConcepts}<i>/ 47</i></strong><p>진단 기록 기준</p></div></article><article><span className="metricIcon coral">!</span><div><small>우선 보완할 개념</small><strong>{needsReview}<i>개</i></strong><p className="down">{student.risk}</p></div></article><article><span className="metricIcon yellow">↗</span><div><small>학습 흐름</small><strong>{student.trend}<i>점</i></strong><p>최근 진단 대비</p></div></article></div>
    <div className="studentDiagnosisGrid"><article className="panel studentProgressPanel"><div className="panelHead"><div><span>현재 학습 상태</span><h2>조금만 더 연습하면 단단해져요</h2></div><b>{student.score}%</b></div><div className="studentBigProgress"><i style={{ width: `${student.score}%` }} /></div><div className="diagnosisMessage"><span>집중할 개념</span><b>{student.risk === "없음" ? "새로운 개념에 도전해 보세요" : student.risk}</b><p>문제를 풀다가 헷갈린 부분을 사진이나 PDF로 올리면 풀이 단계와 혼동 지점을 확인할 수 있어요.</p></div><button className="studyBtn" onClick={onMistakes}>내 문제 분석하러 가기 →</button></article><article className="panel studentPathPanel"><div className="panelHead"><div><span>나의 학습 순서</span><h2>이 순서로 공부해요</h2></div></div><ol><li className="done"><i>1</i><div><b>기초 개념 확인</b><span>선수 개념이 준비됐는지 점검</span></div></li><li className="current"><i>2</i><div><b>{student.risk === "없음" ? "현재 단원 연습" : student.risk}</b><span>오답의 이유를 찾아 집중 연습</span></div></li><li><i>3</i><div><b>비슷한 문제 풀기</b><span>같은 유형으로 이해를 확인</span></div></li><li><i>4</i><div><b>다시 진단하기</b><span>개념이 단단해졌는지 확인</span></div></li></ol></article></div>
    <div className="studentPrivacyNote"><span>🔒</span><div><b>학생 전용 화면이에요.</b><p>학원 관리 정보는 보이지 않으며, 내가 제출한 문제와 학습 진단만 사용할 수 있어요.</p></div></div>
  </div>;
}

function Diagnosis({ student, onRoadmap }: { student: Student; onRoadmap: () => void }) {
  return <div className="content">
    <div className="pageTitle"><div><p>학습 진단 · 중학교 1학년</p><h1>{student.name}의 수학은 지금<br /><em>중1 과정 72%</em> 지점이에요.</h1><span>최근 30일 오답 23개와 확인 문제 48개의 결과를 반영했어요.</span></div><button className="primary" onClick={onRoadmap}>전체 교육과정 보기 →</button></div>
    <div className="metricGrid">
      <article><span className="metricIcon blue">⌁</span><div><small>전체 개념 정복도</small><strong>{student.score}<i>%</i></strong><p className="up">↑ 지난달보다 {student.trend}%</p></div></article>
      <article><span className="metricIcon green">✓</span><div><small>확실히 아는 개념</small><strong>34<i>/ 47</i></strong><p>중1 성취기준 기준</p></div></article>
      <article><span className="metricIcon coral">!</span><div><small>지금 보완할 개념</small><strong>5<i>개</i></strong><p className="down">선수 결손 2개 포함</p></div></article>
      <article><span className="metricIcon yellow">↗</span><div><small>이번 달 성장</small><strong>+8<i>점</i></strong><p>같은 반 상위 31%</p></div></article>
    </div>

    <div className="dashboardGrid">
      <article className="panel masteryPanel">
        <div className="panelHead"><div><span>영역별 이해도</span><h2>어디까지 단단하게 이해했을까?</h2></div><small>최근 진단 7.20</small></div>
        {[
          ["수와 연산", 68, "정수의 부호 계산 보완", "coralBar"], ["변화와 관계", 81, "문자식은 안정적", "blueBar"], ["도형과 측정", 74, "작도 개념 복습", "greenBar"], ["자료와 가능성", 92, "매우 안정적", "purpleBar"],
        ].map(([name, score, note, cls]) => <div className="masteryRow" key={String(name)}><div><b>{name}</b><small>{note}</small></div><div className="bar"><i className={String(cls)} style={{ width: `${score}%` }} /></div><strong>{score}%</strong></div>)}
      </article>

      <article className="panel nextPanel">
        <div className="panelHead"><div><span>AI 추천 학습 경로</span><h2>다음 3단계</h2></div><button>⋯</button></div>
        <ol><li className="done"><i>✓</i><div><small>선수 개념 · 초6</small><b>분수의 나눗셈</b><p>확인 완료 · 88%</p></div></li><li className="current"><i>2</i><div><small>현재 집중 · 중1</small><b>정수와 유리수의 계산</b><p>부호 오류 4회 · 68%</p></div><span>오늘</span></li><li><i>3</i><div><small>다음 개념 · 중1</small><b>문자의 사용과 식</b><p>예상 학습 2회</p></div></li></ol>
        <button className="studyBtn">오늘의 맞춤 문제 8개 풀기 →</button>
      </article>
    </div>

    <article className="panel gapPanel">
      <div className="panelHead"><div><span>개념 연결 분석</span><h2>현재 오답의 뿌리를 찾았어요</h2></div><button>보충 과제 배정</button></div>
      <div className="conceptFlow"><div className="node learned"><small>초5–6 · 선수 개념</small><b>분수·소수 계산</b><span>82% 이해</span></div><i>→</i><div className="node weak"><small>중1 · 결손 발견</small><b>음수의 뜻과 수직선</b><span>61% · 보완 필요</span></div><i>→</i><div className="node focus"><small>중1 · 현재 학습</small><b>정수와 유리수의 계산</b><span>68% · 집중 학습</span></div><i>→</i><div className="node future"><small>중2 · 연결 개념</small><b>유리수와 순환소수</b><span>다음 학년</span></div></div>
      <p className="insight"><b>진단 해석</b> 계산 절차보다 <strong>수직선에서 음수의 방향</strong> 이해가 먼저 필요해요. 선수 개념 확인 문제 3개 후 현재 단원으로 돌아오는 경로를 권장합니다.</p>
    </article>
  </div>;
}

function Roadmap({ stage, setStage, selectedTopic, setSelectedTopic }: { stage: StageKey; setStage: (s: StageKey) => void; selectedTopic: string; setSelectedTopic: (s: string) => void }) {
  const domains = ["수와 연산", "변화와 관계", "도형과 측정", "자료와 가능성"];
  return <div className="content roadmapPage">
    <div className="pageTitle compact"><div><p>2026년 학교 적용 기준 · 교육부 고시 제2022-33호</p><h1>대한민국 수학 <em>성장 지도</em></h1><span>초등학교 1학년부터 고등학교 공통·선택 과목까지 개념의 위계를 한눈에 확인하세요.</span></div><button className="outlineBtn" onClick={() => window.print()}>진단 리포트 인쇄</button></div>
    <div className="transitionNotice"><b>2026 적용 안내</b><span>초1~6 · 중1~2 · 고1~2는 2022 개정 교육과정 적용</span><i>중3 · 고3은 2027년부터 적용</i></div>
    <div className="stageTabs">{(["초등", "중등", "고등"] as StageKey[]).map((item) => <button key={item} onClick={() => setStage(item)} className={stage === item ? "active" : ""}>{item}<small>{item === "초등" ? "1–6학년" : item === "중등" ? "1–3학년" : "공통·일반·진로·융합"}</small></button>)}</div>
    <div className="roadmapLegend"><div>{domains.map((d, i) => <span key={d}><i className={`dot d${i}`} />{d}</span>)}</div><p><i className="meDot" />현재 진단 위치</p></div>
    {stage === "고등" && <div className="highSchoolGuide"><b>고등학교는 학년보다 과목 선택 구조로 봅니다.</b><span>공통 과목을 기반으로 일반·진로·융합 선택 과목을 학교 편성과 진로에 따라 이수합니다. 기본수학1·2는 공통수학1·2의 대체 과목입니다.</span></div>}
    <div className={`gradeGrid ${stage === "고등" ? "highSchoolGrid" : ""}`}>{curriculum[stage].map((group) => <article className={`gradeCard curriculumCard ${group.grade === "중1" ? "currentGrade" : ""}`} key={group.grade}>
      <div className="gradeTop"><div><small>{group.subtitle}</small><h2>{group.grade}</h2></div><span className={`state ${group.state === "완료" ? "complete" : group.state === "학습 중" ? "learning" : ""}`}>{group.state}</span></div>
      <div className={`applyBadge ${group.apply2026.includes("2015") ? "legacy" : ""}`}>{group.apply2026}</div>
      {group.score > 0 && <div className="gradeProgress"><span><i style={{ width: `${group.score}%` }} /></span><b>{group.score}%</b></div>}
      <div className="areaList">{group.areas.map((area) => <section key={area.domain}><div className="areaTitle"><i className={`dot d${area.color}`} /><b>{area.domain}</b><small>{area.topics.length}개 개념군</small></div><div className="conceptChips">{area.topics.map((topic) => <button key={topic} onClick={() => setSelectedTopic(topic)} className={selectedTopic === topic ? "active" : ""}>{topic}{group.grade === "중1" && topic === "정수와 유리수" && <em>현재</em>}</button>)}</div></section>)}</div>
    </article>)}</div>
    <article className="selectedConcept"><div><span>선택한 개념</span><h2>{selectedTopic}</h2><p>오답이 쌓이면 선수 개념 결손과 후속 학습 영향을 이 연결선에 함께 표시합니다.</p></div><div className="miniFlow"><span>선수 개념 확인<small>기초 진단</small></span><i>→</i><strong>{selectedTopic}<small>현재 이해도 분석</small></strong><i>→</i><span>후속 개념 예측<small>학습 경로</small></span></div><button>진단 문제 배정</button></article>
    <div className="curriculumSources"><div><b>구성 기준</b><p>초·중학교는 ‘수와 연산, 변화와 관계, 도형과 측정, 자료와 가능성’의 4개 영역으로, 고등학교는 공통·일반 선택·진로 선택·융합 선택의 과목 구조로 정리했습니다.</p></div><div><a href="https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&page=1&searchType=null&statusYN=W" target="_blank" rel="noreferrer">교육부 고시 원문 ↗</a><a href="https://ncic.go.kr/board/B0033.cs?act=read&bwrId=2105&pageIndex=1&pageUnit=10" target="_blank" rel="noreferrer">NCIC 교육과정 자료 ↗</a></div></div>
  </div>;
}

function Mistakes({ image, file, analyzed, fileInput, onImage, onAnalyze, canSubmit = false, studentName = "학생" }: { image: string | null; file: File | null; analyzed: boolean; fileInput: React.RefObject<HTMLInputElement | null>; onImage: (e: ChangeEvent<HTMLInputElement>) => void; onAnalyze: () => void; canSubmit?: boolean; studentName?: string }) {
  const [note, setNote] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const isPdf = file?.type === "application/pdf";
  const topicOptions = useMemo(() => topicSuggestionsByDomain.get(subject) ?? allTopicSuggestions, [subject]);
  const submitToAcademy = async () => {
    if (!file || !canSubmit) return;
    setSubmitState("sending");
    const form = new FormData();
    form.set("file", file);
    form.set("note", note);
    form.set("subject", subject);
    form.set("topic", topic);
    try {
      const response = await fetch("/api/submissions", { method: "POST", body: form });
      if (!response.ok) throw new Error("submit failed");
      setSubmitState("sent");
    } catch { setSubmitState("error"); }
  };
  return <div className="content"><div className="pageTitle compact"><div><p>{canSubmit ? `${studentName}의 오답 제출` : "문제 파일 분석"}</p><h1>문제를 찍거나 PDF로 올리면 <em>유형부터 풀이까지</em> 보여줘요.</h1><span>{canSubmit ? "이 페이지에서 분석한 문제와 메모는 학원 선생님에게 안전하게 제출할 수 있습니다." : "사진과 PDF에서 문제 유형과 예상 혼동 지점을 분석하고, 학생 풀이가 있으면 실제 오류 지점까지 찾아냅니다."}</span></div></div>
    <div className="inputGuide"><span>1</span><div><b>사진 또는 PDF를 올려 주세요</b><small>JPG·PNG·WEBP·PDF · 파일당 최대 15MB</small></div><i>＋</i><span className="optional">2</span><div><b>학생 풀이를 추가하면 더 정확해요</b><small>실제로 막힌 단계와 잘못 이해한 개념까지 확정</small></div></div>
    <div className="mistakeLayout"><article className="panel uploadPanel"><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onImage} hidden />{image ? <><div className="photoType">{isPdf ? "PDF 문제" : "문제 사진"} · {file?.name}</div>{isPdf ? <object className="pdfPreview" data={image} type="application/pdf" aria-label="업로드한 수학 문제 PDF"><a href={image} target="_blank" rel="noreferrer">PDF 새 창에서 열기</a></object> : <img src={image} alt="업로드한 수학 문제" />}<button className="subtle" onClick={() => fileInput.current?.click()}>다른 문제 파일 선택</button><button className="primary full" onClick={onAnalyze}>문제 유형과 풀이 분석하기 →</button></> : <button className="dropArea" onClick={() => fileInput.current?.click()}><i>▣</i><b>수학 문제 사진·PDF 올리기</b><span>문제 사진, 풀이 사진 또는 PDF 학습지를 분석할 수 있어요.</span><em>＋ 사진 또는 PDF 선택</em></button>}</article>
    <article className="panel analysisPanel">{analyzed ? <><span className="analysisLabel">문제 인식 완료</span><h2>두 미지수의 일차방정식에서<br />계수의 관계와 자연수 해를 찾는 문제</h2><div className="errorTags"><span>중2 · 연립방정식</span><span>상위 유형 · 자연수 해</span></div><div className="recognizedProblem"><small>인식한 문제의 핵심</small><p><b>−ax + 2by = 0</b>의 해가 (2, −1)일 때,<br /><b>2ax − 3by = 20a</b>를 만족하는 자연수 순서쌍 (x, y)의 개수</p></div><div className="curriculumLink"><span>선수</span> 일차방정식의 해 <i>→</i><strong>현재</strong> 미지수가 2개인 일차방정식 <i>→</i><span>확장</span> 자연수 해의 개수</div></> : <div className="emptyAnalysis"><i>⌁</i><b>문제 사진을 분석해 볼까요?</b><span>문제 유형, 관련 교육과정, 단계별 풀이와 헷갈리기 쉬운 지점을 보여드려요.</span></div>}</article></div>
    {canSubmit && file && <article className={`studentSubmitBox ${submitState}`}><div><b>학원 선생님에게 제출하기</b><span>{file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB</span></div><div className="submitTagRow"><label><small>과목</small><input list="subjectOptions" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="예: 도형과 측정" maxLength={60} disabled={submitState === "sent"} /></label><label><small>주제</small><input list="topicOptions" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="예: 정수와 유리수" maxLength={60} disabled={submitState === "sent"} /></label></div><datalist id="subjectOptions">{subjectSuggestions.map((s) => <option key={s} value={s} />)}</datalist><datalist id="topicOptions">{topicOptions.map((t) => <option key={t} value={t} />)}</datalist><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="어려웠던 점이나 질문을 적어 주세요. (선택)" maxLength={500} disabled={submitState === "sent"} /><button onClick={() => void submitToAcademy()} disabled={submitState === "sending" || submitState === "sent"}>{submitState === "sending" ? "제출 중…" : submitState === "sent" ? "✓ 학원에 제출 완료" : "학원에 제출하기 →"}</button>{submitState === "error" && <p>제출하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}</article>}
    {analyzed && <div className="solutionGrid">
      <article className="panel solutionPanel"><div className="panelHead"><div><span>단계별 풀이</span><h2>계수의 관계를 먼저 찾아요</h2></div><b className="answerBadge">정답 3개</b></div>
        <ol className="solutionSteps">
          <li><i>1</i><div><small>주어진 해 대입하기</small><b>(x, y) = (2, −1)을 첫 번째 식에 대입</b><p>−a×2 + 2b×(−1) = 0<br /><strong>−2a − 2b = 0 → a + b = 0 → b = −a</strong></p></div></li>
          <li><i>2</i><div><small>계수 관계 이용하기</small><b>b = −a를 두 번째 식에 대입</b><p>2ax − 3(−a)y = 20a<br /><strong>2ax + 3ay = 20a → a(2x + 3y) = 20a</strong><br />첫 번째 식이 일차방정식이므로 a ≠ 0, 따라서 <strong>2x + 3y = 20</strong></p></div></li>
          <li><i>3</i><div><small>자연수 해 찾기</small><b>x와 y는 1 이상의 자연수</b><p>2x = 20 − 3y가 양의 짝수여야 하므로 y는 6 이하의 짝수예요.<br /><strong>y = 2, 4, 6 → (x, y) = (7, 2), (4, 4), (1, 6)</strong></p></div></li>
          <li className="finalStep"><i>✓</i><div><small>순서쌍 개수</small><b>조건을 만족하는 순서쌍은 모두 3개</b></div></li>
        </ol>
      </article>
      <article className="panel confusionPanel"><div className="panelHead"><div><span>예상 혼동 지점</span><h2>이 네 곳을 확인해 보세요</h2></div></div>
        <div className="notice"><i>i</i><p><b>아직 가희의 풀이가 없어요.</b><br />아래 내용은 이 유형에서 자주 헷갈리는 지점이며, 실제 오답 원인은 풀이를 추가해야 확정할 수 있어요.</p></div>
        <ul>
          <li><span>1</span><div><b>−1을 대입할 때 부호</b><p>2b×(−1)은 +2b가 아니라 <strong>−2b</strong>예요.</p></div></li>
          <li><span>2</span><div><b>a와 b의 관계</b><p>a + b = 0에서 <strong>a = b</strong>가 아니라 <strong>b = −a</strong>예요.</p></div></li>
          <li><span>3</span><div><b>−3by에 b = −a 대입</b><p>−3×(−a)y처럼 음수가 두 번 만나 <strong>+3ay</strong>가 돼요.</p></div></li>
          <li><span>4</span><div><b>자연수 조건과 ‘개수’</b><p>0은 제외하고 가능한 순서쌍을 모두 찾은 뒤, 순서쌍 자체가 아니라 <strong>개수 3</strong>을 답해요.</p></div></li>
        </ul>
        <button className="addWorkBtn" onClick={() => fileInput.current?.click()}>＋ {studentName}의 풀이 사진 또는 PDF 추가하기</button>
      </article>
    </div>}
  </div>;
}

function Academy({ profile, students, submissions, onRefreshSubmissions, onSelect, onAdd, onEdit, onDelete, onEditProfile }: { profile: AcademyProfile; students: Student[]; submissions: Submission[]; onRefreshSubmissions: () => void; onSelect: (id: string) => void; onAdd: () => void; onEdit: (id: string) => void; onDelete: (id: string) => void; onEditProfile: () => void }) {
  const average = Math.round(students.reduce((sum, item) => sum + item.score, 0) / Math.max(students.length, 1));
  const needsHelp = students.filter((item) => item.score < 70).length;
  return <div className="content"><div className="pageTitle compact"><div><p>학원 관리 · {profile.branchName} {profile.className}</p><h1>학생의 점수보다 <em>개념의 빈틈</em>을 관리하세요.</h1><span>반 전체의 교육과정 진도와 학생별 위험 신호를 한 화면에서 확인합니다.</span></div><div className="titleActions"><button className="outlineBtn" onClick={onEditProfile}>✎ 학원 정보 수정</button><button className="primary" onClick={onAdd}>＋ 학생 추가</button></div></div>
    <div className="classSummary"><article><small>등록 학생</small><strong>{students.length}명</strong><span>{profile.branchName} {profile.className}</span></article><article><small>반 평균 정복도</small><strong>{average}%</strong><span className="up">실시간 반영</span></article><article><small>보완 필요 학생</small><strong className="coralText">{needsHelp}명</strong><span>70% 미만 기준</span></article><article><small>담당 선생님</small><strong className="teacherMetric">{profile.teacherName}</strong><span>{profile.teacherRole}</span></article></div>
    <div className="academyGrid"><article className="panel studentTable"><div className="panelHead"><div><span>학생별 진단</span><h2>{profile.branchName} {profile.className}</h2></div><button className="addStudentInline" onClick={onAdd}>＋ 학생 추가</button></div><div className="tableHead"><span>학생</span><span>정복도</span><span>변화</span><span>취약 개념</span><span>관리</span></div>{students.length ? students.map((s) => <div className="studentRow" key={s.id}><span><i style={{ background: s.color }}>{s.name.slice(-1)}</i><b>{s.name}<small>{s.grade}</small>{s.email && (s.linked ? <em className="linkedTag">✓ 계정 연동됨</em> : <em className="pendingTag">연동 대기</em>)}</b></span><span><em><i style={{ width: `${s.score}%` }} /></em><b>{s.score}%</b></span><span className={s.trend.startsWith("−") ? "down" : "up"}>{s.trend}</span><span><small className={s.risk === "없음" ? "safeTag" : "riskTag"}>{s.risk}</small></span><span className="rowActions"><button onClick={() => onEdit(s.id)} aria-label={`${s.name} 정보 수정`}>수정</button><button onClick={() => onSelect(s.id)}>진단</button><button className="deleteRowButton" onClick={() => onDelete(s.id)} aria-label={`${s.name} 삭제`}>삭제</button></span></div>) : <div className="emptyTable"><b>등록된 학생이 없어요.</b><span>학생을 추가해 반 관리를 시작하세요.</span><button onClick={onAdd}>＋ 학생 추가</button></div>}</article>
    <article className="panel heatmap"><div className="panelHead"><div><span>반 취약도</span><h2>개념 히트맵</h2></div></div>{["소인수분해", "정수와 유리수", "문자와 식", "좌표와 그래프", "기본 도형", "통계"].map((topic, i) => <div className="heatRow" key={topic}><span>{topic}</span><div>{[0,1,2,3,4].map((n) => <i key={n} className={`heat h${(i+n)%4}`} />)}</div><b>{[78,64,82,71,75,89][i]}%</b></div>)}<div className="heatLegend"><span>보완 필요</span><i className="heat h0" /><i className="heat h1" /><i className="heat h2" /><i className="heat h3" /><span>안정</span></div><button className="studyBtn">취약 개념 과제 만들기 →</button></article></div>
    <MistakeArchive mode="teacher" submissions={submissions} students={students} onRefresh={onRefreshSubmissions} fileUrlFor={(id) => `/api/submissions/${id}/file`} />
  </div>;
}
