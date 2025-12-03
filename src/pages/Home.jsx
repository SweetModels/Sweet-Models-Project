import React from 'react'
import { formatCurrencyCOP, formatCurrencyUSD } from '../utils/formatters'

export default function Home({ groups = [], trm = 4200, setTrm = () => {}, metrics = {}, calcPerMember = () => ({ cop: 0 }) }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="space-x-2">
          <label className="text-sm text-gray-500">TRM</label>
          <input
            type="number"
            value={trm}
            onChange={(e) => setTrm(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow-sm rounded-xl p-4">
          <div className="text-sm text-gray-500">Facturación Bruta (USD)</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrencyUSD(metrics.grossUSD)}</div>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <div className="text-sm text-gray-500">Ganancia Neta Studio (COP)</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrencyCOP(metrics.studioCOP)}</div>
        </div>
        <div className="bg-white shadow-sm rounded-xl p-4">
          <div className="text-sm text-gray-500">Nómina a Pagar (COP)</div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrencyCOP(metrics.payrollCOP)}</div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-medium mb-2">Grupos</h3>
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="bg-white p-3 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm text-gray-500">Platform: {g.platform}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Pago por miembro</div>
                  <div className="font-medium">{formatCurrencyCOP(calcPerMember(g).cop)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
