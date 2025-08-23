"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [key, setKey] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/visits", {
      headers: { "x-admin-key": key }
    });
    const json = await res.json();
    setRows(json.rows || []);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <input className="border rounded p-2" placeholder="Admin key" value={key} onChange={e=>setKey(e.target.value)} />
        <button className="px-3 py-2 bg-black text-white rounded" onClick={load}>Load</button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[800px] text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Time</th><th className="p-2">IP</th><th className="p-2">URL</th>
              <th className="p-2">Browser</th><th className="p-2">OS</th><th className="p-2">Device</th>
              <th className="p-2">Location</th><th className="p-2">ISP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-b">
                <td className="p-2">{r.time}</td>
                <td className="p-2">{r.ip}</td>
                <td className="p-2">{r.url}</td>
                <td className="p-2">{r.browser}</td>
                <td className="p-2">{r.os}</td>
                <td className="p-2">{r.device}</td>
                <td className="p-2">{r.location}</td>
                <td className="p-2">{r.isp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
