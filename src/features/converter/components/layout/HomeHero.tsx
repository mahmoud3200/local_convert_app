export function HomeHero() {
  return (
    <section className="mt-14 flex flex-col items-center text-center md:mt-25">
      <h1
        className="max-w-270 text-balance text-[clamp(2.375rem,4.6vw,4rem)] font-medium leading-[1.2] tracking-[-0.02em] text-white"
        id="home-heading"
      >
        Convert images, videos, and audio{" "}
        <span className="font-bold text-app-accent">
          right in your browser.
        </span>
      </h1>
      <p className="mt-6.25 max-w-160 text-[clamp(1rem,1.5vw,1.25rem)] leading-[1.2] text-app-muted-strong">
        Convert your media locally without paying for cloud services.
      </p>
    </section>
  );
}
