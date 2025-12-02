export default function ModelsTable({ models, onDeleteModel }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Modelos y Pagos</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Modelo</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Tokens</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                Pago Base (Pesos)
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Comisión</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Pago Final</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr
                key={model.id}
                className={`border-b border-gray-100 transition-colors ${
                  model.isHighPerformer
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {/* Nombre */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        model.isHighPerformer
                          ? 'bg-gradient-to-br from-green-400 to-green-600'
                          : 'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}
                    >
                      {model.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{model.name}</p>
                      <p className="text-xs text-gray-500">ID: {model.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </td>

                {/* Tokens */}
                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-gray-900">
                    {model.tokens.toLocaleString()}
                  </span>
                </td>

                {/* Pago Base */}
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-700">
                    ${model.paymentInPesos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </span>
                </td>

                {/* Comisión */}
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      model.isHighPerformer
                        ? 'bg-green-200 text-green-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {model.percentage}%
                  </span>
                </td>

                {/* Pago Final */}
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-gray-900 text-lg">
                    ${model.finalPayment.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </span>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 text-center">
                  {model.isHighPerformer ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                      <span>⭐</span> Estrella
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      <span>📈</span> Regular
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDeleteModel(model.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-semibold text-sm"
                    title="Eliminar modelo"
                  >
                    <span>🗑️</span> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {models.length === 0 && (
        <div className="px-6 py-12 text-center bg-gray-50">
          <p className="text-gray-500 text-lg font-semibold">📭 No hay modelos registrados</p>
          <p className="text-gray-400 mt-1">Agrega el primer modelo usando el formulario arriba</p>
        </div>
      )}

      {/* Footer con información */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Leyenda:</span> Los modelos con{' '}
          <span className="font-semibold text-green-700">10,000+ tokens</span> reciben una comisión
          del <span className="font-semibold">65%</span>, mientras que los demás reciben{' '}
          <span className="font-semibold">60%</span>.
        </p>
      </div>
    </div>
  );
}
