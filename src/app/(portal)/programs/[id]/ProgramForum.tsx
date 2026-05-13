"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface Attachment {
  id: number; file_name: string; storage_path: string;
  mime_type: string; size_bytes: number;
}
interface Post {
  id: number; parent_id: number | null; body: string; tag?: string;
  created_at: string; user_id: string; name_ar?: string; email?: string;
}

const TAGS: Record<string, { label: string; color: string; bg: string }> = {
  info:    { label: "ℹ️ معلومة",  color: "#3F7DD9", bg: "rgba(63,125,217,0.12)" },
  warning: { label: "⚠️ تنبيه",   color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  success: { label: "✓ إنجاز",   color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  danger:  { label: "🚨 عاجل",    color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff/60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff/3600)} س`;
  if (diff < 604800) return `قبل ${Math.floor(diff/86400)} يوم`;
  return new Date(date).toLocaleDateString("ar-SA");
}

function initials(name?: string) {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
}

export default function ProgramForum({ programId }: { programId: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Record<number, Attachment[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [r, ra] = await Promise.all([
      fetch(`/api/programs/${programId}/forum`),
      fetch(`/api/programs/${programId}/forum/attachments`),
    ]);
    const d = await r.json();
    if (d.ok) { setPosts(d.posts); setCurrentUserId(d.current_user_id); }
    try {
      const da = await ra.json();
      if (da.ok) setAttachments(da.byPost || {});
    } catch {}
    setLoading(false);
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (body: string, parent_id: number | null, tagVal: string | null) => {
    if (!body.trim()) return;
    setSaving(true);
    await fetch(`/api/programs/${programId}/forum`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, tag: tagVal, parent_id }),
    });
    setSaving(false);
    await load();
  };

  const submitMain = async () => {
    await submit(text, null, tag || null);
    setText(""); setTag("");
  };

  const submitReply = async (parentId: number) => {
    await submit(replyText, parentId, null);
    setReplyText(""); setReplyOpen(null);
  };

  const remove = async (postId: number) => {
    if (!confirm("حذف هذا التعليق؟")) return;
    await fetch(`/api/programs/${programId}/forum?postId=${postId}`, { method: "DELETE" });
    load();
  };

  const topLevel = posts.filter(p => !p.parent_id);
  const repliesOf = (parentId: number) => posts.filter(p => p.parent_id === parentId);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("الملف كبير جداً (الحد 10MB)"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (text.trim()) fd.append("body", text.trim());
      const r = await fetch(`/api/programs/${programId}/forum/upload`, { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) { setText(""); await load(); }
      else { alert("فشل الرفع: " + (d.error || "خطأ غير معروف")); }
    } catch (err) {
      alert("فشل الرفع: " + String(err));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* COMPOSER — sleek Trello-card style */}
      <div style={{ background: "linear-gradient(135deg, #131826, #0f1419)", border: "1px solid #2a3142", borderRadius: 12, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="ابدأ نقاشاً جديداً، اكتب تنبيهاً، أو شارك إنجازاً..."
          rows={3}
          style={{ width: "100%", padding: 12, background: "#0a0d14", border: "1px solid #2a3142", borderRadius: 8, color: "#e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <TagBtn label="عادي" active={tag === ""} onClick={() => setTag("")} color="#64748b" />
            {Object.entries(TAGS).map(([k, m]) => (
              <TagBtn key={k} label={m.label} active={tag === k} onClick={() => setTag(k)} color={m.color} />
            ))}
            <input ref={fileInputRef} type="file" hidden onChange={handleFileSelected}
              accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.gif,.zip,.txt,.csv" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || saving}
              style={{ padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px dashed #00ABAF", background: uploading ? "rgba(0,171,175,0.1)" : "transparent", color: "#00ABAF", cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1, transition: "all 0.15s" }}>
              📎 {uploading ? "جاري الرفع..." : "إرفاق ملف"}
            </button>
          </div>
          <button onClick={submitMain} disabled={saving || !text.trim()}
            style={{ padding: "9px 22px", background: text.trim() ? "#00ABAF" : "#1f2937", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: text.trim() ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
            {saving ? "..." : "نشر 📤"}
          </button>
        </div>
      </div>

      {/* THREADS */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>جاري التحميل...</div>
      ) : topLevel.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b", fontSize: 13, background: "#0f1419", borderRadius: 10, border: "1px dashed #2a3142" }}>
          💭 ما فيه نقاشات بعد — كن أوّل من يبدأ
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topLevel.map(p => {
            const replies = repliesOf(p.id);
            const m = p.tag ? TAGS[p.tag] : null;
            const isMine = p.user_id === currentUserId;
            const isReplying = replyOpen === p.id;

            return (
              <div key={p.id} style={{ background: m?.bg || "#131826", border: `1px solid ${m?.color || "#2a3142"}33`, borderRadius: 10, overflow: "hidden", transition: "all 0.15s" }}>
                {/* Main post */}
                <div style={{ padding: 14, borderRight: `3px solid ${m?.color || "#2a3142"}` }}>
                  <div style={{ display: "flex", alignItems: "start", gap: 10, marginBottom: 8 }}>
                    <Avatar name={p.name_ar || p.email} color={m?.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{p.name_ar || p.email}</span>
                        {m && <span style={{ fontSize: 10, padding: "2px 8px", background: m.color, color: "#fff", borderRadius: 4 }}>{m.label}</span>}
                        <span style={{ fontSize: 10, color: "#64748b" }}>· {timeAgo(p.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#cbd5e1", whiteSpace: "pre-wrap", marginTop: 6, lineHeight: 1.7 }}>{p.body}</div>
                  {attachments[p.id] && attachments[p.id].length > 0 && (
                    <div style={{ marginTop: 8, marginRight: 50, display: "flex", flexDirection: "column", gap: 6 }}>
                      {attachments[p.id].map((a) => (
                        <a key={a.id} href={a.storage_path} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px",
                            background: "rgba(0,171,175,0.08)", border: "1px solid rgba(0,171,175,0.25)",
                            borderRadius: 8, color: "#00ABAF", textDecoration: "none", fontSize: 12,
                            fontWeight: 500, alignSelf: "flex-start", transition: "all 0.15s" }}>
                          <span style={{ fontSize: 14 }}>📎</span>
                          <span style={{ flex: 1 }}>{a.file_name}</span>
                          <span style={{ fontSize: 10, color: "#64748b" }}>{a.size_bytes > 1024 * 1024 ? `${(a.size_bytes / 1024 / 1024).toFixed(1)} MB` : `${(a.size_bytes / 1024).toFixed(0)} KB`}</span>
                        </a>
                      ))}
                    </div>
                  )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, paddingTop: 8, borderTop: "1px solid rgba(42,49,66,0.5)", fontSize: 12 }}>
                    <button onClick={() => { setReplyOpen(isReplying ? null : p.id); setReplyText(""); }}
                      style={btnGhost("#00ABAF")}>
                      💬 رد {replies.length > 0 && `(${replies.length})`}
                    </button>
                    {isMine && <button onClick={() => remove(p.id)} style={btnGhost("#EF4444")}>🗑️ حذف</button>}
                  </div>
                </div>

                {/* Replies (indented) */}
                {replies.length > 0 && (
                  <div style={{ background: "#0a0d14", borderTop: "1px solid #2a3142", padding: "10px 14px", paddingRight: 50 }}>
                    {replies.map(r => {
                      const rIsMine = r.user_id === currentUserId;
                      return (
                        <div key={r.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px dashed #2a3142" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                            <Avatar name={r.name_ar || r.email} small />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                                <strong style={{ color: "#cbd5e1" }}>{r.name_ar || r.email}</strong>
                                <span style={{ marginRight: 6, fontSize: 10, color: "#64748b" }}>· {timeAgo(r.created_at)}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 3, whiteSpace: "pre-wrap" }}>{r.body}</div>
                              {rIsMine && (
                                <button onClick={() => remove(r.id)}
                                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 10, marginTop: 4, padding: 0 }}>
                                  حذف
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline reply form */}
                {isReplying && (
                  <div style={{ background: "#0a0d14", borderTop: "1px solid #2a3142", padding: 12 }}>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="اكتب ردك..."
                      autoFocus rows={2}
                      style={{ width: "100%", padding: 8, background: "#131826", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button onClick={() => submitReply(p.id)} disabled={!replyText.trim()}
                        style={{ padding: "6px 14px", background: replyText.trim() ? "#00ABAF" : "#1f2937", color: "#fff", border: 0, borderRadius: 5, fontSize: 12, cursor: replyText.trim() ? "pointer" : "not-allowed" }}>
                        رد
                      </button>
                      <button onClick={() => { setReplyOpen(null); setReplyText(""); }}
                        style={{ padding: "6px 14px", background: "transparent", color: "#94a3b8", border: "1px solid #2a3142", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, color, small }: { name?: string; color?: string; small?: boolean }) {
  const size = small ? 28 : 36;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "#7C32C9", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: small ? 10 : 12, fontWeight: 600, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function TagBtn({ label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", fontSize: 11, borderRadius: 6, cursor: "pointer",
      background: active ? color : "transparent",
      color: active ? "#fff" : color,
      border: `1px solid ${color}`,
      fontWeight: active ? 600 : 400,
    }}>{label}</button>
  );
}

function btnGhost(color: string): React.CSSProperties {
  return { background: "none", border: "none", color, cursor: "pointer", fontSize: 12, padding: 0, fontWeight: 500 };
}
