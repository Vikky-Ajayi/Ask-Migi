import { Search, PenSquare } from "lucide-react";
import { useState } from "react";

export interface SidebarEnquiry {
  id: string;
  question: string;
  status: string;
}

interface ChatSidebarProps {
  enquiries?: SidebarEnquiry[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewQuestion?: () => void;
  isLoading?: boolean;
}

export const ChatSidebar = ({
  enquiries = [],
  activeId,
  onSelect,
  onNewQuestion,
  isLoading = false,
}: ChatSidebarProps) => {
  const [search, setSearch] = useState("");

  const filtered = enquiries.filter((e) =>
    e.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-full flex flex-col gap-3 pt-2">
      {/* New Question button */}
      <button
        onClick={onNewQuestion}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-th-card text-sm text-th-text-80 hover:text-th-text hover:bg-th-card-hover transition-colors border border-th-border-md w-full text-left"
        data-testid="button-new-question"
      >
        <PenSquare size={14} />
        New Question
      </button>

      {/* Previous Enquiries */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-th-text-40 font-medium px-1 mt-1">Previous Enquiries</p>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text-30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Previous Enquiries"
            className="w-full h-9 bg-th-card rounded-xl pl-8 pr-3 text-xs text-th-text-70 placeholder:text-th-text-30 border border-th-border-md focus:outline-none focus:border-th-border-strong"
            data-testid="input-search-enquiries"
          />
        </div>

        {/* Enquiry list */}
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-th-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-th-text-30 px-1 py-3 text-center">
            {search ? "No matching enquiries" : "No enquiries yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((enq) => (
              <button
                key={enq.id}
                onClick={() => onSelect?.(enq.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex flex-col gap-1.5 ${
                  activeId === enq.id
                    ? "bg-th-card-hover border border-th-border-md"
                    : "hover:bg-th-card-alt"
                }`}
                data-testid={`enquiry-item-${enq.id}`}
              >
                <p className="text-xs text-th-text-80 leading-4 line-clamp-2">{enq.question}</p>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${
                    enq.status === "answered"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/30"
                      : "bg-th-hover text-th-text-40 border border-th-border-md"
                  }`}
                >
                  {enq.status === "answered" ? "✅ Answered" : "⏳ Pending"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
