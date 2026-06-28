"use client"
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import jsPDF from 'jspdf'
// @ts-ignore - jspdf-autotable has no default export types in some setups
import autoTable from 'jspdf-autotable'

interface LgrEntry {
  _id?: string;
  DATE: string;
  BOOK: string;
  BILL?: string;
  DESCRIBE: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

interface MasterRec {
  CODE?: number;
  ACCOUNT_N?: string;
  YR_BAL?: number;
}

type ViewKey = 'ledger' | 'debtors' | 'creditors';

// ---- Formatting helpers ---------------------------------------------------
const fmtAmount = (n: number) =>
  (Number(n) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (dateString: string) => {
  const d = new Date(dateString as any)
  if (isNaN(d.getTime())) return ''
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${day}-${month}-${year}`
}

// Whole days between today (local midnight) and a bill date (local midnight).
const daysSince = (dateString: string) => {
  const bill = new Date(dateString as any)
  if (isNaN(bill.getTime())) return null
  const msPerDay = 24 * 60 * 60 * 1000
  const today = new Date()
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const b0 = new Date(bill.getFullYear(), bill.getMonth(), bill.getDate()).getTime()
  return Math.floor((t0 - b0) / msPerDay)
}

function Page() {
  const params = useParams()
  const code = params.code

  const [lgrdata, setlgrdata] = useState<LgrEntry[]>([]);
  const [master, setMaster] = useState<MasterRec | null>(null);
  const [view, setView] = useState<ViewKey>('ledger');
  const [dueDays, setDueDays] = useState<number>(0);

  const getLgrdata = async () => {
    try {
      if (!code) return;
      const response = await axios.get(`/api/company?code=${code}`)
      setlgrdata(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      console.log(error, "error in getting the data from the frontend");
      alert("error in getting the data from the frontend");
      setlgrdata([])
    }
  }

  const getMaster = async () => {
    try {
      if (!code) return;
      const response = await axios.get(`/api/?code=${code}`)
      const rec = Array.isArray(response.data) ? response.data[0] : null
      setMaster(rec || null)
    } catch (error: any) {
      console.log(error, "error in getting the master record")
      setMaster(null)
    }
  }

  useEffect(() => {
    getLgrdata()
    getMaster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Existing full ledger rows (for PDF + Ledger view) ------------------
  const formattedRows = useMemo(() => {
    return lgrdata.map(r => [
      formatDate(r.DATE as unknown as string),
      r.BOOK ?? '',
      r.DESCRIBE ?? '',
      r.DEBIT ?? '',
      r.CREDIT ?? '',
      r.BALANCE ?? ''
    ])
  }, [lgrdata])

  // ---- Debtors Outstanding -------------------------------------------------
  // payment_to_collect starts at (YR_BAL - sum of all CREDIT), then each bill
  // (DEBIT amount) is added cumulatively to give the running payment to collect.
  const debtors = useMemo(() => {
    const yrBal = Number(master?.YR_BAL ?? 0)
    const creditTotal = lgrdata.reduce((s, r) => s + (Number(r.CREDIT) || 0), 0)
    let running = yrBal - creditTotal
    const initial = running
    const rows = lgrdata
      .filter(r => (Number(r.DEBIT) || 0) !== 0) // only actual bills (debit entries)
      .map(r => {
        const billAmt = Number(r.DEBIT) || 0
        running += billAmt
        const since = daysSince(r.DATE as unknown as string)
        const overdue = since === null ? null : since - dueDays
        return {
          date: r.DATE,
          bill: r.BILL ?? '',
          overdue,
          billAmt,
          paymentToCollect: running,
        }
      })
    return { yrBal, creditTotal, initial, rows, final: running }
  }, [lgrdata, master, dueDays])

  // ---- Creditors Outstanding ----------------------------------------------
  // payment_to_pay starts at 0; subtract YR_BAL if positive, add abs(YR_BAL)
  // if negative (i.e. payment_to_pay = -YR_BAL), then subtract sum of all DEBIT.
  // Each bill (CREDIT amount) is then added cumulatively.
  const creditors = useMemo(() => {
    const yrBal = Number(master?.YR_BAL ?? 0)
    const debitTotal = lgrdata.reduce((s, r) => s + (Number(r.DEBIT) || 0), 0)
    let running = 0
    if (yrBal > 0) running -= yrBal
    else if (yrBal < 0) running += Math.abs(yrBal)
    running -= debitTotal
    const initial = running
    const rows = lgrdata
      .filter(r => (Number(r.CREDIT) || 0) !== 0) // only actual bills (credit entries)
      .map(r => {
        const billAmt = Number(r.CREDIT) || 0
        running += billAmt
        const since = daysSince(r.DATE as unknown as string)
        const overdue = since === null ? null : since - dueDays
        return {
          date: r.DATE,
          bill: r.BILL ?? '',
          overdue,
          billAmt,
          paymentToPay: running,
        }
      })
    return { yrBal, debitTotal, initial, rows, final: running }
  }, [lgrdata, master, dueDays])

  const downloadPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      doc.setFontSize(14)

      if (view === 'ledger') {
        doc.text(`Account statement for ${code} company`, 40, 40)
        // @ts-ignore
        autoTable(doc, {
          startY: 60,
          head: [["Date", "Book", "Particulars", "Debit", "Credit", "Balance"]],
          body: formattedRows as any,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [33, 33, 33], textColor: 255 },
          theme: 'grid',
        })
        doc.save(`ledger_${code}.pdf`)
        return
      }

      if (view === 'debtors') {
        doc.text(`Debtors Outstanding - ${code}`, 40, 40)
        doc.setFontSize(10)
        doc.text(`Year Opening Balance (YR_BAL): ${fmtAmount(debtors.yrBal)}`, 40, 58)
        doc.text(`Total Received (Credit Total): ${fmtAmount(debtors.creditTotal)}`, 40, 72)
        doc.text(`Due Days: ${dueDays}    Final Payment To Collect: ${fmtAmount(debtors.final)}`, 40, 86)
        // @ts-ignore
        autoTable(doc, {
          startY: 100,
          head: [["Bill Date", "Bill No.", "Overdue Days", "Bill Amount", "Payment To Collect"]],
          body: debtors.rows.map(r => [
            formatDate(r.date as unknown as string),
            r.bill,
            r.overdue === null ? '' : r.overdue,
            fmtAmount(r.billAmt),
            fmtAmount(r.paymentToCollect),
          ]) as any,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [33, 33, 33], textColor: 255 },
          theme: 'grid',
        })
        doc.save(`debtors_outstanding_${code}.pdf`)
        return
      }

      // creditors
      doc.text(`Creditors Outstanding - ${code}`, 40, 40)
      doc.setFontSize(10)
      doc.text(`Year Opening Balance (YR_BAL): ${fmtAmount(creditors.yrBal)}`, 40, 58)
      doc.text(`Total Paid (Debit Total): ${fmtAmount(creditors.debitTotal)}`, 40, 72)
      doc.text(`Due Days: ${dueDays}    Final Payment To Pay: ${fmtAmount(creditors.final)}`, 40, 86)
      // @ts-ignore
      autoTable(doc, {
        startY: 100,
        head: [["Bill Date", "Bill No.", "Overdue Days", "Bill Amount", "Payment To Pay"]],
        body: creditors.rows.map(r => [
          formatDate(r.date as unknown as string),
          r.bill,
          r.overdue === null ? '' : r.overdue,
          fmtAmount(r.billAmt),
          fmtAmount(r.paymentToPay),
        ]) as any,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 33, 33], textColor: 255 },
        theme: 'grid',
      })
      doc.save(`creditors_outstanding_${code}.pdf`)
    } catch (e) {
      console.error('PDF generation failed:', e)
    }
  }

  const tabs: { key: ViewKey; label: string }[] = [
    { key: 'ledger', label: 'Ledger' },
    { key: 'debtors', label: 'Debtors Outstanding' },
    { key: 'creditors', label: 'Creditors Outstanding' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account Ledger</h1>
            <p className="mt-1 text-sm text-white/70">
              {master?.ACCOUNT_N ? <span className="font-semibold text-white">{master.ACCOUNT_N}</span> : null}
              {master?.ACCOUNT_N ? ' · ' : ''}Code <span className="font-semibold text-white">{code}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onClick={() => { getLgrdata(); getMaster(); }}
            >
              Refresh
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
              onClick={downloadPdf}
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* View switcher — horizontally scrollable on mobile, inline on desktop */}
        <div className="mb-4 overflow-x-auto">
          <div className="inline-flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none ${
                  view === t.key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-white/75 hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due days control — only for the outstanding views */}
        {view !== 'ledger' && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="dueDays" className="text-sm font-medium text-white/80">
              Due days
              <span className="ml-1 text-xs font-normal text-white/50">(days allowed before payment is due)</span>
            </label>
            <input
              id="dueDays"
              type="number"
              min={0}
              value={dueDays}
              onChange={(e) => setDueDays(Math.max(0, Number(e.target.value) || 0))}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/15 sm:w-40"
            />
            <p className="text-xs text-white/50">
              Overdue days = (today − bill date) − due days. Positive = overdue (red).
            </p>
          </div>
        )}

        {/* ---------------- LEDGER VIEW ---------------- */}
        {view === 'ledger' && (
          lgrdata.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] table-auto text-xs md:text-sm">
                  <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">Particulars</th>
                      <th className="px-4 py-3">Debit</th>
                      <th className="px-4 py-3">Credit</th>
                      <th className="px-4 py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {lgrdata.map((item, index) => (
                      <tr key={item._id || index} className="text-white/85 transition hover:bg-white/5">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-white/90">{formatDate(item.DATE)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.BOOK}</td>
                        <td className="max-w-[520px] truncate px-4 py-3" title={item.DESCRIBE}>{item.DESCRIBE}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-emerald-300">{item.DEBIT}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-rose-300">{item.CREDIT}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-white/95">{item.BALANCE}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">Ledger rows: {lgrdata.length}</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/70 shadow-2xl backdrop-blur-xl">No data found.</div>
          )
        )}

        {/* ---------------- DEBTORS OUTSTANDING ---------------- */}
        {view === 'debtors' && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Year Opening Balance (YR_BAL)" value={fmtAmount(debtors.yrBal)} hint={debtors.yrBal < 0 ? 'Excess received before year start' : 'To be collected at year start'} />
              <SummaryCard label="Total Received So Far (Credit Total)" value={fmtAmount(debtors.creditTotal)} />
              <SummaryCard label="Final Payment To Collect" value={fmtAmount(debtors.final)} accent={debtors.final > 0 ? 'amber' : 'emerald'} hint={debtors.final > 0 ? 'Amount to collect' : 'Advance in hand'} />
            </div>

            {debtors.rows.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] table-auto text-xs md:text-sm">
                    <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                      <tr>
                        <th className="px-4 py-3">Bill Date</th>
                        <th className="px-4 py-3">Bill Number</th>
                        <th className="px-4 py-3">Overdue Days</th>
                        <th className="px-4 py-3">Bill Amount</th>
                        <th className="px-4 py-3">Payment To Collect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {debtors.rows.map((r, i) => {
                        const overdue = r.overdue !== null && r.overdue > 0
                        return (
                          <tr key={i} className={`transition ${overdue ? 'bg-red-500/15 hover:bg-red-500/20 text-red-100' : 'text-white/85 hover:bg-white/5'}`}>
                            <td className="whitespace-nowrap px-4 py-3 font-medium">{formatDate(r.date as unknown as string)}</td>
                            <td className="whitespace-nowrap px-4 py-3">{r.bill || '-'}</td>
                            <td className={`whitespace-nowrap px-4 py-3 font-semibold tabular-nums ${overdue ? 'text-red-200' : 'text-white/70'}`}>{r.overdue === null ? '-' : r.overdue}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{fmtAmount(r.billAmt)}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{fmtAmount(r.paymentToCollect)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">Bills: {debtors.rows.length} · Red rows are overdue.</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/70 shadow-2xl backdrop-blur-xl">No bills found for debtors outstanding.</div>
            )}
          </>
        )}

        {/* ---------------- CREDITORS OUTSTANDING ---------------- */}
        {view === 'creditors' && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <SummaryCard label="Year Opening Balance (YR_BAL)" value={fmtAmount(creditors.yrBal)} hint={creditors.yrBal < 0 ? 'Amount to pay at year start' : 'Paid extra before year start'} />
              <SummaryCard label="Total Paid So Far (Debit Total)" value={fmtAmount(creditors.debitTotal)} />
              <SummaryCard label="Final Payment To Pay" value={fmtAmount(creditors.final)} accent={creditors.final > 0 ? 'amber' : 'emerald'} hint={creditors.final > 0 ? 'Amount to pay' : 'Advance paid'} />
            </div>

            {creditors.rows.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] table-auto text-xs md:text-sm">
                    <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                      <tr>
                        <th className="px-4 py-3">Bill Date</th>
                        <th className="px-4 py-3">Bill Number</th>
                        <th className="px-4 py-3">Overdue Days</th>
                        <th className="px-4 py-3">Bill Amount</th>
                        <th className="px-4 py-3">Payment To Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {creditors.rows.map((r, i) => {
                        const overdue = r.overdue !== null && r.overdue > 0
                        return (
                          <tr key={i} className={`transition ${overdue ? 'bg-red-500/15 hover:bg-red-500/20 text-red-100' : 'text-white/85 hover:bg-white/5'}`}>
                            <td className="whitespace-nowrap px-4 py-3 font-medium">{formatDate(r.date as unknown as string)}</td>
                            <td className="whitespace-nowrap px-4 py-3">{r.bill || '-'}</td>
                            <td className={`whitespace-nowrap px-4 py-3 font-semibold tabular-nums ${overdue ? 'text-red-200' : 'text-white/70'}`}>{r.overdue === null ? '-' : r.overdue}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{fmtAmount(r.billAmt)}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{fmtAmount(r.paymentToPay)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">Bills: {creditors.rows.length} · Red rows are overdue.</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/70 shadow-2xl backdrop-blur-xl">No bills found for creditors outstanding.</div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: 'amber' | 'emerald' }) {
  const valueColor = accent === 'amber' ? 'text-amber-300' : accent === 'emerald' ? 'text-emerald-300' : 'text-white'
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs font-medium uppercase tracking-wider text-white/60">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${valueColor}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-white/50">{hint}</div>}
    </div>
  )
}

export default Page
