import { AuthPage } from './pages/AuthPage'
import { NotesPage } from './pages/NotesPage'
import { useAuthStore } from './store/authStore'

function App() {
  const token = useAuthStore((state) => state.token)

  return token ? <NotesPage /> : <AuthPage />
}

export default App
