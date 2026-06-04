import { useState } from "react"
import { ChevronDown, ClipboardList } from "lucide-react"

import type { PackagingActivityLog } from "@/types/packaging.type"
import { formatDateTime } from "./packagingShared"

const cn = (...classes: Array<string | false | undefined | null>) =>
    classes.filter(Boolean).join(" ")

type PackagingActivitySectionProps = {
    logs?: PackagingActivityLog[]
    className?: string
    defaultExpanded?: boolean
}

const PackagingActivitySection = ({
    logs = [],
    className,
    defaultExpanded = false,
}: PackagingActivitySectionProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded)

    if (!logs.length) return null

    const latest = logs[0]

    return (
        <section
            className={cn(
                "rounded-3xl border border-slate-200 bg-white shadow-sm",
                className,
            )}
        >
            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="flex w-full items-start gap-3 rounded-3xl p-5 text-left transition hover:bg-slate-50/80"
            >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                    <ClipboardList className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                            Nhật ký thao tác đóng gói
                        </h2>
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                            {logs.length} mục
                        </span>
                    </div>

                    {!expanded && latest ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            Mới nhất: {latest.actionLabel} ·{" "}
                            {formatDateTime(latest.changedAt)}
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-slate-500">
                            Ghi chú theo từng lần submit (chung cho các dòng đã
                            chọn trong lần đó).
                        </p>
                    )}
                </div>

                <ChevronDown
                    className={cn(
                        "mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform",
                        expanded && "rotate-180",
                    )}
                />
            </button>

            {expanded ? (
                <ol className="space-y-3 border-t border-slate-100 px-5 pb-5 pt-4">
                    {logs.map((entry, index) => (
                        <li
                            key={`${entry.changedAt}-${index}`}
                            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                                    {entry.actionLabel || "Thao tác"}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {formatDateTime(entry.changedAt)}
                                </span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {entry.note}
                            </p>
                        </li>
                    ))}
                </ol>
            ) : null}
        </section>
    )
}

export default PackagingActivitySection
