import toast from "react-hot-toast";

export interface ToastOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  icon?: string;
}

export const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, {
        duration: options?.duration,
        position: options?.position,
        icon: options?.icon,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      toast.error(message, {
        duration: options?.duration,
        position: options?.position,
        icon: options?.icon,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      toast(message, {
        duration: options?.duration,
        position: options?.position,
        icon: options?.icon || "i",
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      toast(message, {
        duration: options?.duration,
        position: options?.position,
        icon: options?.icon || "!",
      });
    },
    loading: (message: string, options?: ToastOptions) => {
      return toast.loading(message, {
        duration: options?.duration,
        position: options?.position,
      });
    },
    dismiss: (toastId?: string) => {
      toast.dismiss(toastId);
    },
    promise: <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      },
      options?: ToastOptions,
    ) => {
      return toast.promise(
        promise,
        {
          loading: messages.loading,
          success: messages.success,
          error: messages.error,
        },
        {
          duration: options?.duration,
          position: options?.position,
        },
      );
    },
  };
};
