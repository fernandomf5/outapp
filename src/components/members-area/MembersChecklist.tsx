import { useEffect, useState } from "react";
import { Check, CheckSquare } from "lucide-react";
import { parseChecklist } from "./ChecklistBlockEditor";

interface Props {
  blockId: string;
  title?: string;
  content: string;
  accentColor?: string;
  cardTextColor?: string;
  storageScope?: string;
}

export function MembersChecklist({
  blockId,
  title,
  content,
  accentColor = "#8B5CF6",
  cardTextColor = "#374151",
  storageScope = "anon",
}: Props) {
  const data = parseChecklist(content);
  const storageKey = `ma-checklist-${storageScope}-${blockId}`;
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggle = (id: string) => {
    if (!data.allowCheck) return;
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const total = data.items.length;
  const completed = data.items.filter((i) => done[i.id]).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: `${accentColor}10` }}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          <CheckSquare className="w-4 h-4" />
        </div>
        <span className="font-medium flex-1 min-w-0 truncate" style={{ color: cardTextColor }}>
          {title || "Checklist"}
        </span>
        {data.showProgress && total > 0 && (
          <span className="text-xs font-semibold shrink-0" style={{ color: accentColor }}>
            {completed}/{total}
          </span>
        )}
      </div>

      {data.showProgress && total > 0 && (
        <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: accentColor }}
          />
        </div>
      )}

      <div className="space-y-2">
        {data.items.map((item) => {
          const checked = !!done[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              disabled={!data.allowCheck}
              className={`w-full flex items-start gap-3 text-left p-2.5 rounded-lg transition-colors ${
                data.allowCheck ? "hover:bg-black/5 cursor-pointer" : "cursor-default"
              }`}
              style={{ backgroundColor: checked ? `${accentColor}12` : "transparent" }}
            >
              <span
                className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all"
                style={{
                  borderColor: checked ? accentColor : `${accentColor}66`,
                  backgroundColor: checked ? accentColor : "transparent",
                }}
              >
                {checked && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm break-words ${checked ? "line-through opacity-60" : ""}`}
                  style={{ color: cardTextColor }}
                >
                  {item.text}
                </span>
                {item.description && (
                  <span
                    className={`block text-xs opacity-70 break-words ${checked ? "line-through" : ""}`}
                    style={{ color: cardTextColor }}
                  >
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        {total === 0 && (
          <p className="text-sm opacity-60" style={{ color: cardTextColor }}>
            Nenhum item neste checklist.
          </p>
        )}
      </div>

      {data.showProgress && total > 0 && completed === total && (
        <p className="mt-3 text-xs font-medium" style={{ color: accentColor }}>
          🎉 Checklist concluído!
        </p>
      )}
    </div>
  );
}
