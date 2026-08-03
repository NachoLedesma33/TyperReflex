import { TypingTest } from "@/components/TypingTest"

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between shrink-0">
        <span className="font-mono text-2xl font-bold text-primary tracking-tight select-none">
          TyperReflex
        </span>
        <div className="flex items-center gap-2">
          {/* placeholder for future settings */}
        </div>
      </header>

      {/* Main – vertically centered, nudged slightly above center */}
      <main className="flex-1 flex items-center justify-center px-4 -mt-12">
        <TypingTest />
      </main>
    </div>
  )
}

export default App
