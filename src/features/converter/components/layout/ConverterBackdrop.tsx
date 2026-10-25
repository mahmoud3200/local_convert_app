import glowImage from "@/assets/glow.svg";

export function ConverterBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden"
    >
      <img
        alt=""
        className="w-[1300px] max-w-none translate-y-1/2 select-none sm:w-[1600px]"
        src={glowImage}
      />
    </div>
  );
}
