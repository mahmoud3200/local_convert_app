import type React from "react";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-app-main flex min-h-screen items-center justify-center px-4 py-6 text-app-fg md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {children}
      </div>
    </main>
  );
}

export default Layout;
