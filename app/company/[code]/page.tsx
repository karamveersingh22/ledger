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
  DESCRIBE: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

function Page() {
  const params = useParams()
  const code = params.code

  const [fileContent, setFileContent] = useState(null);
  const [lgrdata, setlgrdata] = useState<LgrEntry[]>([]);

  // masdata
  // lgrdata
  // masdata -> code and name
  // lgrdata -> date,book, particulars, debit, credit, balance

  // already handled in the home page.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileContent(json);

        // Send JSON to backend
        const response = await axios.post('/api/company', json);
        console.log("Uploaded successfully:", response.data);
      } catch (err) {
        console.error("Invalid JSON file:", err);
      }
    };
    reader.readAsText(file);
  };

  const postdata = async () => {
    try {
      const response = await axios.post("/api/company")
      console.log(response, "lgr data fetched in the frontend");
      getLgrdata()

    } catch (error: any) {
      console.log("error: data didnt posted from the frontend ");
    }
  }

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
  useEffect(() => {
    getLgrdata()
  }, [])

  const formattedRows = useMemo(() => {
    const formatDate = (dateString: string) => {
      const d = new Date(dateString as any)
      if (isNaN(d.getTime())) return ''
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear().toString().slice(-2)
      return `${day}-${month}-${year}`
    }
    return lgrdata.map(r => [
      formatDate(r.DATE as unknown as string),
      r.BOOK ?? '',
      r.DESCRIBE ?? '', // Use DESCRIBE for 'Particulars'
      r.DEBIT ?? '',
      r.CREDIT ?? '',
      r.BALANCE ?? ''
    ])
  }, [lgrdata])

  const downloadPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      doc.setFontSize(14)
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
    } catch (e) {
      console.error('PDF generation failed:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account Ledger</h1>
            <p className="mt-1 text-sm text-white/70">
              Account statement for <span className="font-semibold text-white">{code}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              onClick={getLgrdata}
            >
              Show the lgr data
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-500/25"
              onClick={downloadPdf}
            >
              Download PDF
            </button>
          </div>
        </div>

        {lgrdata.length > 0 ? (
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
                  {lgrdata.map((item, index) => {
                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const year = date.getFullYear().toString().slice(-2);
                      return `${day}-${month}-${year}`;
                    };
                    return (
                      <tr key={item._id || index} className="text-white/85 transition hover:bg-white/5">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-white/90">{formatDate(item.DATE)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{item.BOOK}</td>
                        <td className="max-w-[520px] truncate px-4 py-3" title={item.DESCRIBE}>
                          {item.DESCRIBE}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-emerald-300">{item.DEBIT}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-rose-300">{item.CREDIT}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-white/95">{item.BALANCE}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
              Ledger rows: {lgrdata.length}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/70 shadow-2xl backdrop-blur-xl">
            No data found.
          </div>
        )}
      </main>
    </div>
  )

}

export default Page