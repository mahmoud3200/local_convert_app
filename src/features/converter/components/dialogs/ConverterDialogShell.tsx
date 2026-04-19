import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type React from "react";

interface ConverterDialogShellProps {
  children: React.ReactNode;
  description: string;
  footer?: React.ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
  sizeClassName?: string;
}

export function ConverterDialogShell({
  children,
  description,
  footer,
  isOpen,
  title,
  onClose,
  sizeClassName,
}: ConverterDialogShellProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={sizeClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

        <DialogFooter className="border-none pt-2">
          {footer ?? (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
