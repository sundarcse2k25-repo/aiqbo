import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'

/**
 * Root application component.
 * Provides the router context and renders the route tree.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
