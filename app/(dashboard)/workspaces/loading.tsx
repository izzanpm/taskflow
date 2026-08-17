export default function WorkspacesLoading() {
  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl animate-pulse">
        <div className="h-6 w-32 border-b border-[#E2E8F0]" />
        <div className="py-12 sm:py-16">
          <div className="h-12 w-80 bg-[#E2E8F0]" />
          <div className="mt-5 h-5 w-full max-w-lg bg-[#E2E8F0]" />
          <div className="mt-10 space-y-3">
            {[0, 1].map((item) => (
              <div
                className="h-28 border border-[#E2E8F0] bg-white"
                key={item}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
