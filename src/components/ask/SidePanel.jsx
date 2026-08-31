import {
  fmtDate,
  chipCls,
  selectorCls,
  receiptLabel,
  chipActiveCls,
} from "./shared.js";
import { LANGUAGES } from "../../lib/languages.js";

function SidePanel({
  lang,
  setLang,
  loading,
  receipts,
  policies,
  policyId,
  receiptId,
  setPolicyId,
  setReceiptId,
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 md:w-72">
      <div>
        <h1 className="eyebrow">Ask Sahi Kharch</h1>
        <p className="mt-1 body-sm text-black/60">
          Type or speak your expense question in your language.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="body-sm font-[480]">Language</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className={`${selectorCls} md:hidden`}
          aria-label="Language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <div
          className="hidden flex-wrap gap-2 md:flex"
          role="group"
          aria-label="Language"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={lang === l.code ? chipActiveCls : chipCls}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="body-sm font-[480]">Receipt</span>
        <select
          value={receiptId}
          onChange={(e) => setReceiptId(e.target.value)}
          className={selectorCls}
        >
          <option value="">{loading ? "Loading…" : "Select receipt"}</option>
          {receipts.map((r) => (
            <option key={r.id} value={r.id}>
              {receiptLabel(r)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="body-sm font-[480]">Policy</span>
        <select
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          className={selectorCls}
        >
          <option value="">{loading ? "Loading…" : "Select policy"}</option>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({fmtDate(p.effectiveFromDate)})
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}

export default SidePanel;
