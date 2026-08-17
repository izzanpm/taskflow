export default function BoardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading board"
      className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8"
    >
      <div className="mx-auto w-full max-w-[1440px] animate-pulse">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
          <div className="h-4 w-32 rounded bg-[#E2E8F0]" />
          <div className="h-9 w-20 rounded-lg bg-[#E2E8F0]" />
        </div>
        <div className="py-10 sm:py-14">
          <div className="h-4 w-28 rounded bg-[#E2E8F0]" />
          <div className="mt-4 h-12 w-72 rounded bg-[#E2E8F0]" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-[#E2E8F0]" />
          <div className="mt-10 flex gap-4 overflow-hidden">
            <div className="h-[28rem] w-80 shrink-0 rounded-xl border border-[#E2E8F0] bg-white" />
            <div className="h-[28rem] w-80 shrink-0 rounded-xl border border-[#E2E8F0] bg-white" />
            <div className="h-[28rem] w-80 shrink-0 rounded-xl border border-[#E2E8F0] bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}
