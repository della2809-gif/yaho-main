import Link from "next/link";

const features = [
  { icon: "✎", title: "오답 분석", desc: "틀린 문제 사진이나 PDF를 올리면 유형과 단계별 풀이, 자주 헷갈리는 지점을 바로 보여줘요." },
  { icon: "◉", title: "학습 진단", desc: "영역별 이해도와 선수·현재·후속 개념의 연결을 한눈에 확인할 수 있어요." },
  { icon: "▤", title: "오답노트 보관", desc: "과목·주제별로 오답을 모아두고, 원하는 것만 골라 PDF 한 장으로 내보낼 수 있어요." },
];

const steps = [
  { n: "1", title: "문제 사진·PDF 업로드", desc: "헷갈렸던 문제를 사진으로 찍거나 PDF로 올려요." },
  { n: "2", title: "유형·풀이 자동 분석", desc: "문제 유형, 단계별 풀이, 예상 혼동 지점을 바로 확인해요." },
  { n: "3", title: "오답노트로 보관", desc: "과목·주제 태그를 붙여 모아두고, 필요할 때 PDF로 내보내요." },
];

export default function Landing() {
  return (
    <main className="landingPage">
      <header className="landingHeader">
        <div className="logo"><span>√</span><div><b>수학성장지도</b><small>Math Path Lab</small></div></div>
        <Link className="landingNavLogin" href="/login">로그인</Link>
      </header>

      <section className="landingHero">
        <span className="landingBadge">학생과 학부모를 위한 무료 수학 오답 관리</span>
        <h1>오답 하나에서<br /><em>다음 학습 방향</em>까지</h1>
        <p>틀린 문제 사진 한 장으로 유형과 풀이를 분석하고, 내 학습 진단과 오답노트를 한곳에서 확인하세요.</p>
        <div className="landingHeroActions">
          <Link className="primary" href="/login">무료로 시작하기 →</Link>
        </div>
      </section>

      <section className="landingSection">
        <div className="landingSectionHead"><span>기능 소개</span><h2>이런 게 가능해요</h2></div>
        <div className="landingFeatureGrid landingFeatureGrid3">
          {features.map((f) => (
            <article className="landingFeatureCard" key={f.title}>
              <span className="landingFeatureIcon">{f.icon}</span>
              <b>{f.title}</b>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection landingSteps">
        <div className="landingSectionHead"><span>사용 방법</span><h2>이렇게 사용해요</h2></div>
        <div className="landingStepGrid">
          {steps.map((s, i) => (
            <div className="landingStepItem" key={s.n}>
              <div className="landingStepCard"><i>{s.n}</i><b>{s.title}</b><p>{s.desc}</p></div>
              {i < steps.length - 1 && <span className="landingStepArrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="landingAudience">
        <article><span>학생</span><h3>내 오답만 모아보는 학습실</h3><p>선생님이 등록한 이메일과 같은 이메일로 가입하면 자동으로 내 학습 페이지와 연결돼요. 문제를 제출하고 나만의 오답노트를 관리할 수 있어요.</p></article>
        <article><span>학부모</span><h3>아이의 학습을 함께 챙기세요</h3><p>아이가 스스로 오답을 정리하는 동안, 어떤 개념에서 자주 막히는지 학습 진단으로 함께 확인하고 다음 학습 방향을 챙길 수 있어요.</p></article>
      </section>

      <section className="landingCta">
        <h2>지금 바로 시작해 보세요</h2>
        <p>이메일로 가입하거나 구글·카카오 계정으로 간편하게 시작할 수 있어요.</p>
        <Link className="primary" href="/login">로그인 · 회원가입 →</Link>
      </section>

      <footer className="landingFooter">
        <div className="logo"><span>√</span><div><b>수학성장지도</b><small>Math Path Lab</small></div></div>
        <span>© {new Date().getFullYear()} 수학성장지도</span>
      </footer>
    </main>
  );
}
