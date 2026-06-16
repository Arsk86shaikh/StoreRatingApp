import { Loader2 } from 'lucide-react'

const Loader = ({ fullScreen = false, label = 'Loading…' }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f7f8fb]">
        <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
        <p className="text-sm text-ink/50 font-medium">{label}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 py-10">
      <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
      <span className="text-sm text-ink/50">{label}</span>
    </div>
  )
}

export default Loader