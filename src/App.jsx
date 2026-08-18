import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Line, ScatterChart, Scatter, ComposedChart, Area, Bar, BarChart, Cell, XAxis, YAxis, ZAxis,
  ResponsiveContainer, ReferenceArea, ReferenceLine, Tooltip, CartesianGrid,
} from "recharts";
import {
  Eye, EyeOff, Home, Gauge, Activity, Settings, Bluetooth, Check, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, ChevronsUpDown, Bell, Clock, Stethoscope, Smartphone, Send, User, Users,
  UserPlus, UserCog, RefreshCw, X, Trash2, Plus, CalendarDays, AlertTriangle, LineChart, Circle,
  Sunrise, Sun, Sunset, Moon, TrendingUp, Share2, ShieldCheck, Shield, Info, ListChecks, Search,
  Lock, LogIn, LogOut, KeyRound, Mail, Phone, Flag, Globe, Monitor, FileText, Download,
  Building2, PackageCheck, Undo2, Link2, Unlink, BatteryLow, CircleAlert,
  WifiOff, MessageSquare, CheckCheck, Timer, BellRing, Play, History, PhoneCall, ServerCog, Sparkles,
} from "lucide-react";

/* ============================================================
   안압케어 IOP v2 — 안압관리 전용 (환자 앱 + 의료진 웹)
   C&V Tech · CVT200 companion
   v2 추가: ① 좌/우안 선택 측정  ② 계정·권한 관리 + 고객 DB
            ③ 그래프 타입 선택 (Chart / Scatter / Diurnal)
   ============================================================ */

const C = {
  ink: "#0A2A31", primary: "#0E5563", primaryDeep: "#083841", aqua: "#3EA6A6",
  mint: "#E6F0EF", mintDeep: "#D3E6E4", bg: "#F3F7F6", card: "#FFFFFF", line: "#E2EAE9",
  sub: "#5E7A7C", gold: "#C39A2E", goldSoft: "#F3E9CC",
  low: "#2E9E7B", lowSoft: "#E4F2EC", mid: "#D79A2B", midSoft: "#FBEFD3",
  high: "#D25C46", highSoft: "#FBE6E0", od: "#0E5563", os: "#C39A2E", grey: "#AAB9B8",
};
const FONT = "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', system-ui, sans-serif";
const RISK = {
  저: { label: "낮음", c: C.low, soft: C.lowSoft },
  중: { label: "주의", c: C.mid, soft: C.midSoft },
  고: { label: "높음", c: C.high, soft: C.highSoft },
  "-": { label: "참고", c: C.sub, soft: "#EEF2F1" },
};

/* ============================================================
   역할 · 권한 정의
   ============================================================ */
const ROLES = {
  admin: { id: "admin", label: "관리자", short: "관리자", c: C.high, desc: "기관 전체 설정·사용자 계정·데이터 관리" },
  physician: { id: "physician", label: "의사", short: "의사", c: C.low, desc: "환자 진료·목표 안압 설정·인증" },
  trainer: { id: "trainer", label: "교육 담당자", short: "교육", c: C.gold, desc: "환자 등록·측정 교육·기기 관리" },
};
/* 권한 매트릭스: [환자, 의사, 교육담당자, 관리자] */
const PERMISSIONS = [
  { t: "신규 사용자(직원) 생성", p: [0, 0, 0, 1] },
  { t: "사용자 명단 보기", p: [0, 0, 0, 1] },
  { t: "사용자 정보 보기 및 편집", p: [0, 0, 0, 1] },
  { t: "기관 정보 보기 및 편집", p: [0, 0, 0, 1] },
  { t: "기관 데이터 다운로드", p: [0, 0, 0, 1] },
  { t: "기관 장치(CVT200) 관리", p: [0, 1, 1, 1] },
  { t: "환자 추가", p: [0, 1, 1, 1] },
  { t: "환자 명단 보기", p: [0, 1, 1, 1] },
  { t: "환자 정보 보기 및 편집", p: [0, 1, 1, 1] },
  { t: "환자 활성화 및 비활성화", p: [0, 1, 1, 1] },
  { t: "환자 계정 인증", p: [0, 1, 1, 1] },
  { t: "목표 안압 설정·변경", p: [0, 1, 0, 1] },
  { t: "측정 결과 및 보고서 보기", p: [0, 1, 1, 1] },
  { t: "측정 결과 제외 처리", p: [0, 1, 0, 1] },
  { t: "홈 사용 기간 지정", p: [0, 1, 1, 1] },
  { t: "본인 프로필 보기", p: [1, 1, 1, 1] },
  { t: "본인 측정 결과 및 보고서 보기", p: [1, 1, 1, 1] },
  { t: "본인 안압계에서 결과 업로드", p: [1, 1, 1, 1] },
];
const CAN = {
  admin: { users: 1, org: 1, devices: 1, patients: 1, addPatient: 1, editTarget: 1, exclude: 1, download: 1, notifySend: 1, notifyEdit: 1, runBatch: 1 },
  physician: { users: 0, org: 0, devices: 1, patients: 1, addPatient: 1, editTarget: 1, exclude: 1, download: 0, notifySend: 1, notifyEdit: 0, runBatch: 1 },
  trainer: { users: 0, org: 0, devices: 1, patients: 1, addPatient: 1, editTarget: 0, exclude: 0, download: 0, notifySend: 1, notifyEdit: 0, runBatch: 0 },
};

/* ============================================================
   SNS 로그인 제공자 (국가별)
   ============================================================ */
const SNS = [
  { region: "한국", items: [
    { id: "kakao", label: "카카오", c: "#FEE500", fg: "#191600", mark: "K" },
    { id: "naver", label: "네이버", c: "#03C75A", fg: "#fff", mark: "N" },
  ]},
  { region: "미국 · 글로벌", items: [
    { id: "google", label: "Google", c: "#fff", fg: "#3C4043", mark: "G", border: true },
    { id: "apple", label: "Apple", c: "#000", fg: "#fff", mark: "A" },
    { id: "facebook", label: "Facebook", c: "#1877F2", fg: "#fff", mark: "f" },
  ]},
  { region: "중국", items: [
    { id: "wechat", label: "WeChat 위챗", c: "#07C160", fg: "#fff", mark: "W" },
    { id: "weibo", label: "Weibo 웨이보", c: "#E6162D", fg: "#fff", mark: "微" },
    { id: "qq", label: "QQ", c: "#12B7F5", fg: "#fff", mark: "Q" },
  ]},
];
const SNS_MAP = SNS.reduce((a, g) => { g.items.forEach((i) => (a[i.id] = i)); return a; }, {});

/* ============================================================
   데모 데이터
   ============================================================ */
const _pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`;
const TODAY_REF = new Date(2026, 6, 3);
const RANGE_FROM_DEFAULT = isoDate(new Date(2026, 5, 3));
const RANGE_TO_DEFAULT = isoDate(TODAY_REF);

const PATIENTS_DB = [
  { id: "P-1042", name: "이순영", gender: "남", birth: "1962-01-02", phone: "010-3355-7712", email: "sylee@naver.com", loginId: "sylee62", join: "kakao", dx: "정상안압녹내장 (NTG)", targetOD: 15, targetOS: 16, lastAt: "2026-07-03 18:30", lastOD: 17.2, cnt: 128, notify: "고", active: true, period: "2026-06-03 ~ 2026-07-03", serial: "CVT2H-2033AA11", certified: true },
  { id: "P-1043", name: "김도현", gender: "남", birth: "1958-11-20", phone: "010-2211-9080", email: "dhkim@gmail.com", loginId: "dhkim58", join: "google", dx: "원발개방각녹내장", targetOD: 16, targetOS: 16, lastAt: "2026-07-03 09:12", lastOD: 15.4, cnt: 96, notify: "-", active: true, period: "2026-05-20 ~ 2026-07-20", serial: "CVT2H-2033AB27", certified: true },
  { id: "P-1044", name: "박미정", gender: "여", birth: "1971-04-08", phone: "010-7788-1122", email: "mjpark@kakao.com", loginId: "mjpark71", join: "개별", dx: "고안압증", targetOD: 18, targetOS: 18, lastAt: "2026-07-02 21:40", lastOD: 19.6, cnt: 54, notify: "고", active: true, period: "2026-06-15 ~ 2026-07-15", serial: "CVT2H-2041CC03", certified: false },
  { id: "P-1045", name: "Wang Lei", gender: "남", birth: "1965-09-30", phone: "+86 138-0011-2233", email: "wanglei@wechat.cn", loginId: "wanglei65", join: "wechat", dx: "폐쇄각녹내장 의증", targetOD: 15, targetOS: 15, lastAt: "2026-07-01 07:35", lastOD: 18.3, cnt: 41, notify: "중", active: true, period: "2026-06-01 ~ 2026-08-01", serial: "CVT2H-2050DD88", certified: true },
  { id: "P-1046", name: "정해린", gender: "여", birth: "1980-02-14", phone: "010-9090-3344", email: "hrjung@apple.com", loginId: "hrjung80", join: "apple", dx: "녹내장 의증", targetOD: 17, targetOS: 17, lastAt: "2026-06-28 13:05", lastOD: 14.8, cnt: 22, notify: "-", active: true, period: "2026-06-10 ~ 2026-07-10", serial: "CVT2H-2051EE14", certified: true },
  { id: "P-1047", name: "Sarah Miller", gender: "여", birth: "1954-07-19", phone: "+1 415-220-8891", email: "smiller@topeye.com", loginId: "smiller54", join: "facebook", dx: "정상안압녹내장 (NTG)", targetOD: 14, targetOS: 15, lastAt: "2026-06-25 07:20", lastOD: 16.9, cnt: 77, notify: "중", active: true, period: "2026-05-01 ~ 2026-07-01", serial: "CVT2H-2062GG40", certified: true },
  { id: "P-1048", name: "최우석", gender: "남", birth: "1949-12-03", phone: "010-4455-6677", email: "-", loginId: "guest-8842", join: "비회원", dx: "미지정", targetOD: 16, targetOS: 16, lastAt: "2026-06-20 10:40", lastOD: 15.1, cnt: 8, notify: "-", active: false, period: "2026-06-18 ~ 2026-06-25", serial: "—", certified: false },
];
const USERS_DB = [
  { id: "U-01", name: "김선우", email: "swkim@cnvtech.co.kr", org: "씨엔브이 안과", role: "admin", phone: "010-1111-2222", last: "2026-07-03", active: true },
  { id: "U-02", name: "이재훈", email: "jhlee@cnvtech.co.kr", org: "씨엔브이 안과", role: "physician", phone: "010-3333-4444", last: "2026-07-03", active: true },
  { id: "U-03", name: "한소진", email: "sjhan@cnvtech.co.kr", org: "씨엔브이 안과", role: "physician", phone: "010-5555-6666", last: "2026-07-02", active: true },
  { id: "U-04", name: "박정민", email: "jmpark@cnvtech.co.kr", org: "씨엔브이 안과", role: "trainer", phone: "010-7777-8888", last: "2026-07-01", active: true },
  { id: "U-05", name: "Ann Lewinsky", email: "ann@topeye.com", org: "Topeye Clinic", role: "trainer", phone: "+1 415-220-1010", last: "2026-06-28", active: false },
];
/* ---------- 장치: 소유 구분 = 기관(대여용/원내용) · 환자 개인 소유 ---------- */
const TODAY_STR = "2026-07-03";
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const DEVICES_INIT = [
  { serial: "CVT2-1719BD007", name: "1진료실 CVT200", type: "CVT200", owner: "기관", use: "clinic", org: "씨엔브이 안과", assignedTo: null, rentFrom: null, rentTo: null, linkedAt: null, battery: 82, fw: "1.4.2", active: true },
  { serial: "CVT2-1717BD095", name: "2진료실 CVT200", type: "CVT200", owner: "기관", use: "clinic", org: "씨엔브이 안과", assignedTo: null, rentFrom: null, rentTo: null, linkedAt: null, battery: 64, fw: "1.4.2", active: true },
  { serial: "CVT2H-2033AA11", name: "홈 대여기 #1", type: "CVT200 HOME", owner: "기관", use: "home", org: "씨엔브이 안과", assignedTo: "P-1042", rentFrom: "2026-06-03", rentTo: "2026-07-03", linkedAt: null, battery: 47, fw: "1.4.0", active: true },
  { serial: "CVT2H-2041CC03", name: "홈 대여기 #2", type: "CVT200 HOME", owner: "기관", use: "home", org: "씨엔브이 안과", assignedTo: "P-1044", rentFrom: "2026-06-15", rentTo: "2026-06-30", linkedAt: null, battery: 12, fw: "1.4.0", active: true },
  { serial: "CVT2H-2049FF62", name: "홈 대여기 #3", type: "CVT200 HOME", owner: "기관", use: "home", org: "씨엔브이 안과", assignedTo: null, rentFrom: null, rentTo: null, linkedAt: null, battery: 100, fw: "1.4.2", active: true },
  { serial: "CVT2H-2062GG40", name: "홈 대여기 #4", type: "CVT200 HOME", owner: "기관", use: "home", org: "씨엔브이 안과", assignedTo: "P-1047", rentFrom: "2026-06-20", rentTo: "2026-07-20", linkedAt: null, battery: 71, fw: "1.4.2", active: true },
  { serial: "CVT2H-2033AB27", name: "김도현 개인 기기", type: "CVT200 HOME", owner: "개인", use: "home", org: "씨엔브이 안과", assignedTo: "P-1043", rentFrom: null, rentTo: null, linkedAt: "2026-05-20", battery: 88, fw: "1.4.2", active: true },
  { serial: "CVT2H-2050DD88", name: "Wang Lei 개인 기기", type: "CVT200 HOME", owner: "개인", use: "home", org: "씨엔브이 안과", assignedTo: "P-1045", rentFrom: null, rentTo: null, linkedAt: "2026-06-01", battery: 55, fw: "1.4.1", active: true },
  { serial: "CVT2H-2051EE14", name: "정해린 개인 기기", type: "CVT200 HOME", owner: "개인", use: "home", org: "씨엔브이 안과", assignedTo: "P-1046", rentFrom: null, rentTo: null, linkedAt: "2026-06-10", battery: 93, fw: "1.4.2", active: true },
  { serial: "CVT2-9001XX02", name: "Topeye 데모기", type: "CVT200", owner: "기관", use: "clinic", org: "Topeye Clinic", assignedTo: null, rentFrom: null, rentTo: null, linkedAt: null, battery: 0, fw: "1.3.8", active: false },
];
function deviceState(d) {
  if (!d) return { k: "none", label: "기기 미배정", c: C.sub, bg: "#EEF2F1" };
  if (!d.active) return { k: "inactive", label: "비활성", c: C.sub, bg: "#EEF2F1" };
  if (d.owner === "개인") return { k: "owned", label: "개인 소유 · 연동됨", c: C.aqua, bg: "#E2F1F0" };
  if (d.use === "clinic") return { k: "clinic", label: "원내 사용", c: C.primary, bg: C.mint };
  if (!d.assignedTo) return { k: "free", label: "대여 가능", c: C.low, bg: C.lowSoft };
  const dd = dayDiff(TODAY_STR, d.rentTo);
  if (dd < 0) return { k: "overdue", label: `반납 연체 ${-dd}일`, c: C.high, bg: C.highSoft, dd };
  if (dd === 0) return { k: "due", label: "오늘 반납 예정", c: C.mid, bg: C.midSoft, dd };
  if (dd <= 3) return { k: "due", label: `반납 D-${dd}`, c: C.mid, bg: C.midSoft, dd };
  return { k: "rent", label: `대여 중 D-${dd}`, c: C.primary, bg: C.mint, dd };
}
function OwnerBadge({ owner, small }) {
  const rental = owner === "기관";
  return <span className="inline-flex items-center gap-1" style={{ fontSize: small ? 10 : 11, fontWeight: 700, color: rental ? C.primary : C.aqua, background: rental ? C.mint : "#E2F1F0", padding: small ? "2px 7px" : "3px 9px", borderRadius: 99 }}>
    {rental ? <Building2 size={10} /> : <User size={10} />}{rental ? "병원 대여" : "개인 소유"}
  </span>;
}
function DevStateChip({ st, small }) {
  return <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, color: st.c, background: st.bg, padding: small ? "2px 8px" : "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>{st.label}</span>;
}

/* ============================================================
   ★ 반납 예정 알림 자동화 엔진
   D-3 안내 → D-1 알림 → 당일 → 연체 경고 → 연체 3일 초과 시 데이터 수신 중단
   ============================================================ */
const SYNC_GRACE = 3;   // 연체 후 데이터 수신을 유지하는 유예 일수
const RENT_LEVEL = {
  d3: { key: "d3", icon: CalendarDays, c: C.primary, bg: C.mint, title: "반납 3일 전 안내", ch: "앱 푸시" },
  d1: { key: "d1", icon: BellRing, c: C.mid, bg: C.midSoft, title: "반납 1일 전 알림", ch: "앱 푸시 + SMS" },
  d0: { key: "d0", icon: BellRing, c: C.mid, bg: C.midSoft, title: "오늘 반납 예정", ch: "앱 푸시 + SMS" },
  overdue: { key: "overdue", icon: AlertTriangle, c: C.high, bg: C.highSoft, title: "반납 연체", ch: "앱 푸시 + SMS + 유선" },
  blocked: { key: "blocked", icon: WifiOff, c: C.high, bg: C.highSoft, title: "측정 데이터 수신 중단", ch: "앱 푸시 + SMS + 유선" },
};
/* rentTo(반납 예정일)와 기준일을 비교해 알림 단계를 반환. 대상 아니면 null */
function rentAlert(rentTo, today) {
  if (!rentTo) return null;
  const dd = dayDiff(today, rentTo);
  if (dd > 3) return null;
  let key;
  if (dd >= 2) key = "d3";
  else if (dd === 1) key = "d1";
  else if (dd === 0) key = "d0";
  else if (dd > -SYNC_GRACE) key = "overdue";
  else key = "blocked";
  const L = RENT_LEVEL[key];
  const msg = dd > 0 ? `반납 예정일까지 ${dd}일 남았습니다.`
    : dd === 0 ? "오늘이 반납 예정일입니다."
    : key === "overdue" ? `반납 예정일이 ${-dd}일 지났습니다. ${SYNC_GRACE + dd}일 후 측정 데이터 수신이 중단됩니다.`
    : `반납 연체 ${-dd}일 · 측정 데이터가 의료진에게 전송되지 않습니다.`;
  return { ...L, dd, msg, blocked: key === "blocked" };
}
/* 기관 대여 기기 중 알림 대상만 추출 */
function rentAlertList(devices, patients, today = TODAY_STR) {
  return devices
    .filter((d) => d.owner === "기관" && d.use === "home" && d.active && d.assignedTo)
    .map((d) => ({ dev: d, a: rentAlert(d.rentTo, today), pt: patients.find((x) => x.id === d.assignedTo) }))
    .filter((x) => x.a)
    .sort((x, y) => x.a.dd - y.a.dd);
}
function AlertChip({ a, small }) {
  return <span className="inline-flex items-center gap-1" style={{ fontSize: small ? 10 : 11, fontWeight: 700, color: a.c, background: a.bg, padding: small ? "2px 8px" : "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
    <a.icon size={small ? 10 : 11} />{a.title}
  </span>;
}

/* ---------- 발송 채널 · 스케줄 설정 ---------- */
const CHANNELS = [
  { id: "push", label: "앱 푸시", icon: Smartphone, gw: "FCM / APNs", c: C.primary },
  { id: "sms", label: "SMS", icon: MessageSquare, gw: "문자 발송사 API", c: C.gold },
  { id: "call", label: "유선 안내", icon: PhoneCall, gw: "콜 리스트 생성", c: C.high },
];
const NOTIFY_CFG_INIT = {
  enabled: true,
  runAt: "09:00",
  grace: SYNC_GRACE,
  resendDaily: true,
  quiet: true,
  retry: 2,
  ch: {
    d3: { push: true, sms: false, call: false },
    d1: { push: true, sms: true, call: false },
    d0: { push: true, sms: true, call: false },
    overdue: { push: true, sms: true, call: true },
    blocked: { push: true, sms: true, call: true },
  },
};
const chLabel = (cfg, key) => CHANNELS.filter((c) => cfg.ch[key] && cfg.ch[key][c.id]).map((c) => c.label).join(" + ") || "발송 없음";
const AUDIT_INIT = [
  { id: "L-018", at: "2026-07-03 09:00", pid: "P-1042", name: "이순영", serial: "CVT2H-2033AA11", level: "d0", chs: ["push", "sms"], mode: "자동", result: "성공", actor: "스케줄러", detail: "당일 반납 안내 발송" },
  { id: "L-017", at: "2026-07-03 09:00", pid: "P-1044", name: "박미정", serial: "CVT2H-2041CC03", level: "blocked", chs: ["push", "sms", "call"], mode: "자동", result: "부분 실패", actor: "스케줄러", detail: "SMS 수신 거부 번호 · 푸시 성공" },
  { id: "L-016", at: "2026-07-02 09:00", pid: "P-1044", name: "박미정", serial: "CVT2H-2041CC03", level: "overdue", chs: ["push", "sms", "call"], mode: "자동", result: "성공", actor: "스케줄러", detail: "연체 2일 재발송" },
  { id: "L-015", at: "2026-07-02 14:22", pid: "P-1044", name: "박미정", serial: "CVT2H-2041CC03", level: "overdue", chs: ["sms"], mode: "수동", result: "성공", actor: "박정민", detail: "담당자 수동 재발송" },
  { id: "L-014", at: "2026-07-02 09:00", pid: "P-1042", name: "이순영", serial: "CVT2H-2033AA11", level: "d1", chs: ["push", "sms"], mode: "자동", result: "성공", actor: "스케줄러", detail: "반납 1일 전 알림" },
  { id: "L-013", at: "2026-07-01 09:00", pid: "P-1044", name: "박미정", serial: "CVT2H-2041CC03", level: "overdue", chs: ["push", "sms"], mode: "자동", result: "실패", actor: "스케줄러", detail: "푸시 토큰 만료 · 재시도 2회 초과" },
  { id: "L-012", at: "2026-06-30 09:00", pid: "P-1042", name: "이순영", serial: "CVT2H-2033AA11", level: "d3", chs: ["push"], mode: "자동", result: "성공", actor: "스케줄러", detail: "반납 3일 전 안내" },
  { id: "L-011", at: "2026-06-30 09:00", pid: "P-1044", name: "박미정", serial: "CVT2H-2041CC03", level: "d0", chs: ["push", "sms"], mode: "자동", result: "성공", actor: "스케줄러", detail: "당일 반납 안내 발송" },
  { id: "L-010", at: "2026-06-17 09:00", pid: "P-1047", name: "Sarah Miller", serial: "CVT2H-2062GG40", level: "d3", chs: ["push"], mode: "자동", result: "성공", actor: "스케줄러", detail: "반납 3일 전 안내" },
];
const RESULT_C = { "성공": C.low, "부분 실패": C.mid, "실패": C.high };

/* ---------- 오늘 실시간 측정 세션 (od/os 중 한쪽만 있을 수 있음) ---------- */
const SESSIONS_INIT = [
  { id: "s1", t: "07:40", tv: 7.67, od: 16.4, os: 15.2, ctx: "기상 직후", src: "auto", eye: "both" },
  { id: "s2", t: "12:10", tv: 12.17, od: 17.2, os: null, ctx: "", src: "auto", eye: "od" },
  { id: "s3", t: "18:30", tv: 18.5, od: 16.1, os: 15.0, ctx: "저녁 식후", src: "manual", eye: "both" },
];

/* ============================================================
   추세 데이터 생성
   ============================================================ */
const PERIODS = ["2주", "1개월", "3개월", "6개월", "1년", "누적"];
function _rnd(seed) { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); }
function _hash(s) { let x = 7; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 100000; return x; }
function _fmt(date, kind) {
  const m = date.getMonth() + 1, d = date.getDate(), yy = String(date.getFullYear()).slice(2);
  if (kind === "mon") return `${m}월`;
  if (kind === "ym") return `${yy}.${m}`;
  return `${m}/${d}`;
}
const _CFG = {
  "2주": { n: 14, step: 1, kind: "md", spread: 1.6 },
  "1개월": { n: 15, step: 2, kind: "md", spread: 1.9 },
  "3개월": { n: 13, step: 7, kind: "md", spread: 2.4 },
  "6개월": { n: 12, step: 15, kind: "md", spread: 2.8 },
  "1년": { n: 12, step: 30, kind: "mon", spread: 3.3 },
  "누적": { n: 16, step: 40, kind: "ym", spread: 3.6 },
};
function _point(date, kind, base, i, spread) {
  const wave = Math.sin(i * 0.5 + (base % 6)) * 0.9;
  const odAvg = +(16.3 + wave + (_rnd(base + i) - 0.5) * 0.7).toFixed(1);
  const osAvg = +(15.2 + wave * 0.8 + (_rnd(base + 500 + i) - 0.5) * 0.6).toFixed(1);
  const dOD = spread * (0.6 + _rnd(base + 90 + i) * 0.5);
  const dOS = spread * (0.55 + _rnd(base + 130 + i) * 0.5);
  const odMin = +(odAvg - dOD * 0.55).toFixed(1), odMax = +(odAvg + dOD * 0.6).toFixed(1);
  const osMin = +(osAvg - dOS * 0.5).toFixed(1), osMax = +(osAvg + dOS * 0.55).toFixed(1);
  return {
    d: _fmt(date, kind), i, odAvg, odMin, odMax, osAvg, osMin, osMax,
    cnt: 2 + Math.round(_rnd(base + 700 + i) * 2),
    odRange: [odMin, odMax], osRange: [osMin, osMax], fluc: +(odMax - odMin).toFixed(1),
  };
}
function trendData(period) {
  const c = _CFG[period] || _CFG["1개월"]; const base = _hash(period);
  const out = [];
  for (let i = 0; i < c.n; i++) {
    const date = new Date(TODAY_REF); date.setDate(date.getDate() - (c.n - 1 - i) * c.step);
    out.push(_point(date, c.kind, base, i, c.spread));
  }
  return out;
}
function _spanCfg(days) {
  if (days <= 30) return { step: Math.max(1, Math.round(days / 13)), kind: "md", spread: 1.9 };
  if (days <= 120) return { step: 7, kind: "md", spread: 2.4 };
  if (days <= 210) return { step: 15, kind: "md", spread: 2.8 };
  if (days <= 400) return { step: 30, kind: "mon", spread: 3.3 };
  return { step: Math.round(days / 15), kind: "ym", spread: 3.6 };
}
function trendDataRange(fromStr, toStr) {
  const from = new Date(fromStr), to = new Date(toStr);
  if (isNaN(from) || isNaN(to) || to <= from) return trendData("1개월");
  const days = Math.round((to - from) / 86400000);
  const c = _spanCfg(days);
  const n = Math.max(2, Math.min(24, Math.floor(days / c.step) + 1));
  const base = _hash(fromStr + toStr);
  const out = [];
  for (let i = 0; i < n; i++) {
    const date = new Date(from); date.setDate(date.getDate() + Math.round((i * days) / (n - 1)));
    out.push(_point(date, c.kind, base, i, c.spread));
  }
  return out;
}
/* 개별 측정점 (Scatter / Diurnal 용) */
function rawPoints(pts) {
  const out = [];
  pts.forEach((p, i) => {
    const n = p.cnt;
    for (let k = 0; k < n; k++) {
      const r = _rnd(p.i * 31 + k * 7 + 11);
      const hr = +(6.5 + (k / Math.max(1, n - 1)) * 15 + (r - 0.5) * 1.6).toFixed(2);
      const w = (n === 1 ? 0.5 : k / (n - 1));
      const od = +(p.odMax - (p.odMax - p.odMin) * w + (r - 0.5) * 0.5).toFixed(1);
      const os = +(p.osMax - (p.osMax - p.osMin) * w + (r - 0.5) * 0.45).toFixed(1);
      out.push({ x: i, d: p.d, hr, od, os });
    }
  });
  return out;
}
/* 시간대(시각)별 평균 곡선 */
function diurnalCurve(raw) {
  const buckets = {};
  raw.forEach((p) => {
    const h = Math.round(p.hr);
    if (!buckets[h]) buckets[h] = { h, od: [], os: [] };
    buckets[h].od.push(p.od); buckets[h].os.push(p.os);
  });
  const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  return Object.values(buckets).sort((a, b) => a.h - b.h).map((b) => ({
    h: b.h, odAvg: mean(b.od), osAvg: mean(b.os), n: b.od.length,
    odBand: [+Math.min(...b.od).toFixed(1), +Math.max(...b.od).toFixed(1)],
  }));
}
const TOD_PROFILE = [
  { k: "기상 직후", range: "05–08시", icon: Sunrise, od: 17.3, os: 15.9, n: 26 },
  { k: "오전", range: "08–12시", icon: Sun, od: 16.5, os: 15.3, n: 22 },
  { k: "오후", range: "12–17시", icon: Sun, od: 16.9, os: 15.5, n: 24 },
  { k: "저녁", range: "17–21시", icon: Sunset, od: 16.0, os: 15.0, n: 19 },
  { k: "취침 전", range: "21–24시", icon: Moon, od: 15.6, os: 14.7, n: 17 },
];

/* ---------- 측정 알림 ---------- */
const hmToMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
const minToHM = (min) => `${_pad(Math.floor((((min % 1440) + 1440) % 1440) / 60))}:${_pad((((min % 1440) + 1440) % 1440) % 60)}`;
function nowHM() { const d = new Date(); return `${_pad(d.getHours())}:${_pad(d.getMinutes())}`; }
function measureAlerts(schedule, sessions, nowMin) {
  const done = sessions.map((s) => hmToMin(s.t));
  const upcoming = [], overdue = [];
  schedule.forEach((hm) => {
    const t = hmToMin(hm);
    if (done.some((d) => Math.abs(d - t) <= 90)) return;
    const diff = t - nowMin;
    if (diff > 0 && diff <= 30) upcoming.push({ time: hm, diff });
    else if (diff < 0 && diff >= -240) overdue.push({ time: hm, late: -diff });
  });
  return { upcoming, overdue };
}
function useIopPush(upcoming, overdue, rent) {
  let supported = false;
  try { supported = typeof window !== "undefined" && "Notification" in window; } catch (e) { supported = false; }
  const readPerm = () => { try { return supported ? Notification.permission : "unsupported"; } catch (e) { return "unsupported"; } };
  const [permission, setPermission] = useState(readPerm);
  const [enabled, setEnabled] = useState(false);
  const sent = useRef(new Set());
  const fire = (title, body, tag) => {
    if (!supported || readPerm() !== "granted") return;
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, tag }));
      else new Notification(title, { body, tag });
    } catch (e) { try { new Notification(title, { body, tag }); } catch (_) {} }
  };
  const request = async () => {
    if (!supported) return;
    try {
      const p = await Notification.requestPermission(); setPermission(p);
      if (p === "granted") { setEnabled(true); fire("안압 측정 알림이 켜졌습니다", "설정한 시간에 알림을 보내드립니다."); }
    } catch (e) {}
  };
  useEffect(() => {
    if (!enabled || permission !== "granted") return;
    upcoming.forEach((m) => { const k = `soon-${m.time}`; if (!sent.current.has(k)) { sent.current.add(k); fire("안압 측정 예정", `${m.diff}분 후(${m.time}) 측정 예정입니다.`, k); } });
    overdue.forEach((m) => { const k = `late-${m.time}`; if (!sent.current.has(k)) { sent.current.add(k); fire("⚠️ 측정 시간 초과", `${m.time} 예정 측정이 ${m.late}분 지났습니다.`, k); } });
    if (rent) {
      const k = `rent-${rent.key}-${rent.dd}`;
      if (!sent.current.has(k)) {
        sent.current.add(k);
        fire(rent.blocked ? "⛔ 측정 데이터 수신 중단" : rent.dd < 0 ? "⚠️ 대여 기기 반납 연체" : "📦 대여 기기 반납 안내", rent.msg, k);
      }
    }
  }, [enabled, permission, upcoming, overdue, rent]);
  return { supported, permission, enabled, setEnabled, request };
}

/* ============================================================
   UI ATOMS
   ============================================================ */
function Card({ children, style, className = "", onClick }) {
  return <div onClick={onClick} className={className} style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, ...style }}>{children}</div>;
}
function Eyebrow({ children, color = C.sub }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.14em", color, fontWeight: 700, textTransform: "uppercase" }}>{children}</div>;
}
function SectionTitle({ icon: Ic, children, right }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
      <div className="flex items-center gap-2">{Ic && <Ic size={17} color={C.primary} strokeWidth={2.2} />}<span style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>{children}</span></div>{right}
    </div>
  );
}
function DeviceChip({ icon: Ic, label, connected = true }) {
  return <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 999, background: connected ? C.lowSoft : "#F0F2F2", color: connected ? C.low : C.sub }}><Ic size={12} /> {label}</span>;
}
function Legend({ c, t, soft }) {
  return <div className="flex items-center gap-1.5"><span style={{ width: 14, height: 4, borderRadius: 99, background: c, opacity: soft ? 0.35 : 1 }} /><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{t}</span></div>;
}
function RiskPill({ r, small }) {
  const m = RISK[r]; if (!m) return null;
  return <span className="inline-flex items-center gap-1" style={{ background: m.soft, color: m.c, borderRadius: 999, padding: small ? "2px 8px" : "3px 10px", fontSize: small ? 11 : 12, fontWeight: 700 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: m.c }} />{m.label}</span>;
}
function RoleBadge({ role, small }) {
  const r = ROLES[role]; if (!r) return null;
  return <span className="inline-flex items-center gap-1.5" style={{ fontSize: small ? 10.5 : 11.5, fontWeight: 700, color: r.c, background: r.c + "18", padding: small ? "2px 8px" : "3px 10px", borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: r.c }} />{r.label}</span>;
}
function JoinBadge({ join }) {
  if (join === "개별") return <span style={{ fontSize: 10.5, fontWeight: 700, color: C.primary, background: C.mint, padding: "2px 8px", borderRadius: 99 }}>개별 등록</span>;
  if (join === "비회원") return <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, background: "#EEF2F1", padding: "2px 8px", borderRadius: 99 }}>비회원</span>;
  const s = SNS_MAP[join];
  if (!s) return null;
  return <span className="inline-flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 700, color: C.ink, background: "#F4F7F6", padding: "2px 8px 2px 4px", borderRadius: 99 }}>
    <span className="inline-flex items-center justify-center" style={{ width: 14, height: 14, borderRadius: 99, background: s.c, color: s.fg, fontSize: 8.5, fontWeight: 800, border: s.border ? `1px solid ${C.line}` : "none" }}>{s.mark}</span>
    {s.label}
  </span>;
}
const inp = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px", fontSize: 14, fontFamily: FONT, color: C.ink, outline: "none", boxSizing: "border-box", background: "#fff" };
const inpSm = { ...inp, borderRadius: 9, padding: "8px 10px", fontSize: 12.5 };
function Field({ label, children, req }) {
  return <div className="flex-1"><div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 6 }}>{label}{req && <span style={{ color: C.high }}> *</span>}</div>{children}</div>;
}

/* ---------- IOP 게이지 ---------- */
function arcPath(cx, cy, r, a1, a2, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = (a1 + (a2 - a1) * (i / n)) * (Math.PI / 180); pts.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); }
  return "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L");
}
const v2a = (v, min = 8, max = 30) => 180 - Math.min(1, Math.max(0, (v - min) / (max - min))) * 180;
function IOPGauge({ value, target, eye }) {
  const W = 190, H = 118, cx = W / 2, cy = 104, r = 78;
  if (value == null) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 150, color: C.sub }}>
        <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 999, background: C.bg, marginBottom: 8 }}><EyeOff size={24} color={C.grey} /></div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.sub }}>{eye}</div>
        <div style={{ fontSize: 11.5, color: C.grey, marginTop: 2 }}>측정 기록 없음</div>
      </div>
    );
  }
  const a = v2a(value) * (Math.PI / 180);
  const needle = { x: cx + (r - 6) * Math.cos(a), y: cy - (r - 6) * Math.sin(a) };
  const over = value > target;
  const st = value <= target ? C.low : value <= target + 3 ? C.mid : C.high;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 200 }}>
        <path d={arcPath(cx, cy, r, 180, 0)} fill="none" stroke={C.mintDeep} strokeWidth={11} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, v2a(target - 3), v2a(target + 1))} fill="none" stroke={C.low} strokeWidth={11} strokeLinecap="round" opacity={0.55} />
        <path d={arcPath(cx, cy, r, 180, v2a(value))} fill="none" stroke={st} strokeWidth={11} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={C.ink} />
        <text x={cx - r} y={cy + 14} fontSize="9" fill={C.sub} textAnchor="middle">8</text>
        <text x={cx + r} y={cy + 14} fontSize="9" fill={C.sub} textAnchor="middle">30</text>
      </svg>
      <div className="flex items-baseline gap-1" style={{ marginTop: -6 }}>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>{eye}</span>
        <span style={{ fontSize: 34, fontWeight: 800, color: st, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>mmHg</span>
      </div>
      <div style={{ fontSize: 11.5, color: over ? C.high : C.low, fontWeight: 600 }}>목표 {target} · {over ? `+${(value - target).toFixed(1)} 초과` : "목표 이내"}</div>
    </div>
  );
}

/* ============================================================
   ★ 그래프 타입 선택 (Chart / Scatter / Diurnal)
   ============================================================ */
const GRAPH_TYPES = [
  { id: "chart", label: "Chart", ko: "추세 그래프", icon: LineChart, desc: "날짜별 평균 안압과 일중 최소–최대 범위를 선으로 표시합니다." },
  { id: "scatter", label: "Scatter", ko: "산점도", icon: Circle, desc: "개별 측정값을 하나씩 점으로 표시해 분포와 이상치를 봅니다." },
  { id: "diurnal", label: "Diurnal", ko: "일중 변동", icon: Clock, desc: "측정 시각(0–24시) 기준으로 겹쳐 하루 중 안압 리듬을 봅니다." },
];
function GraphTypeSwitch({ value, onChange, compact }) {
  return (
    <div className="flex" style={{ background: compact ? C.bg : "#fff", borderRadius: compact ? 9 : 12, padding: compact ? 2 : 3, border: `1px solid ${C.line}` }}>
      {GRAPH_TYPES.map((g) => {
        const on = value === g.id;
        return (
          <button key={g.id} onClick={() => onChange(g.id)} className="cursor-pointer flex items-center justify-center gap-1.5"
            style={{ flex: 1, border: "none", borderRadius: compact ? 7 : 10, padding: compact ? "5px 12px" : "8px 0", fontSize: compact ? 11.5 : 12.5, fontWeight: 700, fontFamily: FONT, background: on ? (compact ? "#fff" : C.mint) : "transparent", color: on ? C.primary : C.sub, boxShadow: on && compact ? "0 1px 3px rgba(0,0,0,.06)" : "none", whiteSpace: "nowrap" }}>
            <g.icon size={compact ? 12 : 14} /> {g.label}
          </button>
        );
      })}
    </div>
  );
}
function TrendTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0] && payload[0].payload; if (!p) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 10px", fontSize: 11.5, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
      <div style={{ fontWeight: 700, color: C.ink, marginBottom: 3 }}>{label} <span style={{ color: C.sub, fontWeight: 500 }}>· {p.cnt}회 측정</span></div>
      <div style={{ color: C.od }}>우안 평균 {p.odAvg} <span style={{ color: C.sub }}>(최소 {p.odMin} · 최대 {p.odMax})</span></div>
      <div style={{ color: C.os }}>좌안 평균 {p.osAvg} <span style={{ color: C.sub }}>(최소 {p.osMin} · 최대 {p.osMax})</span></div>
    </div>
  );
}
/* 통합 그래프 렌더러 — type에 따라 표현을 바꿉니다 */
function IopGraph({ type, pts, height = 190, targetOD = 15, targetOS = 16, eyeFilter = "both" }) {
  const raw = useMemo(() => rawPoints(pts), [pts]);
  const diu = useMemo(() => diurnalCurve(raw), [raw]);
  const showOD = eyeFilter === "both" || eyeFilter === "od";
  const showOS = eyeFilter === "both" || eyeFilter === "os";
  const labels = pts.map((p) => p.d);
  const tickIdx = pts.length <= 8 ? pts.map((_, i) => i) : [0, Math.floor(pts.length / 3), Math.floor((pts.length * 2) / 3), pts.length - 1];

  if (type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <ReferenceArea y1={12} y2={targetOS + 1} fill={C.low} fillOpacity={0.07} />
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis type="number" dataKey="x" domain={[-0.4, pts.length - 0.6]} ticks={tickIdx} tickFormatter={(v) => labels[v] || ""} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} />
          <YAxis type="number" domain={[10, 24]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={38} tickMargin={4} />
          <ZAxis range={[26, 26]} />
          <ReferenceLine y={targetOD} stroke={C.low} strokeDasharray="3 3" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }}
            formatter={(v, n) => [`${v} mmHg`, n === "od" ? "우안 OD" : "좌안 OS"]} labelFormatter={(v) => labels[Math.round(v)] || ""} />
          {showOD && <Scatter name="od" data={raw} dataKey="od" fill={C.od} fillOpacity={0.75} />}
          {showOS && <Scatter name="os" data={raw} dataKey="os" fill={C.os} fillOpacity={0.75} />}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }
  if (type === "diurnal") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={diu} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <ReferenceArea y1={12} y2={targetOS + 1} fill={C.low} fillOpacity={0.07} />
          <ReferenceArea x1={0} x2={7} fill={C.ink} fillOpacity={0.045} />
          <ReferenceArea x1={22} x2={24} fill={C.ink} fillOpacity={0.045} />
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis type="number" dataKey="h" domain={[5, 24]} ticks={[6, 9, 12, 15, 18, 21, 24]} tickFormatter={(v) => `${v}시`} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} />
          <YAxis domain={[10, 24]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={38} tickMargin={4} />
          <ReferenceLine y={targetOD} stroke={C.low} strokeDasharray="3 3" />
          <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }}
            formatter={(v, n) => (n === "odAvg" ? [`${v} mmHg`, "우안 평균"] : n === "osAvg" ? [`${v} mmHg`, "좌안 평균"] : null)}
            labelFormatter={(v) => `${v}시대`} />
          {showOD && <Area dataKey="odBand" stroke="none" fill={C.od} fillOpacity={0.12} isAnimationActive={false} />}
          {showOD && <Line type="monotone" dataKey="odAvg" stroke={C.od} strokeWidth={2.6} dot={{ r: 3, fill: C.od }} isAnimationActive={false} />}
          {showOS && <Line type="monotone" dataKey="osAvg" stroke={C.os} strokeWidth={2.4} dot={{ r: 2.5, fill: C.os }} isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={pts} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <ReferenceArea y1={12} y2={targetOS + 1} fill={C.low} fillOpacity={0.07} />
        <CartesianGrid stroke={C.line} vertical={false} />
        <XAxis dataKey="d" interval="preserveStartEnd" minTickGap={16} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} />
        <YAxis domain={[10, 22]} tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} width={38} tickMargin={4} />
        <Tooltip content={<TrendTip />} />
        {showOD && <Area dataKey="odRange" stroke="none" fill={C.od} fillOpacity={0.13} isAnimationActive={false} />}
        {showOS && <Area dataKey="osRange" stroke="none" fill={C.os} fillOpacity={0.13} isAnimationActive={false} />}
        {showOD && <Line type="monotone" dataKey="odAvg" stroke={C.od} strokeWidth={2.4} dot={false} isAnimationActive={false} />}
        {showOS && <Line type="monotone" dataKey="osAvg" stroke={C.os} strokeWidth={2.4} dot={false} isAnimationActive={false} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
function GraphLegend({ type, eyeFilter }) {
  const showOD = eyeFilter !== "os", showOS = eyeFilter !== "od";
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap" style={{ marginTop: 6 }}>
      {showOD && <Legend c={C.od} t="우안 OD" />}
      {showOS && <Legend c={C.os} t="좌안 OS" />}
      {type === "chart" && <div className="flex items-center gap-1.5"><span style={{ width: 14, height: 9, borderRadius: 2, background: C.od, opacity: 0.2 }} /><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>일중 범위</span></div>}
      {type === "scatter" && <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>점 1개 = 측정 1회</span>}
      {type === "diurnal" && <div className="flex items-center gap-1.5"><span style={{ width: 14, height: 9, borderRadius: 2, background: C.ink, opacity: 0.08 }} /><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>야간 시간대</span></div>}
    </div>
  );
}
function EyeFilterSwitch({ value, onChange }) {
  return (
    <div className="flex" style={{ gap: 4 }}>
      {[{ id: "both", t: "양안" }, { id: "od", t: "우안 OD" }, { id: "os", t: "좌안 OS" }].map((e) => (
        <button key={e.id} onClick={() => onChange(e.id)} className="cursor-pointer"
          style={{ border: `1px solid ${value === e.id ? C.primary : C.line}`, background: value === e.id ? C.primary : "#fff", color: value === e.id ? "#fff" : C.sub, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT }}>{e.t}</button>
      ))}
    </div>
  );
}

function FlucChart({ data, height = 130 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={C.line} vertical={false} />
        <XAxis dataKey="d" interval="preserveStartEnd" minTickGap={16} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tick={{ fontSize: 9.5, fill: C.sub }} axisLine={false} tickLine={false} width={34} tickMargin={4} />
        <ReferenceLine y={5} stroke={C.high} strokeDasharray="3 3" />
        <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} formatter={(v) => [`${v} mmHg`, "일중 변동폭"]} />
        <Bar dataKey="fluc" radius={[3, 3, 0, 0]} barSize={12} isAnimationActive={false}>
          {data.map((e, i) => <Cell key={i} fill={e.fluc >= 5 ? C.high : e.fluc >= 2 ? C.mid : C.primary} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
function DayStat({ eye, avg, min, max, col }) {
  if (avg == null) return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 11px" }}>
      <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{eye}</div>
      <div style={{ fontSize: 11, color: C.grey, marginTop: 3 }}>오늘 측정 없음</div>
    </div>
  );
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 11px" }}>
      <div className="flex items-baseline gap-1.5"><span style={{ fontSize: 11.5, color: C.sub, fontWeight: 700 }}>{eye}</span><span style={{ fontSize: 18, fontWeight: 800, color: col, fontVariantNumeric: "tabular-nums" }}>{avg}</span><span style={{ fontSize: 10.5, color: C.sub }}>평균</span></div>
      <div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>최소 {min} · 최대 {max} mmHg</div>
    </div>
  );
}
const _dateInp = { border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 8px", fontSize: 11.5, fontFamily: FONT, color: C.ink, outline: "none", background: "#fff" };
function PeriodPicker({ period, from, to, onPreset, onFrom, onTo, options = PERIODS, resetTo = "1개월" }) {
  const custom = period === "custom";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex" style={{ gap: 4, flexWrap: "wrap" }}>
        {options.map((p) => (
          <button key={p} onClick={() => onPreset(p)} className="cursor-pointer"
            style={{ border: `1px solid ${period === p ? C.primary : C.line}`, background: period === p ? C.primary : "#fff", color: period === p ? "#fff" : C.sub, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>{p}</button>
        ))}
        <button onClick={() => onPreset(custom ? resetTo : "custom")} className="cursor-pointer inline-flex items-center gap-1"
          style={{ border: `1px solid ${custom ? C.primary : C.line}`, background: custom ? C.primary : "#fff", color: custom ? "#fff" : C.sub, borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>
          <CalendarDays size={12} /> 직접 선택
        </button>
      </div>
      {custom && (
        <div className="flex items-center gap-2" style={{ flexWrap: "wrap", padding: "8px 10px", borderRadius: 10, border: `1px solid ${C.primary}`, background: C.mint }}>
          <span style={{ fontSize: 11, color: C.primary, fontWeight: 800 }}>기간 지정</span>
          <input type="date" value={from} max={to} onChange={(e) => onFrom(e.target.value)} style={_dateInp} />
          <span style={{ color: C.sub, fontSize: 12 }}>~</span>
          <input type="date" value={to} min={from} onChange={(e) => onTo(e.target.value)} style={_dateInp} />
        </div>
      )}
    </div>
  );
}
const EYE_LABEL = { both: "양안", od: "우안", os: "좌안" };
function MeasureRow({ s, targetOD, targetOS, onRemove }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 13, color: C.ink, fontWeight: 700 }}>{s.t}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: C.primary, background: C.mint, padding: "1px 6px", borderRadius: 99 }}>{EYE_LABEL[s.eye] || "양안"}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: s.src === "manual" ? C.gold : C.primary, background: s.src === "manual" ? C.goldSoft : C.mint, padding: "1px 6px", borderRadius: 99 }}>{s.src === "manual" ? "수동" : "자동"}</span>
        {s.ctx && <span style={{ fontSize: 10.5, color: C.sub }}>· {s.ctx}</span>}
      </div>
      <div className="flex items-center gap-3" style={{ fontVariantNumeric: "tabular-nums" }}>
        {s.od != null && <span style={{ fontSize: 13, color: s.od > targetOD ? C.high : C.od, fontWeight: 700 }}>OD {s.od.toFixed(1)}</span>}
        {s.os != null && <span style={{ fontSize: 13, color: s.os > targetOS ? C.high : C.os, fontWeight: 700 }}>OS {s.os.toFixed(1)}</span>}
        {onRemove && <Trash2 size={14} color={C.grey} className="cursor-pointer" onClick={() => onRemove(s.id)} />}
      </div>
    </div>
  );
}

/* ============================================================
   ★ 환자 로그인 / 회원가입 / 비회원
   ============================================================ */
function SnsButton({ s, onClick }) {
  return (
    <button onClick={onClick} className="cursor-pointer flex items-center gap-2.5"
      style={{ width: "100%", border: s.border ? `1px solid ${C.line}` : "none", background: s.c, color: s.fg, borderRadius: 12, padding: "11px 14px", fontSize: 13.5, fontWeight: 700, fontFamily: FONT }}>
      <span className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: 6, background: s.border ? "#F4F7F6" : "rgba(255,255,255,.22)", color: s.fg, fontSize: 12, fontWeight: 800 }}>{s.mark}</span>
      {s.label}(으)로 계속하기
    </button>
  );
}
function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [region, setRegion] = useState("한국");
  const [showPw, setShowPw] = useState(false);
  const [f, setF] = useState({ id: "", pw: "", name: "", gender: "", birth: "", phone: "", email: "", pw2: "", serial: "", owner: "기관", agree: false });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const grp = SNS.find((g) => g.region === region) || SNS[0];
  const serialOK = /^CVT2H?-[0-9A-Z]{6,10}$/.test(f.serial.trim());
  const canJoin = f.name && f.id && f.pw && f.pw === f.pw2 && f.phone && f.agree && (!f.serial || serialOK);

  return (
    <div className="flex flex-col" style={{ padding: "10px 4px 20px" }}>
      <div className="flex flex-col items-center" style={{ marginBottom: 18 }}>
        <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 16, background: C.primary, marginBottom: 10 }}><Eye size={28} color="#fff" /></div>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>안압케어 IOP</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 3, textAlign: "center", lineHeight: 1.5 }}>안압 측정·기록을 시작하려면<br />로그인하거나 비회원으로 사용하세요.</div>
      </div>

      <div className="flex" style={{ background: "#fff", borderRadius: 12, padding: 3, border: `1px solid ${C.line}`, marginBottom: 14 }}>
        {[{ id: "login", t: "로그인" }, { id: "join", t: "회원가입" }, { id: "guest", t: "비회원" }].map((m) => (
          <button key={m.id} onClick={() => setTab(m.id)} className="cursor-pointer" style={{ flex: 1, border: "none", borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT, background: tab === m.id ? C.mint : "transparent", color: tab === m.id ? C.primary : C.sub }}>{m.t}</button>
        ))}
      </div>

      {tab === "login" && (
        <div className="flex flex-col gap-3">
          <Card style={{ padding: 14 }}>
            <div className="flex flex-col gap-2.5">
              <Field label="아이디"><input value={f.id} onChange={(e) => set("id", e.target.value)} placeholder="아이디 또는 이메일" style={inp} /></Field>
              <Field label="비밀번호">
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={f.pw} onChange={(e) => set("pw", e.target.value)} placeholder="비밀번호" style={{ ...inp, paddingRight: 40 }} />
                  <span className="cursor-pointer" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: 11, color: C.sub }}>{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</span>
                </div>
              </Field>
              <button onClick={() => onAuth({ mode: "member", name: "이순영", join: "개별", id: f.id || "sylee62", serial: "CVT2H-2033AA11", owner: "기관" })} className="cursor-pointer flex items-center justify-center gap-2"
                style={{ border: "none", borderRadius: 12, padding: "13px 0", background: C.primary, color: "#fff", fontSize: 14.5, fontWeight: 800, fontFamily: FONT, marginTop: 4 }}><LogIn size={17} /> 로그인</button>
              <div className="flex items-center justify-center gap-3" style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>
                <span className="cursor-pointer">아이디 찾기</span><span style={{ color: C.line }}>|</span>
                <span className="cursor-pointer">비밀번호 재설정</span>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2" style={{ margin: "2px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>SNS 계정으로 계속하기</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>

          <div className="flex" style={{ gap: 4 }}>
            {SNS.map((g) => (
              <button key={g.region} onClick={() => setRegion(g.region)} className="cursor-pointer flex items-center justify-center gap-1"
                style={{ flex: 1, border: `1px solid ${region === g.region ? C.primary : C.line}`, background: region === g.region ? C.mint : "#fff", color: region === g.region ? C.primary : C.sub, borderRadius: 999, padding: "6px 4px", fontSize: 11, fontWeight: 700, fontFamily: FONT }}>
                <Globe size={11} /> {g.region}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {grp.items.map((s) => <SnsButton key={s.id} s={s} onClick={() => onAuth({ mode: "member", name: "이순영", join: s.id, id: `${s.id}_user`, serial: "CVT2H-2033AA11", owner: "기관" })} />)}
          </div>
        </div>
      )}

      {tab === "join" && (
        <div className="flex flex-col gap-3">
          <Card style={{ padding: 14 }}>
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5">
                <Field label="이름" req><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" style={inp} /></Field>
                <Field label="성별" req>
                  <div className="flex" style={{ gap: 5 }}>
                    {["남", "여"].map((g) => (
                      <button key={g} onClick={() => set("gender", g)} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${f.gender === g ? C.primary : C.line}`, background: f.gender === g ? C.mint : "#fff", color: f.gender === g ? C.primary : C.sub, borderRadius: 11, padding: "10px 0", fontSize: 13.5, fontWeight: 700, fontFamily: FONT }}>{g}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="생년월일"><input type="date" value={f.birth} onChange={(e) => set("birth", e.target.value)} style={inp} /></Field>
              <Field label="연락처" req><input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" style={inp} /></Field>
              <Field label="이메일"><input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" style={inp} /></Field>
              <Field label="아이디" req><input value={f.id} onChange={(e) => set("id", e.target.value)} placeholder="영문·숫자 6자 이상" style={inp} /></Field>
              <div className="flex gap-2.5">
                <Field label="비밀번호" req><input type="password" value={f.pw} onChange={(e) => set("pw", e.target.value)} placeholder="8자 이상" style={inp} /></Field>
                <Field label="비밀번호 확인" req><input type="password" value={f.pw2} onChange={(e) => set("pw2", e.target.value)} placeholder="다시 입력" style={inp} /></Field>
              </div>
              {f.pw && f.pw2 && f.pw !== f.pw2 && <div style={{ fontSize: 11, color: C.high, fontWeight: 700 }}>비밀번호가 일치하지 않습니다.</div>}

              {/* 기기 시리얼 등록 */}
              <div style={{ border: `1px solid ${serialOK ? C.low : C.line}`, borderRadius: 12, padding: "11px 12px", background: serialOK ? C.lowSoft : C.bg, marginTop: 2 }}>
                <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                  <Bluetooth size={13} color={serialOK ? C.low : C.primary} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>안압계 기기 등록</span>
                  <span style={{ fontSize: 10, color: C.sub }}>선택 · 나중에 가능</span>
                </div>
                <input value={f.serial} onChange={(e) => set("serial", e.target.value.toUpperCase())} placeholder="CVT2H-0000AA00"
                  style={{ ...inp, fontFamily: "monospace", letterSpacing: "0.04em" }} />
                <div className="flex" style={{ gap: 6, marginTop: 8 }}>
                  {[{ id: "기관", t: "병원에서 대여" }, { id: "개인", t: "직접 구입" }].map((o) => (
                    <button key={o.id} onClick={() => set("owner", o.id)} className="cursor-pointer"
                      style={{ flex: 1, border: `1.5px solid ${f.owner === o.id ? C.primary : C.line}`, background: f.owner === o.id ? C.mint : "#fff", color: f.owner === o.id ? C.primary : C.sub, borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{o.t}</button>
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: serialOK ? C.low : C.sub, marginTop: 7, lineHeight: 1.45 }}>
                  {serialOK
                    ? (f.owner === "기관" ? "✓ 병원 대여 기기로 연결됩니다. 반납 예정일이 앱에 표시됩니다."
                                          : "✓ 개인 소유 기기로 병원 계정에 연동됩니다.")
                    : "기기 뒷면 라벨 또는 포장 박스의 시리얼 번호를 입력하세요. (예: CVT2H-2033AA11)"}
                </div>
              </div>

              <div className="flex items-center gap-2 cursor-pointer" onClick={() => set("agree", !f.agree)} style={{ marginTop: 2 }}>
                <span className="flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${f.agree ? C.primary : C.line}`, background: f.agree ? C.primary : "#fff", flexShrink: 0 }}>{f.agree && <Check size={13} color="#fff" strokeWidth={3.5} />}</span>
                <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>개인정보 수집·이용 및 <b style={{ color: C.primary }}>의료진 데이터 공유</b>에 동의합니다.</span>
              </div>
              <button onClick={() => canJoin && onAuth({ mode: "member", name: f.name, join: "개별", id: f.id, serial: f.serial.trim(), owner: f.owner, rentTo: f.owner === "기관" ? "2026-08-03" : null })} disabled={!canJoin} className="cursor-pointer flex items-center justify-center gap-2"
                style={{ border: "none", borderRadius: 12, padding: "13px 0", background: canJoin ? C.primary : C.mintDeep, color: canJoin ? "#fff" : C.sub, fontSize: 14.5, fontWeight: 800, fontFamily: FONT, marginTop: 4 }}><UserPlus size={17} /> 가입하고 시작하기</button>
            </div>
          </Card>
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.55, background: C.mint, borderRadius: 12, padding: "10px 12px" }}>
            가입 후 의료기관에서 <b style={{ color: C.primary }}>환자 인증</b>을 완료하면 측정 기록이 담당 의료진에게 전달됩니다.
          </div>
        </div>
      )}

      {tab === "guest" && (
        <div className="flex flex-col gap-3">
          <Card style={{ padding: 16 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: C.bg, color: C.sub }}><User size={20} /></div>
              <div><div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>비회원으로 사용하기</div><div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>가입 없이 바로 측정할 수 있습니다.</div></div>
            </div>
            <div className="flex flex-col gap-2" style={{ marginBottom: 14 }}>
              {[
                { ok: true, t: "안압 측정 · 기록 저장 (이 기기 안에만 저장)" },
                { ok: true, t: "추세·일중 변동 그래프 확인" },
                { ok: false, t: "의료진 웹으로 데이터 전송 불가" },
                { ok: false, t: "기기 변경 시 기록 이전 불가" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 99, background: r.ok ? C.lowSoft : C.highSoft, color: r.ok ? C.low : C.high }}>{r.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}</span>
                  <span style={{ fontSize: 12.5, color: r.ok ? C.ink : C.sub }}>{r.t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => onAuth({ mode: "guest", name: "비회원", join: "비회원", id: `guest-${Math.floor(Math.random() * 9000 + 1000)}` })} className="cursor-pointer"
              style={{ width: "100%", border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primary, borderRadius: 12, padding: "13px 0", fontSize: 14.5, fontWeight: 800, fontFamily: FONT }}>비회원으로 시작</button>
          </Card>
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.55, background: C.goldSoft, borderRadius: 12, padding: "10px 12px" }}>
            <b style={{ color: C.gold }}>안내:</b> 비회원 기록은 앱 삭제 시 사라집니다. 나중에 회원가입하면 이 기기의 기록을 계정으로 옮길 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ★ 측정 패널 — 좌/우안 선택 후 측정
   ============================================================ */
/* ============================================================
   안압 측정 패널 — 기기 신호 기반
   CVT200은 좌·우를 분리한 신호로 전송하므로 사전 선택 없이
   수신되는 대로 해당 눈의 슬롯이 채워진다. 값은 수기 수정 가능.
   ============================================================ */
const ampm = (hm) => {
  if (!hm) return "";
  const [h, m, s] = hm.split(":").map(Number);
  const ap = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${_pad(h12)}:${_pad(m)}${s != null && !isNaN(s) ? ":" + _pad(s) : ""}`;
};
function EyeValueSlot({ eye, label, target, value, onChange, receivedAt, live, manual }) {
  const [edit, setEdit] = useState(false);
  const [buf, setBuf] = useState("");
  const has = value != null;
  const st = !has ? C.grey : value <= target ? C.low : value <= target + 3 ? C.mid : C.high;
  const commit = (raw) => {
    const v = parseFloat(raw);
    onChange(isNaN(v) ? null : +Math.min(80, Math.max(1, v)).toFixed(1));
  };
  const editing = manual || edit;
  return (
    <div style={{ border: `1.5px solid ${live ? C.primary : has ? st + "45" : C.line}`, borderRadius: 14, padding: "12px 14px", background: live ? C.mint : "#fff" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: eye === "od" ? C.od : C.os, padding: "2px 9px", borderRadius: 99 }}>{label}</span>
          <span style={{ fontSize: 10, color: C.sub }}>목표 {target}</span>
        </div>
        {live ? (
          <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 800, color: C.primary }}><RefreshCw size={10} className="animate-spin" /> 수신 중</span>
        ) : manual ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>수기 입력</span>
        ) : edit ? (
          <span onClick={() => setEdit(false)} className="cursor-pointer" style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>완료</span>
        ) : (
          <span onClick={() => { setBuf(has ? String(value) : ""); setEdit(true); }} className="cursor-pointer flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, color: C.low }}>
            <Sparkles size={10} /> 수기 수정
          </span>
        )}
      </div>

      {editing ? (
        <input autoFocus={edit} type="number" step="0.1" min="1" max="80"
          value={manual ? (has ? value : "") : buf}
          onChange={(e) => { if (manual) commit(e.target.value); else setBuf(e.target.value); }}
          onBlur={() => { if (!manual) { commit(buf); setEdit(false); } }}
          onKeyDown={(e) => { if (e.key === "Enter" && !manual) { commit(buf); setEdit(false); } }}
          placeholder="0"
          style={{ ...inp, fontSize: 30, fontWeight: 800, textAlign: "center", padding: "4px 8px", color: has ? st : C.ink, fontVariantNumeric: "tabular-nums" }} />
      ) : (
        <div className="flex items-baseline justify-center gap-1.5" style={{ padding: "3px 0" }}>
          <span style={{ fontSize: 38, fontWeight: 800, color: has ? st : C.mintDeep, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {has ? value.toFixed(1) : "0"}
          </span>
          <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>mmHg</span>
        </div>
      )}

      <div style={{ fontSize: 10.5, textAlign: "center", color: has ? st : C.grey, fontWeight: 600, marginTop: 3 }}>
        {has ? (value > target ? `목표 +${(value - target).toFixed(1)} 초과` : "목표 이내")
             : live ? "신호 수신 중" : manual ? "값을 입력하세요" : "대기 중"}
        {receivedAt && !manual && <span style={{ color: C.sub, fontWeight: 500 }}> · {receivedAt}</span>}
      </div>
    </div>
  );
}
function MeasurePanel({ onClose, onSave, targetOD, targetOS, baseOD }) {
  const now = new Date();
  const [mDate, setMDate] = useState(isoDate(now));
  const [mTime, setMTime] = useState(`${_pad(now.getHours())}:${_pad(now.getMinutes())}:${_pad(now.getSeconds())}`);
  const [auto, setAuto] = useState(true);
  const [live, setLive] = useState(null);
  const [vals, setVals] = useState({ od: null, os: null });
  const [recv, setRecv] = useState({ od: null, os: null });
  const [log, setLog] = useState([]);
  const [ctx, setCtx] = useState("");
  const [round, setRound] = useState(0);          // 재측정 시 증가
  const timers = useRef([]);
  const CTX_OPTS = ["기상 직후", "점안 전", "점안 후", "운동 후", "저녁 식후", "취침 전"];
  const hasAny = vals.od != null || vals.os != null;
  const bothDone = vals.od != null && vals.os != null;

  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearAll(), []);

  /* 자동측정 ON → 기기 신호를 계속 대기하다가 좌·우가 들어오는 대로 자동 반영.
     실제 구현에서는 BLE characteristic notify 구독으로 대체한다. */
  useEffect(() => {
    clearAll();
    setLive(null);
    if (!auto) return;
    const order = ["od", "os"].filter((e) => vals[e] == null);
    if (!order.length) return;
    const stamp = () => { const d = new Date(); return `${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())}`; };
    order.forEach((eye, i) => {
      timers.current.push(setTimeout(() => setLive(eye), 700 + i * 2100));
      timers.current.push(setTimeout(() => {
        const v = +((eye === "od" ? baseOD : 15.4) + (Math.random() - 0.5) * 1.6).toFixed(1);
        const at = stamp();
        setVals((o) => ({ ...o, [eye]: v }));
        setRecv((o) => ({ ...o, [eye]: ampm(at) }));
        setLog((l) => [{ eye, v, at: ampm(at), re: l.some((x) => x.eye === eye) }, ...l]);
        setMTime(at);
        setLive(null);
      }, 1900 + i * 2100));
    });
    return clearAll;
  }, [auto, round]);

  const remeasure = () => { clearAll(); setVals({ od: null, os: null }); setRecv({ od: null, os: null }); setLive(null); setRound((r) => r + 1); };
  const save = () => {
    if (!hasAny) return;
    const eye = bothDone ? "both" : vals.od != null ? "od" : "os";
    onSave({ od: vals.od, os: vals.os, date: mDate, time: mTime.slice(0, 5), src: log.length ? "auto" : "manual", eye, ctx });
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden", border: `1.5px solid ${C.mintDeep}` }}>
      <div className="flex items-center justify-between" style={{ padding: "13px 16px", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2">
          <Gauge size={17} color={C.primary} />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>안압 측정</span>
        </div>
        <X size={20} color={C.sub} className="cursor-pointer" onClick={onClose} />
      </div>

      {/* 측정일 · 측정시간 */}
      <div style={{ padding: "13px 16px", background: C.bg, borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 9 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>측정일</span>
          <input type="date" value={mDate} max={isoDate(new Date())} onChange={(e) => setMDate(e.target.value)}
            style={{ ...inpSm, width: 158, textAlign: "center", fontWeight: 700 }} />
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub, lineHeight: 1.35 }}>측정시간<br /><span style={{ fontSize: 10.5, fontWeight: 500 }}>(오전/오후 포함)</span></span>
          <div className="flex flex-col items-end" style={{ gap: 3 }}>
            <input type="time" step="1" value={mTime} onChange={(e) => setMTime(e.target.value)}
              style={{ ...inpSm, width: 158, textAlign: "center", fontWeight: 700 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.primary }}>{ampm(mTime)}</span>
          </div>
        </div>
      </div>

      {/* 자동측정 토글 */}
      <div className="flex items-center justify-between" style={{ padding: "11px 16px", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2">
          <Bluetooth size={14} color={auto ? C.primary : C.grey} />
          <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>자동측정</span>
          <span style={{ fontSize: 10.5, color: auto ? C.primary : C.gold, fontWeight: 700 }}>
            {auto ? (bothDone ? "측정 완료" : live ? `${live === "od" ? "우안" : "좌안"} 신호 수신 중` : "기기 신호 대기 중") : "수기 입력 모드"}
          </span>
        </div>
        <div onClick={() => setAuto(!auto)} className="cursor-pointer flex items-center"
          style={{ width: 46, height: 26, borderRadius: 99, background: auto ? C.primary : C.mintDeep, padding: 3, justifyContent: auto ? "flex-end" : "flex-start", transition: "all .15s" }}>
          <span style={{ width: 20, height: 20, borderRadius: 99, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
        </div>
      </div>

      {/* 현재 입력/측정치 */}
      <div style={{ padding: "14px 16px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>현재 입력/측정치</span>
          {auto
            ? <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: C.low }}><Sparkles size={11} /> 수기 수정 가능</span>
            : <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: C.gold }}><Sparkles size={11} /> 좌·우 직접 입력</span>}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <EyeValueSlot eye="od" label="우안 OD" target={targetOD} value={vals.od} live={live === "od"} receivedAt={recv.od} manual={!auto}
            onChange={(v) => setVals((o) => ({ ...o, od: v }))} />
          <EyeValueSlot eye="os" label="좌안 OS" target={targetOS} value={vals.os} live={live === "os"} receivedAt={recv.os} manual={!auto}
            onChange={(v) => setVals((o) => ({ ...o, os: v }))} />
        </div>

        <div className="flex items-center justify-center gap-2" style={{ marginTop: 11 }}>
          {auto ? (
            <>
              <span style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.5, textAlign: "center" }}>
                {bothDone ? "좌·우 측정이 모두 반영되었습니다. 값을 확인하고 저장하세요."
                          : "CVT200을 눈에 맞추면 좌·우가 자동으로 구분되어 위 칸에 반영됩니다."}
              </span>
              {hasAny && (
                <span onClick={remeasure} className="cursor-pointer flex items-center gap-1 flex-shrink-0" style={{ fontSize: 11, fontWeight: 800, color: C.primary }}>
                  <RefreshCw size={11} /> 다시 측정
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.5, textAlign: "center" }}>
              병원에서 측정한 값이나 다른 기기의 값을 직접 기록합니다. 한쪽만 입력해도 저장됩니다.
            </span>
          )}
        </div>

        {/* 기기 수신 이력 */}
        {auto && log.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.sub, marginBottom: 6 }}>기기 수신 이력</div>
            <div className="flex flex-col gap-1">
              {log.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center gap-2" style={{ fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: "#fff", background: r.eye === "od" ? C.od : C.os, padding: "1px 7px", borderRadius: 99, fontSize: 9.5 }}>{r.eye === "od" ? "우안" : "좌안"}</span>
                  <span style={{ fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{r.v.toFixed(1)}</span>
                  <span style={{ color: C.sub }}>mmHg</span>
                  {r.re && <span style={{ fontSize: 9.5, fontWeight: 700, color: C.mid, background: C.midSoft, padding: "1px 6px", borderRadius: 99 }}>재측정 갱신</span>}
                  <span style={{ color: C.grey, marginLeft: "auto" }}>{r.at}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 측정 상황 */}
        {hasAny && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 6 }}>측정 상황 (선택)</div>
            <div className="flex flex-wrap" style={{ gap: 5 }}>
              {CTX_OPTS.map((o) => (
                <button key={o} onClick={() => setCtx(ctx === o ? "" : o)} className="cursor-pointer"
                  style={{ border: `1px solid ${ctx === o ? C.primary : C.line}`, background: ctx === o ? C.mint : "#fff", color: ctx === o ? C.primary : C.sub, borderRadius: 999, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>{o}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 취소 · 저장 */}
      <div className="flex gap-2.5" style={{ padding: "0 16px 16px" }}>
        <button onClick={onClose} className="cursor-pointer flex items-center justify-center gap-1.5"
          style={{ flex: 1, border: `1.5px solid ${C.high}45`, background: "#fff", color: C.high, borderRadius: 13, padding: "13px 0", fontSize: 14.5, fontWeight: 800, fontFamily: FONT }}>
          <X size={16} /> 취소
        </button>
        <button onClick={save} disabled={!hasAny} className="cursor-pointer flex items-center justify-center gap-1.5"
          style={{ flex: 1.4, border: "none", background: hasAny ? C.low : C.mintDeep, color: "#fff", borderRadius: 13, padding: "13px 0", fontSize: 15, fontWeight: 800, fontFamily: FONT }}>
          <Check size={17} strokeWidth={3} /> 저장
        </button>
      </div>
      {!hasAny && <div style={{ fontSize: 10.5, color: C.sub, textAlign: "center", padding: "0 16px 14px", marginTop: -8 }}>측정값이 하나 이상 있어야 저장할 수 있습니다.</div>}
    </Card>
  );
}

/* ============================================================
   PATIENT SCREENS
   ============================================================ */
function AlertBanner({ upcoming, overdue, go }) {
  if (!upcoming.length && !overdue.length) return null;
  const late = overdue[0], soon = upcoming[0], isLate = !!late;
  return (
    <Card onClick={() => go("measure")} className="cursor-pointer" style={{ padding: 13, background: isLate ? C.highSoft : C.mint, border: `1px solid ${isLate ? C.high : C.mintDeep}40` }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 11, background: "#fff", color: isLate ? C.high : C.primary }}>{isLate ? <AlertTriangle size={18} /> : <Bell size={18} />}</div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{isLate ? "측정 시간이 지났습니다" : "곧 측정 시간입니다"}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{isLate ? `${late.time} 예정 · ${late.late}분 경과` : `${soon.time} 예정 · ${soon.diff}분 후`}</div>
        </div>
        <ChevronRight size={18} color={C.sub} />
      </div>
    </Card>
  );
}
function HomeScreen({ account, sessions, targetOD, targetOS, go, upcoming, overdue, schedule, rent, rentTo }) {
  const odS = sessions.filter((s) => s.od != null), osS = sessions.filter((s) => s.os != null);
  const lastOD = odS.length ? odS[odS.length - 1].od : null;
  const lastOS = osS.length ? osS[osS.length - 1].os : null;
  const avg1 = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);
  const odV = odS.map((s) => s.od), osV = osS.map((s) => s.os);
  const flucOD = odV.length > 1 ? +(Math.max(...odV) - Math.min(...odV)).toFixed(1) : 0;
  const week = useMemo(() => trendData("2주").slice(-7), []);
  const overCnt = sessions.filter((s) => (s.od != null && s.od > targetOD) || (s.os != null && s.os > targetOS)).length;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow color={C.primary}>안압관리</Eyebrow>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>{account.name}님, 안녕하세요</div>
          <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
            <JoinBadge join={account.join} />
            <span style={{ fontSize: 11.5, color: C.sub }}>목표 OD {targetOD} / OS {targetOS}</span>
          </div>
        </div>
      </div>

      {account.mode === "guest" && (
        <Card style={{ padding: 12, background: C.goldSoft, border: `1px solid ${C.gold}40` }}>
          <div className="flex items-center gap-2.5">
            <Info size={16} color={C.gold} className="flex-shrink-0" />
            <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.45, flex: 1 }}>비회원 모드입니다. 기록이 이 기기에만 저장되고 의료진에게 전송되지 않습니다.</div>
            <button onClick={() => go("settings")} className="cursor-pointer flex-shrink-0" style={{ border: "none", background: C.gold, color: "#fff", borderRadius: 999, padding: "6px 11px", fontSize: 11, fontWeight: 800, fontFamily: FONT }}>가입</button>
          </div>
        </Card>
      )}

      <AlertBanner upcoming={upcoming} overdue={overdue} go={go} />

      {rent && (
        <Card onClick={() => go("settings")} className="cursor-pointer" style={{ padding: 13, background: rent.bg, border: `1px solid ${rent.c}45` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 11, background: "#fff", color: rent.c }}><rent.icon size={18} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{rent.title}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: rent.c, padding: "1px 7px", borderRadius: 99 }}>{rent.dd >= 0 ? `D-${rent.dd}` : `+${-rent.dd}일`}</span>
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.45 }}>{rent.msg}</div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 3 }}>반납 예정일 {rentTo} · 병원 대여 기기</div>
            </div>
            <ChevronRight size={18} color={C.sub} />
          </div>
          {rent.blocked && (
            <div className="flex items-center gap-2" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${rent.c}25` }}>
              <WifiOff size={14} color={rent.c} className="flex-shrink-0" />
              <span style={{ fontSize: 11, color: C.ink, lineHeight: 1.4 }}>측정 기록은 계속 저장되지만 <b style={{ color: rent.c }}>의료진에게 전송되지 않습니다.</b> 기기를 반납하거나 병원에 기간 연장을 요청하세요.</span>
            </div>
          )}
        </Card>
      )}

      <Card style={{ padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>최근 측정 · {sessions.length ? sessions[sessions.length - 1].t : "-"}</span>
          <DeviceChip icon={Bluetooth} label="CVT200 연결됨" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <IOPGauge value={lastOD} target={targetOD} eye="OD" />
          <IOPGauge value={lastOS} target={targetOS} eye="OS" />
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap" style={{ marginTop: 6, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
          <Legend c={C.low} t="목표 이내" /><Legend c={C.mid} t="근접(+3)" /><Legend c={C.high} t="초과" />
        </div>
      </Card>

      <button onClick={() => go("measure")} className="cursor-pointer flex items-center justify-center gap-2"
        style={{ border: "none", borderRadius: 16, padding: "15px 0", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 15.5, fontFamily: FONT, boxShadow: "0 8px 20px -10px rgba(14,85,99,.7)" }}>
        <Gauge size={19} /> 지금 안압 측정하기
      </button>

      <Card style={{ padding: 16 }}>
        <SectionTitle icon={Clock} right={<span style={{ fontSize: 11, color: C.sub }}>{sessions.length}회 측정</span>}>오늘 요약</SectionTitle>
        <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 10 }}>
          <DayStat eye="우안 OD" avg={avg1(odV)} min={odV.length ? Math.min(...odV) : 0} max={odV.length ? Math.max(...odV) : 0} col={C.od} />
          <DayStat eye="좌안 OS" avg={avg1(osV)} min={osV.length ? Math.min(...osV) : 0} max={osV.length ? Math.max(...osV) : 0} col={C.os} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "일중 변동폭", v: flucOD, u: "mmHg", c: flucOD >= 5 ? C.high : flucOD >= 2 ? C.mid : C.low },
            { l: "목표 초과", v: overCnt, u: `/ ${sessions.length}회`, c: overCnt ? C.high : C.low },
            { l: "예정 측정", v: schedule.length, u: "회/일", c: C.primary },
          ].map((k) => (
            <div key={k.l} style={{ background: C.bg, borderRadius: 12, padding: "9px 10px" }}>
              <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{k.l}</div>
              <div className="flex items-baseline gap-1"><span style={{ fontSize: 17, fontWeight: 800, color: k.c }}>{k.v}</span><span style={{ fontSize: 9.5, color: C.sub }}>{k.u}</span></div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 16 }} className="cursor-pointer" onClick={() => go("record")}>
        <SectionTitle icon={TrendingUp} right={<ChevronRight size={16} color={C.sub} />}>최근 7일 추세</SectionTitle>
        <IopGraph type="chart" pts={week} height={140} targetOD={targetOD} targetOS={targetOS} />
        <GraphLegend type="chart" eyeFilter="both" />
      </Card>

      <Card style={{ padding: 16 }}>
        <SectionTitle icon={ListChecks}>오늘 측정 기록</SectionTitle>
        <div className="flex flex-col">
          {[...sessions].reverse().map((s) => <MeasureRow key={s.id} s={s} targetOD={targetOD} targetOS={targetOS} />)}
        </div>
      </Card>
    </div>
  );
}

function MeasureScreen({ sessions, setSessions, targetOD, targetOS, schedule, upcoming, overdue, rent }) {
  const [open, setOpen] = useState(false);
  const odS = sessions.filter((s) => s.od != null);
  const baseOD = odS.length ? odS.reduce((a, s) => a + s.od, 0) / odS.length : 16;
  const save = (p) => {
    const [h, mm] = p.time.split(":").map(Number);
    setSessions((ss) => [...ss, { id: "s" + Date.now(), t: p.time, tv: (h || 0) + (mm || 0) / 60, od: p.od, os: p.os, date: p.date, src: p.src, eye: p.eye, ctx: p.ctx || "" }]);
    setOpen(false);
  };
  const remove = (id) => setSessions((ss) => ss.filter((s) => s.id !== id));
  const doneTimes = sessions.map((s) => hmToMin(s.t));

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div><Eyebrow color={C.primary}>실시간 측정 · CVT200</Eyebrow><div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>안압 측정</div></div>
        <DeviceChip icon={Bluetooth} label="CVT200" />
      </div>

      {rent && rent.blocked && (
        <Card style={{ padding: 13, background: C.highSoft, border: `1px solid ${C.high}40` }}>
          <div className="flex items-center gap-2.5">
            <WifiOff size={17} color={C.high} className="flex-shrink-0" />
            <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.45 }}>
              <b style={{ color: C.high }}>의료진 전송이 중단된 상태입니다.</b> 대여 기기 반납이 연체되어 측정값이 기기 안에만 저장됩니다. 반납 또는 기간 연장 후 자동으로 재전송됩니다.
            </div>
          </div>
        </Card>
      )}

      {!open && (
        <Card style={{ padding: 15 }}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>지금 측정하기</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>CVT200이 좌·우를 자동으로 구분해 전송합니다. 한쪽만 측정해도 기록됩니다.</div>
            </div>
            <button onClick={() => setOpen(true)} className="flex items-center gap-2 cursor-pointer"
              style={{ border: "none", borderRadius: 14, padding: "12px 18px", background: C.primary, color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: FONT }}><Gauge size={17} /> 측정</button>
          </div>
        </Card>
      )}
      {open && <MeasurePanel onClose={() => setOpen(false)} onSave={save} targetOD={targetOD} targetOS={targetOS} baseOD={baseOD} />}

      <Card style={{ padding: 16 }}>
        <SectionTitle icon={Clock} right={<span style={{ fontSize: 11, color: C.sub }}>설정에서 변경</span>}>오늘 측정 스케줄</SectionTitle>
        <div className="flex flex-col gap-2">
          {schedule.map((hm) => {
            const t = hmToMin(hm);
            const done = doneTimes.some((d) => Math.abs(d - t) <= 90);
            const late = overdue.some((o) => o.time === hm);
            const soon = upcoming.some((o) => o.time === hm);
            const st = done ? { c: C.low, bg: C.lowSoft, t: "완료" } : late ? { c: C.high, bg: C.highSoft, t: "지연" } : soon ? { c: C.mid, bg: C.midSoft, t: "곧 예정" } : { c: C.sub, bg: "#F1F4F4", t: "예정" };
            return (
              <div key={hm} className="flex items-center gap-3" style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 10, background: st.bg, color: st.c }}>{done ? <Check size={17} strokeWidth={3} /> : <Clock size={16} />}</div>
                <div className="flex-1">
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{hm}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{hmToMin(hm) < 600 ? "기상 직후 권장" : hmToMin(hm) < 1020 ? "낮 시간대" : "취침 전 권장"}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: st.c, background: st.bg, padding: "4px 10px", borderRadius: 999 }}>{st.t}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <SectionTitle icon={ListChecks} right={<span style={{ fontSize: 11, color: C.sub }}>{sessions.length}건</span>}>오늘 측정 기록</SectionTitle>
        {sessions.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.sub, padding: "20px 0", textAlign: "center" }}>아직 오늘 측정 기록이 없습니다.</div>
        ) : (
          <div className="flex flex-col">{[...sessions].reverse().map((s) => <MeasureRow key={s.id} s={s} targetOD={targetOD} targetOS={targetOS} onRemove={remove} />)}</div>
        )}
      </Card>

      <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.55, background: C.mint, borderRadius: 12, padding: "10px 12px" }}>
        <b style={{ color: C.primary }}>측정 팁:</b> 좌·우 구분은 기기가 자동으로 판별하므로 순서는 상관없습니다. 측정 전 5분 이상 안정을 취하고 목을 조이는 옷은 풀어 주세요.
      </div>
    </div>
  );
}

function RecordScreen({ targetOD, targetOS }) {
  const [period, setPeriod] = useState("1개월");
  const [from, setFrom] = useState(RANGE_FROM_DEFAULT);
  const [to, setTo] = useState(RANGE_TO_DEFAULT);
  const [gtype, setGtype] = useState("chart");
  const [eyeF, setEyeF] = useState("both");
  const pts = period === "custom" ? trendDataRange(from, to) : trendData(period);
  const gmeta = GRAPH_TYPES.find((g) => g.id === gtype);

  const stat = useMemo(() => {
    const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
    const overDays = pts.filter((p) => p.odAvg > targetOD).length;
    return {
      odMean: mean(pts.map((p) => p.odAvg)), osMean: mean(pts.map((p) => p.osAvg)),
      overDays, overPct: Math.round((overDays / pts.length) * 100),
      flucAvg: +(pts.reduce((a, p) => a + p.fluc, 0) / pts.length).toFixed(1),
      total: pts.reduce((a, p) => a + p.cnt, 0),
    };
  }, [pts, targetOD]);

  return (
    <div className="flex flex-col gap-3.5">
      <div><Eyebrow color={C.primary}>기간 분석</Eyebrow><div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>안압 기록</div></div>

      <Card style={{ padding: 14 }}>
        <PeriodPicker period={period} from={from} to={to} onPreset={setPeriod}
          onFrom={(v) => { setFrom(v); setPeriod("custom"); }} onTo={(v) => { setTo(v); setPeriod("custom"); }} />
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { l: "우안 평균", v: stat.odMean, u: "mmHg", c: stat.odMean > targetOD ? C.high : C.od, sub: `목표 ${targetOD}` },
          { l: "좌안 평균", v: stat.osMean, u: "mmHg", c: stat.osMean > targetOS ? C.high : C.os, sub: `목표 ${targetOS}` },
          { l: "목표 초과일", v: `${stat.overPct}%`, u: "", c: stat.overPct > 30 ? C.high : stat.overPct > 15 ? C.mid : C.low, sub: `${stat.overDays}일 / ${pts.length}일` },
          { l: "평균 일중 변동", v: stat.flucAvg, u: "mmHg", c: stat.flucAvg >= 5 ? C.high : stat.flucAvg >= 2 ? C.mid : C.low, sub: "2 미만 안정 · 5 이상 주의" },
        ].map((k) => (
          <Card key={k.l} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>{k.l}</div>
            <div className="flex items-baseline gap-1" style={{ marginTop: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: k.c, fontVariantNumeric: "tabular-nums" }}>{k.v}</span>
              <span style={{ fontSize: 10.5, color: C.sub, fontWeight: 600 }}>{k.u}</span>
            </div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 1 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* ★ 그래프 타입 선택 */}
      <Card style={{ padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="flex items-center gap-2"><Activity size={17} color={C.primary} strokeWidth={2.2} /><span style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>그래프</span></div>
          <span style={{ fontSize: 11, color: C.sub }}>총 {stat.total}회 측정</span>
        </div>
        <GraphTypeSwitch value={gtype} onChange={setGtype} />
        <div className="flex items-center justify-between" style={{ margin: "10px 0 8px" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{gmeta.ko}</span>
          <EyeFilterSwitch value={eyeF} onChange={setEyeF} />
        </div>
        <IopGraph type={gtype} pts={pts} height={195} targetOD={targetOD} targetOS={targetOS} eyeFilter={eyeF} />
        <GraphLegend type={gtype} eyeFilter={eyeF} />
        <div style={{ fontSize: 11, color: C.sub, marginTop: 10, lineHeight: 1.5, background: C.bg, borderRadius: 10, padding: "9px 11px" }}>{gmeta.desc}</div>
      </Card>

      <Card style={{ padding: 16 }}>
        <SectionTitle icon={TrendingUp}>일중 변동폭 (최대 − 최소)</SectionTitle>
        <FlucChart data={pts} height={140} />
        <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: 6 }}>
          <Legend c={C.primary} t="2 미만" /><Legend c={C.mid} t="2–5" /><Legend c={C.high} t="5 이상" />
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <SectionTitle icon={Clock}>시간대별 평균 안압</SectionTitle>
        <div className="flex flex-col gap-2">
          {TOD_PROFILE.map((t) => {
            const pct = Math.min(100, ((t.od - 12) / 8) * 100);
            const col = t.od > targetOD + 1 ? C.high : t.od > targetOD ? C.mid : C.low;
            return (
              <div key={t.k}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <div className="flex items-center gap-2"><t.icon size={14} color={C.primary} /><span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{t.k}</span><span style={{ fontSize: 10.5, color: C.sub }}>{t.range}</span></div>
                  <div className="flex items-center gap-2" style={{ fontVariantNumeric: "tabular-nums" }}><span style={{ fontSize: 12.5, fontWeight: 800, color: col }}>OD {t.od}</span><span style={{ fontSize: 11.5, fontWeight: 700, color: C.os }}>OS {t.os}</span></div>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: C.mint, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 99 }} /></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 14 }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 11, background: C.mint, color: C.primary }}><Share2 size={17} /></div>
          <div className="flex-1"><div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>진료용 리포트 공유</div><div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>선택한 기간·그래프 형식 그대로 의료진에게 전송</div></div>
          <button className="cursor-pointer" style={{ border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primary, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 800, fontFamily: FONT }}>전송</button>
        </div>
      </Card>
    </div>
  );
}

function PushToggleCard({ push }) {
  const st = !push.supported ? { t: "이 환경에서는 브라우저 알림을 지원하지 않습니다.", c: C.sub }
    : push.permission === "denied" ? { t: "알림이 차단되어 있습니다. 브라우저 설정에서 허용해 주세요.", c: C.high }
    : push.permission === "granted" && push.enabled ? { t: "알림 켜짐 · 앱이 백그라운드여도 OS 알림이 울립니다.", c: C.low }
    : { t: "측정 예정 30분 전 알림과 시간 초과 알람을 받으세요.", c: C.sub };
  const on = push.permission === "granted" && push.enabled;
  return (
    <Card style={{ padding: 13 }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: on ? C.lowSoft : C.mint, color: on ? C.low : C.primary }}><Bell size={18} /></div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>측정 푸시 알림</div>
          <div style={{ fontSize: 11, color: st.c, marginTop: 1, lineHeight: 1.45 }}>{st.t}</div>
        </div>
        {push.supported && push.permission !== "denied" && (
          <button onClick={() => (on ? push.setEnabled(false) : push.request())} className="cursor-pointer flex-shrink-0"
            style={{ border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 800, fontFamily: FONT, background: on ? C.mintDeep : C.primary, color: on ? C.primary : "#fff" }}>{on ? "끄기" : "켜기"}</button>
        )}
      </div>
    </Card>
  );
}
function SettingsScreen({ account, onLogout, targetOD, targetOS, setTargetOD, setTargetOS, schedule, setSchedule, push, rent, rentTo, setRentTo }) {
  const [dOD, setDOD] = useState(targetOD);
  const [dOS, setDOS] = useState(targetOS);
  const [saved, setSaved] = useState(false);
  const [newTime, setNewTime] = useState("09:00");
  const dirty = dOD !== targetOD || dOS !== targetOS;
  useEffect(() => { setDOD(targetOD); setDOS(targetOS); }, [targetOD, targetOS]);
  const save = () => { setTargetOD(dOD); setTargetOS(dOS); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex flex-col gap-3.5">
      <div><Eyebrow color={C.primary}>설정</Eyebrow><div style={{ fontSize: 21, fontWeight: 800, color: C.ink, marginTop: 2 }}>안압 관리 설정</div></div>

      {/* 계정 */}
      <Card style={{ padding: 14 }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: C.mint, color: C.primary }}><User size={20} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><span style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>{account.name}</span><JoinBadge join={account.join} /></div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>ID {account.id}</div>
          </div>
          <button onClick={onLogout} className="cursor-pointer flex items-center gap-1.5 flex-shrink-0" style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
            <LogOut size={13} /> {account.mode === "guest" ? "종료" : "로그아웃"}
          </button>
        </div>
        {account.mode === "guest" && (
          <button onClick={onLogout} className="cursor-pointer flex items-center justify-center gap-2" style={{ width: "100%", border: "none", background: C.primary, color: "#fff", borderRadius: 12, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT, marginTop: 11 }}>
            <UserPlus size={15} /> 회원가입하고 기록 이전하기
          </button>
        )}
      </Card>

      {/* 목표 안압 */}
      <Card style={{ padding: 14 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <Gauge size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>목표 안압</span><span style={{ fontSize: 10.5, color: C.sub }}>주치의와 상의한 값</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {[{ l: "우안 OD", v: dOD, set: setDOD, col: C.od }, { l: "좌안 OS", v: dOS, set: setDOS, col: C.os }].map((t) => (
            <div key={t.l} className="flex items-center gap-3" style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.col, width: 62, flexShrink: 0 }}>{t.l}</span>
              <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
                <button onClick={() => t.set(Math.max(8, t.v - 1))} className="cursor-pointer" style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 8, width: 30, height: 30, fontSize: 17, fontWeight: 800, fontFamily: FONT, lineHeight: 1 }}>−</button>
                <input type="number" min={8} max={30} value={t.v} onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) t.set(Math.min(30, Math.max(8, n))); }}
                  style={{ width: 48, textAlign: "center", border: "none", outline: "none", fontSize: 18, fontWeight: 800, color: C.ink, fontFamily: FONT, background: "transparent" }} />
                <button onClick={() => t.set(Math.min(30, t.v + 1))} className="cursor-pointer" style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 8, width: 30, height: 30, fontSize: 17, fontWeight: 800, fontFamily: FONT, lineHeight: 1 }}>＋</button>
                <span style={{ fontSize: 11, color: C.sub, width: 34, flexShrink: 0 }}>mmHg</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={save} disabled={!dirty} className="cursor-pointer flex items-center justify-center gap-1.5"
          style={{ width: "100%", border: "none", borderRadius: 11, padding: "11px 0", marginTop: 10, fontSize: 14, fontWeight: 800, fontFamily: FONT, background: saved ? C.low : dirty ? C.primary : C.mintDeep, color: saved || dirty ? "#fff" : C.sub }}>
          {saved ? <><Check size={16} strokeWidth={3} /> 저장됨</> : dirty ? "목표 안압 저장" : "저장된 상태"}
        </button>
      </Card>

      {/* 측정 알림 시간 */}
      <Card style={{ padding: 14 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <Clock size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>측정 알림 시간</span><span style={{ fontSize: 10.5, color: C.sub }}>하루 {schedule.length}회</span>
        </div>
        <div className="flex flex-col gap-2">
          {schedule.map((hm) => (
            <div key={hm} className="flex items-center gap-3" style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 12px" }}>
              <Clock size={15} color={C.sub} />
              <span style={{ fontSize: 15, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{hm}</span>
              <span style={{ fontSize: 11, color: C.sub, marginLeft: "auto" }}>30분 전 알림</span>
              <Trash2 size={15} color={C.grey} className="cursor-pointer" onClick={() => setSchedule((s) => s.filter((x) => x !== hm))} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
          <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ ...inp, flex: 1 }} />
          <button onClick={() => setSchedule((s) => (s.includes(newTime) ? s : [...s, newTime].sort()))} className="cursor-pointer flex items-center gap-1.5"
            style={{ border: "none", borderRadius: 11, padding: "11px 16px", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: FONT, flexShrink: 0 }}><Plus size={15} /> 추가</button>
        </div>
      </Card>

      <PushToggleCard push={push} />

      <Card style={{ padding: 14 }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: account.serial ? C.lowSoft : C.mint, color: account.serial ? C.low : C.primary }}><Bluetooth size={18} /></div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>CVT200 안압계</div>
            {account.serial ? (
              <>
                <div className="flex items-center gap-1.5" style={{ marginTop: 3 }}>
                  <OwnerBadge owner={account.owner || "기관"} small />
                  <span style={{ fontSize: 10.5, color: C.sub, fontFamily: "monospace" }}>{account.serial}</span>
                </div>
                <div style={{ fontSize: 10.5, color: C.low, marginTop: 3, fontWeight: 600 }}>
                  연결됨 · 배터리 82% · FW 1.4.2{account.owner === "기관" && account.rentTo ? ` · 반납 예정 ${account.rentTo}` : ""}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, color: C.gold, marginTop: 1, fontWeight: 600 }}>시리얼 번호 미등록 · 기기를 등록해 주세요</div>
            )}
          </div>
          <button className="cursor-pointer flex-shrink-0" style={{ border: `1.5px solid ${account.serial ? C.line : C.primary}`, background: "#fff", color: account.serial ? C.sub : C.primary, borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{account.serial ? "관리" : "등록"}</button>
        </div>

        {/* 대여 기기 반납 관리 */}
        {account.serial && (account.owner || "기관") === "기관" && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div className="flex items-center gap-1.5">
                <Timer size={14} color={rent ? rent.c : C.primary} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>반납 예정일</span>
              </div>
              {rent
                ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: rent.c, padding: "3px 10px", borderRadius: 99 }}>{rent.dd >= 0 ? `D-${rent.dd}` : `연체 ${-rent.dd}일`}</span>
                : <span style={{ fontSize: 10.5, fontWeight: 700, color: C.low, background: C.lowSoft, padding: "3px 10px", borderRadius: 99 }}>여유 있음</span>}
            </div>
            <input type="date" value={rentTo} onChange={(e) => setRentTo(e.target.value)} style={inp} />
            {rent && (
              <div style={{ fontSize: 10.5, color: rent.c, marginTop: 7, lineHeight: 1.45, fontWeight: 600 }}>{rent.msg}</div>
            )}
            <div className="flex gap-2" style={{ marginTop: 9 }}>
              <button className="cursor-pointer flex items-center justify-center gap-1.5" style={{ flex: 1, border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primary, borderRadius: 11, padding: "9px 0", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}><CalendarDays size={13} /> 기간 연장 요청</button>
              <button className="cursor-pointer flex items-center justify-center gap-1.5" style={{ flex: 1, border: "none", background: C.primary, color: "#fff", borderRadius: 11, padding: "10px 0", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}><Undo2 size={13} /> 반납 예약</button>
            </div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
              반납 3일 전·1일 전·당일에 자동으로 알림을 보내드립니다. 연체 {SYNC_GRACE}일이 지나면 측정 데이터가 의료진에게 전송되지 않습니다.
            </div>
          </div>
        )}
      </Card>

      <Card style={{ padding: 14 }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: account.mode === "guest" ? "#EEF2F1" : C.mint, color: account.mode === "guest" ? C.sub : C.primary }}><ShieldCheck size={18} /></div>
          <div className="flex-1"><div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>의료진 데이터 공유</div><div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{account.mode === "guest" ? "비회원은 전송할 수 없습니다" : "씨엔브이 안과 · 이재훈 원장"}</div></div>
          <span style={{ fontSize: 11, fontWeight: 800, color: account.mode === "guest" ? C.sub : C.low, background: account.mode === "guest" ? "#EEF2F1" : C.lowSoft, padding: "5px 11px", borderRadius: 999 }}>{account.mode === "guest" ? "불가" : "동의함"}</span>
        </div>
      </Card>

      <div style={{ fontSize: 10.5, color: C.sub, textAlign: "center", lineHeight: 1.6, padding: "4px 0 8px" }}>
        안압케어 IOP v2.0 · C&V Tech<br />본 앱은 안압 기록·관리 도구이며 진단·치료를 대체하지 않습니다.
      </div>
    </div>
  );
}

/* ============================================================
   PHONE SHELL
   ============================================================ */
const TABS = [
  { id: "home", label: "홈", icon: Home },
  { id: "measure", label: "측정", icon: Gauge },
  { id: "record", label: "기록", icon: Activity },
  { id: "settings", label: "설정", icon: Settings },
];

/* ---------- 환자 앱 알림 패널 ---------- */
function buildNotices({ upcoming, overdue, rent }) {
  const out = [];
  (overdue || []).forEach((m) => out.push({
    id: `late-${m.time}`, icon: AlertTriangle, c: C.high, bg: C.highSoft, tab: "measure",
    title: "측정 시간이 지났습니다", body: `${m.time} 예정 측정이 ${m.late}분 경과했습니다.`, tag: "측정",
  }));
  (upcoming || []).forEach((m) => out.push({
    id: `soon-${m.time}`, icon: Bell, c: C.mid, bg: C.midSoft, tab: "measure",
    title: "곧 측정 시간입니다", body: `${m.time} 예정 · ${m.diff}분 후`, tag: "측정",
  }));
  if (rent) out.push({
    id: `rent-${rent.key}`, icon: rent.icon, c: rent.c, bg: rent.bg, tab: "settings",
    title: rent.title, body: rent.msg, tag: "기기",
  });
  return out;
}
function NoticePanel({ notices, onClose, onGo }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 45 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,42,49,.35)" }} />
      <div style={{ position: "absolute", top: 74, left: 14, right: 14, maxHeight: 560, overflowY: "auto",
                    background: "#fff", borderRadius: 18, border: `1px solid ${C.line}`, boxShadow: "0 22px 50px -14px rgba(8,52,62,.45)" }}>
        <div className="flex items-center justify-between" style={{ padding: "13px 16px", borderBottom: `1px solid ${C.line}`, background: C.bg, position: "sticky", top: 0 }}>
          <div className="flex items-center gap-1.5">
            <Bell size={15} color={C.primary} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>알림</span>
            <span style={{ fontSize: 11.5, color: C.sub }}>{notices.length}건</span>
          </div>
          <X size={19} color={C.sub} className="cursor-pointer" onClick={onClose} />
        </div>
        {notices.length === 0 ? (
          <div className="flex flex-col items-center" style={{ padding: "44px 20px", color: C.sub }}>
            <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 999, background: C.lowSoft, color: C.low, marginBottom: 12 }}><Check size={24} strokeWidth={3} /></div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>새 알림이 없습니다</div>
            <div style={{ fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>측정 일정과 기기 상태가 모두 정상입니다.</div>
          </div>
        ) : notices.map((n, i) => (
          <div key={n.id} onClick={() => { onGo(n.tab); onClose(); }} className="cursor-pointer flex items-start gap-3"
            style={{ padding: "13px 16px", borderBottom: i < notices.length - 1 ? `1px solid ${C.line}` : "none" }}>
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 11, background: n.bg, color: n.c }}><n.icon size={17} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 9.5, fontWeight: 800, color: n.c, background: n.bg, padding: "1px 7px", borderRadius: 99 }}>{n.tag}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{n.title}</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3, lineHeight: 1.45 }}>{n.body}</div>
            </div>
            <ChevronRight size={16} color={C.grey} className="flex-shrink-0" style={{ marginTop: 9 }} />
          </div>
        ))}
        {notices.length > 0 && (
          <div style={{ padding: "11px 16px", background: C.bg, fontSize: 10.5, color: C.sub, lineHeight: 1.5 }}>
            알림을 누르면 해당 화면으로 이동합니다. 푸시 알림은 <b style={{ color: C.primary }}>설정</b>에서 켜고 끌 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function PatientApp() {
  const [account, setAccount] = useState(null);
  const [tab, setTab] = useState("home");
  const [sessions, setSessions] = useState(SESSIONS_INIT);
  const [targetOD, setTargetOD] = useState(15);
  const [targetOS, setTargetOS] = useState(16);
  const [schedule, setSchedule] = useState(["07:30", "13:00", "21:30"]);
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => { const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 60000); return () => clearInterval(id); }, []);
  const [rentTo, setRentTo] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoDate(d); });
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { upcoming, overdue } = measureAlerts(schedule, sessions, nowMin);
  const isRental = !!account && (account.owner || "기관") === "기관" && !!account.serial;
  const rent = isRental ? rentAlert(rentTo, isoDate(new Date())) : null;
  const push = useIopPush(upcoming, overdue, rent);
  const notices = buildNotices({ upcoming, overdue, rent });
  const alertCount = notices.length;

  return (
    <div style={{ width: 380, maxWidth: "100%", height: 800, background: C.bg, borderRadius: 40, border: "10px solid #10262B", overflow: "hidden", position: "relative", boxShadow: "0 30px 70px -30px rgba(8,52,62,.5)" }}>
      <div className="flex items-center justify-between" style={{ padding: "13px 24px 6px", fontSize: 12.5, fontWeight: 700, color: C.ink }}>
        <span>{minToHM(nowMin)}</span>
        <div className="flex items-center gap-1.5" style={{ color: C.primary }}><Bluetooth size={13} /><span style={{ fontSize: 11 }}>●●●</span></div>
      </div>

      {!account ? (
        <div style={{ height: 722, overflowY: "auto", padding: "6px 18px 20px" }}>
          <AuthScreen onAuth={(a) => { setAccount(a); setTab("home"); }} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between" style={{ padding: "2px 22px 10px" }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 9, background: C.primary }}><Eye size={17} color="#fff" /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1 }}>안압케어 IOP</div>
                <div style={{ fontSize: 9.5, color: C.sub, letterSpacing: "0.05em" }}>CVT200 · 안압 전용 관리</div>
              </div>
            </div>
            <div className="cursor-pointer" style={{ position: "relative" }} onClick={() => setNoticeOpen(true)}>
              <Bell size={20} color={alertCount ? C.high : C.sub} />
              {alertCount > 0 && <span className="flex items-center justify-center" style={{ position: "absolute", top: -5, right: -6, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: C.high, color: "#fff", fontSize: 9.5, fontWeight: 800 }}>{alertCount}</span>}
            </div>
          </div>
          <div style={{ height: 656, overflowY: "auto", padding: "6px 18px 20px" }}>
            {tab === "home" && <HomeScreen account={account} sessions={sessions} targetOD={targetOD} targetOS={targetOS} go={setTab} upcoming={upcoming} overdue={overdue} schedule={schedule} rent={rent} rentTo={rentTo} />}
            {tab === "measure" && <MeasureScreen sessions={sessions} setSessions={setSessions} targetOD={targetOD} targetOS={targetOS} schedule={schedule} upcoming={upcoming} overdue={overdue} rent={rent} />}
            {tab === "record" && <RecordScreen targetOD={targetOD} targetOS={targetOS} />}
            {tab === "settings" && <SettingsScreen account={account} onLogout={() => setAccount(null)} targetOD={targetOD} targetOS={targetOS} setTargetOD={setTargetOD} setTargetOS={setTargetOS} schedule={schedule} setSchedule={setSchedule} push={push} rent={rent} rentTo={rentTo} setRentTo={setRentTo} />}
          </div>
          <div className="flex items-center justify-around" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 66, background: "rgba(255,255,255,.94)", borderTop: `1px solid ${C.line}`, backdropFilter: "blur(8px)" }}>
            {TABS.map((t) => {
              const on = tab === t.id; const dot = t.id === "measure" && alertCount > 0;
              return (
                <div key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-1 cursor-pointer" style={{ flex: 1, paddingTop: 4, position: "relative" }}>
                  <t.icon size={21} color={on ? C.primary : C.sub} strokeWidth={on ? 2.5 : 2} />
                  <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, color: on ? C.primary : C.sub }}>{t.label}</span>
                  {dot && <span style={{ position: "absolute", top: 2, right: "50%", marginRight: -16, width: 7, height: 7, borderRadius: 99, background: C.high }} />}
                </div>
              );
            })}
          </div>
          {noticeOpen && <NoticePanel notices={notices} onClose={() => setNoticeOpen(false)} onGo={setTab} />}
        </>
      )}
    </div>
  );
}

/* ============================================================
   ★ 의료진 웹 — 권한 · 고객 DB
   ============================================================ */
function SortHead({ label, k, sort, setSort, align }) {
  const on = sort.k === k;
  return (
    <span className="cursor-pointer inline-flex items-center gap-1" onClick={() => setSort({ k, dir: on && sort.dir === "asc" ? "desc" : "asc" })}
      style={{ color: on ? C.primary : C.sub, fontWeight: 700, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
      {label}{on ? (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={11} opacity={0.5} />}
    </span>
  );
}
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="flex items-center justify-center" style={{ position: "absolute", inset: 0, background: "rgba(10,42,49,.45)", zIndex: 40, padding: 20 }}>
      <div style={{ width: wide ? 620 : 460, maxWidth: "100%", maxHeight: "88%", overflowY: "auto", background: "#fff", borderRadius: 18, border: `1px solid ${C.line}`, boxShadow: "0 30px 60px -20px rgba(8,52,62,.45)" }}>
        <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>{title}</span>
          <X size={19} color={C.sub} className="cursor-pointer" onClick={onClose} />
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}
function PwCell({ value }) {
  const [show, setShow] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5" style={{ fontFamily: "monospace", fontSize: 12, color: C.sub }}>
      {show ? value : "••••••••"}
      <span className="cursor-pointer" onClick={() => setShow(!show)}>{show ? <EyeOff size={13} color={C.grey} /> : <Eye size={13} color={C.grey} />}</span>
    </span>
  );
}
function NoPermission({ role }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ padding: "60px 20px", color: C.sub }}>
      <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 999, background: C.highSoft, color: C.high, marginBottom: 12 }}><Lock size={26} /></div>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>접근 권한이 없습니다</div>
      <div style={{ fontSize: 12.5, marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>
        현재 역할은 <b style={{ color: ROLES[role].c }}>{ROLES[role].label}</b>입니다.<br />이 메뉴는 관리자만 사용할 수 있습니다.
      </div>
    </div>
  );
}

/* ---------- 고객(환자) DB 목록 ---------- */
function PatientsPage({ role, patients, setPatients, onOpen, devices, setDevices, alerts = [] }) {
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [sort, setSort] = useState({ k: "notify", dir: "asc" });
  const [devFilt, setDevFilt] = useState("all");
  const [add, setAdd] = useState(false);
  const perm = CAN[role];
  const devOf = (pid) => devices.find((d) => d.assignedTo === pid);

  const rows = useMemo(() => {
    const rank = { 고: 0, 중: 1, 저: 2, "-": 3 };
    let r = patients.filter((p) => {
      if (!(showInactive || p.active)) return false;
      const d = devOf(p.id);
      if (devFilt === "rental" && !(d && d.owner === "기관")) return false;
      if (devFilt === "owned" && !(d && d.owner === "개인")) return false;
      if (devFilt === "none" && d) return false;
      if (devFilt === "due" && !(d && ["due", "overdue"].includes(deviceState(d).k))) return false;
      return !q || [p.name, p.id, p.email, p.phone, p.loginId, p.serial].join(" ").toLowerCase().includes(q.toLowerCase());
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    const devRank = (p) => { const d = devOf(p.id); const st = deviceState(d); return { overdue: 0, due: 1, rent: 2, owned: 3, none: 9 }[st.k] ?? 8; };
    r = [...r].sort((a, b) => {
      if (sort.k === "notify") return (rank[a.notify] - rank[b.notify]) * dir;
      if (sort.k === "device") return (devRank(a) - devRank(b)) * dir;
      if (sort.k === "cnt" || sort.k === "lastOD") return (a[sort.k] - b[sort.k]) * dir;
      return String(a[sort.k]).localeCompare(String(b[sort.k]), "ko") * dir;
    });
    return r;
  }, [patients, q, showInactive, sort, devFilt, devices]);

  const COLS = "1.1fr 0.85fr 0.45fr 1.05fr 0.85fr 0.95fr 1.25fr 1.15fr 0.55fr";
  const due = alerts.filter((x) => x.a.dd >= 0);
  const late = alerts.filter((x) => x.a.dd < 0 && !x.a.blocked);
  const blocked = alerts.filter((x) => x.a.blocked);

  return (
    <div style={{ padding: "16px 20px" }}>
      {alerts.length > 0 && (
        <div className="flex items-center gap-3" style={{ marginBottom: 12, padding: "11px 14px", borderRadius: 12, background: blocked.length ? C.highSoft : late.length ? C.highSoft + "80" : C.midSoft, border: `1px solid ${blocked.length || late.length ? C.high : C.mid}35` }}>
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 11, background: "#fff", color: blocked.length ? C.high : C.mid }}>
            {blocked.length ? <WifiOff size={17} /> : <BellRing size={17} />}
          </div>
          <div className="flex-1">
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>
              대여 기기 반납 알림 {alerts.length}건
              {blocked.length > 0 && <span style={{ color: C.high }}> · 데이터 수신 중단 {blocked.length}명</span>}
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>
              반납 임박 {due.length}명 · 연체 {late.length}명 · 수신 중단 {blocked.length}명 — 우측 상단 알림에서 일괄 처리할 수 있습니다.
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {alerts.slice(0, 3).map((x) => (
              <span key={x.dev.serial} onClick={() => onOpen(x.pt)} className="cursor-pointer" style={{ fontSize: 11, fontWeight: 700, color: x.a.c, background: "#fff", borderRadius: 999, padding: "5px 11px", border: `1px solid ${x.a.c}30` }}>
                {x.pt ? x.pt.name : "-"} {x.a.dd >= 0 ? `D-${x.a.dd}` : `+${-x.a.dd}일`}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 260 }}>
          <div className="flex items-center gap-2" style={{ flex: 1, maxWidth: 300, border: `1px solid ${C.line}`, borderRadius: 10, padding: "7px 11px", background: "#fff" }}>
            <Search size={14} color={C.sub} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · ID · 연락처 · 이메일 검색" style={{ flex: 1, border: "none", outline: "none", fontSize: 12.5, fontFamily: FONT, color: C.ink }} />
            {q && <X size={14} color={C.grey} className="cursor-pointer" onClick={() => setQ("")} />}
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer" style={{ fontSize: 12, color: C.sub }}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> 비활성 환자 표시
          </label>
          <div className="flex" style={{ gap: 4 }}>
            {[{ id: "all", t: "전체" }, { id: "rental", t: "병원 대여" }, { id: "owned", t: "개인 소유" }, { id: "due", t: "반납 임박·연체" }, { id: "none", t: "미배정" }].map((f) => (
              <button key={f.id} onClick={() => setDevFilt(f.id)} className="cursor-pointer"
                style={{ border: `1px solid ${devFilt === f.id ? C.primary : C.line}`, background: devFilt === f.id ? C.primary : "#fff", color: devFilt === f.id ? "#fff" : C.sub, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT, whiteSpace: "nowrap" }}>{f.t}</button>
            ))}
          </div>
        </div>
        {perm.addPatient && (
          <button onClick={() => setAdd(true)} className="cursor-pointer flex items-center gap-1.5" style={{ border: "none", borderRadius: 10, padding: "9px 15px", background: C.primary, color: "#fff", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>
            <UserPlus size={14} /> 신규 환자 등록
          </button>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: COLS, fontSize: 10.5, padding: "0 6px 8px", borderBottom: `1px solid ${C.line}`, gap: 6 }}>
        <SortHead label="이름" k="name" sort={sort} setSort={setSort} />
        <SortHead label="환자 ID" k="id" sort={sort} setSort={setSort} />
        <SortHead label="성별" k="gender" sort={sort} setSort={setSort} />
        <SortHead label="연락처" k="phone" sort={sort} setSort={setSort} />
        <SortHead label="가입 경로" k="join" sort={sort} setSort={setSort} />
        <SortHead label="기기 구분" k="device" sort={sort} setSort={setSort} />
        <SortHead label="시리얼 · 기간" k="serial" sort={sort} setSort={setSort} />
        <SortHead label="기기 상태" k="device" sort={sort} setSort={setSort} />
        <SortHead label="알림" k="notify" sort={sort} setSort={setSort} />
      </div>

      {rows.map((p, i) => { const dv = devOf(p.id); const dst = deviceState(dv); return (
        <div key={p.id} onClick={() => onOpen(p)} className="grid items-center cursor-pointer"
          style={{ gridTemplateColumns: COLS, gap: 6, padding: "10px 6px", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none", background: dst.k === "overdue" ? C.highSoft + "70" : p.notify === "고" ? C.highSoft + "40" : "transparent", opacity: p.active ? 1 : 0.55 }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span style={{ fontSize: 13, fontWeight: 800, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            {!p.certified && <Flag size={11} color={C.gold} />}
          </div>
          <span style={{ fontSize: 11.5, color: C.sub, fontFamily: "monospace" }}>{p.id}</span>
          <span style={{ fontSize: 12, color: C.ink }}>{p.gender}</span>
          <span style={{ fontSize: 11.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.phone}</span>
          <span><JoinBadge join={p.join} /></span>
          <span>{dv ? <OwnerBadge owner={dv.owner} small /> : <span style={{ fontSize: 10.5, color: C.grey }}>미배정</span>}</span>
          <span style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.35 }}>
            {dv ? <><span style={{ fontFamily: "monospace" }}>{dv.serial}</span><br />{dv.owner === "기관" ? `${dv.rentFrom.slice(5)} ~ ${dv.rentTo.slice(5)}` : `연동 ${dv.linkedAt.slice(5)}`}</> : "—"}
          </span>
          <span><DevStateChip st={dst} small /></span>
          <span className="flex items-center justify-end gap-1.5">
            {p.notify !== "-" && <RiskPill r={p.notify} small />}
            <ChevronRight size={14} color={C.grey} />
          </span>
        </div>
      ); })}
      {rows.length === 0 && <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12.5, color: C.sub }}>조건에 맞는 환자가 없습니다.</div>}

      <div className="flex items-center justify-between" style={{ marginTop: 12, fontSize: 11.5, color: C.sub }}>
        <span>
          총 {rows.length}명 · 병원 대여 {rows.filter((r) => { const d = devOf(r.id); return d && d.owner === "기관"; }).length}명 ·
          개인 소유 {rows.filter((r) => { const d = devOf(r.id); return d && d.owner === "개인"; }).length}명 ·
          <b style={{ color: C.high }}> 반납 연체 {rows.filter((r) => deviceState(devOf(r.id)).k === "overdue").length}명</b> ·
          미인증 {rows.filter((r) => !r.certified).length}명
        </span>
        {perm.download && <button className="cursor-pointer flex items-center gap-1.5" style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 8, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}><Download size={12} /> 기관 데이터 다운로드</button>}
      </div>

      {add && (
        <Modal title="신규 환자 등록" onClose={() => setAdd(false)} wide>
          <AddPatientForm devices={devices} onCancel={() => setAdd(false)}
            onSubmit={(p, dev) => {
              setPatients((ps) => [p, ...ps]);
              if (dev) {
                setDevices((ds) => ds.some((d) => d.serial === dev.serial)
                  ? ds.map((d) => (d.serial === dev.serial ? { ...d, ...dev } : d))
                  : [...ds, dev]);
              }
              setAdd(false);
            }} />
        </Modal>
      )}
    </div>
  );
}
function AddPatientForm({ onCancel, onSubmit, devices = [] }) {
  const [f, setF] = useState({ name: "", gender: "남", birth: "", phone: "", email: "", loginId: "", pw: "", dx: "", targetOD: 15, targetOS: 15, join: "개별", serial: "" });
  const [devMode, setDevMode] = useState("rental");   // rental | owned | later
  const [rentFrom, setRentFrom] = useState(TODAY_STR);
  const [rentTo, setRentTo] = useState("2026-08-03");
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const free = devices.filter((d) => d.owner === "기관" && d.use === "home" && d.active && !d.assignedTo);
  const serialOK = /^CVT2H?-[0-9A-Z]{6,10}$/.test(f.serial.trim());
  const taken = devices.some((d) => d.serial === f.serial.trim() && d.assignedTo);
  const devOK = devMode === "later"
    || (devMode === "rental" && !!f.serial)
    || (devMode === "owned" && serialOK && !taken);
  const ok = f.name && f.phone && f.loginId && devOK;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2.5">
        <Field label="이름" req><input value={f.name} onChange={(e) => set("name", e.target.value)} style={inpSm} /></Field>
        <Field label="성별" req>
          <div className="flex" style={{ gap: 5 }}>
            {["남", "여"].map((g) => <button key={g} onClick={() => set("gender", g)} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${f.gender === g ? C.primary : C.line}`, background: f.gender === g ? C.mint : "#fff", color: f.gender === g ? C.primary : C.sub, borderRadius: 9, padding: "8px 0", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>{g}</button>)}
          </div>
        </Field>
        <Field label="생년월일"><input type="date" value={f.birth} onChange={(e) => set("birth", e.target.value)} style={inpSm} /></Field>
      </div>
      <div className="flex gap-2.5">
        <Field label="연락처" req><input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" style={inpSm} /></Field>
        <Field label="이메일"><input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" style={inpSm} /></Field>
      </div>
      <div className="flex gap-2.5">
        <Field label="로그인 ID" req><input value={f.loginId} onChange={(e) => set("loginId", e.target.value)} style={inpSm} /></Field>
        <Field label="임시 비밀번호"><input value={f.pw} onChange={(e) => set("pw", e.target.value)} placeholder="자동 생성 가능" style={inpSm} /></Field>
        <Field label="가입 경로">
          <select value={f.join} onChange={(e) => set("join", e.target.value)} style={inpSm}>
            <option value="개별">개별 등록</option>
            {SNS.flatMap((g) => g.items).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            <option value="비회원">비회원</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-2.5">
        <Field label="진단명"><input value={f.dx} onChange={(e) => set("dx", e.target.value)} placeholder="예: 정상안압녹내장 (NTG)" style={inpSm} /></Field>
        <Field label="목표 OD"><input type="number" value={f.targetOD} onChange={(e) => set("targetOD", +e.target.value)} style={inpSm} /></Field>
        <Field label="목표 OS"><input type="number" value={f.targetOS} onChange={(e) => set("targetOS", +e.target.value)} style={inpSm} /></Field>
      </div>
      {/* 기기 배정 — 병원 대여 vs 개인 소유 */}
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "12px 13px", background: C.bg }}>
        <div className="flex items-center gap-1.5" style={{ marginBottom: 9 }}>
          <Monitor size={13} color={C.primary} />
          <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>안압계 기기</span>
          <span style={{ fontSize: 10, color: C.sub }}>대여 · 개인 소유 중 선택</span>
        </div>

        <div className="flex" style={{ gap: 7, marginBottom: 11 }}>
          {[
            { id: "rental", t: "병원 대여", d: `보유 ${free.length}대 가능`, icon: Building2, c: C.primary },
            { id: "owned", t: "개인 소유", d: "환자 보유 기기 연동", icon: User, c: C.aqua },
            { id: "later", t: "나중에", d: "추후 배정", icon: Clock, c: C.sub },
          ].map((m) => {
            const on = devMode === m.id;
            return (
              <div key={m.id} onClick={() => { setDevMode(m.id); set("serial", ""); }} className="cursor-pointer flex flex-col items-center"
                style={{ flex: 1, border: `1.5px solid ${on ? m.c : C.line}`, background: on ? m.c + "12" : "#fff", borderRadius: 11, padding: "10px 6px" }}>
                <m.icon size={16} color={on ? m.c : C.sub} />
                <div style={{ fontSize: 12, fontWeight: 800, color: on ? m.c : C.ink, marginTop: 4 }}>{m.t}</div>
                <div style={{ fontSize: 9.5, color: C.sub, marginTop: 1 }}>{m.d}</div>
              </div>
            );
          })}
        </div>

        {devMode === "rental" && (
          <div className="flex flex-col gap-2.5">
            <Field label="대여할 기기" req>
              <select value={f.serial} onChange={(e) => set("serial", e.target.value)} style={inpSm}>
                <option value="">보유 장치에서 선택하세요</option>
                {free.map((d) => <option key={d.serial} value={d.serial}>{d.name} · {d.serial} · 배터리 {d.battery}%</option>)}
              </select>
            </Field>
            <div className="flex gap-2.5">
              <Field label="대여 시작"><input type="date" value={rentFrom} onChange={(e) => setRentFrom(e.target.value)} style={inpSm} /></Field>
              <Field label="반납 예정일"><input type="date" value={rentTo} min={rentFrom} onChange={(e) => setRentTo(e.target.value)} style={inpSm} /></Field>
            </div>
            <div style={{ fontSize: 10.5, color: free.length ? C.sub : C.high, lineHeight: 1.45 }}>
              {free.length ? "반납 예정일이 지나면 환자 목록과 장치 목록에 연체로 표시됩니다."
                : "현재 대여 가능한 홈 기기가 없습니다. 반납 처리 후 다시 시도하세요."}
            </div>
          </div>
        )}

        {devMode === "owned" && (
          <div className="flex flex-col gap-2.5">
            <Field label="시리얼 번호" req>
              <input value={f.serial} onChange={(e) => set("serial", e.target.value.toUpperCase())} placeholder="CVT2H-0000AA00"
                style={{ ...inpSm, fontFamily: "monospace", letterSpacing: "0.04em" }} />
            </Field>
            <div style={{ fontSize: 10.5, lineHeight: 1.45, color: !f.serial ? C.sub : taken ? C.high : serialOK ? C.low : C.high }}>
              {!f.serial ? "환자가 구입한 기기 뒷면 라벨의 시리얼 번호를 입력하세요."
                : taken ? "이미 다른 환자에게 배정된 시리얼입니다."
                : serialOK ? "✓ 연동 가능합니다. 반납 관리 없이 측정 데이터만 연동됩니다."
                : "형식이 올바르지 않습니다. 예: CVT2H-2033AA11"}
            </div>
          </div>
        )}

        {devMode === "later" && (
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.45 }}>
            기기 없이 먼저 등록합니다. 환자 상세 → <b>기기 관리</b> 탭에서 언제든 대여 배정하거나 개인 기기를 연동할 수 있습니다.
          </div>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: C.sub, background: C.bg, borderRadius: 9, padding: "8px 10px", lineHeight: 1.5 }}>
        임시 비밀번호는 환자 최초 로그인 시 변경하도록 안내됩니다. 실제 운영 시스템에서는 비밀번호를 평문 저장하지 않고 해시로 보관합니다.
      </div>
      <div className="flex gap-2.5" style={{ marginTop: 2 }}>
        <button onClick={onCancel} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
        <button onClick={() => {
          if (!ok) return;
          const pid = "P-" + Math.floor(Math.random() * 900 + 1100);
          const serial = f.serial.trim();
          const np = { ...f, serial: serial || "—", id: pid, lastAt: "-", lastOD: 0, cnt: 0, notify: "-", active: true,
            period: devMode === "rental" ? `${rentFrom} ~ ${rentTo}` : "-", certified: false, dx: f.dx || "미지정" };
          let dev = null;
          if (devMode === "rental") dev = { serial, assignedTo: pid, rentFrom, rentTo };
          if (devMode === "owned") dev = { serial, name: `${f.name} 개인 기기`, type: "CVT200 HOME", owner: "개인", use: "home", org: "씨엔브이 안과", assignedTo: pid, rentFrom: null, rentTo: null, linkedAt: TODAY_STR, battery: 100, fw: "1.4.2", active: true };
          onSubmit(np, dev);
        }} disabled={!ok} className="cursor-pointer" style={{ flex: 2, border: "none", background: ok ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>등록</button>
      </div>
    </div>
  );
}

/* ---------- 환자 상세 ---------- */
const MEAS_ROWS = [
  { at: "2026-07-03 18:30", dev: "CVT200 HOME", eye: "양안", od: 16.1, os: 15.0, qod: "우수", qos: "우수", src: "수동" },
  { at: "2026-07-03 12:10", dev: "CVT200 HOME", eye: "우안", od: 17.2, os: null, qod: "양호", qos: "-", src: "자동" },
  { at: "2026-07-03 07:40", dev: "CVT200 HOME", eye: "양안", od: 16.4, os: 15.2, qod: "우수", qos: "양호", src: "자동" },
  { at: "2026-07-02 21:40", dev: "CVT200 HOME", eye: "양안", od: 15.7, os: 14.8, qod: "우수", qos: "우수", src: "자동" },
  { at: "2026-07-02 13:05", dev: "1진료실 CVT200", eye: "양안", od: 16.9, os: 15.5, qod: "우수", qos: "재측정", src: "자동" },
  { at: "2026-07-02 07:20", dev: "CVT200 HOME", eye: "좌안", od: null, os: 16.1, qod: "-", qos: "양호", src: "자동" },
  { at: "2026-07-01 07:35", dev: "CVT200 HOME", eye: "양안", od: 18.3, os: 16.6, qod: "양호", qos: "우수", src: "자동" },
];
function PatientDetail({ p, role, onBack, devices, setDevices, patients, sent, onSend, onUpdatePatient, toast }) {
  const [tab, setTab] = useState("measure");
  const [gtype, setGtype] = useState("chart");
  const [eyeF, setEyeF] = useState("both");
  const [period, setPeriod] = useState("1개월");
  const [from, setFrom] = useState(RANGE_FROM_DEFAULT);
  const [to, setTo] = useState(RANGE_TO_DEFAULT);
  const [excluded, setExcluded] = useState({});
  const [modal, setModal] = useState(null);
  const perm = CAN[role];
  const pts = period === "custom" ? trendDataRange(from, to) : trendData(period);
  const gmeta = GRAPH_TYPES.find((g) => g.id === gtype);
  const myDev = devices.find((d) => d.assignedTo === p.id);
  const devSt = deviceState(myDev);
  const QCOL = { 우수: C.low, 양호: C.primary, 재측정: C.high, "-": C.grey };

  return (
    <div style={{ padding: "16px 20px" }}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={onBack} style={{ color: C.primary, marginBottom: 12 }}>
        <ChevronLeft size={18} /><span style={{ fontSize: 13, fontWeight: 700 }}>환자 명단</span>
      </div>

      <div className="flex items-center justify-between" style={{ paddingBottom: 14, borderBottom: `1px solid ${C.line}`, marginBottom: 14 }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 13, background: C.mint }}><User size={22} color={C.primary} /></div>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{p.name}</span>
              <span style={{ fontSize: 12.5, color: C.sub }}>{p.gender} · {p.dx}</span>
              <JoinBadge join={p.join} />
              {!p.certified && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.gold, background: C.goldSoft, padding: "2px 8px", borderRadius: 99 }}>미인증</span>}
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 3 }}>
              <span style={{ fontSize: 11.5, color: C.sub }}>{p.id} · 목표 OD {p.targetOD} / OS {p.targetOS} mmHg</span>
              {myDev && <OwnerBadge owner={myDev.owner} small />}
              <DevStateChip st={devSt} small />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {perm.editTarget && <button onClick={() => setModal("target")} className="cursor-pointer" style={{ border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primary, borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>목표 안압 변경</button>}
          <button onClick={() => setModal("report")} className="cursor-pointer flex items-center gap-1.5" style={{ border: "none", background: C.primary, color: "#fff", borderRadius: 9, padding: "8px 13px", fontSize: 12, fontWeight: 800, fontFamily: FONT }}><FileText size={13} /> 보고서</button>
        </div>
      </div>

      <div className="flex" style={{ gap: 4, marginBottom: 14 }}>
        {[{ id: "measure", t: "측정 결과" }, { id: "device", t: "기기 관리" }, { id: "profile", t: "환자 프로필" }, { id: "cert", t: "인증 · 사용 기간" }].map((m) => (
          <button key={m.id} onClick={() => setTab(m.id)} className="cursor-pointer"
            style={{ border: `1px solid ${tab === m.id ? C.primary : C.line}`, background: tab === m.id ? C.primary : "#fff", color: tab === m.id ? "#fff" : C.sub, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{m.t}</button>
        ))}
      </div>

      {tab === "measure" && (
        <>
          <div className="flex items-center justify-between" style={{ marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
            <PeriodPicker period={period} from={from} to={to} onPreset={setPeriod} onFrom={(v) => { setFrom(v); setPeriod("custom"); }} onTo={(v) => { setTo(v); setPeriod("custom"); }} />
            <div className="flex items-center gap-2">
              <EyeFilterSwitch value={eyeF} onChange={setEyeF} />
              <div style={{ width: 300 }}><GraphTypeSwitch value={gtype} onChange={setGtype} compact /></div>
            </div>
          </div>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.primary }}>{gmeta.label} · {gmeta.ko}</span>
            <span style={{ fontSize: 11, color: C.sub }}>{gmeta.desc}</span>
          </div>
          <IopGraph type={gtype} pts={pts} height={200} targetOD={p.targetOD} targetOS={p.targetOS} eyeFilter={eyeF} />
          <GraphLegend type={gtype} eyeFilter={eyeF} />

          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: "18px 0 8px" }}>측정 이력</div>
          <div className="grid" style={{ gridTemplateColumns: "1.5fr 1.4fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr", fontSize: 10.5, color: C.sub, fontWeight: 700, padding: "0 4px 8px", borderBottom: `1px solid ${C.line}`, gap: 4 }}>
            <span>측정 시각</span><span>기기</span><span>측정 눈</span><span>IOP (OD)</span><span>품질 OD</span><span>IOP (OS)</span><span>품질 OS</span><span>기록</span><span style={{ textAlign: "right" }}>제외</span>
          </div>
          {MEAS_ROWS.map((r, i) => {
            const ex = !!excluded[i];
            return (
              <div key={i} className="grid items-center" style={{ gridTemplateColumns: "1.5fr 1.4fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr 0.7fr", gap: 4, padding: "9px 4px", borderBottom: i < MEAS_ROWS.length - 1 ? `1px solid ${C.line}` : "none", opacity: ex ? 0.45 : 1, background: !ex && r.od != null && r.od > p.targetOD ? C.highSoft + "55" : "transparent" }}>
                <span style={{ fontSize: 12, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{r.at.slice(5)}</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{r.dev}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>{r.eye}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: r.od == null ? C.grey : r.od > p.targetOD ? C.high : C.od }}>{r.od == null ? "–" : r.od.toFixed(1)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: QCOL[r.qod] }}>{r.qod}</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: r.os == null ? C.grey : r.os > p.targetOS ? C.high : C.os }}>{r.os == null ? "–" : r.os.toFixed(1)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: QCOL[r.qos] }}>{r.qos}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: r.src === "수동" ? C.gold : C.primary }}>{r.src}</span>
                <span style={{ textAlign: "right" }}>
                  {perm.exclude ? (
                    <input type="checkbox" checked={ex} onChange={(e) => setExcluded((o) => ({ ...o, [i]: e.target.checked }))} className="cursor-pointer" />
                  ) : <Lock size={12} color={C.grey} />}
                </span>
              </div>
            );
          })}
          {!perm.exclude && <div style={{ fontSize: 10.5, color: C.sub, marginTop: 8 }}>측정 결과 제외 처리는 의사·관리자 권한입니다.</div>}
        </>
      )}

      {tab === "device" && (
        <DeviceTab p={p} role={role} devices={devices} setDevices={setDevices} myDev={myDev} devSt={devSt} sent={sent} onSend={onSend} />
      )}

      {modal === "target" && (
        <TargetModal p={p} onClose={() => setModal(null)}
          onSave={(v) => { onUpdatePatient && onUpdatePatient(p.id, { targetOD: v.targetOD, targetOS: v.targetOS });
            toast && toast(`${p.name}님 목표 안압을 OD ${v.targetOD} / OS ${v.targetOS} mmHg로 변경했습니다.`); setModal(null); }} />
      )}
      {modal === "report" && (
        <ReportModal p={p} from={period === "custom" ? from : RANGE_FROM_DEFAULT} to={period === "custom" ? to : RANGE_TO_DEFAULT} onClose={() => setModal(null)} />
      )}

      {tab === "profile" && (
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {[
            { l: "이름", v: p.name }, { l: "환자 ID", v: p.id },
            { l: "성별", v: p.gender }, { l: "생년월일", v: p.birth },
            { l: "연락처", v: p.phone, icon: Phone }, { l: "이메일", v: p.email, icon: Mail },
            { l: "로그인 ID", v: p.loginId, icon: KeyRound },
            { l: "비밀번호", v: "PW", pw: true },
            { l: "가입 경로", v: p.join, badge: true }, { l: "진단명", v: p.dx },
            { l: "기기 시리얼", v: p.serial || "—", icon: Bluetooth, mono: true },
            { l: "목표 안압", v: `OD ${p.targetOD} / OS ${p.targetOS} mmHg` },
            { l: "총 측정 횟수", v: `${p.cnt}회` },
          ].map((r) => (
            <div key={r.l} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 13px" }}>
              <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginBottom: 3 }}>{r.icon && <r.icon size={11} />}{r.l}</div>
              {r.pw ? <PwCell value="Cvt!2026#tmp" /> : r.badge ? <JoinBadge join={p.join} /> : <div style={{ fontSize: 13, color: C.ink, fontWeight: 700, fontFamily: r.mono ? "monospace" : FONT }}>{r.v}</div>}
            </div>
          ))}
          <div className="col-span-2 flex items-center gap-2" style={{ marginTop: 2 }}>
            <button className="cursor-pointer flex items-center gap-1.5" style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}><KeyRound size={13} /> 비밀번호 재설정 메일 발송</button>
            <button className="cursor-pointer" style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>정보 편집</button>
            <button className="cursor-pointer" style={{ border: `1.5px solid ${C.high}40`, background: "#fff", color: C.high, borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>{p.active ? "비활성화" : "활성화"}</button>
          </div>
        </div>
      )}

      {tab === "cert" && (
        <div className="flex flex-col gap-3">
          <Card style={{ padding: 15 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: p.certified ? C.lowSoft : C.goldSoft, color: p.certified ? C.low : C.gold }}><ShieldCheck size={19} /></div>
              <div className="flex-1">
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>환자 계정 인증</div>
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{p.certified ? "인증 완료 · 측정 데이터가 의료진 웹으로 수신됩니다." : "미인증 · 인증 전까지 데이터가 연동되지 않습니다."}</div>
              </div>
              <button className="cursor-pointer" style={{ border: "none", background: p.certified ? C.mintDeep : C.primary, color: p.certified ? C.primary : "#fff", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 800, fontFamily: FONT }}>{p.certified ? "인증 해제" : "인증하기"}</button>
            </div>
          </Card>
          <Card style={{ padding: 15 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 10 }}>홈 사용 기간</div>
            <div className="flex items-center gap-2.5">
              <Field label="시작일"><input type="date" defaultValue={RANGE_FROM_DEFAULT} style={inpSm} /></Field>
              <Field label="종료일"><input type="date" defaultValue={RANGE_TO_DEFAULT} style={inpSm} /></Field>
              <div style={{ paddingTop: 20 }}><button className="cursor-pointer" style={{ border: "none", background: C.primary, color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>지정</button></div>
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 8 }}>현재 지정: {p.period}</div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ---------- 의료진 웹 · 반납 알림 센터 ---------- */
function NotifCenter({ alerts, read, setRead, sent, onSend, onExtend, onReturn, onOpenPatient, onBatch }) {
  const [open, setOpen] = useState(false);
  const unread = alerts.filter((x) => !read.includes(x.dev.serial)).length;
  const markAll = () => setRead(alerts.map((x) => x.dev.serial));

  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer flex items-center justify-center"
        style={{ width: 32, height: 32, borderRadius: 8, background: open ? "rgba(255,255,255,.14)" : "transparent", position: "relative" }}>
        <Bell size={17} color={unread ? "#fff" : "#9FC4C6"} />
        {unread > 0 && (
          <span className="flex items-center justify-center" style={{ position: "absolute", top: 3, right: 2, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: C.high, color: "#fff", fontSize: 9, fontWeight: 800 }}>{unread}</span>
        )}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 380, maxHeight: 460, overflowY: "auto", background: "#fff", borderRadius: 14, border: `1px solid ${C.line}`, boxShadow: "0 18px 40px -12px rgba(8,52,62,.35)", zIndex: 31 }}>
            <div className="flex items-center justify-between" style={{ padding: "12px 15px", borderBottom: `1px solid ${C.line}`, background: C.bg, position: "sticky", top: 0 }}>
              <div className="flex items-center gap-1.5">
                <Bell size={14} color={C.primary} />
                <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>대여 기기 반납 알림</span>
                <span style={{ fontSize: 11, color: C.sub }}>{alerts.length}건</span>
              </div>
              <div className="flex items-center gap-2">
                {onBatch && alerts.length > 0 && <span onClick={() => { onBatch(); markAll(); }} className="cursor-pointer flex items-center gap-1" style={{ fontSize: 11, color: C.primary, fontWeight: 800 }}><Play size={11} /> 일괄 발송</span>}
                {unread > 0 && <span onClick={markAll} className="cursor-pointer flex items-center gap-1" style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}><CheckCheck size={12} /> 모두 읽음</span>}
              </div>
            </div>

            {alerts.length === 0 && (
              <div className="flex flex-col items-center" style={{ padding: "36px 20px", color: C.sub }}>
                <Check size={22} color={C.low} /><div style={{ fontSize: 12.5, marginTop: 8 }}>반납 예정 알림이 없습니다.</div>
              </div>
            )}

            {alerts.map((x) => {
              const isRead = read.includes(x.dev.serial);
              const log = sent[x.dev.serial] || [];
              return (
                <div key={x.dev.serial} style={{ padding: "12px 15px", borderBottom: `1px solid ${C.line}`, background: isRead ? "#fff" : x.a.bg + "50" }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 5 }}>
                    <AlertChip a={x.a} small />
                    <span onClick={() => { onOpenPatient(x.pt); setOpen(false); }} className="cursor-pointer" style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{x.pt ? x.pt.name : "-"}</span>
                    <span style={{ fontSize: 10.5, color: C.sub }}>{x.dev.name}</span>
                    {!isRead && <span style={{ width: 6, height: 6, borderRadius: 99, background: C.high, marginLeft: "auto" }} />}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.45, marginBottom: 7 }}>{x.a.msg}</div>
                  <div style={{ fontSize: 10.5, color: C.sub, marginBottom: 8 }}>
                    반납 예정 <b style={{ color: x.a.c }}>{x.dev.rentTo}</b> · 발송 채널 {x.a.ch}
                    {log.length > 0 && <> · <span style={{ color: C.low, fontWeight: 700 }}>발송 {log.length}회 (최근 {log[log.length - 1]})</span></>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { onSend(x.dev.serial, x.a); setRead((r) => (r.includes(x.dev.serial) ? r : [...r, x.dev.serial])); }} className="cursor-pointer flex items-center gap-1"
                      style={{ border: "none", background: x.a.c, color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 800, fontFamily: FONT }}><MessageSquare size={11} /> 알림 발송</button>
                    <button onClick={() => onExtend(x.dev.serial, 7)} className="cursor-pointer flex items-center gap-1"
                      style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT }}><CalendarDays size={11} /> 7일 연장</button>
                    <button onClick={() => onReturn(x.dev.serial)} className="cursor-pointer flex items-center gap-1"
                      style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.primary, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT }}><Undo2 size={11} /> 반납 처리</button>
                  </div>
                </div>
              );
            })}

            <div style={{ padding: "10px 15px", fontSize: 10, color: C.sub, lineHeight: 1.5, background: C.bg }}>
              알림은 반납 <b>3일 전 · 1일 전 · 당일</b> 자동 발송되고, 연체 시 매일 재발송됩니다. 연체 {SYNC_GRACE}일이 지나면 해당 기기의 측정 데이터 수신이 중단됩니다.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   ★ 알림 스케줄러 · 발송 감사 로그
   ============================================================ */
function NotifyPage({ role, cfg, setCfg, log, alerts, lastRun, lastResult, onRunBatch }) {
  const [sub, setSub] = useState("sched");
  const canEdit = CAN[role].notifyEdit;
  const canRun = CAN[role].runBatch;
  const [q, setQ] = useState("");
  const [fRes, setFRes] = useState("all");
  const [fLevel, setFLevel] = useState("all");
  const [sort, setSort] = useState({ k: "at", dir: "desc" });
  const [csv, setCsv] = useState(null);

  const setCh = (lv, ch, v) => setCfg((c) => ({ ...c, ch: { ...c.ch, [lv]: { ...c.ch[lv], [ch]: v } } }));
  const nextRun = useMemo(() => {
    const [h, m] = cfg.runAt.split(":").map(Number);
    const now = new Date(); const n = new Date(now);
    n.setHours(h, m, 0, 0);
    if (n <= now) n.setDate(n.getDate() + 1);
    const mins = Math.round((n - now) / 60000);
    return { at: `${isoDate(n)} ${cfg.runAt}`, in: mins < 60 ? `${mins}분 후` : `${Math.floor(mins / 60)}시간 ${mins % 60}분 후` };
  }, [cfg.runAt]);

  const rows = useMemo(() => {
    let r = log.filter((x) =>
      (fRes === "all" || x.result === fRes) &&
      (fLevel === "all" || x.level === fLevel) &&
      (!q || [x.name, x.serial, x.actor, x.detail].join(" ").toLowerCase().includes(q.toLowerCase())));
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => String(a[sort.k]).localeCompare(String(b[sort.k]), "ko") * dir);
  }, [log, q, fRes, fLevel, sort]);

  const stat = useMemo(() => ({
    total: log.length,
    ok: log.filter((x) => x.result === "성공").length,
    part: log.filter((x) => x.result === "부분 실패").length,
    fail: log.filter((x) => x.result === "실패").length,
    auto: log.filter((x) => x.mode === "자동").length,
  }), [log]);

  const exportCsv = () => {
    const head = ["로그ID", "발송일시", "환자", "환자ID", "기기", "단계", "채널", "방식", "결과", "처리자", "비고"];
    const body = rows.map((r) => [r.id, r.at, r.name, r.pid, r.serial, RENT_LEVEL[r.level].title, r.chs.map((c) => (CHANNELS.find((x) => x.id === c) || {}).label).join("|"), r.mode, r.result, r.actor, r.detail]);
    const text = "\uFEFF" + [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    try {
      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `iop-notify-log-${TODAY_STR}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setCsv(text); }
  };

  const COLS = "0.7fr 1.3fr 1fr 1.25fr 1.25fr 1.2fr 0.7fr 0.8fr 0.85fr";

  return (
    <div style={{ padding: "16px 20px" }}>
      <div className="flex" style={{ gap: 4, marginBottom: 14 }}>
        {[{ id: "sched", t: "스케줄 · 채널 설정" }, { id: "log", t: `발송 감사 로그 (${log.length})` }].map((m) => (
          <button key={m.id} onClick={() => setSub(m.id)} className="cursor-pointer"
            style={{ border: `1px solid ${sub === m.id ? C.primary : C.line}`, background: sub === m.id ? C.primary : "#fff", color: sub === m.id ? "#fff" : C.sub, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{m.t}</button>
        ))}
      </div>

      {sub === "sched" && (
        <div className="flex flex-col gap-3">
          {/* 스케줄러 상태 */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div className="flex items-center gap-3" style={{ padding: "14px 17px", background: cfg.enabled ? C.mint : "#EEF2F1", borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: "#fff", color: cfg.enabled ? C.primary : C.sub }}><ServerCog size={19} /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>반납 알림 배치 스케줄러</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: cfg.enabled ? C.low : C.sub, background: cfg.enabled ? C.lowSoft : "#fff", padding: "3px 10px", borderRadius: 99 }}>{cfg.enabled ? "실행 중" : "중지됨"}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>
                  매일 {cfg.runAt} 실행 · 다음 실행 {nextRun.at} ({nextRun.in}) · 마지막 실행 {lastRun || "기록 없음"}
                </div>
              </div>
              {canEdit && (
                <button onClick={() => setCfg((c) => ({ ...c, enabled: !c.enabled }))} className="cursor-pointer"
                  style={{ border: "none", borderRadius: 999, padding: "8px 15px", fontSize: 12, fontWeight: 800, fontFamily: FONT, background: cfg.enabled ? C.mintDeep : C.primary, color: cfg.enabled ? C.primary : "#fff" }}>{cfg.enabled ? "중지" : "시작"}</button>
              )}
            </div>

            <div className="grid grid-cols-4" style={{ gap: 0 }}>
              {[
                { l: "오늘 발송 대상", v: alerts.length, u: "건", c: alerts.length ? C.primary : C.sub },
                { l: "연체 대상", v: alerts.filter((x) => x.a.dd < 0).length, u: "건", c: C.high },
                { l: "수신 중단", v: alerts.filter((x) => x.a.blocked).length, u: "건", c: C.high },
                { l: "실패 재시도 한도", v: cfg.retry, u: "회", c: C.sub },
              ].map((k, i) => (
                <div key={k.l} style={{ padding: "13px 17px", borderRight: i < 3 ? `1px solid ${C.line}` : "none" }}>
                  <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{k.l}</div>
                  <div className="flex items-baseline gap-1"><span style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</span><span style={{ fontSize: 10, color: C.sub }}>{k.u}</span></div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2" style={{ padding: "12px 17px", borderTop: `1px solid ${C.line}` }}>
              <button onClick={() => { onRunBatch(); setSub("sched"); }} disabled={!canRun || !alerts.length} className="cursor-pointer flex items-center gap-1.5"
                style={{ border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 12.5, fontWeight: 800, fontFamily: FONT, background: canRun && alerts.length ? C.primary : C.mintDeep, color: canRun && alerts.length ? "#fff" : C.sub }}>
                <Play size={13} /> 지금 배치 실행
              </button>
              <span style={{ fontSize: 10.5, color: C.sub }}>
                {!canRun ? "배치 수동 실행은 의사·관리자 권한입니다."
                  : !alerts.length ? "현재 발송 대상이 없습니다."
                  : `대상 ${alerts.length}건에 즉시 발송합니다.`}
              </span>
            </div>

            {lastResult && (
              <div className="flex items-center gap-3" style={{ padding: "12px 17px", borderTop: `1px solid ${C.line}`, background: C.lowSoft }}>
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", color: C.low }}><PackageCheck size={16} /></div>
                <div className="flex-1">
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>배치 실행 완료 · {lastResult.sent}건 발송</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{lastResult.at} · {lastResult.detail || "감사 로그에 기록되었습니다."}</div>
                </div>
                <button onClick={() => setSub("log")} className="cursor-pointer flex items-center gap-1"
                  style={{ border: `1px solid ${C.low}45`, background: "#fff", color: C.low, borderRadius: 8, padding: "6px 11px", fontSize: 11, fontWeight: 800, fontFamily: FONT }}>
                  <History size={11} /> 로그 보기
                </button>
              </div>
            )}
          </Card>

          {/* 기본 설정 */}
          <Card style={{ padding: 16 }}>
            <SectionTitle icon={Timer}>기본 설정</SectionTitle>
            <div className="grid grid-cols-3" style={{ gap: 12 }}>
              <Field label="일일 발송 시각">
                <input type="time" value={cfg.runAt} disabled={!canEdit} onChange={(e) => setCfg((c) => ({ ...c, runAt: e.target.value }))} style={{ ...inpSm, background: canEdit ? "#fff" : C.bg }} />
              </Field>
              <Field label="수신 중단 유예 (연체 후)">
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={14} value={cfg.grace} disabled={!canEdit} onChange={(e) => setCfg((c) => ({ ...c, grace: Math.max(0, Math.min(14, +e.target.value)) }))} style={{ ...inpSm, background: canEdit ? "#fff" : C.bg }} />
                  <span style={{ fontSize: 12, color: C.sub, whiteSpace: "nowrap" }}>일</span>
                </div>
              </Field>
              <Field label="실패 시 재시도">
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={5} value={cfg.retry} disabled={!canEdit} onChange={(e) => setCfg((c) => ({ ...c, retry: Math.max(0, Math.min(5, +e.target.value)) }))} style={{ ...inpSm, background: canEdit ? "#fff" : C.bg }} />
                  <span style={{ fontSize: 12, color: C.sub, whiteSpace: "nowrap" }}>회</span>
                </div>
              </Field>
            </div>
            <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
              {[
                { k: "resendDaily", t: "연체 상태일 때 매일 재발송", d: "반납·연장 처리될 때까지 같은 시각에 반복 발송합니다." },
                { k: "quiet", t: "야간 발송 제한 (21:00 ~ 08:00)", d: "제한 시간대에 걸린 발송은 다음 발송 시각으로 미룹니다." },
              ].map((o) => (
                <div key={o.k} onClick={() => canEdit && setCfg((c) => ({ ...c, [o.k]: !c[o.k] }))} className={canEdit ? "cursor-pointer flex items-center gap-3" : "flex items-center gap-3"}
                  style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 13px", opacity: canEdit ? 1 : 0.7 }}>
                  <span className="flex items-center justify-center flex-shrink-0" style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${cfg[o.k] ? C.primary : C.line}`, background: cfg[o.k] ? C.primary : "#fff" }}>{cfg[o.k] && <Check size={12} color="#fff" strokeWidth={3.5} />}</span>
                  <div className="flex-1"><div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{o.t}</div><div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{o.d}</div></div>
                </div>
              ))}
            </div>
          </Card>

          {/* 단계별 채널 매트릭스 */}
          <Card style={{ padding: 16 }}>
            <SectionTitle icon={MessageSquare} right={<span style={{ fontSize: 11, color: C.sub }}>단계별로 사용할 발송 채널</span>}>발송 채널 설정</SectionTitle>
            <div className="grid" style={{ gridTemplateColumns: "1.7fr 1fr 1fr 1fr 1.4fr", background: C.bg, borderRadius: "9px 9px 0 0", padding: "9px 13px", fontSize: 11, fontWeight: 800, color: C.sub, gap: 6 }}>
              <span>알림 단계</span>
              {CHANNELS.map((c) => <span key={c.id} className="flex items-center justify-center gap-1" style={{ color: c.c }}><c.icon size={11} /> {c.label}</span>)}
              <span style={{ textAlign: "right" }}>연동 게이트웨이</span>
            </div>
            {Object.values(RENT_LEVEL).map((L, i) => (
              <div key={L.key} className="grid items-center" style={{ gridTemplateColumns: "1.7fr 1fr 1fr 1fr 1.4fr", gap: 6, padding: "10px 13px", borderBottom: `1px solid ${C.line}` }}>
                <span className="flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}><L.icon size={13} color={L.c} /> {L.title}</span>
                {CHANNELS.map((c) => (
                  <span key={c.id} className="flex items-center justify-center">
                    <input type="checkbox" checked={!!cfg.ch[L.key][c.id]} disabled={!canEdit} onChange={(e) => setCh(L.key, c.id, e.target.checked)} className={canEdit ? "cursor-pointer" : ""} />
                  </span>
                ))}
                <span style={{ textAlign: "right", fontSize: 10.5, color: C.sub }}>{chLabel(cfg, L.key)}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: C.sub, marginTop: 10, lineHeight: 1.55, background: C.bg, borderRadius: 10, padding: "9px 11px" }}>
              <b style={{ color: C.primary }}>앱 푸시</b>는 FCM(Android)·APNs(iOS)로, <b style={{ color: C.gold }}>SMS</b>는 문자 발송사 API로 전송됩니다. <b style={{ color: C.high }}>유선 안내</b>는 자동 발송이 아니라 담당자 콜 리스트를 생성하는 방식입니다.
              {!canEdit && <> · 설정 변경은 <b>관리자</b> 권한입니다.</>}
            </div>
          </Card>
        </div>
      )}

      {sub === "log" && (
        <>
          <div className="grid grid-cols-5" style={{ gap: 8, marginBottom: 12 }}>
            {[
              { l: "총 발송", v: stat.total, c: C.ink },
              { l: "성공", v: stat.ok, c: C.low },
              { l: "부분 실패", v: stat.part, c: C.mid },
              { l: "실패", v: stat.fail, c: C.high },
              { l: "자동 발송", v: stat.auto, c: C.primary },
            ].map((k) => (
              <div key={k.l} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{k.l}</div>
                <div className="flex items-baseline gap-1"><span style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</span><span style={{ fontSize: 10, color: C.sub }}>건</span></div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between" style={{ marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2" style={{ width: 230, border: `1px solid ${C.line}`, borderRadius: 10, padding: "7px 11px", background: "#fff" }}>
                <Search size={14} color={C.sub} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="환자 · 기기 · 처리자 검색" style={{ flex: 1, border: "none", outline: "none", fontSize: 12.5, fontFamily: FONT, color: C.ink }} />
              </div>
              <select value={fLevel} onChange={(e) => setFLevel(e.target.value)} style={{ ...inpSm, width: 150 }}>
                <option value="all">전체 단계</option>
                {Object.values(RENT_LEVEL).map((L) => <option key={L.key} value={L.key}>{L.title}</option>)}
              </select>
              <select value={fRes} onChange={(e) => setFRes(e.target.value)} style={{ ...inpSm, width: 120 }}>
                <option value="all">전체 결과</option>
                {["성공", "부분 실패", "실패"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={exportCsv} className="cursor-pointer flex items-center gap-1.5"
              style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "8px 13px", fontSize: 12, fontWeight: 700, fontFamily: FONT }}><Download size={13} /> CSV 내보내기</button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: COLS, fontSize: 10.5, padding: "0 6px 8px", borderBottom: `1px solid ${C.line}`, gap: 6 }}>
            <SortHead label="로그 ID" k="id" sort={sort} setSort={setSort} />
            <SortHead label="발송 일시" k="at" sort={sort} setSort={setSort} />
            <SortHead label="환자" k="name" sort={sort} setSort={setSort} />
            <SortHead label="기기" k="serial" sort={sort} setSort={setSort} />
            <SortHead label="단계" k="level" sort={sort} setSort={setSort} />
            <span style={{ color: C.sub, fontWeight: 700 }}>채널</span>
            <SortHead label="방식" k="mode" sort={sort} setSort={setSort} />
            <SortHead label="처리자" k="actor" sort={sort} setSort={setSort} />
            <SortHead label="결과" k="result" sort={sort} setSort={setSort} align="right" />
          </div>

          {rows.map((r, i) => {
            const L = RENT_LEVEL[r.level];
            return (
              <div key={r.id} className="grid items-center" style={{ gridTemplateColumns: COLS, gap: 6, padding: "10px 6px", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none", background: r.result === "실패" ? C.highSoft + "50" : "transparent" }}>
                <span style={{ fontSize: 11, color: C.sub, fontFamily: "monospace" }}>{r.id}</span>
                <span style={{ fontSize: 11.5, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{r.at}</span>
                <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 700 }}>{r.name}</span>
                <span style={{ fontSize: 10.5, color: C.sub, fontFamily: "monospace" }}>{r.serial}</span>
                <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: L.c }}><L.icon size={11} /> {L.title}</span>
                <span className="flex items-center gap-1">
                  {r.chs.map((cid) => { const c = CHANNELS.find((x) => x.id === cid); return c ? <c.icon key={cid} size={12} color={c.c} /> : null; })}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.mode === "자동" ? C.primary : C.gold }}>{r.mode}</span>
                <span style={{ fontSize: 11.5, color: C.sub }}>{r.actor}</span>
                <span style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: RESULT_C[r.result], background: RESULT_C[r.result] + "18", padding: "3px 9px", borderRadius: 99 }}>{r.result}</span>
                </span>
              </div>
            );
          })}
          {rows.length === 0 && <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12.5, color: C.sub }}>조건에 맞는 발송 기록이 없습니다.</div>}

          <div style={{ fontSize: 10.5, color: C.sub, marginTop: 12, lineHeight: 1.55, background: C.bg, borderRadius: 10, padding: "9px 11px" }}>
            <b style={{ color: C.primary }}>감사 로그:</b> 모든 발송은 자동·수동 구분과 처리자를 남기며 임의 수정·삭제할 수 없습니다. 의료기기 소프트웨어 기록 관리 요건에 따라 보존 기간은 기관 정책(권장 3년)에 맞춰 설정하세요.
          </div>
        </>
      )}

      {csv && (
        <Modal title="CSV 내보내기" onClose={() => setCsv(null)} wide>
          <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 9, lineHeight: 1.5 }}>브라우저에서 파일 다운로드가 차단되어 내용을 직접 표시합니다. 전체 선택 후 복사해 사용하세요.</div>
          <textarea readOnly value={csv} style={{ width: "100%", height: 260, ...inpSm, fontFamily: "monospace", fontSize: 11, resize: "vertical" }} />
        </Modal>
      )}
    </div>
  );
}

/* ---------- 목표 안압 변경 ---------- */
function TargetModal({ p, onClose, onSave }) {
  const [od, setOd] = useState(p.targetOD);
  const [os, setOs] = useState(p.targetOS);
  const [note, setNote] = useState("");
  const dirty = od !== p.targetOD || os !== p.targetOS;
  return (
    <Modal title="목표 안압 변경" onClose={onClose}>
      <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: C.mint, color: C.primary }}><Gauge size={19} /></div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: C.sub }}>{p.dx} · 현재 OD {p.targetOD} / OS {p.targetOS} mmHg</div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {[{ l: "우안 OD", v: od, set: setOd, c: C.od }, { l: "좌안 OS", v: os, set: setOs, c: C.os }].map((t) => (
          <div key={t.l} className="flex items-center gap-3" style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 13px" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: t.c, width: 62, flexShrink: 0 }}>{t.l}</span>
            <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
              <button onClick={() => t.set(Math.max(8, t.v - 1))} className="cursor-pointer" style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 8, width: 30, height: 30, fontSize: 17, fontWeight: 800, fontFamily: FONT, lineHeight: 1 }}>−</button>
              <input type="number" min={8} max={30} value={t.v} onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) t.set(Math.min(30, Math.max(8, n))); }}
                style={{ width: 52, textAlign: "center", border: "none", outline: "none", fontSize: 19, fontWeight: 800, color: C.ink, fontFamily: FONT, background: "transparent" }} />
              <button onClick={() => t.set(Math.min(30, t.v + 1))} className="cursor-pointer" style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 8, width: 30, height: 30, fontSize: 17, fontWeight: 800, fontFamily: FONT, lineHeight: 1 }}>＋</button>
              <span style={{ fontSize: 11, color: C.sub, width: 34, flexShrink: 0 }}>mmHg</span>
            </div>
          </div>
        ))}
        <Field label="변경 사유 (선택)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 시야검사 진행 소견으로 하향 조정" style={inpSm} /></Field>
        <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.5 }}>
          저장하면 환자 앱의 게이지·추세 목표선·초과 알림에 즉시 반영되고, 변경 이력이 기록됩니다.
        </div>
        <div className="flex gap-2.5" style={{ marginTop: 2 }}>
          <button onClick={onClose} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
          <button onClick={() => dirty && onSave({ targetOD: od, targetOS: os, note })} disabled={!dirty} className="cursor-pointer"
            style={{ flex: 2, border: "none", background: dirty ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>변경 저장</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- 진료 보고서 생성 ---------- */
/* ---------- 보고서 데이터 구성 · HTML/TEXT 렌더 ---------- */
const REPORT_SECTIONS = [
  { id: "iop", t: "안압 측정 요약 · 그래프", on: true },
  { id: "trend", t: "일자별 안압 추이", on: true },
  { id: "hist", t: "측정 이력 상세", on: true },
  { id: "tod", t: "시간대별 안압 프로파일", on: false },
  { id: "device", t: "기기 대여·반납 이력", on: false },
];
function buildReportData(p, from, to, sec, gtype) {
  const pts = trendDataRange(from, to);
  const mean = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : 0);
  const blocks = [];

  if (sec.includes("iop")) {
    const odAvg = mean(pts.map((x) => x.odAvg)), osAvg = mean(pts.map((x) => x.osAvg));
    const peak = Math.max(...pts.map((x) => x.odMax));
    const overDays = pts.filter((x) => x.odAvg > p.targetOD).length;
    const flucAvg = mean(pts.map((x) => x.fluc));
    blocks.push({ h: "1. 안압 측정 요약", kv: [
      ["측정 기간", `${from} ~ ${to}`],
      ["총 측정 횟수", `${pts.reduce((a, x) => a + x.cnt, 0)}회`],
      ["우안(OD) 평균", `${odAvg} mmHg (목표 ${p.targetOD})`],
      ["좌안(OS) 평균", `${osAvg} mmHg (목표 ${p.targetOS})`],
      ["기간 최고 안압", `${peak.toFixed(1)} mmHg`],
      ["목표 초과일", `${overDays}일 / ${pts.length}일 (${Math.round((overDays / pts.length) * 100)}%)`],
      ["평균 일중 변동폭", `${flucAvg} mmHg (2 미만 안정 · 5 이상 주의)`],
      ["그래프 형식", (GRAPH_TYPES.find((g) => g.id === gtype) || {}).ko],
    ]});
  }
  if (sec.includes("trend")) {
    blocks.push({ h: "2. 일자별 안압 추이", table: {
      head: ["일자", "우안 평균", "우안 최소~최대", "좌안 평균", "좌안 최소~최대", "측정 횟수", "일중 변동"],
      rows: pts.map((x) => [x.d, x.odAvg, `${x.odMin} ~ ${x.odMax}`, x.osAvg, `${x.osMin} ~ ${x.osMax}`, `${x.cnt}회`, `${x.fluc}`]),
    }});
  }
  if (sec.includes("hist")) {
    blocks.push({ h: "3. 측정 이력 상세", table: {
      head: ["측정 시각", "기기", "측정 눈", "IOP(OD)", "품질", "IOP(OS)", "품질", "기록"],
      rows: MEAS_ROWS.map((r) => [r.at, r.dev, r.eye, r.od == null ? "–" : r.od.toFixed(1), r.qod, r.os == null ? "–" : r.os.toFixed(1), r.qos, r.src]),
    }});
  }
  if (sec.includes("tod")) {
    blocks.push({ h: "4. 시간대별 안압 프로파일", table: {
      head: ["시간대", "구간", "우안 평균", "좌안 평균", "측정 횟수"],
      rows: TOD_PROFILE.map((t) => [t.k, t.range, t.od, t.os, `${t.n}회`]),
      },
      note: "진료실 측정으로 놓치기 쉬운 야간·기상 시 최고 안압을 확인하는 자료입니다.",
    });
  }
  if (sec.includes("device")) {
    const dev = DEVICES_INIT.find((d) => d.serial === p.serial);
    blocks.push({ h: "5. 기기 대여 · 반납 이력", table: {
      head: ["항목", "내용"],
      rows: [["기기 시리얼", p.serial || "-"], ["소유 구분", dev ? (dev.owner === "기관" ? "병원 대여" : "개인 소유") : "-"],
             ["사용 기간", p.period || "-"], ["현재 상태", deviceState(dev).label]],
    }});
  }
  return {
    title: "녹내장 안압관리 진료 보고서",
    org: "씨엔브이 안과 · 안압케어 CLINIC",
    patient: [["환자명", p.name], ["환자 ID", p.id], ["성별 · 생년월일", `${p.gender} · ${p.birth || "-"}`],
              ["진단명", p.dx], ["목표 안압", `OD ${p.targetOD} / OS ${p.targetOS} mmHg`], ["대상 기간", `${from} ~ ${to}`]],
    issuedAt: `${isoDate(new Date())} ${nowHM()}`,
    blocks,
  };
}
function reportHtml(d) {
  const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const kv = (rows) => `<table class="kv">${rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</table>`;
  const tbl = (t) => `<table class="d"><thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`
    + `<tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const body = d.blocks.map((b) => `<section><h2>${esc(b.h)}</h2>`
    + (b.kv ? kv(b.kv) : "")
    + (b.table ? tbl(b.table) : "")
    + (b.list ? `<ol class="cs">${b.list.map((x) => `<li>${esc(x).replace(/\n/g, "<br>")}</li>`).join("")}</ol>` : "")
    + (b.note ? `<p class="note">${esc(b.note)}</p>` : "") + `</section>`).join("");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(d.title)} - ${esc(d.patient[0][1])}</title>
<style>
*{box-sizing:border-box}
body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#0A2A31;margin:0;padding:28px 30px;background:#fff;font-size:12px;line-height:1.6}
header{border-bottom:2px solid #0E5563;padding-bottom:12px;margin-bottom:16px}
h1{font-size:19px;margin:0 0 4px;color:#0E5563}
.org{font-size:11px;color:#5E7A7C}
.issued{font-size:10px;color:#8AA0A1;margin-top:6px}
h2{font-size:13px;margin:20px 0 8px;color:#0A2A31;border-left:4px solid #3EA6A6;padding-left:8px}
table{width:100%;border-collapse:collapse;margin-bottom:6px}
.kv th{width:130px;text-align:left;background:#F3F7F6;color:#5E7A7C;font-weight:700;padding:6px 10px;border:1px solid #E2EAE9;font-size:11px}
.kv td{padding:6px 10px;border:1px solid #E2EAE9;font-size:11.5px}
.d th{background:#0E5563;color:#fff;font-size:10.5px;padding:6px 8px;border:1px solid #0E5563;text-align:left}
.d td{padding:5px 8px;border:1px solid #E2EAE9;font-size:11px}
.d tbody tr:nth-child(even){background:#F8FBFA}
.cs{padding-left:18px;font-size:11.5px}
.cs li{margin-bottom:8px}
.note{font-size:10.5px;color:#5E7A7C;background:#F3F7F6;padding:8px 10px;border-radius:6px;margin-top:4px}
footer{margin-top:26px;padding-top:12px;border-top:1px solid #E2EAE9;font-size:10px;color:#8AA0A1;line-height:1.7}
@media print{body{padding:0}section{page-break-inside:avoid}}
</style></head><body>
<header><h1>${esc(d.title)}</h1><div class="org">${esc(d.org)}</div><div class="issued">발행 ${esc(d.issuedAt)}</div></header>
<section><h2>환자 정보</h2>${kv(d.patient)}</section>
${body}
<footer>본 보고서는 기록된 측정·점안 데이터를 정리한 자료이며 진단·처방 판단을 포함하지 않습니다.<br>
임상적 판단은 의료진의 소견과 함께 이루어져야 합니다. · C&amp;V Tech 안압케어</footer>
</body></html>`;
}
function reportText(d) {
  const line = "=".repeat(56);
  const kv = (rows) => rows.map((r) => `  ${String(r[0]).padEnd(16, " ")}: ${r[1]}`).join("\n");
  const tbl = (t) => [t.head.join(" | "), "-".repeat(56), ...t.rows.map((r) => r.join(" | "))].join("\n");
  const body = d.blocks.map((b) => [`\n[${b.h}]`, b.kv ? kv(b.kv) : "", b.table ? tbl(b.table) : "",
    b.list ? b.list.join("\n") : "", b.note ? `  * ${b.note}` : ""].filter(Boolean).join("\n")).join("\n");
  return [line, `  ${d.title}`, `  ${d.org}`, `  발행 ${d.issuedAt}`, line,
    "\n[환자 정보]", kv(d.patient), body, "\n" + line,
    "본 보고서는 기록된 측정·점안 데이터를 정리한 자료이며 진단·처방 판단을 포함하지 않습니다.", line].join("\n");
}
function downloadBlob(text, filename, mime) {
  try {
    const blob = new Blob(["\uFEFF" + text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (e) { return false; }
}

function ReportModal({ p, from, to, onClose }) {
  const [sec, setSec] = useState(REPORT_SECTIONS.filter((x) => x.on).map((x) => x.id));
  const [gtype, setGtype] = useState("chart");
  const [stage, setStage] = useState("form");        // form | making | done
  const [fmt, setFmt] = useState("pdf");
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState("");
  const frame = useRef(null);
  const toggle = (id) => setSec((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const make = () => { setStage("making"); setTimeout(() => setStage("done"), 1400); };

  const data = useMemo(() => (stage === "done" ? buildReportData(p, from, to, sec, gtype) : null), [stage, p, from, to, sec, gtype]);
  const html = data ? reportHtml(data) : "";
  const base = `안압케어_진료보고서_${p.name}_${from}_${to}`;
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };

  const doPrint = () => {
    try { frame.current.contentWindow.focus(); frame.current.contentWindow.print(); }
    catch (e) { flash("이 환경에서는 인쇄 창을 열 수 없습니다. HTML로 내려받아 브라우저에서 인쇄하세요."); }
  };
  const doDownload = () => {
    if (fmt === "html") {
      flash(downloadBlob(html, `${base}.html`, "text/html;charset=utf-8") ? "HTML 파일을 내려받았습니다." : "다운로드가 차단되었습니다. 미리보기에서 내용을 복사하세요.");
    } else if (fmt === "txt") {
      flash(downloadBlob(reportText(data), `${base}.txt`, "text/plain;charset=utf-8") ? "텍스트 파일을 내려받았습니다." : "다운로드가 차단되었습니다.");
    } else {
      if (!preview) setPreview(true);
      setTimeout(doPrint, 400);
      flash("인쇄 창에서 대상을 'PDF로 저장'으로 선택하세요.");
    }
  };

  const FMTS = [
    { id: "pdf", t: "PDF", d: "인쇄 → PDF로 저장", icon: FileText },
    { id: "html", t: "HTML", d: "웹 문서 파일", icon: Globe },
    { id: "txt", t: "TEXT", d: "텍스트 파일", icon: ListChecks },
  ];

  return (
    <Modal title="진료 보고서 생성" onClose={onClose} wide>
      {stage === "done" ? (
        <div className="flex flex-col" style={{ paddingTop: 4 }}>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 999, background: C.lowSoft, color: C.low, marginBottom: 11 }}><FileText size={25} /></div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: C.ink }}>보고서가 생성되었습니다</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 5, textAlign: "center", lineHeight: 1.55 }}>
              {p.name} · {from} ~ {to}<br />선택 항목 {sec.length}개 · {(GRAPH_TYPES.find((g) => g.id === gtype) || {}).ko}
            </div>
          </div>

          {/* 미리보기 */}
          {preview && (
            <div style={{ marginTop: 14, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
              <div className="flex items-center justify-between" style={{ padding: "8px 12px", background: C.bg, borderBottom: `1px solid ${C.line}` }}>
                <span className="flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 800, color: C.primary }}><Eye size={12} /> HTML 미리보기</span>
                <div className="flex items-center gap-2">
                  <span onClick={doPrint} className="cursor-pointer flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: C.sub }}><FileText size={11} /> 인쇄</span>
                  <span onClick={() => setPreview(false)} className="cursor-pointer" style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>닫기</span>
                </div>
              </div>
              <iframe ref={frame} title="report-preview" srcDoc={html} style={{ width: "100%", height: 360, border: "none", background: "#fff" }} />
            </div>
          )}

          {/* 다운로드 형식 */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, marginBottom: 7 }}>다운로드 형식</div>
            <div className="flex" style={{ gap: 7 }}>
              {FMTS.map((f) => {
                const on = fmt === f.id;
                return (
                  <div key={f.id} onClick={() => setFmt(f.id)} className="cursor-pointer flex flex-col items-center"
                    style={{ flex: 1, border: `1.5px solid ${on ? C.primary : C.line}`, background: on ? C.mint : "#fff", borderRadius: 12, padding: "11px 6px" }}>
                    <f.icon size={16} color={on ? C.primary : C.sub} />
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: on ? C.primary : C.ink, marginTop: 4 }}>{f.t}</div>
                    <div style={{ fontSize: 9.5, color: C.sub, marginTop: 1 }}>{f.d}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {msg && (
            <div className="flex items-center gap-2" style={{ marginTop: 11, background: C.mint, borderRadius: 10, padding: "9px 12px", fontSize: 11.5, color: C.ink, fontWeight: 600 }}>
              <Info size={13} color={C.primary} className="flex-shrink-0" /> {msg}
            </div>
          )}

          <div className="flex gap-2.5" style={{ marginTop: 14 }}>
            <button onClick={() => setPreview((v) => !v)} className="cursor-pointer flex items-center justify-center gap-1.5"
              style={{ flex: 1, border: `1.5px solid ${C.primary}`, background: "#fff", color: C.primary, borderRadius: 11, padding: "11px 0", fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
              <Eye size={14} /> {preview ? "미리보기 닫기" : "미리보기"}
            </button>
            <button onClick={doDownload} className="cursor-pointer flex items-center justify-center gap-1.5"
              style={{ flex: 2, border: "none", background: C.primary, color: "#fff", borderRadius: 11, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>
              <Download size={14} /> {FMTS.find((f) => f.id === fmt).t}로 다운로드
            </button>
          </div>
          <div style={{ fontSize: 10, color: C.sub, marginTop: 9, lineHeight: 1.5, textAlign: "center" }}>
            파일명 {base}.{fmt === "txt" ? "txt" : fmt} · 운영 환경에서는 서버가 PDF를 생성해 15분간 유효한 링크를 제공합니다.
          </div>
        </div>
      ) : stage === "making" ? (
        <div className="flex flex-col items-center" style={{ padding: "40px 0" }}>
          <RefreshCw size={30} color={C.primary} className="animate-spin" />
          <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginTop: 14 }}>보고서를 만들고 있습니다…</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 4 }}>측정·점안 데이터를 집계하는 중</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5" style={{ padding: "10px 12px", borderRadius: 11, background: C.bg }}>
            <User size={16} color={C.primary} className="flex-shrink-0" />
            <div className="flex-1">
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{p.name} <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{p.id} · {p.dx}</span></div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>대상 기간 {from} ~ {to}</div>
            </div>
          </div>
          <Field label="포함할 항목">
            <div className="grid grid-cols-2" style={{ gap: 7 }}>
              {REPORT_SECTIONS.map((x) => {
                const on = sec.includes(x.id);
                return (
                  <div key={x.id} onClick={() => toggle(x.id)} className="cursor-pointer flex items-center gap-2"
                    style={{ border: `1.5px solid ${on ? C.primary : C.line}`, background: on ? C.mint : "#fff", borderRadius: 10, padding: "9px 11px" }}>
                    <span className="flex items-center justify-center flex-shrink-0" style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${on ? C.primary : C.line}`, background: on ? C.primary : "#fff" }}>{on && <Check size={11} color="#fff" strokeWidth={3.5} />}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>{x.t}</span>
                  </div>
                );
              })}
            </div>
          </Field>
          <Field label="안압 그래프 형식"><GraphTypeSwitch value={gtype} onChange={setGtype} compact /></Field>
          <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.5, background: C.bg, borderRadius: 10, padding: "9px 11px" }}>
            보고서에는 진단·처방 판단이 포함되지 않으며, 기록된 측정·점안 데이터를 정리해 제공합니다.
          </div>
          <div className="flex gap-2.5" style={{ marginTop: 2 }}>
            <button onClick={onClose} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
            <button onClick={make} disabled={!sec.length} className="cursor-pointer flex items-center justify-center gap-1.5"
              style={{ flex: 2, border: "none", background: sec.length ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}><FileText size={14} /> 보고서 생성</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- 장치 등록 ---------- */
function AddDeviceForm({ devices, onCancel, onSubmit }) {
  const [f, setF] = useState({ name: "", serial: "", model: "CVT200", owner: "org", usage: "home", battery: 100, firmware: "1.4.2" });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const serialOK = /^CVT2H?-[0-9A-Z]{6,10}$/.test(f.serial.trim());
  const dup = devices.some((d) => d.serial === f.serial.trim());
  const ok = f.name.trim() && serialOK && !dup;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2.5">
        <Field label="장치명" req><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="예: 홈 대여기 #5" style={inpSm} /></Field>
        <Field label="모델">
          <select value={f.model} onChange={(e) => set("model", e.target.value)} style={inpSm}>
            <option value="CVT200">CVT200</option>
            <option value="CVT200 HOME">CVT200 HOME</option>
          </select>
        </Field>
      </div>
      <Field label="시리얼 번호" req>
        <input value={f.serial} onChange={(e) => set("serial", e.target.value.toUpperCase())} placeholder="CVT2H-0000AA00"
          style={{ ...inpSm, fontFamily: "monospace", letterSpacing: "0.04em", borderColor: f.serial ? (ok ? C.low : C.high) : C.line }} />
        <div style={{ fontSize: 10.5, marginTop: 5, lineHeight: 1.45, color: !f.serial ? C.sub : dup ? C.high : serialOK ? C.low : C.high }}>
          {!f.serial ? "기기 뒷면 라벨의 시리얼 번호를 입력하세요."
            : dup ? "이미 등록된 시리얼 번호입니다."
            : serialOK ? "✓ 등록 가능한 형식입니다." : "형식이 올바르지 않습니다. 예: CVT2H-2033AA11"}
        </div>
      </Field>
      <div className="flex gap-2.5">
        <Field label="소유 구분" req>
          <div className="flex" style={{ gap: 5 }}>
            {[{ id: "org", t: "기관 자산" }, { id: "patient", t: "환자 개인" }].map((o) => (
              <button key={o.id} onClick={() => set("owner", o.id)} className="cursor-pointer"
                style={{ flex: 1, border: `1.5px solid ${f.owner === o.id ? C.primary : C.line}`, background: f.owner === o.id ? C.mint : "#fff", color: f.owner === o.id ? C.primary : C.sub, borderRadius: 9, padding: "9px 0", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{o.t}</button>
            ))}
          </div>
        </Field>
        <Field label="용도" req>
          <div className="flex" style={{ gap: 5 }}>
            {[{ id: "clinic", t: "원내용" }, { id: "home", t: "가정 대여용" }].map((o) => (
              <button key={o.id} onClick={() => set("usage", o.id)} className="cursor-pointer"
                style={{ flex: 1, border: `1.5px solid ${f.usage === o.id ? C.primary : C.line}`, background: f.usage === o.id ? C.mint : "#fff", color: f.usage === o.id ? C.primary : C.sub, borderRadius: 9, padding: "9px 0", fontSize: 12, fontWeight: 700, fontFamily: FONT }}>{o.t}</button>
            ))}
          </div>
        </Field>
      </div>
      <div className="flex gap-2.5">
        <Field label="배터리 (%)"><input type="number" min={0} max={100} value={f.battery} onChange={(e) => set("battery", Math.max(0, Math.min(100, +e.target.value)))} style={inpSm} /></Field>
        <Field label="펌웨어"><input value={f.firmware} onChange={(e) => set("firmware", e.target.value)} style={inpSm} /></Field>
      </div>
      <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.5, background: C.bg, borderRadius: 9, padding: "9px 11px" }}>
        기관 자산 · 가정 대여용으로 등록하면 곧바로 <b style={{ color: C.low }}>대여 가능</b> 상태가 되어 환자에게 배정할 수 있습니다.
      </div>
      <div className="flex gap-2.5" style={{ marginTop: 2 }}>
        <button onClick={onCancel} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
        <button onClick={() => ok && onSubmit({
          serial: f.serial.trim(), name: f.name.trim(), type: f.model, model: f.model,
          owner: f.owner === "org" ? "기관" : "개인", use: f.usage, org: "씨엔브이 안과",
          assignedTo: null, rentFrom: null, rentTo: null, linkedAt: null,
          battery: f.battery, fw: f.firmware, active: true,
        })} disabled={!ok} className="cursor-pointer"
          style={{ flex: 2, border: "none", background: ok ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>장치 등록</button>
      </div>
    </div>
  );
}


/* ---------- 환자 상세 · 기기 관리 탭 ---------- */
function DeviceTab({ p, role, devices, setDevices, myDev, devSt, sent = {}, onSend }) {
  const [mode, setMode] = useState(null);      // "assign" | "extend" | "link"
  const [pick, setPick] = useState("");
  const [rentFrom, setRentFrom] = useState(TODAY_STR);
  const [rentTo, setRentTo] = useState("2026-08-03");
  const [newSerial, setNewSerial] = useState("");
  const [msg, setMsg] = useState("");
  const perm = CAN[role].devices;
  const alert = myDev && myDev.owner === "기관" ? rentAlert(myDev.rentTo, TODAY_STR) : null;
  const sentList = (myDev && sent[myDev.serial]) || [];
  const free = devices.filter((d) => d.owner === "기관" && d.use === "home" && d.active && !d.assignedTo);
  const serialOK = /^CVT2H?-[0-9A-Z]{6,10}$/.test(newSerial.trim());
  const taken = devices.find((d) => d.serial === newSerial.trim() && d.assignedTo && d.assignedTo !== p.id);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };
  const assign = () => {
    if (!pick) return;
    setDevices((ds) => ds.map((d) => (d.serial === pick ? { ...d, assignedTo: p.id, rentFrom, rentTo } : d)));
    setMode(null); setPick(""); flash("기기가 대여 배정되었습니다.");
  };
  const extend = () => {
    setDevices((ds) => ds.map((d) => (d.serial === myDev.serial ? { ...d, rentTo } : d)));
    setMode(null); flash("반납 예정일이 변경되었습니다.");
  };
  const doReturn = () => {
    setDevices((ds) => ds.map((d) => (d.serial === myDev.serial ? { ...d, assignedTo: null, rentFrom: null, rentTo: null } : d)));
    flash("반납 처리되었습니다. 기기가 대여 가능 상태로 전환됩니다.");
  };
  const unlink = () => {
    setDevices((ds) => ds.map((d) => (d.serial === myDev.serial ? { ...d, assignedTo: null, linkedAt: null } : d)));
    flash("개인 기기 연동이 해제되었습니다.");
  };
  const link = () => {
    if (!serialOK || taken) return;
    const exists = devices.some((d) => d.serial === newSerial.trim());
    if (exists) {
      setDevices((ds) => ds.map((d) => (d.serial === newSerial.trim() ? { ...d, owner: "개인", assignedTo: p.id, linkedAt: TODAY_STR, rentFrom: null, rentTo: null } : d)));
    } else {
      setDevices((ds) => [...ds, { serial: newSerial.trim(), name: `${p.name} 개인 기기`, type: "CVT200 HOME", owner: "개인", use: "home", org: "씨엔브이 안과", assignedTo: p.id, rentFrom: null, rentTo: null, linkedAt: TODAY_STR, battery: 100, fw: "1.4.2", active: true }]);
    }
    setMode(null); setNewSerial(""); flash("개인 소유 기기가 연동되었습니다.");
  };

  return (
    <div className="flex flex-col gap-3">
      {msg && (
        <div className="flex items-center gap-2" style={{ background: C.lowSoft, color: C.low, borderRadius: 10, padding: "10px 13px", fontSize: 12, fontWeight: 700 }}>
          <PackageCheck size={15} /> {msg}
        </div>
      )}

      {/* 반납 알림 자동화 패널 */}
      {alert && (
        <Card style={{ padding: 0, overflow: "hidden", borderColor: alert.c + "50" }}>
          <div className="flex items-center gap-3" style={{ background: alert.bg, padding: "13px 16px" }}>
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 11, background: "#fff", color: alert.c }}><alert.icon size={18} /></div>
            <div className="flex-1">
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{alert.title}</div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{alert.msg}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: alert.c, background: "#fff", padding: "5px 12px", borderRadius: 999 }}>
              {alert.dd >= 0 ? `D-${alert.dd}` : `+${-alert.dd}일`}
            </span>
          </div>

          {alert.blocked && (
            <div className="flex items-center gap-2.5" style={{ padding: "11px 16px", borderTop: `1px solid ${C.line}`, background: "#fff" }}>
              <WifiOff size={15} color={C.high} className="flex-shrink-0" />
              <div style={{ fontSize: 11.5, color: C.ink, lineHeight: 1.45, flex: 1 }}>
                연체 {SYNC_GRACE}일 초과로 이 기기의 <b style={{ color: C.high }}>측정 데이터 수신이 중단</b>되었습니다. 환자 앱에는 기록이 저장되지만 의료진 웹으로 전송되지 않으며, 반납 또는 기간 연장 시 즉시 재개됩니다.
              </div>
            </div>
          )}

          {perm && (
            <div className="flex items-center gap-2" style={{ padding: "11px 16px", borderTop: `1px solid ${C.line}` }}>
              <button onClick={() => onSend && onSend(myDev.serial, alert)} className="cursor-pointer flex items-center gap-1.5"
                style={{ border: "none", background: alert.c, color: "#fff", borderRadius: 9, padding: "8px 13px", fontSize: 12, fontWeight: 800, fontFamily: FONT }}><MessageSquare size={13} /> 반납 알림 발송</button>
              <span style={{ fontSize: 10.5, color: C.sub }}>
                자동 발송 채널 {alert.ch}
                {sentList.length > 0 && <> · 발송 이력 {sentList.length}회 (최근 {sentList[sentList.length - 1]})</>}
              </span>
            </div>
          )}

          <div style={{ padding: "10px 16px", background: C.bg, fontSize: 10, color: C.sub, lineHeight: 1.5 }}>
            자동 스케줄: D-3 안내 → D-1 알림 → 당일 알림 → 연체 시 매일 재발송 → 연체 {SYNC_GRACE}일 초과 시 데이터 수신 중단
          </div>
        </Card>
      )}

      {/* 현재 기기 */}
      {myDev ? (
        <Card style={{ padding: 16, borderColor: devSt.k === "overdue" ? C.high + "60" : C.line }}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 46, height: 46, borderRadius: 14, background: myDev.owner === "개인" ? "#E2F1F0" : C.mint, color: myDev.owner === "개인" ? C.aqua : C.primary }}><Monitor size={22} /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{myDev.name}</span>
                <OwnerBadge owner={myDev.owner} />
                <DevStateChip st={devSt} />
              </div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3, fontFamily: "monospace" }}>{myDev.serial}</div>

              <div className="grid grid-cols-4" style={{ gap: 10, marginTop: 12 }}>
                {(myDev.owner === "기관"
                  ? [
                      { l: "대여 시작", v: myDev.rentFrom || "—" },
                      { l: "반납 예정", v: myDev.rentTo || "—", c: devSt.k === "overdue" ? C.high : devSt.k === "due" ? C.mid : C.ink },
                      { l: "배터리", v: `${myDev.battery}%`, c: myDev.battery <= 20 ? C.high : C.ink },
                      { l: "펌웨어", v: myDev.fw },
                    ]
                  : [
                      { l: "연동일", v: myDev.linkedAt || "—" },
                      { l: "소유자", v: p.name },
                      { l: "배터리", v: `${myDev.battery}%`, c: myDev.battery <= 20 ? C.high : C.ink },
                      { l: "펌웨어", v: myDev.fw },
                    ]
                ).map((r) => (
                  <div key={r.l}>
                    <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{r.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: r.c || C.ink, marginTop: 2 }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {perm && (
            <div className="flex items-center gap-2" style={{ marginTop: 14, paddingTop: 13, borderTop: `1px solid ${C.line}` }}>
              {myDev.owner === "기관" ? (
                <>
                  <button onClick={() => { setRentTo(myDev.rentTo); setMode(mode === "extend" ? null : "extend"); }} className="cursor-pointer flex items-center gap-1.5"
                    style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}><CalendarDays size={13} /> 대여 기간 연장</button>
                  <button onClick={doReturn} className="cursor-pointer flex items-center gap-1.5"
                    style={{ border: "none", background: C.primary, color: "#fff", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}><Undo2 size={13} /> 반납 처리</button>
                  <span style={{ fontSize: 10.5, color: C.sub, marginLeft: "auto" }}>반납 처리하면 장치가 즉시 대여 가능 상태가 됩니다.</span>
                </>
              ) : (
                <>
                  <button onClick={unlink} className="cursor-pointer flex items-center gap-1.5"
                    style={{ border: `1.5px solid ${C.high}40`, background: "#fff", color: C.high, borderRadius: 10, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}><Unlink size={13} /> 연동 해제</button>
                  <span style={{ fontSize: 10.5, color: C.sub, marginLeft: "auto" }}>환자 개인 자산이므로 반납 절차가 없습니다. 연동만 해제됩니다.</span>
                </>
              )}
            </div>
          )}

          {mode === "extend" && (
            <div className="flex items-end gap-2.5" style={{ marginTop: 12, padding: "12px 13px", borderRadius: 12, background: C.bg }}>
              <Field label="새 반납 예정일"><input type="date" value={rentTo} min={TODAY_STR} onChange={(e) => setRentTo(e.target.value)} style={inpSm} /></Field>
              <button onClick={extend} className="cursor-pointer" style={{ border: "none", background: C.primary, color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>변경</button>
              <button onClick={() => setMode(null)} className="cursor-pointer" style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>취소</button>
            </div>
          )}
        </Card>
      ) : (
        <Card style={{ padding: 20 }}>
          <div className="flex flex-col items-center" style={{ color: C.sub }}>
            <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 999, background: C.bg, color: C.grey, marginBottom: 10 }}><Monitor size={22} /></div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>배정된 기기가 없습니다</div>
            <div style={{ fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>병원 기기를 대여해 주거나, 환자가 직접 구입한 기기를 연동하세요.</div>
          </div>
        </Card>
      )}

      {/* 배정 방식 선택 */}
      {perm && !myDev && (
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          <Card style={{ padding: 16, borderColor: mode === "assign" ? C.primary : C.line }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <Building2 size={16} color={C.primary} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>병원 기기 대여</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5, marginBottom: 10 }}>기관 보유 홈 기기를 기간을 정해 빌려줍니다. 반납 예정일 관리 대상이 됩니다. 현재 대여 가능 <b style={{ color: free.length ? C.low : C.high }}>{free.length}대</b></div>
            {mode === "assign" ? (
              <div className="flex flex-col gap-2.5">
                <Field label="대여할 기기">
                  <select value={pick} onChange={(e) => setPick(e.target.value)} style={inpSm}>
                    <option value="">선택하세요</option>
                    {free.map((d) => <option key={d.serial} value={d.serial}>{d.name} · {d.serial} · 배터리 {d.battery}%</option>)}
                  </select>
                </Field>
                <div className="flex gap-2.5">
                  <Field label="대여 시작"><input type="date" value={rentFrom} onChange={(e) => setRentFrom(e.target.value)} style={inpSm} /></Field>
                  <Field label="반납 예정"><input type="date" value={rentTo} min={rentFrom} onChange={(e) => setRentTo(e.target.value)} style={inpSm} /></Field>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMode(null)} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 9, padding: "9px 0", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>취소</button>
                  <button onClick={assign} disabled={!pick} className="cursor-pointer" style={{ flex: 2, border: "none", background: pick ? C.primary : C.mintDeep, color: "#fff", borderRadius: 9, padding: "9px 0", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>대여 배정</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setMode("assign")} disabled={!free.length} className="cursor-pointer" style={{ width: "100%", border: "none", background: free.length ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "10px 0", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>{free.length ? "대여 배정하기" : "대여 가능 기기 없음"}</button>
            )}
          </Card>

          <Card style={{ padding: 16, borderColor: mode === "link" ? C.aqua : C.line }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <Link2 size={16} color={C.aqua} /><span style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>개인 소유 기기 연동</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5, marginBottom: 10 }}>환자가 직접 구입해 보유한 기기를 병원 계정에 연결합니다. 반납 관리 없이 측정 데이터만 연동됩니다.</div>
            {mode === "link" ? (
              <div className="flex flex-col gap-2.5">
                <Field label="시리얼 번호">
                  <input value={newSerial} onChange={(e) => setNewSerial(e.target.value.toUpperCase())} placeholder="CVT2H-0000AA00" style={{ ...inpSm, fontFamily: "monospace" }} />
                </Field>
                <div style={{ fontSize: 10.5, lineHeight: 1.45, color: !newSerial ? C.sub : taken ? C.high : !serialOK ? C.high : C.low }}>
                  {!newSerial ? "환자가 보유한 기기의 시리얼 번호를 입력하세요."
                    : taken ? "다른 환자에게 이미 배정된 기기입니다."
                    : !serialOK ? "형식이 올바르지 않습니다. 예: CVT2H-2033AA11"
                    : "✓ 연동 가능합니다."}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMode(null)} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 9, padding: "9px 0", fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>취소</button>
                  <button onClick={link} disabled={!serialOK || !!taken} className="cursor-pointer" style={{ flex: 2, border: "none", background: serialOK && !taken ? C.aqua : C.mintDeep, color: "#fff", borderRadius: 9, padding: "9px 0", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>연동하기</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setMode("link")} className="cursor-pointer" style={{ width: "100%", border: `1.5px solid ${C.aqua}`, background: "#fff", color: C.aqua, borderRadius: 10, padding: "10px 0", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>시리얼로 연동하기</button>
            )}
          </Card>
        </div>
      )}

      {!perm && <div style={{ fontSize: 11, color: C.sub }}>기기 배정·반납 처리는 의사·관리자·교육 담당자 권한입니다.</div>}

      {/* 이력 */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 10 }}>기기 이력</div>
        {[
          myDev && (myDev.owner === "기관"
            ? { d: myDev.rentFrom, t: `${myDev.name} 대여 시작`, s: `반납 예정 ${myDev.rentTo}`, c: C.primary }
            : { d: myDev.linkedAt, t: `${myDev.name} 연동`, s: "환자 개인 소유 기기", c: C.aqua }),
          { d: "2026-05-12", t: "원내 CVT200 측정 교육 이수", s: "교육 담당자 박정민", c: C.gold },
          { d: "2026-05-10", t: "환자 계정 생성", s: p.join === "개별" ? "개별 등록" : "SNS 연동 가입", c: C.sub },
        ].filter(Boolean).map((r, i) => (
          <div key={i} className="flex items-center gap-3" style={{ padding: "9px 0", borderBottom: i < 2 ? `1px solid ${C.line}` : "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: r.c, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: C.sub, width: 82, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{r.d}</span>
            <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 700, flex: 1 }}>{r.t}</span>
            <span style={{ fontSize: 11, color: C.sub }}>{r.s}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------- 사용자(직원) 관리 ---------- */
function UsersPage({ role, users, setUsers }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ k: "name", dir: "asc" });
  const [add, setAdd] = useState(false);
  if (!CAN[role].users) return <NoPermission role={role} />;

  const rows = useMemo(() => {
    let r = users.filter((u) => !q || [u.name, u.email, u.org].join(" ").toLowerCase().includes(q.toLowerCase()));
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => String(a[sort.k]).localeCompare(String(b[sort.k]), "ko") * dir);
  }, [users, q, sort]);
  const COLS = "1.2fr 1.8fr 1.3fr 1.2fr 1fr 0.9fr 0.6fr";

  return (
    <div style={{ padding: "16px 20px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="flex items-center gap-2" style={{ flex: 1, maxWidth: 300, border: `1px solid ${C.line}`, borderRadius: 10, padding: "7px 11px", background: "#fff" }}>
          <Search size={14} color={C.sub} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 이메일 · 기관 검색" style={{ flex: 1, border: "none", outline: "none", fontSize: 12.5, fontFamily: FONT, color: C.ink }} />
        </div>
        <button onClick={() => setAdd(true)} className="cursor-pointer flex items-center gap-1.5" style={{ border: "none", borderRadius: 10, padding: "9px 15px", background: C.primary, color: "#fff", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>
          <UserPlus size={14} /> 신규 사용자 추가
        </button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: COLS, fontSize: 10.5, padding: "0 6px 8px", borderBottom: `1px solid ${C.line}`, gap: 6 }}>
        <SortHead label="이름" k="name" sort={sort} setSort={setSort} />
        <SortHead label="이메일" k="email" sort={sort} setSort={setSort} />
        <SortHead label="기관" k="org" sort={sort} setSort={setSort} />
        <SortHead label="연락처" k="phone" sort={sort} setSort={setSort} />
        <SortHead label="역할" k="role" sort={sort} setSort={setSort} />
        <SortHead label="최근 로그인" k="last" sort={sort} setSort={setSort} />
        <span style={{ textAlign: "right", color: C.sub, fontWeight: 700 }}>상태</span>
      </div>
      {rows.map((u, i) => (
        <div key={u.id} className="grid items-center" style={{ gridTemplateColumns: COLS, gap: 6, padding: "10px 6px", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none", opacity: u.active ? 1 : 0.5 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{u.name}</span>
          <span style={{ fontSize: 11.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</span>
          <span style={{ fontSize: 12, color: C.ink }}>{u.org}</span>
          <span style={{ fontSize: 11.5, color: C.sub }}>{u.phone}</span>
          <span><RoleBadge role={u.role} small /></span>
          <span style={{ fontSize: 11.5, color: C.sub }}>{u.last}</span>
          <span style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: u.active ? C.low : C.sub }}>{u.active ? "활성" : "비활성"}</span>
        </div>
      ))}
      {add && (
        <Modal title="신규 사용자 추가" onClose={() => setAdd(false)}>
          <AddUserForm onCancel={() => setAdd(false)} onSubmit={(u) => { setUsers((us) => [...us, u]); setAdd(false); }} />
        </Modal>
      )}
    </div>
  );
}
function AddUserForm({ onCancel, onSubmit }) {
  const [f, setF] = useState({ name: "", email: "", org: "씨엔브이 안과", phone: "", role: "physician", active: true });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const ok = f.name && f.email;
  return (
    <div className="flex flex-col gap-3">
      <Field label="이메일" req><input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@clinic.co.kr" style={inpSm} /></Field>
      <div className="flex gap-2.5">
        <Field label="이름" req><input value={f.name} onChange={(e) => set("name", e.target.value)} style={inpSm} /></Field>
        <Field label="연락처"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} style={inpSm} /></Field>
      </div>
      <Field label="기관"><input value={f.org} onChange={(e) => set("org", e.target.value)} style={inpSm} /></Field>
      <Field label="역할" req>
        <div className="flex flex-col gap-2">
          {Object.values(ROLES).map((r) => (
            <div key={r.id} onClick={() => set("role", r.id)} className="cursor-pointer flex items-center gap-2.5"
              style={{ border: `1.5px solid ${f.role === r.id ? r.c : C.line}`, background: f.role === r.id ? r.c + "0F" : "#fff", borderRadius: 11, padding: "10px 12px" }}>
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${f.role === r.id ? r.c : C.line}` }}>{f.role === r.id && <span style={{ width: 8, height: 8, borderRadius: 99, background: r.c }} />}</span>
              <div className="flex-1"><div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{r.label}</div><div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{r.desc}</div></div>
            </div>
          ))}
        </div>
      </Field>
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => set("active", !f.active)}>
        <span className="flex items-center justify-center" style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${f.active ? C.primary : C.line}`, background: f.active ? C.primary : "#fff" }}>{f.active && <Check size={12} color="#fff" strokeWidth={3.5} />}</span>
        <span style={{ fontSize: 12.5, color: C.sub }}>계정을 활성 상태로 생성</span>
      </div>
      <div className="flex gap-2.5" style={{ marginTop: 2 }}>
        <button onClick={onCancel} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
        <button onClick={() => ok && onSubmit({ ...f, id: "U-" + Math.floor(Math.random() * 90 + 10), last: "-" })} disabled={!ok} className="cursor-pointer"
          style={{ flex: 2, border: "none", background: ok ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>추가</button>
      </div>
    </div>
  );
}

/* ---------- 장치 · 권한 ---------- */
function DevicesPage({ role, devices, setDevices, patients, toast }) {
  const [q, setQ] = useState("");
  const [filt, setFilt] = useState("all");
  const [sort, setSort] = useState({ k: "name", dir: "asc" });
  const [add, setAdd] = useState(false);
  const pName = (id) => (patients.find((x) => x.id === id) || {}).name || "-";

  const kpi = useMemo(() => {
    const home = devices.filter((d) => d.use === "home" && d.active);
    return {
      total: devices.filter((d) => d.active).length,
      free: home.filter((d) => d.owner === "기관" && !d.assignedTo).length,
      rent: home.filter((d) => d.owner === "기관" && d.assignedTo).length,
      overdue: home.filter((d) => deviceState(d).k === "overdue").length,
      owned: home.filter((d) => d.owner === "개인").length,
    };
  }, [devices]);

  const rows = useMemo(() => {
    let r = devices.filter((d) => {
      if (filt === "rental" && !(d.owner === "기관" && d.use === "home")) return false;
      if (filt === "owned" && d.owner !== "개인") return false;
      if (filt === "clinic" && d.use !== "clinic") return false;
      return !q || [d.name, d.serial, d.org, pName(d.assignedTo)].join(" ").toLowerCase().includes(q.toLowerCase());
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => {
      if (sort.k === "assignedTo") return pName(a.assignedTo).localeCompare(pName(b.assignedTo), "ko") * dir;
      if (sort.k === "state") return String(deviceState(a).label).localeCompare(String(deviceState(b).label), "ko") * dir;
      if (sort.k === "battery") return (a.battery - b.battery) * dir;
      return String(a[sort.k]).localeCompare(String(b[sort.k]), "ko") * dir;
    });
  }, [devices, q, filt, sort, patients]);

  const ret = (serial) => setDevices((ds) => ds.map((d) => (d.serial === serial ? { ...d, assignedTo: null, rentFrom: null, rentTo: null } : d)));
  const COLS = "1.5fr 0.95fr 1.35fr 0.95fr 1.3fr 1.15fr 0.85fr";

  return (
    <div style={{ padding: "16px 20px" }}>
      {/* KPI */}
      <div className="grid grid-cols-5" style={{ gap: 8, marginBottom: 14 }}>
        {[
          { l: "활성 장치", v: kpi.total, c: C.ink },
          { l: "대여 가능", v: kpi.free, c: C.low },
          { l: "대여 중", v: kpi.rent, c: C.primary },
          { l: "반납 연체", v: kpi.overdue, c: C.high },
          { l: "개인 소유 연동", v: kpi.owned, c: C.aqua },
        ].map((k) => (
          <div key={k.l} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>{k.l}</div>
            <div className="flex items-baseline gap-1"><span style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</span><span style={{ fontSize: 10, color: C.sub }}>대</span></div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2" style={{ width: 250, border: `1px solid ${C.line}`, borderRadius: 10, padding: "7px 11px", background: "#fff" }}>
            <Search size={14} color={C.sub} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="장치명 · 시리얼 · 환자 검색" style={{ flex: 1, border: "none", outline: "none", fontSize: 12.5, fontFamily: FONT, color: C.ink }} />
          </div>
          <div className="flex" style={{ gap: 4 }}>
            {[{ id: "all", t: "전체" }, { id: "rental", t: "병원 대여용" }, { id: "owned", t: "개인 소유" }, { id: "clinic", t: "원내용" }].map((f) => (
              <button key={f.id} onClick={() => setFilt(f.id)} className="cursor-pointer"
                style={{ border: `1px solid ${filt === f.id ? C.primary : C.line}`, background: filt === f.id ? C.primary : "#fff", color: filt === f.id ? "#fff" : C.sub, borderRadius: 999, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, fontFamily: FONT }}>{f.t}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setAdd(true)} className="cursor-pointer flex items-center gap-1.5" style={{ border: "none", borderRadius: 10, padding: "9px 15px", background: C.primary, color: "#fff", fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}><Plus size={14} /> 장치 등록</button>
      </div>

      {add && (
        <Modal title="장치 등록" onClose={() => setAdd(false)} wide>
          <AddDeviceForm devices={devices} onCancel={() => setAdd(false)}
            onSubmit={(d) => { setDevices((ds) => [...ds, d]); setAdd(false); toast && toast(`${d.name} 장치를 등록했습니다.`); }} />
        </Modal>
      )}

      <div className="grid" style={{ gridTemplateColumns: COLS, fontSize: 10.5, padding: "0 6px 8px", borderBottom: `1px solid ${C.line}`, gap: 6 }}>
        <SortHead label="장치명" k="name" sort={sort} setSort={setSort} />
        <SortHead label="소유 구분" k="owner" sort={sort} setSort={setSort} />
        <SortHead label="시리얼 번호" k="serial" sort={sort} setSort={setSort} />
        <SortHead label="사용 환자" k="assignedTo" sort={sort} setSort={setSort} />
        <SortHead label="대여 기간 · 연동일" k="rentTo" sort={sort} setSort={setSort} />
        <SortHead label="상태" k="state" sort={sort} setSort={setSort} />
        <SortHead label="배터리" k="battery" sort={sort} setSort={setSort} align="right" />
      </div>

      {rows.map((d, i) => {
        const st = deviceState(d);
        const canReturn = d.owner === "기관" && d.use === "home" && d.assignedTo && CAN[role].devices;
        return (
          <div key={d.serial} className="grid items-center" style={{ gridTemplateColumns: COLS, gap: 6, padding: "10px 6px", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none", opacity: d.active ? 1 : 0.5, background: st.k === "overdue" ? C.highSoft + "60" : "transparent" }}>
            <span className="flex items-center gap-1.5 min-w-0" style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>
              <Monitor size={13} color={d.owner === "개인" ? C.aqua : C.primary} className="flex-shrink-0" />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
            </span>
            <span><OwnerBadge owner={d.owner} small /></span>
            <span style={{ fontSize: 11, color: C.sub, fontFamily: "monospace" }}>{d.serial}</span>
            <span style={{ fontSize: 12, color: d.assignedTo ? C.ink : C.grey, fontWeight: d.assignedTo ? 700 : 400 }}>{d.assignedTo ? pName(d.assignedTo) : "—"}</span>
            <span style={{ fontSize: 10.5, color: C.sub }}>
              {d.owner === "개인" ? `연동 ${d.linkedAt}` : d.rentFrom ? `${d.rentFrom.slice(5)} ~ ${d.rentTo.slice(5)}` : "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <DevStateChip st={st} small />
              {canReturn && <Undo2 size={13} color={C.grey} className="cursor-pointer" onClick={() => ret(d.serial)} />}
            </span>
            <span className="flex items-center justify-end gap-1" style={{ fontSize: 11, color: d.battery <= 20 ? C.high : C.sub, fontWeight: d.battery <= 20 ? 700 : 400 }}>
              {d.battery <= 20 && d.active && <BatteryLow size={12} />}{d.battery}% · {d.fw}
            </span>
          </div>
        );
      })}
      {rows.length === 0 && <div style={{ padding: "36px 0", textAlign: "center", fontSize: 12.5, color: C.sub }}>조건에 맞는 장치가 없습니다.</div>}

      <div style={{ fontSize: 10.5, color: C.sub, marginTop: 12, lineHeight: 1.55, background: C.bg, borderRadius: 10, padding: "9px 11px" }}>
        <b style={{ color: C.primary }}>소유 구분:</b> <b>병원 대여</b>는 기관 자산을 환자에게 기간을 정해 빌려주는 형태로 반납 관리가 필요합니다. <b>개인 소유</b>는 환자가 직접 구입한 기기를 병원 계정에 연동한 형태로, 반납 개념 없이 연동 해제만 가능합니다.
      </div>
    </div>
  );
}
function PermissionPage({ role }) {
  const cols = ["환자", "의사", "교육 담당자", "관리자"];
  const colC = [C.sub, ROLES.physician.c, ROLES.trainer.c, ROLES.admin.c];
  return (
    <div style={{ padding: "16px 20px" }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
        <Shield size={16} color={C.primary} /><span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>역할별 권한 매트릭스</span>
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 14 }}>
        현재 로그인 역할: <RoleBadge role={role} small /> · 역할은 관리자만 변경할 수 있습니다.
      </div>
      <div className="grid" style={{ gridTemplateColumns: "2.4fr 0.7fr 0.7fr 0.9fr 0.7fr", background: C.primary, color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px", fontSize: 11.5, fontWeight: 800, gap: 6 }}>
        <span>기능</span>{cols.map((c) => <span key={c} style={{ textAlign: "center" }}>{c}</span>)}
      </div>
      {PERMISSIONS.map((r, i) => (
        <div key={r.t} className="grid items-center" style={{ gridTemplateColumns: "2.4fr 0.7fr 0.7fr 0.9fr 0.7fr", gap: 6, padding: "9px 14px", borderBottom: `1px solid ${C.line}`, background: i % 2 ? C.bg : "#fff" }}>
          <span style={{ fontSize: 12.5, color: C.ink }}>{r.t}</span>
          {r.p.map((v, k) => (
            <span key={k} style={{ textAlign: "center" }}>
              {v ? <Check size={15} color={colC[k]} strokeWidth={3} /> : <span style={{ color: C.line }}>—</span>}
            </span>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-3" style={{ gap: 12, marginTop: 16 }}>
        {Object.values(ROLES).map((r) => (
          <Card key={r.id} style={{ padding: 14, borderColor: r.c + "40" }}>
            <RoleBadge role={r.id} />
            <div style={{ fontSize: 12, color: C.sub, marginTop: 7, lineHeight: 1.5 }}>{r.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- 의료진 웹 로그인 ---------- */
function ClinicianLogin({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [keep, setKeep] = useState(true);
  const [err, setErr] = useState("");
  const demo = users.filter((u) => u.active);

  const submit = () => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) { setErr("등록되지 않은 이메일입니다. 기관 관리자에게 계정 생성을 요청하세요."); return; }
    if (!u.active) { setErr("비활성 계정입니다. 기관 관리자에게 문의하세요."); return; }
    if (!pw) { setErr("비밀번호를 입력하세요."); return; }
    onLogin(u);
  };

  return (
    <div className="flex" style={{ width: 900, maxWidth: "100%", background: C.card, borderRadius: 22, border: `1px solid ${C.line}`, overflow: "hidden", boxShadow: "0 30px 70px -35px rgba(8,52,62,.35)" }}>
      {/* 브랜드 패널 */}
      <div className="flex flex-col justify-between" style={{ width: 340, background: C.primaryDeep, padding: "30px 28px", flexShrink: 0 }}>
        <div>
          <div className="flex items-center gap-2.5" style={{ marginBottom: 22 }}>
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,.14)" }}><Stethoscope size={19} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>안압케어 CLINIC</div>
              <div style={{ fontSize: 10, color: "#9FC4C6", letterSpacing: "0.06em" }}>C&V TECH · CVT200</div>
            </div>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", lineHeight: 1.45, marginBottom: 10 }}>환자의 하루 안압을<br />진료실 밖에서도 봅니다</div>
          <div style={{ fontSize: 12, color: "#9FC4C6", lineHeight: 1.6 }}>기관 계정으로 로그인하면 담당 환자의 실시간 측정 기록과 추세 분석을 확인할 수 있습니다.</div>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { icon: Users, t: "환자 고객 DB · 정렬 · 검색" },
            { icon: Activity, t: "Chart · Scatter · Diurnal 분석" },
            { icon: Shield, t: "역할별 권한 분리 관리" },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-2" style={{ color: "#9FC4C6", fontSize: 11.5 }}><r.icon size={13} /> {r.t}</div>
          ))}
        </div>
      </div>

      {/* 폼 */}
      <div style={{ flex: 1, padding: "34px 36px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>로그인</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4, marginBottom: 20 }}>기관에서 발급받은 계정으로 접속하세요.</div>

        <div className="flex flex-col gap-3">
          <Field label="이메일">
            <input value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="name@clinic.co.kr" style={inp} />
          </Field>
          <Field label="비밀번호">
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="비밀번호" style={{ ...inp, paddingRight: 40 }} />
              <span className="cursor-pointer" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: 11, color: C.sub }}>{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</span>
            </div>
          </Field>

          {err && (
            <div className="flex items-center gap-2" style={{ background: C.highSoft, borderRadius: 10, padding: "9px 12px", fontSize: 11.5, color: C.high, fontWeight: 700 }}>
              <AlertTriangle size={14} /> {err}
            </div>
          )}

          <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 12, color: C.sub }}>
              <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> 로그인 상태 유지
            </label>
            <span className="cursor-pointer" style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>비밀번호 재설정</span>
          </div>

          <button onClick={submit} className="cursor-pointer flex items-center justify-center gap-2"
            style={{ border: "none", borderRadius: 12, padding: "13px 0", background: C.primary, color: "#fff", fontSize: 14.5, fontWeight: 800, fontFamily: FONT, marginTop: 6 }}>
            <LogIn size={17} /> 로그인
          </button>
        </div>

        <div className="flex items-center gap-2" style={{ margin: "22px 0 12px" }}>
          <div style={{ flex: 1, height: 1, background: C.line }} />
          <span style={{ fontSize: 10.5, color: C.sub, fontWeight: 700 }}>데모 계정으로 바로 보기</span>
          <div style={{ flex: 1, height: 1, background: C.line }} />
        </div>
        <div className="flex flex-col gap-2">
          {demo.map((u) => (
            <div key={u.id} onClick={() => onLogin(u)} className="cursor-pointer flex items-center gap-2.5"
              style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "9px 12px" }}>
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, borderRadius: 99, background: ROLES[u.role].c, color: "#fff", fontSize: 11, fontWeight: 800 }}>{u.name.slice(0, 1)}</span>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.ink }}>{u.name}</div>
                <div style={{ fontSize: 10.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
              </div>
              <RoleBadge role={u.role} small />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.sub, marginTop: 14, lineHeight: 1.5 }}>
          계정이 없으면 기관 관리자가 <b>사용자 → 신규 사용자 추가</b>에서 생성해야 합니다. 의사·교육 담당자는 스스로 가입할 수 없습니다.
        </div>
      </div>
    </div>
  );
}

/* ---------- 내 프로필 · 비밀번호 변경 ---------- */
function ProfileModal({ me, onClose, onSave }) {
  const [f, setF] = useState({ name: me.name, phone: me.phone, org: me.org, email: me.email });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  return (
    <Modal title="내 프로필" onClose={onClose}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <span className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 99, background: ROLES[me.role].c, color: "#fff", fontSize: 19, fontWeight: 800 }}>{me.name.slice(0, 1)}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{me.name}</div>
          <div className="flex items-center gap-2" style={{ marginTop: 3 }}><RoleBadge role={me.role} small /><span style={{ fontSize: 11, color: C.sub }}>최근 로그인 {me.last}</span></div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Field label="이름"><input value={f.name} onChange={(e) => set("name", e.target.value)} style={inpSm} /></Field>
        <Field label="이메일 (로그인 ID)"><input value={f.email} disabled style={{ ...inpSm, background: C.bg, color: C.sub }} /></Field>
        <div className="flex gap-2.5">
          <Field label="연락처"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} style={inpSm} /></Field>
          <Field label="기관"><input value={f.org} onChange={(e) => set("org", e.target.value)} style={inpSm} /></Field>
        </div>
        <Field label="역할">
          <div style={{ ...inpSm, background: C.bg, color: C.sub }}>{ROLES[me.role].label} — {ROLES[me.role].desc}</div>
        </Field>
        <div style={{ fontSize: 10.5, color: C.sub, lineHeight: 1.5 }}>이메일과 역할은 기관 관리자만 변경할 수 있습니다.</div>
        <div className="flex gap-2.5" style={{ marginTop: 2 }}>
          <button onClick={onClose} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
          <button onClick={() => onSave(f)} className="cursor-pointer" style={{ flex: 2, border: "none", background: C.primary, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>저장</button>
        </div>
      </div>
    </Modal>
  );
}
function PasswordModal({ onClose }) {
  const [cur, setCur] = useState(""); const [n1, setN1] = useState(""); const [n2, setN2] = useState("");
  const [done, setDone] = useState(false);
  const strong = n1.length >= 8 && /[A-Za-z]/.test(n1) && /\d/.test(n1);
  const ok = cur && strong && n1 === n2;
  const rules = [
    { t: "8자 이상", ok: n1.length >= 8 },
    { t: "영문 포함", ok: /[A-Za-z]/.test(n1) },
    { t: "숫자 포함", ok: /\d/.test(n1) },
    { t: "새 비밀번호 일치", ok: !!n1 && n1 === n2 },
  ];
  return (
    <Modal title="비밀번호 변경" onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center" style={{ padding: "18px 0 8px" }}>
          <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 999, background: C.lowSoft, color: C.low, marginBottom: 12 }}><Check size={26} strokeWidth={3} /></div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>비밀번호가 변경되었습니다</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4, textAlign: "center" }}>다음 로그인부터 새 비밀번호를 사용하세요.</div>
          <button onClick={onClose} className="cursor-pointer" style={{ width: "100%", border: "none", background: C.primary, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT, marginTop: 18 }}>확인</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="현재 비밀번호" req><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} style={inpSm} /></Field>
          <Field label="새 비밀번호" req><input type="password" value={n1} onChange={(e) => setN1(e.target.value)} style={inpSm} /></Field>
          <Field label="새 비밀번호 확인" req><input type="password" value={n2} onChange={(e) => setN2(e.target.value)} style={inpSm} /></Field>
          <div className="grid grid-cols-2" style={{ gap: 6 }}>
            {rules.map((r) => (
              <div key={r.t} className="flex items-center gap-1.5" style={{ fontSize: 11, color: r.ok ? C.low : C.sub }}>
                <span className="flex items-center justify-center" style={{ width: 15, height: 15, borderRadius: 99, background: r.ok ? C.lowSoft : "#EEF2F1", color: r.ok ? C.low : C.grey }}>{r.ok ? <Check size={10} strokeWidth={3.5} /> : <X size={10} strokeWidth={3} />}</span>
                {r.t}
              </div>
            ))}
          </div>
          <div className="flex gap-2.5" style={{ marginTop: 2 }}>
            <button onClick={onClose} className="cursor-pointer" style={{ flex: 1, border: `1.5px solid ${C.line}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, fontFamily: FONT }}>취소</button>
            <button onClick={() => ok && setDone(true)} disabled={!ok} className="cursor-pointer" style={{ flex: 2, border: "none", background: ok ? C.primary : C.mintDeep, color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: FONT }}>변경</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ClinicianWeb() {
  const [session, setSession] = useState(null);   // 로그인한 직원
  const [menu, setMenu] = useState(false);        // 우상단 드롭다운
  const [modal, setModal] = useState(null);       // "profile" | "password"
  const [nav, setNav] = useState("patients");
  const [patients, setPatients] = useState(PATIENTS_DB);
  const [users, setUsers] = useState(USERS_DB);
  const [devices, setDevices] = useState(DEVICES_INIT);
  const [readAlerts, setReadAlerts] = useState([]);
  const [sentLog, setSentLog] = useState({ "CVT2H-2041CC03": ["06-30 09:00", "07-01 09:00", "07-02 09:00"] });
  const [cfg, setCfg] = useState(NOTIFY_CFG_INIT);
  const [audit, setAudit] = useState(AUDIT_INIT);
  const [lastRun, setLastRun] = useState("2026-07-03 09:00");
  const [lastResult, setLastResult] = useState(null);
  const [toast, setToast] = useState("");
  const [open, setOpen] = useState(null);

  if (!session) return <ClinicianLogin users={users} onLogin={(u) => { setSession(u); setNav("patients"); setOpen(null); }} />;

  const me = session;
  const role = me.role;
  const logout = () => { setSession(null); setMenu(false); setModal(null); };

  /* --- 반납 알림 자동화 --- */
  const alerts = rentAlertList(devices, patients);
  const blockedCnt = alerts.filter((x) => x.a.blocked).length;
  const flashToast = (t) => { setToast(t); setTimeout(() => setToast(""), 2800); };
  const stampNow = () => { const n = new Date(); return `${isoDate(n)} ${_pad(n.getHours())}:${_pad(n.getMinutes())}`; };
  /* 발송 1건 → 감사 로그 적재 (자동/수동 공통) */
  const writeLog = (dev, a, mode, actor) => {
    const chs = CHANNELS.filter((c) => cfg.ch[a.key] && cfg.ch[a.key][c.id]).map((c) => c.id);
    if (!chs.length) return null;
    const pt = patients.find((x) => x.id === dev.assignedTo);
    const entry = {
      id: "L-" + Math.floor(Math.random() * 900 + 100),
      at: stampNow(), pid: dev.assignedTo, name: pt ? pt.name : "-", serial: dev.serial,
      level: a.key, chs, mode, result: "성공", actor,
      detail: mode === "자동" ? "스케줄러 배치 발송" : "담당자 수동 발송",
    };
    setAudit((l) => [entry, ...l]);
    const st = `${_pad(new Date().getMonth() + 1)}-${_pad(new Date().getDate())} ${_pad(new Date().getHours())}:${_pad(new Date().getMinutes())}`;
    setSentLog((l) => ({ ...l, [dev.serial]: [...(l[dev.serial] || []), st] }));
    return entry;
  };
  const sendNotice = (serial, a) => {
    const dev = devices.find((d) => d.serial === serial);
    if (!dev) return;
    const e = writeLog(dev, a, "수동", me.name);
    const nm = (patients.find((x) => x.id === dev.assignedTo) || {}).name || "환자";
    flashToast(e ? `${nm}님에게 ${chLabel(cfg, a.key)} 알림을 발송했습니다 · ${a.title}`
                 : `${a.title} 단계에 설정된 발송 채널이 없습니다.`);
  };
  /* 배치 실행: 대상 전체에 단계별 채널로 일괄 발송 */
  const runBatch = () => {
    let n = 0; const names = [];
    alerts.forEach((x) => { if (writeLog(x.dev, x.a, "자동", "스케줄러")) { n += 1; if (x.pt) names.push(`${x.pt.name}(${x.a.title})`); } });
    const at = stampNow();
    setLastRun(at); setReadAlerts([]);
    setLastResult({ sent: n, at, detail: n ? names.join(" · ") : "설정된 발송 채널이 없어 실제 발송은 없었습니다." });
    flashToast(n ? `배치 실행 완료 · ${n}건 발송, 감사 로그에 기록했습니다.` : "발송 대상이 없습니다.");
  };
  const updatePatient = (pid, patch) => {
    setPatients((ps) => ps.map((x) => (x.id === pid ? { ...x, ...patch } : x)));
    setOpen((o) => (o && o.id === pid ? { ...o, ...patch } : o));
  };
  const extendRent = (serial, days) => {
    setDevices((ds) => ds.map((d) => {
      if (d.serial !== serial) return d;
      const nd = new Date(d.rentTo); nd.setDate(nd.getDate() + days);
      return { ...d, rentTo: isoDate(nd) };
    }));
    setReadAlerts((r) => r.filter((x) => x !== serial));
    flashToast(`반납 예정일을 ${days}일 연장했습니다.`);
  };
  const returnDev = (serial) => {
    setDevices((ds) => ds.map((d) => (d.serial === serial ? { ...d, assignedTo: null, rentFrom: null, rentTo: null } : d)));
    flashToast("반납 처리되었습니다. 측정 데이터 수신이 정상화됩니다.");
  };
  const NAVS = [
    { id: "patients", t: "환자 (고객 DB)", icon: Users },
    { id: "devices", t: "장치", icon: Monitor },
    { id: "notif", t: "알림 자동화", icon: BellRing },
    { id: "users", t: "사용자", icon: UserCog, adminOnly: true },
    { id: "perm", t: "권한", icon: Shield },
  ];

  return (
    <div style={{ width: 900, maxWidth: "100%", background: C.card, borderRadius: 22, border: `1px solid ${C.line}`, overflow: "hidden", position: "relative", boxShadow: "0 30px 70px -35px rgba(8,52,62,.35)" }}>
      {/* 상단 바 */}
      <div className="flex items-center justify-between" style={{ padding: "12px 20px", background: C.primaryDeep }}>
        <div className="flex items-center gap-2.5">
          <Stethoscope size={19} color="#fff" />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>안압케어 CLINIC</span>
          <span style={{ fontSize: 11.5, color: "#9FC4C6" }}>안압 모니터링 · 고객 관리</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11.5, color: "#9FC4C6" }}>{me.org}</span>
          <NotifCenter alerts={alerts} read={readAlerts} setRead={setReadAlerts} sent={sentLog}
            onSend={sendNotice} onExtend={extendRent} onReturn={returnDev} onBatch={CAN[role].runBatch ? runBatch : null}
            onOpenPatient={(pt) => { if (pt) { setNav("patients"); setOpen(pt); } }} />
          <div style={{ position: "relative" }}>
            <div onClick={() => setMenu(!menu)} className="cursor-pointer flex items-center gap-2"
              style={{ color: "#fff", background: menu ? "rgba(255,255,255,.14)" : "transparent", borderRadius: 8, padding: "5px 9px" }}>
              <span className="flex items-center justify-center" style={{ width: 26, height: 26, borderRadius: 99, background: ROLES[role].c, fontSize: 11, fontWeight: 800 }}>{me.name.slice(0, 1)}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{me.name}</span>
              <ChevronDown size={13} style={{ transform: menu ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </div>

            {menu && (
              <>
                <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 250, background: "#fff", borderRadius: 14, border: `1px solid ${C.line}`, boxShadow: "0 18px 40px -12px rgba(8,52,62,.35)", zIndex: 31, overflow: "hidden" }}>
                  <div style={{ padding: "14px 15px", borderBottom: `1px solid ${C.line}`, background: C.bg }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 99, background: ROLES[role].c, color: "#fff", fontSize: 15, fontWeight: 800 }}>{me.name.slice(0, 1)}</span>
                      <div className="min-w-0">
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{me.name}</div>
                        <div style={{ fontSize: 10.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.email}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}><RoleBadge role={role} small /></div>
                  </div>

                  {[
                    { id: "profile", t: "프로필", d: "이름·연락처·기관 정보", icon: User },
                    { id: "password", t: "비밀번호 변경", d: "현재 비밀번호 확인 후 변경", icon: KeyRound },
                  ].map((m) => (
                    <div key={m.id} onClick={() => { setModal(m.id); setMenu(false); }} className="cursor-pointer flex items-center gap-2.5"
                      style={{ padding: "11px 15px", borderBottom: `1px solid ${C.line}` }}>
                      <m.icon size={15} color={C.primary} className="flex-shrink-0" />
                      <div className="flex-1"><div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{m.t}</div><div style={{ fontSize: 10.5, color: C.sub, marginTop: 1 }}>{m.d}</div></div>
                      <ChevronRight size={13} color={C.grey} />
                    </div>
                  ))}

                  <div onClick={logout} className="cursor-pointer flex items-center gap-2.5" style={{ padding: "11px 15px" }}>
                    <LogOut size={15} color={C.high} className="flex-shrink-0" />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.high }}>로그아웃</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 내비게이션 */}
      <div className="flex items-center" style={{ borderBottom: `1px solid ${C.line}`, background: C.bg, padding: "0 12px" }}>
        {NAVS.map((n) => {
          const locked = n.adminOnly && !CAN[role].users;
          const on = nav === n.id;
          return (
            <button key={n.id} onClick={() => { setNav(n.id); setOpen(null); }} className="cursor-pointer flex items-center gap-1.5"
              style={{ border: "none", background: "transparent", padding: "12px 16px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT, color: on ? C.primary : locked ? C.grey : C.sub, borderBottom: `2px solid ${on ? C.primary : "transparent"}` }}>
              <n.icon size={14} /> {n.t} {locked && <Lock size={11} />}
              {n.id === "devices" && devices.filter((d) => deviceState(d).k === "overdue").length > 0 && (
                <span className="flex items-center justify-center" style={{ minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: C.high, color: "#fff", fontSize: 9.5, fontWeight: 800 }}>{devices.filter((d) => deviceState(d).k === "overdue").length}</span>
              )}
              {n.id === "notif" && alerts.length > 0 && (
                <span className="flex items-center justify-center" style={{ minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: C.mid, color: "#fff", fontSize: 9.5, fontWeight: 800 }}>{alerts.length}</span>
              )}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", fontSize: 11.5, color: C.sub, paddingRight: 8 }}>동기화 · 방금 전</div>
      </div>

      {nav === "patients" && (open
        ? <PatientDetail p={open} role={role} onBack={() => setOpen(null)} devices={devices} setDevices={setDevices} patients={patients} sent={sentLog} onSend={sendNotice} onUpdatePatient={updatePatient} toast={flashToast} />
        : <PatientsPage role={role} patients={patients} setPatients={setPatients} onOpen={setOpen} devices={devices} setDevices={setDevices} alerts={alerts} />)}
      {nav === "devices" && <DevicesPage role={role} devices={devices} setDevices={setDevices} patients={patients} toast={flashToast} />}
      {nav === "notif" && <NotifyPage role={role} cfg={cfg} setCfg={setCfg} log={audit} alerts={alerts} lastRun={lastRun} lastResult={lastResult} onRunBatch={runBatch} />}
      {nav === "users" && <UsersPage role={role} users={users} setUsers={setUsers} />}
      {nav === "perm" && <PermissionPage role={role} />}

      <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.line}`, fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
        <b style={{ color: C.primary }}>데이터 출처:</b> CVT200 실시간 다회 측정(좌·우안 개별 기록) · 환자 수동 입력. 개인정보는 국가별 규정(국내 개인정보보호법·의료법, EU GDPR, 미국 HIPAA, 중국 PIPL)에 따라 분리 보관·암호화됩니다.
      </div>

      {modal === "profile" && (
        <ProfileModal me={me} onClose={() => setModal(null)}
          onSave={(f) => {
            const next = { ...me, ...f };
            setSession(next);
            setUsers((us) => us.map((u) => (u.id === me.id ? next : u)));
            setModal(null);
          }} />
      )}
      {modal === "password" && <PasswordModal onClose={() => setModal(null)} />}

      {toast && (
        <div className="flex items-center gap-2" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 70, background: C.ink, color: "#fff", borderRadius: 12, padding: "11px 18px", fontSize: 12.5, fontWeight: 700, boxShadow: "0 12px 30px -8px rgba(8,52,62,.5)", zIndex: 50 }}>
          <PackageCheck size={15} color={C.mintDeep} /> {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */
export default function App() {
  const [view, setView] = useState("patient");
  return (
    <div style={{ fontFamily: FONT, background: "#E9F0EF", minHeight: "100vh", padding: "28px 16px 48px" }}>
      <style>{`.animate-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div className="flex flex-col items-center" style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", color: C.primary, fontWeight: 800 }}>C&V TECH · CVT200 COMPANION</div>
          <h1 style={{ fontSize: 25, fontWeight: 800, color: C.ink, margin: "5px 0 3px" }}>안압케어 IOP v2 — 안압관리 전용</h1>
          <div style={{ fontSize: 13, color: C.sub, textAlign: "center", maxWidth: 620, lineHeight: 1.5 }}>
            기기 신호 기반 좌·우안 자동 측정, 그래프 형식 선택(Chart · Scatter · Diurnal), 역할별 권한과 고객 DB, 기기 대여·반납 알림 자동화를 갖춘 안압관리 단독 버전입니다.
          </div>
          <div className="flex items-center" style={{ marginTop: 16, background: "#fff", borderRadius: 999, padding: 4, border: `1px solid ${C.line}` }}>
            {[{ id: "patient", label: "환자 앱", icon: Smartphone }, { id: "clinician", label: "의료진 웹", icon: Stethoscope }].map((v) => {
              const on = view === v.id;
              return <button key={v.id} onClick={() => setView(v.id)} className="flex items-center gap-2 cursor-pointer" style={{ border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 13.5, fontWeight: 700, fontFamily: FONT, background: on ? C.primary : "transparent", color: on ? "#fff" : C.sub }}><v.icon size={16} /> {v.label}</button>;
            })}
          </div>
        </div>

        <div className="flex justify-center">{view === "patient" ? <PatientApp /> : <ClinicianWeb />}</div>

        <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginTop: 26, fontSize: 12, color: C.sub }}>
          <Flow icon={Eye} t="좌·우안 자동 측정" /><Send size={13} color={C.mintDeep} />
          <Flow icon={Activity} t="Chart · Scatter · Diurnal" /><Send size={13} color={C.mintDeep} />
          <Flow icon={Users} t="고객 DB · 권한 관리" /><Send size={13} color={C.mintDeep} />
          <Flow icon={Stethoscope} t="의료진 웹" strong />
        </div>
      </div>
    </div>
  );
}
function Flow({ icon: Ic, t, strong }) {
  return <span className="inline-flex items-center gap-1.5" style={{ padding: "5px 11px", borderRadius: 999, background: strong ? C.primary : "#fff", color: strong ? "#fff" : C.ink, border: `1px solid ${strong ? C.primary : C.line}`, fontWeight: 600, fontSize: 12 }}><Ic size={13} /> {t}</span>;
}
