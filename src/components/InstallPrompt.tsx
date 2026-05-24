import { Download } from 'lucide-react'
import { useUiStore } from '../store/uiStore'

export function InstallPrompt() {
  const installPrompt = useUiStore((state) => state.installPrompt)
  const setInstallPrompt = useUiStore((state) => state.setInstallPrompt)
  const prompt = installPrompt

  if (!prompt) return null

  async function handleInstall() {
    await prompt!.prompt()
    const { outcome } = await prompt!.userChoice
    if (outcome === 'dismissed') {
      setInstallPrompt(null)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <Download size={14} className="shrink-0 text-blue-600" />
        <span className="text-blue-900">Instalá la app para acceder más rápido</span>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={() => setInstallPrompt(null)}
          className="rounded-md px-2 py-1 text-blue-500 transition hover:bg-blue-100"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
