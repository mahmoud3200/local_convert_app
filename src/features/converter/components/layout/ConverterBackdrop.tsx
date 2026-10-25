export function ConverterBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden"
    >
      <div className="size-[54vw] shrink-0 translate-y-1/2 rounded-full bg-app-accent/20 blur-[10vw]" />
    </div>
  );
}
