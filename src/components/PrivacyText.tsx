import { useUiStore } from '../store/uiStore'

type PrivacyTextProps = {
  children: React.ReactNode
  fallback?: string
  className?: string
}

export function PrivacyText({ children, fallback = 'Contenido oculto', className = '' }: PrivacyTextProps) {
  const privacyMode = useUiStore((state) => state.privacyMode)

  if (privacyMode) {
    return <span className={`${className} select-none italic text-slate-400`}>{fallback}</span>
  }

  return <span className={className}>{children}</span>
}
