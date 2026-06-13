"use client";

import { useState } from "react";
import { Camera, Loader2, AlertTriangle, Check } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Field,
  TextInput,
  Select,
} from "@/components/ui/primitives";
import { EXPENSE_CATEGORIES } from "@/lib/data";
import { BUSINESS_ID } from "@/lib/mock-data";
import { now, daysFromToday } from "@/lib/clock";

interface OcrResult {
  /** Mock OCR returns a free-text merchant string (a human-readable receipt name). */
  merchant: string;
  date: string;
  amount: number;
  tax: number;
  category: string;
  confidence: { merchant: number; amount: number; tax: number };
}

const LOW_CONFIDENCE = 0.7;

export default function CapturePage() {
  const { t, formatDate } = useI18n();
  const { toast } = useToast();
  const business = useAppStore((s) => s.business);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);

  const runDemo = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const r: OcrResult = {
        // Mock receipt vendor name — acceptable free text for a simulated scan.
        merchant: "Green Farm Wholesale",
        date: daysFromToday(0),
        amount: 642.5,
        tax: 38.55,
        category: "raw_materials",
        confidence: { merchant: 0.93, amount: 0.62, tax: 0.48 },
      };
      setResult(r);
      setMerchant(r.merchant);
      setAmount(String(r.amount));
      setTax(String(r.tax));
      setCategory(r.category);
      setScanning(false);
    }, 1400);
  };

  const lowAmount = !!result && result.confidence.amount < LOW_CONFIDENCE;
  const lowTax = !!result && result.confidence.tax < LOW_CONFIDENCE;
  const lowConf = lowAmount || lowTax;

  const save = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    addTransaction({
      businessId: BUSINESS_ID,
      type: "expense",
      amount: value,
      currency: business?.currency ?? "USD",
      category,
      // A receipt's merchant line is human-readable text → store as raw.
      descriptionRaw: merchant.trim() || undefined,
      paymentMethod: "card",
      // The new ledger entry is created "now" (real or demo anchor); never hardcoded.
      occurredAt: result?.date ?? now().toISOString(),
      source: "receipt",
      confidence: result?.confidence.amount,
    });
    setResult(null);
    setAmount("");
    setTax("");
    setMerchant("");
    toast(t("capture.toastSaved"));
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("capture.title")} subtitle={t("capture.subtitle")} />

      <Card className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-ink/15 bg-white/60 py-10 text-center shadow-none">
        {scanning ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <p className="text-sm text-ink/60">{t("capture.scanning")}</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Camera className="h-7 w-7 text-accent" />
            </div>
            <p className="text-sm text-ink/60">{t("capture.uploadHint")}</p>
            <Button onClick={runDemo}>{t("capture.demoCta")}</Button>
          </>
        )}
      </Card>

      {result && (
        <Card className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{t("capture.result")}</h2>
            <Badge tone="neutral">{t("common.mock")}</Badge>
          </div>

          {lowConf && (
            <div className="flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t("capture.lowConfidenceWarning")}
            </div>
          )}

          <Field label={t("capture.merchant")}>
            <TextInput value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          </Field>

          <div className="text-xs text-ink/50">
            {t("common.date")}: {formatDate(result.date)}
          </div>

          <Field
            label={`${t("common.amount")} (${Math.round(result.confidence.amount * 100)}% ${t("capture.confidence")})`}
          >
            <TextInput
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={lowAmount ? "border-warning ring-2 ring-warning/20" : ""}
            />
            {lowAmount && (
              <span className="mt-1 block text-xs text-warning">
                {t("capture.fieldLowConfidence")}
              </span>
            )}
          </Field>

          <Field
            label={`${t("capture.tax")} (${Math.round(result.confidence.tax * 100)}% ${t("capture.confidence")})`}
          >
            <TextInput
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className={lowTax ? "border-warning ring-2 ring-warning/20" : ""}
            />
            {lowTax && (
              <span className="mt-1 block text-xs text-warning">
                {t("capture.fieldLowConfidence")}
              </span>
            )}
          </Field>

          <Field label={t("common.category")}>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`ledger.expenseCategory.${c}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Button className="w-full" onClick={save}>
            <Check className="h-4 w-4" />
            {t("capture.confirmSave")}
          </Button>
        </Card>
      )}
    </div>
  );
}
