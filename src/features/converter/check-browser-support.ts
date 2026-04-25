export const supportsBrowserConversionRuntime =
  typeof WebAssembly !== "undefined" &&
  typeof Worker !== "undefined" &&
  typeof File !== "undefined" &&
  typeof Blob !== "undefined" &&
  typeof URL !== "undefined" &&
  typeof URL.createObjectURL === "function";
