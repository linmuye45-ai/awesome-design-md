import type { AiIntent } from "../types";

export type { AiIntent };

interface IntentRule {
  intent: AiIntent;
  patterns: RegExp[];
}

/**
 * Lightweight keyword/regex intent router. In production this would be replaced
 * by the LLM's own tool-selection, but the contract (text -> intent) stays.
 * Patterns cover several languages so the demo feels responsive everywhere.
 */
const RULES: IntentRule[] = [
  {
    intent: "cashflow_forecast",
    patterns: [
      /cash\s?flow|payroll|afford|next week|safety/i,
      /现金|工资|发得起|下周|安全线/,
      /キャッシュ|給料|来週/,
      /현금|급여|다음 ?주/,
      /flujo|nómina|próxima semana/i,
      /caixa|folha|semana que vem/i,
      /arus kas|gaji|minggu depan/i,
      /กระแสเงิน|เงินเดือน|สัปดาห์หน้า/,
      /dòng tiền|lương|tuần sau/i,
      /تدفق|رواتب|الأسبوع المقبل/,
    ],
  },
  {
    intent: "customer_query",
    patterns: [
      /customer|churn|leav(e|ing)|loyal/i,
      /客户|流失|常客/,
      /顧客|離反/,
      /고객|이탈/,
      /cliente|se va|fidel/i,
      /pelanggan|pergi/i,
      /ลูกค้า|หาย/,
      /khách hàng|rời/i,
      /عملاء|عميل|مغادر/,
    ],
  },
  {
    intent: "employee_query",
    patterns: [
      /staff|schedule|shift|employee|how many people/i,
      /员工|排班|上班|几个人/,
      /従業員|シフト|スタッフ/,
      /직원|근무|배치/,
      /personal|turno|programo/i,
      /escala|funcionário/i,
      /jadwal|karyawan/i,
      /พนักงาน|จัดคน/,
      /nhân viên|xếp/i,
      /موظف|جدول/,
    ],
  },
  {
    intent: "draft_message",
    patterns: [
      /write|draft|message|reminder|reply/i,
      /帮我写|催款消息|草稿/,
      /書い|メッセージ/,
      /작성|메시지/,
      /escrib|recordatorio|mensaje/i,
      /escrev|mensagem|cobran/i,
      /tulis|pesan/i,
      /เขียน|ข้อความ/,
      /viết|tin nhắn/i,
      /اكتب|رسالة/,
    ],
  },
  {
    intent: "report_generation",
    patterns: [
      /report|monthly review|diagnos/i,
      /报告|复盘|诊断/,
      /レポート|月次/,
      /리포트|보고/,
      /reporte|informe/i,
      /relatório/i,
      /laporan/i,
      /รายงาน/,
      /báo cáo/i,
      /تقرير/,
    ],
  },
  {
    intent: "peer_benchmark",
    patterns: [
      /peer|benchmark|industry|compare|margin/i,
      /同行|对标|行业|毛利/,
      /同業|業界/,
      /동종|업계|마진/,
      /sector|margen|comparar/i,
      /setor|margem/i,
      /industri|margin/i,
      /อุตสาหกรรม/,
      /ngành|biên lợi/i,
      /قطاع|هامش/,
    ],
  },
  {
    intent: "compliance_question",
    patterns: [
      /tax|legal|contract|loan|financ/i,
      /税|法律|合同|融资/,
      /税金|法律|融資/,
      /세금|법|대출/,
      /impuesto|legal|préstamo/i,
      /imposto|jurídic|empréstimo/i,
      /pajak|hukum|pinjaman/i,
      /ภาษี|กฎหมาย|กู้/,
      /thuế|pháp lý|vay/i,
      /ضريبة|قانون|قرض/,
    ],
  },
  {
    intent: "finance_query",
    patterns: [
      /revenue|profit|made|earn|expense|spend|income/i,
      /收|赚|利润|花|支出|收入/,
      /売|利益|稼|支出/,
      /벌|이익|매출|지출/,
      /gan|utilidad|ingres|gast/i,
      /fatur|lucro|despesa|ganhei/i,
      /pendapatan|laba|untung/i,
      /รายได้|กำไร|ได้เงิน/,
      /thu|lợi nhuận|chi/i,
      /ربح|إيراد|مصروف/,
    ],
  },
];

export function routeIntent(text: string): AiIntent {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.intent;
  }
  return "unknown";
}
