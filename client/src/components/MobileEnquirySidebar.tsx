import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ChatSidebar, type SidebarEnquiry } from "./ChatSidebar";

interface MobileEnquirySidebarProps {
  open: boolean;
  onClose: () => void;
  enquiries: SidebarEnquiry[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewQuestion: () => void;
}

export const MobileEnquirySidebar = ({
  open,
  onClose,
  enquiries,
  activeId,
  onSelect,
  onNewQuestion,
}: MobileEnquirySidebarProps) => {
  const [rendered, setRendered] = useState(false);
  const [slideVisible, setSlideVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideVisible(true));
      });
    } else {
      setSlideVisible(false);
      const t = setTimeout(() => setRendered(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!rendered) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: slideVisible ? 1 : 0 }}
        onClick={onClose}
        data-testid="enquiry-sidebar-backdrop"
      />

      {/* Slide-in panel */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-th-sidebar flex flex-col overflow-hidden"
        style={{
          transform: slideVisible ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        data-testid="enquiry-sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
          <img className="h-7 logo-adaptive" alt="Ask MiGi" src="/figmaAssets/vector.svg" />
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-th-hover text-th-text transition-colors"
            data-testid="button-close-enquiry-sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Enquiry list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
          <ChatSidebar
            enquiries={enquiries}
            activeId={activeId}
            onSelect={(id) => {
              onSelect(id);
              onClose();
            }}
            onNewQuestion={() => {
              onNewQuestion();
              onClose();
            }}
          />
        </div>
      </aside>
    </>
  );
};
