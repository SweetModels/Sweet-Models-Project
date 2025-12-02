export default function DollarStudioCard({ dollarStudio }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Dólar Studio (TRM - 300)
      </label>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <p className="text-5xl font-bold text-green-600 mb-1">
            ${dollarStudio.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-gray-600">Tasa de conversión actual</p>
        </div>
        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
          <span className="text-4xl">💵</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-green-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-green-700">Fórmula:</span> TRM - $300 COP
        </p>
      </div>
    </div>
  );
}
