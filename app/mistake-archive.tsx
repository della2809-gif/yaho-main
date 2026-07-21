"use client";

import { useMemo, useState } from "react";

export type ArchiveSubmission = {
  id: string;
  fileName: string;
  contentType: string;
  note: string;
  subject: string;
  topic: string;
  createdAt: string;
  student: { id: string; name: string; grade: string } | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const HEADER_HEIGHT = 128;
const MARGIN = 24;
const CANVAS_SCALE = 2;
const KOREAN_FONT_STACK = "'Malgun Gothic','Apple SD Gothic Neo',sans-serif";

function formatDate(createdAt: string) {
  const date = new Date(createdAt.replace(" ", "T") + "Z");
  return date.toLocaleString("ko-KR", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dataUrlToBytes(dataUrl: string) {
  const binary = atob(dataUrl.split(",")[1] ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.slice(0, maxLines).forEach((text2, i) => {
    let out = text2;
    if (i === maxLines - 1 && ctx.measureText(out).width > maxWidth) {
      while (out.length > 0 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
      out += "…";
    }
    ctx.fillText(out, x, y + i * lineHeight);
  });
}

function renderHeaderPng(item: ArchiveSubmission) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH * CANVAS_SCALE;
  canvas.height = HEADER_HEIGHT * CANVAS_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF 헤더를 그릴 수 없습니다.");
  ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_WIDTH, HEADER_HEIGHT);
  ctx.fillStyle = "#e9ebf3";
  ctx.fillRect(0, HEADER_HEIGHT - 2, PAGE_WIDTH, 2);

  const title = [item.subject, item.topic].filter(Boolean).join(" · ") || "미분류 오답노트";
  ctx.fillStyle = "#161c2c";
  ctx.font = `bold 22px ${KOREAN_FONT_STACK}`;
  ctx.fillText(title, MARGIN, 36);

  const meta = [item.student?.name, formatDate(item.createdAt), item.fileName].filter(Boolean).join("   ·   ");
  ctx.fillStyle = "#667187";
  ctx.font = `13px ${KOREAN_FONT_STACK}`;
  ctx.fillText(meta, MARGIN, 60);

  if (item.note) {
    ctx.fillStyle = "#3a4358";
    ctx.font = `13px ${KOREAN_FONT_STACK}`;
    wrapText(ctx, `메모: ${item.note}`, MARGIN, 86, PAGE_WIDTH - MARGIN * 2, 18, 2);
  }

  return dataUrlToBytes(canvas.toDataURL("image/png"));
}

async function toEmbeddablePng(bytes: Uint8Array, contentType: string): Promise<{ bytes: Uint8Array; kind: "png" | "jpg" }> {
  if (contentType === "image/jpeg") return { bytes, kind: "jpg" };
  if (contentType === "image/png") return { bytes, kind: "png" };
  const blob = new Blob([bytes], { type: contentType });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 변환할 수 없습니다.");
  ctx.drawImage(bitmap, 0, 0);
  return { bytes: dataUrlToBytes(canvas.toDataURL("image/png")), kind: "png" };
}

export async function exportSelectedAsPdf(items: ArchiveSubmission[], fileUrlFor: (id: string) => string) {
  if (!items.length) return;
  const { PDFDocument } = await import("pdf-lib");
  const outDoc = await PDFDocument.create();

  for (const item of items) {
    const response = await fetch(fileUrlFor(item.id));
    if (!response.ok) throw new Error(`${item.fileName} 파일을 불러오지 못했습니다.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const headerImage = await outDoc.embedPng(renderHeaderPng(item));

    if (item.contentType === "application/pdf") {
      const page = outDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      page.drawImage(headerImage, { x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT, width: PAGE_WIDTH, height: HEADER_HEIGHT });
      const srcDoc = await PDFDocument.load(bytes);
      const copiedPages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((copied) => outDoc.addPage(copied));
      continue;
    }

    const { bytes: imageBytes, kind } = await toEmbeddablePng(bytes, item.contentType);
    const image = kind === "jpg" ? await outDoc.embedJpg(imageBytes) : await outDoc.embedPng(imageBytes);
    const page = outDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(headerImage, { x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT, width: PAGE_WIDTH, height: HEADER_HEIGHT });

    const areaWidth = PAGE_WIDTH - MARGIN * 2;
    const areaHeight = PAGE_HEIGHT - HEADER_HEIGHT - MARGIN * 2;
    const scale = Math.min(areaWidth / image.width, areaHeight / image.height, 1);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    page.drawImage(image, { x: (PAGE_WIDTH - drawWidth) / 2, y: MARGIN + (areaHeight - drawHeight) / 2, width: drawWidth, height: drawHeight });
  }

  const pdfBytes = await outDoc.save();
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const link = document.createElement("a");
  link.href = url;
  link.download = `오답노트_모음_${dateStr}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function MistakeArchive({ mode, submissions, students, onRefresh, fileUrlFor }: {
  mode: "teacher" | "student";
  submissions: ArchiveSubmission[];
  students?: { id: string; name: string }[];
  onRefresh: () => void;
  fileUrlFor: (id: string) => string;
}) {
  const [subjectFilter, setSubjectFilter] = useState("전체");
  const [topicFilter, setTopicFilter] = useState("전체");
  const [studentFilter, setStudentFilter] = useState("전체");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportState, setExportState] = useState<"idle" | "exporting" | "error">("idle");

  const subjectOptions = useMemo(() => Array.from(new Set(submissions.map((s) => s.subject).filter(Boolean))), [submissions]);
  const topicOptions = useMemo(() => Array.from(new Set(submissions
    .filter((s) => subjectFilter === "전체" || s.subject === subjectFilter)
    .map((s) => s.topic).filter(Boolean))), [submissions, subjectFilter]);

  const filtered = useMemo(() => submissions.filter((s) =>
    (subjectFilter === "전체" || s.subject === subjectFilter) &&
    (topicFilter === "전체" || s.topic === topicFilter) &&
    (mode === "student" || studentFilter === "전체" || s.student?.id === studentFilter)
  ), [submissions, subjectFilter, topicFilter, studentFilter, mode]);

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleAll = () => setSelected((prev) => {
    if (allChecked) return new Set();
    return new Set(filtered.map((s) => s.id));
  });

  const runExport = async () => {
    const items = filtered.filter((s) => selected.has(s.id));
    if (!items.length) return;
    setExportState("exporting");
    try {
      await exportSelectedAsPdf(items, fileUrlFor);
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  };

  return <article className="panel submissionInbox archivePanel">
    <div className="panelHead"><div><span>{mode === "teacher" ? "학생 제출함" : "내 오답노트"}</span><h2>{mode === "teacher" ? "사진·PDF 오답 제출" : "과목·주제로 모아보고 PDF로 저장해요"}</h2></div>
      <div className="archiveHeadActions"><button onClick={onRefresh}>새로고침</button><button className="archiveExportBtn" onClick={() => void runExport()} disabled={exportState === "exporting" || selected.size === 0}>{exportState === "exporting" ? "PDF 만드는 중…" : `선택 항목 PDF로 저장 (${selected.size})`}</button></div>
    </div>
    {exportState === "error" && <p className="archiveError">PDF를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
    {submissions.length > 0 && <div className="archiveFilters">
      <label><small>과목</small><select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setTopicFilter("전체"); }}><option>전체</option>{subjectOptions.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label><small>주제</small><select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}><option>전체</option>{topicOptions.map((t) => <option key={t}>{t}</option>)}</select></label>
      {mode === "teacher" && students && <label><small>학생</small><select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}><option>전체</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      <label className="archiveSelectAll"><input type="checkbox" checked={allChecked} onChange={toggleAll} /><small>전체 선택</small></label>
    </div>}
    {filtered.length ? <div className="submissionList archiveList">{filtered.map((item) => <div className="submissionItem archiveRow" key={item.id}>
      <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} aria-label={`${item.fileName} 선택`} />
      <span className={`fileBadge ${item.contentType === "application/pdf" ? "pdf" : "image"}`}>{item.contentType === "application/pdf" ? "PDF" : "IMG"}</span>
      <div><b>{mode === "teacher" ? (item.student?.name ?? "삭제된 학생") : (item.subject || item.topic ? [item.subject, item.topic].filter(Boolean).join(" · ") : "미분류")}{mode === "teacher" && <small>{item.student?.grade ?? ""}</small>}</b>
        <p>{item.fileName}</p>
        {mode === "teacher" && (item.subject || item.topic) && <em className="archiveTag">{[item.subject, item.topic].filter(Boolean).join(" · ")}</em>}
        {item.note && <em>“{item.note}”</em>}
      </div>
      <time>{formatDate(item.createdAt)}</time>
      <a href={fileUrlFor(item.id)} target="_blank" rel="noreferrer">파일 보기</a>
    </div>)}</div> : <div className="emptyInbox"><b>{submissions.length ? "조건에 맞는 오답노트가 없어요." : "아직 제출된 문제가 없습니다."}</b>{mode === "teacher" && !submissions.length && <span>학생별 ‘링크’ 버튼으로 전용 페이지를 보내 주세요.</span>}</div>}
  </article>;
}
