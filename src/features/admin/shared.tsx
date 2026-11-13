"use client";
import React from "react";
import { Card, PageHeader, DemoTag } from "@/components/ui";

export function AHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return <PageHeader eyebrow="Academic Admin" title={title} subtitle={subtitle} actions={<div className="flex items-center gap-2">{actions}<DemoTag>Mock data · local only</DemoTag></div>} />;
}

export function DataTable<T extends { id: string }>({ rows, cols, empty }: { rows: T[]; cols: { head: string; cell: (r: T) => React.ReactNode; className?: string }[]; empty?: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-oxford-50 text-left text-oxford"><tr>{cols.map((c) => <th key={c.head} className={`whitespace-nowrap px-4 py-3 font-semibold ${c.className ?? ""}`}>{c.head}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={cols.length} className="p-10 text-center text-slate-500">{empty ?? "No records."}</td></tr>}
            {rows.map((r) => <tr key={r.id} className="border-t border-line hover:bg-mist/60">{cols.map((c) => <td key={c.head} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>{c.cell(r)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
