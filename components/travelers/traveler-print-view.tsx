import type { Traveler } from "@/types"

export function TravelerPrintView({
  traveler,
  jobNumber,
}: {
  traveler: Traveler
  jobNumber: string
}) {
  return (
    <div className="traveler-print mx-auto max-w-3xl bg-white text-black p-8 print:p-0">
      <header className="border-b border-black pb-4 mb-6">
        <p className="text-xs uppercase tracking-wide text-neutral-600">
          QB Fabrication &amp; Welding Inc
        </p>
        <h1 className="text-2xl font-bold mt-1">Traveler</h1>
        <p className="font-mono text-lg mt-1">
          TRV-{traveler.poNumber}
          {traveler.version > 1 ? `_v${traveler.version}` : ""}
        </p>
        <p className="text-sm text-neutral-600 mt-1">
          Job {jobNumber} · Rev {traveler.revNumber ?? "0"} · Status{" "}
          {traveler.status}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 text-sm mb-8">
        <p>
          <strong>Customer:</strong> {traveler.customer ?? "—"}
        </p>
        <p>
          <strong>Customer PO:</strong> {traveler.poNumber}
        </p>
        <p>
          <strong>Order date:</strong> {traveler.orderDate ?? "—"}
        </p>
        <p>
          <strong>Ship date:</strong> {traveler.shipDate ?? "—"}
        </p>
        <p>
          <strong>QB Sales Order:</strong> {traveler.qbSalesOrder ?? "—"}
        </p>
        <p>
          <strong>Imported:</strong>{" "}
          {new Date(traveler.importedAt).toLocaleString()}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide mb-3">
          Line items
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Qty</th>
              <th className="py-2 pr-2">Catalog ID</th>
              <th className="py-2 pr-2">Structure #</th>
              <th className="py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {traveler.lines.map((line) => (
              <tr key={line.id} className="border-b border-neutral-300 align-top">
                <td className="py-2 pr-2 font-mono">
                  {line.lineNumber ?? "—"}
                </td>
                <td className="py-2 pr-2">{line.quantity}</td>
                <td className="py-2 pr-2 font-mono">{line.catalogId}</td>
                <td className="py-2 pr-2 font-mono">
                  {line.structureNumber ?? "—"}
                </td>
                <td className="py-2">{line.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-10 pt-4 border-t border-neutral-300 text-xs text-neutral-600 print:mt-16">
        Digital traveler · print snapshot · not a signed shop floor record
        (sign-offs coming later)
      </footer>
    </div>
  )
}
