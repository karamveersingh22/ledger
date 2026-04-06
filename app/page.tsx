"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  userId: string;
  phone: string;
  exp: number;
};

function Page() {
  const [data, setdata] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [masterPath, setMasterPath] = useState<string>("");
  const [ledgerPath, setLedgerPath] = useState<string>("");

  const handleMasFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileContent(json);

        // Send JSON to backend
        const response = await axios.post("/api/", json);
        alert("MAS data uploaded successfully");
        console.log("Uploaded successfully:", response.data);
      } catch (err) {
        console.error("Invalid JSON file:", err);
        alert("Invalid JSON file. Please upload a valid JSON.");
      }
    };
    reader.readAsText(file);
  };
  const handleLgrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileContent(json);

        // Send JSON to backend
        const response = await axios.post("/api/company", json);
        console.log("Uploaded successfully:", response.data);
        alert("LGR data uploaded successfully");
      } catch (err) {
        console.error("Invalid JSON file:", err);
        alert("Invalid JSON file. Please upload a valid JSON.")
      }
    };
    reader.readAsText(file);
  };

  const filteredData = data.filter((item: any) => {
    const query = searchQuery.toLowerCase();
    return (
      item.CODE?.toString().toLowerCase().includes(query) ||
      item.ACCOUNT_N?.toLowerCase().includes(query) ||
      item.CITY?.toLowerCase().includes(query) ||
      item.AMOUNT?.toString().toLowerCase().includes(query)
    );
  });

  // const fetchdata = async () => {
  //   try {
  //     const response = await axios.post("/api/");
  //     console.log(response);
  //     getdata();
  //   } catch (error: any) {
  //     console.log(error, "error in fetching the data in the frontend");
  //   }
  // };

  const getMasdata = async () => {
    try {
      const response = await axios.get("/api/", { withCredentials: true });
      console.log(response);
      setdata(response.data);
    } catch (error: any) {
      console.log(error, "error in fetching the mas data");
    }
  };
  const router = useRouter();

  const fetchinside = (code: number | string) => {
    router.push(`/company/${code}`);
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setdata([]);
    router.push("/login");
  };

  useEffect(() => {
    getMasdata();
    const fetchMeta = async () => {
      try {
        const res = await fetch('/api/me');
        const meta = await res.json();
        setUsername(meta.username || null);
        setMasterPath(meta.masterPath || '');
        setLedgerPath(meta.ledgerPath || '');
      } catch (e) {
        setUsername(null);
        setMasterPath('');
        setLedgerPath('');
      }
    };
    fetchMeta();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Client Ledger Workspace</h1>
          <p className="mt-1 text-sm text-white/70">
            Upload master and ledger JSON files, then review client balances securely.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-24 left-8 h-40 w-40 rounded-full bg-gradient-to-br from-blue-600/35 to-indigo-600/10 blur-2xl" />
            <div className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Master (MAS)</h2>
                  <p className="mt-1 text-sm text-white/70">Upload the master file and refresh the table.</p>
                </div>
                <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 sm:block">
                  JSON
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleMasFileChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white/80 hover:file:bg-white/15 focus:outline-none focus:ring-4 focus:ring-blue-500/20 sm:flex-1"
                />
                <button
                  onClick={getMasdata}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-blue-500/25 sm:w-auto"
                >
                  Show the mas data
                </button>
              </div>

              {masterPath && (
                <div
                  className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  title={masterPath}
                >
                  <span className="font-medium text-white/80">Master Path:</span> {masterPath}
                </div>
              )}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-24 left-8 h-40 w-40 rounded-full bg-gradient-to-br from-blue-600/20 to-indigo-600/10 blur-2xl" />
            <div className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Ledger (LGR)</h2>
                  <p className="mt-1 text-sm text-white/70">Upload the ledger file to enable per-client drilldown.</p>
                </div>
                <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 sm:block">
                  JSON
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLgrFileChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white/80 hover:file:bg-white/15 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                />
              </div>

              {ledgerPath && (
                <div
                  className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  title={ledgerPath}
                >
                  <span className="font-medium text-white/80">Ledger Path:</span> {ledgerPath}
                </div>
              )}
            </div>
          </section>
        </div>

        {data.length === 0 ? (
          <div className="mx-auto mt-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/10 p-6 text-center text-sm text-white/70 shadow-2xl backdrop-blur-xl">
            No data found. Please upload both the MAS file and the LGR file, then refresh the MAS data to populate the table.
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <label className="mb-2 block text-xs font-medium text-white/70">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/45">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by code, account, city, amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/15"
                />
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] table-auto">
                  <thead className="bg-white/5 text-left text-xs font-semibold uppercase tracking-wider text-white/70">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Account Name</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">City</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {filteredData.map((item: any) => (
                      <tr
                        onClick={() => fetchinside(item.CODE)}
                        key={item.CODE}
                        className="cursor-pointer transition hover:bg-white/5"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-white/90">
                          {item.CODE}
                        </td>
                        <td className="px-4 py-3 text-white/80">{item.ACCOUNT_N}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-white/90">
                          {item.AMOUNT}
                        </td>
                        <td className="px-4 py-3 text-white/75">{item.CITY}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
                Tip: Click any row to open the company ledger.
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Page;
