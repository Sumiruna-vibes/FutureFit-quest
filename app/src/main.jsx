import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { EngineProvider } from './contexts/EngineContext.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console for dev server
    console.error('Uncaught error in React tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20, color:'#fff', background:'#111', minHeight:'100vh'}}>
          <h1 style={{color:'#f66'}}>Application Error</h1>
          <pre style={{whiteSpace:'pre-wrap', color:'#fff'}}>{String(this.state.error)}</pre>
          <details style={{whiteSpace:'pre-wrap', color:'#ddd'}}>
            {this.state.info?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <EngineProvider>
        <App />
      </EngineProvider>
    </ErrorBoundary>
  </StrictMode>,
)
