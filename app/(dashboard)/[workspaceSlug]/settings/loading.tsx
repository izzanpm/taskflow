export default function WorkspaceSettingsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading workspace settings"
      className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8"
    >
      <div className="mx-auto w-full max-w-5xl animate-pulse">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
          <div className="h-4 w-24 rounded bg-[#E2E8F0]" />
          <div className="h-9 w-20 rounded-lg bg-[#E2E8F0]" />
        </div>
        <div className="py-12 sm:py-16">
          <div className="h-4 w-20 rounded bg-[#E2E8F0]" />
          <div className="mt-4 h-12 w-3/4 max-w-lg rounded bg-[#E2E8F0]" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-[#E2E8F0]" />
          <div className="mt-10 space-y-6">
            <div className="h-56 rounded-lg border border-[#E2E8F0] bg-white" />
            <div className="h-80 rounded-lg border border-[#E2E8F0] bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}
