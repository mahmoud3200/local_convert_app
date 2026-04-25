import { useState } from "react";

export function useDismissedFlag(storageKey: string) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(storageKey) === "true";
  });

  function dismiss() {
    setIsDismissed(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "true");
    }
  }

  return {
    dismiss,
    isDismissed,
  };
}
