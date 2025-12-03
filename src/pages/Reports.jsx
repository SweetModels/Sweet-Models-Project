import React from 'react'

export default function Reports({ dailyProduction = [] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Reportes</h2>
      <div className="bg-white shadow-sm rounded overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm">Fecha</th>
              <th className="p-3 text-left text-sm">Grupo</th>
              <th className="p-3 text-left text-sm">Tokens</th>
              <th className="p-3 text-left text-sm">Payout COP</th>
            </tr>
          </thead>
          <tbody>
            {dailyProduction.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-sm">{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleString()}</td>
                <td className="p-3 text-sm">{r.groupName}</td>
                <td className="p-3 text-sm">{r.tokens}</td>
                <td className="p-3 text-sm">{r.payoutCOP}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
