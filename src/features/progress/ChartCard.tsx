"use client";
import React, { useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { Card, CardHeader, DemoTag } from "@/components/ui";

/** Chart wrapper with an accessible "view as table" alternative. */
export function ChartCard({ title, subtitle, chart, table, className }: { title: string; subtitle?: string; chart: React.ReactNode; table: { head: string[]; rows: (string | number)[][] }; className?: string }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} action={
        <div className="flex items-center gap-2"><DemoTag />
          <button onClick={() => setAsTable((t) => !t)} className="rounded-lg p-1.5 text-slate-500 hover:bg-oxford-50" aria-label={asTable ? "View as chart" : "View as table"} title={asTable ? "View as chart" : "View as table"}>{asTable ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}</button></div>} />
      <div className="p-4">
        {asTable ? (
          <div className="max-h-64 overflow-auto rounded-xl border border-line"><table className="w-full text-sm"><thead className="bg-oxford-50 text-left text-oxford"><tr>{table.head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>)}</tbody></table></div>
        ) : <div className="h-60">{chart}</div>}
      </div>
    </Card>
  );
}
