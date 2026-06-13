"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { NumericText } from "@/components/NumericText";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Modal,
  Field,
  TextInput,
  Select,
  EmptyState,
} from "@/components/ui/primitives";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/data";
import { now } from "@/lib/clock";
import type { Transaction, TransactionType, PaymentMethod } from "@/lib/types";

type Tab = "income" | "expense" | "receivables" | "payables";

export default function LedgerPage() {
  const { t, formatCurrency, formatDate } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  const business = useAppStore((s) => s.business);
  const transactions = useAppStore((s) => s.transactions);
  const receivables = useAppStore((s) => s.receivables);
  const payables = useAppStore((s) => s.payables);
  const customers = useAppStore((s) => s.customers);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const setReceivableStatus = useAppStore((s) => s.setReceivableStatus);
  const setPayableStatus = useAppStore((s) => s.setPayableStatus);

  const [tab, setTab] = useState<Tab>("income");
  const [modalOpen, setModalOpen] = useState(false);

  const tabs: Tab[] = ["income", "expense", "receivables", "payables"];

  const income = useMemo(() => transactions.filter((x) => x.type === "income"), [transactions]);
  const expense = useMemo(() => transactions.filter((x) => x.type === "expense"), [transactions]);

  const catLabel = (type: TransactionType, cat: string) =>
    type === "income" ? t(`ledger.incomeCategory.${cat}`) : t(`ledger.expenseCategory.${cat}`);

  // Customer display name comes from an i18n key (no free-text customer names).
  const custName = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? t(c.nameKey) : id;
  };

  // Transaction description: a localized key for mock/system rows, raw text if a
  // human typed it, otherwise a category-derived fallback label.
  const txLabel = (tx: Transaction) => {
    if (tx.descriptionRaw) return tx.descriptionRaw;
    if (tx.descriptionKey) return t(tx.descriptionKey, tx.descriptionParams);
    return t(`ledger.${tx.type}`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between">
        <PageHeader title={t("ledger.title")} subtitle={t("ledger.subtitle")} />
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("ledger.addTransaction")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === tb ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t(`ledger.${tb}`)}
          </button>
        ))}
      </div>

      {(tab === "income" || tab === "expense") && (
        <TransactionList
          items={tab === "income" ? income : expense}
          label={txLabel}
          catLabel={catLabel}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          emptyMsg={t("ledger.noTransactions")}
        />
      )}

      {tab === "receivables" && (
        <div className="space-y-2">
          {receivables.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{custName(r.customerId)}</p>
                <p className="text-xs text-ink/50">
                  {r.noteKey ? `${t(r.noteKey)} · ` : ""}
                  {t("ledger.due", { date: formatDate(r.dueDate) })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  tone={
                    r.status === "overdue" ? "danger" : r.status === "paid" ? "success" : "neutral"
                  }
                >
                  {t(`ledger.status.${r.status}`)}
                </Badge>
                <NumericText className="text-sm font-bold text-ink">
                  {formatCurrency(r.amount)}
                </NumericText>
                {r.status !== "paid" && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setReceivableStatus(r.id, "paid");
                      toast(t("ledger.markPaid"));
                    }}
                  >
                    {t("ledger.markPaid")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "payables" && (
        <div className="space-y-2">
          {payables.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{t(p.vendorNameKey)}</p>
                <p className="text-xs text-ink/50">
                  {p.noteKey ? `${t(p.noteKey)} · ` : ""}
                  {t("ledger.due", { date: formatDate(p.dueDate) })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  tone={
                    p.status === "overdue" ? "danger" : p.status === "paid" ? "success" : "neutral"
                  }
                >
                  {t(`ledger.status.${p.status}`)}
                </Badge>
                <NumericText className="text-sm font-bold text-ink">
                  {formatCurrency(p.amount)}
                </NumericText>
                {p.status !== "paid" && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPayableStatus(p.id, "paid");
                      toast(t("ledger.markPaid"));
                    }}
                  >
                    {t("ledger.markPaid")}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-4 flex items-center justify-between bg-ink/5 shadow-none">
        <span className="text-sm text-ink/60">{t("cashflow.subtitle")}</span>
        <Button variant="ghost" onClick={() => router.push("/cashflow")}>
          <TrendingUp className="h-4 w-4" />
          {t("ledger.forecastCta")}
        </Button>
      </Card>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(input) => {
          addTransaction(input);
          setModalOpen(false);
          toast(t("ledger.toastAdded"));
        }}
        currency={business?.currency ?? "USD"}
      />
    </div>
  );
}

function TransactionList({
  items,
  label,
  catLabel,
  formatCurrency,
  formatDate,
  emptyMsg,
}: {
  items: Transaction[];
  label: (tx: Transaction) => string;
  catLabel: (type: TransactionType, cat: string) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d: string) => string;
  emptyMsg: string;
}) {
  if (items.length === 0) return <EmptyState message={emptyMsg} />;
  return (
    <div className="space-y-2">
      {items.map((tx) => (
        <Card key={tx.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{label(tx)}</p>
            <p className="text-xs text-ink/50">
              {catLabel(tx.type, tx.category)} · {formatDate(tx.occurredAt)}
            </p>
          </div>
          <NumericText
            className={`text-sm font-bold ${tx.type === "income" ? "text-success" : "text-ink"}`}
          >
            {tx.type === "income" ? "+" : "−"}
            {formatCurrency(tx.amount)}
          </NumericText>
        </Card>
      ))}
    </div>
  );
}

function AddTransactionModal({
  open,
  onClose,
  onSave,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  currency: string;
}) {
  const { t } = useI18n();
  const [type, setType] = useState<TransactionType>("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState("");

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = () => {
    const value = parseFloat(amount);
    if (!amount || isNaN(value)) return setError(t("validation.invalidNumber"));
    if (value <= 0) return setError(t("validation.positiveAmount"));
    setError("");
    onSave({
      businessId: "biz_demo",
      type,
      amount: value,
      currency,
      category,
      // New, human-typed entries record real current time and store raw text
      // only when the owner actually typed something.
      descriptionRaw: description.trim() || undefined,
      paymentMethod: method,
      occurredAt: now().toISOString(),
      source: "manual",
    });
    setAmount("");
    setDescription("");
  };

  return (
    <Modal open={open} onClose={onClose} title={t("ledger.newTransaction")}>
      <div className="space-y-3">
        <Field label={t("ledger.type")}>
          <Select
            value={type}
            onChange={(e) => {
              const next = e.target.value as TransactionType;
              setType(next);
              setCategory(next === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
            }}
          >
            <option value="income">{t("ledger.income")}</option>
            <option value="expense">{t("ledger.expense")}</option>
          </Select>
        </Field>
        <Field label={t("common.amount")} error={error}>
          <TextInput
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label={t("common.category")}>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {cats.map((c) => (
              <option key={c} value={c}>
                {type === "income"
                  ? t(`ledger.incomeCategory.${c}`)
                  : t(`ledger.expenseCategory.${c}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.description")}>
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label={t("ledger.paymentMethod")}>
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`ledger.method.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={submit}>
            {t("common.save")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
