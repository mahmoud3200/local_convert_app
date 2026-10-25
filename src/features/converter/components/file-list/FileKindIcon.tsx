import {
  Image as ImageIcon,
  Music,
  Video,
} from "lucide-react";
import type { MediaKind } from "@/features/converter/types";

export function FileKindIcon({ kind }: { kind: MediaKind }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-white/13 bg-white/8 text-white">
      {kind === "audio" ? (
        <Music aria-hidden="true" className="h-6 w-6" />
      ) : kind === "video" ? (
        <Video aria-hidden="true" className="h-6 w-6" />
      ) : (
        <ImageIcon aria-hidden="true" className="h-6 w-6" />
      )}
    </div>
  );
}
