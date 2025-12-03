import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white shadow-md rounded-lg p-6 max-w-lg text-center">
            <h2 className="text-xl font-semibold mb-2">Ocurrió un error</h2>
            <p className="text-sm text-gray-500 mb-4">Recarga la página o contacta al administrador.</p>
            <pre className="text-xs text-left overflow-auto max-h-40">{String(this.state.error)}</pre>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
