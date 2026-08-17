export default function BoardListLoading() {
  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1200px] animate-pulse">
        <div className="h-6 w-32 border-b border-[#E2E8F0]" />
        <div className="py-12 sm:py-16">
          <div className="h-12 w-72 bg-[#E2E8F0]" />
          <div className="mt-5 h-5 w-full max-w-lg bg-[#E2E8F0]" />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                className="h-32 border border-[#E2E8F0] bg-white"
                key={item}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
