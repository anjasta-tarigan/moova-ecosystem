import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  position?: "left" | "right";
}

export const SideSheet = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = "right",
}: SideSheetProps) => {
  if (!isOpen) return null;

  const positionClasses = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={onClose}
    >
      <div
        className={cn(
          "fixed top-0 h-full bg-white shadow-xl w-full max-w-md flex flex-col",
          positionClasses[position],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto">{children}</div>
        {footer && (
          <div className="p-4 border-t flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideSheet;
