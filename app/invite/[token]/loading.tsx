export default function InviteLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading invitation"
      className="min-h-svh bg-[#F9F8F6] px-5 py-10 text-[#0F172A] sm:px-8"
    >
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-[32rem] items-center">
        <div className="w-full animate-pulse">
          <div className="h-4 w-20 rounded bg-[#E2E8F0]" />
          <div className="mt-10 border border-[#E2E8F0] bg-white p-6 sm:p-8">
            <div className="h-4 w-28 rounded bg-[#E2E8F0]" />
            <div className="mt-4 h-11 w-3/4 rounded bg-[#E2E8F0]" />
            <div className="mt-4 h-5 w-full rounded bg-[#E2E8F0]" />
            <div className="mt-8 h-11 w-full rounded-lg bg-[#E2E8F0]" />
          </div>
        </div>
      </div>
    </main>
  );
}
