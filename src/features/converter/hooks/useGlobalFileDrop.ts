import { useEffect, useRef, useState } from "react";

type FileDropHandler = (files: FileList) => void;

export function useGlobalFileDrop(onFiles: FileDropHandler) {
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const dragDepth = useRef(0);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    function isFileDrag(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function resetDragState() {
      dragDepth.current = 0;
      setIsFileDragActive(false);
    }

    function handleDragEnter(event: DragEvent) {
      if (!isFileDrag(event)) {
        return;
      }

      event.preventDefault();
      dragDepth.current += 1;
      setIsFileDragActive(true);
    }

    function handleDragOver(event: DragEvent) {
      if (!isFileDrag(event)) {
        return;
      }

      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    }

    function handleDragLeave() {
      if (dragDepth.current === 0) {
        return;
      }

      dragDepth.current -= 1;

      if (dragDepth.current === 0) {
        setIsFileDragActive(false);
      }
    }

    function handleWindowDragLeave(event: DragEvent) {
      if (event.relatedTarget === null) {
        resetDragState();
      }
    }

    function handleDrop(event: DragEvent) {
      if (!isFileDrag(event)) {
        return;
      }

      event.preventDefault();
      const files = event.dataTransfer?.files;
      resetDragState();

      if (files && files.length > 0) {
        onFilesRef.current(files);
      }
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragend", resetDragState);
    window.addEventListener("blur", resetDragState);
    document.addEventListener("dragleave", handleWindowDragLeave);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragend", resetDragState);
      window.removeEventListener("blur", resetDragState);
      document.removeEventListener("dragleave", handleWindowDragLeave);
    };
  }, []);

  return isFileDragActive;
}
