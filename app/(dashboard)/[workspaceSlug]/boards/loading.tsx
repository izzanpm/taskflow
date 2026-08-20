export default function BoardListLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading boards"
      className="min-h-svh bg-taskflow-canvas px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="mx-auto w-full max-w-[1200px] animate-pulse">
        <div className="flex items-center justify-between border-b border-taskflow-border pb-5">
          <div className="h-5 w-40 bg-taskflow-border" />
          <div className="h-11 w-24 bg-taskflow-border" />
        </div>
        <div className="py-12 sm:py-16">
          <div className="h-12 w-72 max-w-full bg-taskflow-border" />
          <div className="mt-4 h-5 w-full max-w-lg bg-taskflow-border" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div>
              <div className="h-14 border-b border-taskflow-border" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[0, 1].map((item) => (
                  <div
                    className="h-32 border border-taskflow-border bg-taskflow-surface"
                    key={item}
                  />
                ))}
              </div>
            </div>
            <div className="h-72 border border-taskflow-border bg-taskflow-surface" />
          </div>
        </div>
      </div>
    </main>
  );
}
