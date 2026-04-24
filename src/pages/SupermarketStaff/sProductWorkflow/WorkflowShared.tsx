import React from "react"

export const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

export const formatCurrencyVN = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—"
    return `${value.toLocaleString("vi-VN")} đ`
}

export const parseCurrencyVN = (value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, "")
    if (!digitsOnly) return 0

    const parsed = Number(digitsOnly)
    return Number.isNaN(parsed) ? 0 : parsed
}

export const normalizeDateInput = (value?: string | null) => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value.includes("T") ? value.slice(0, 10) : value
    return d.toISOString().slice(0, 10)
}

export const StepBadge = ({
    active,
    children,
}: {
    active?: boolean
    children: React.ReactNode
}) => (
    <div
        className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.14em] uppercase",
            active
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500",
        )}
    >
        {children}
    </div>
)

export const SectionCard = ({
    title,
    description,
    children,
}: {
    title: string
    description?: string
    children: React.ReactNode
}) => (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            ) : null}
        </div>
        <div className="p-5">{children}</div>
    </section>
)

export const Field = ({
    label,
    value,
    onChange,
    readOnly = false,
}: {
    label: string
    value: string
    onChange?: (value: string) => void
    readOnly?: boolean
}) => (
    <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
        <input
            type="text"
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
                "w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
                readOnly
                    ? "border-slate-200 bg-slate-50 text-slate-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100",
            )}
        />
    </label>
)

export const SelectField = <T extends string | number>({
    label,
    value,
    onChange,
    options,
    placeholder = "-- Chọn --",
}: {
    label: string
    value: T | ""
    onChange: (value: T | "") => void
    options: ReadonlyArray<{ label: string; value: T }>
    placeholder?: string
}) => (
    <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
        <select
            value={String(value)}
            onChange={(e) => {
                const raw = e.target.value

                if (raw === "") {
                    onChange("")
                    return
                }

                const matched = options.find((option) => String(option.value) === raw)
                onChange(matched ? matched.value : "")
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                </option>
            ))}
        </select>
    </label>
)

export const TextareaField = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) => (
    <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
        <textarea
            rows={5}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
    </label>
)

export const CheckboxField = ({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) => (
    <label className="flex min-h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
        />
        <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
)

export const NumberField = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: number | ""
    onChange: (value: number | "") => void
}) => (
    <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
        <input
            type="number"
            min={0}
            step="any"
            value={value}
            onChange={(e) => {
                const raw = e.target.value

                if (raw === "") {
                    onChange("")
                    return
                }

                const parsed = Number(raw)
                onChange(Number.isNaN(parsed) ? "" : parsed)
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
    </label>
)

export const DateField = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) => (
    <label className="block">
        <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
    </label>
)

export const CurrencyField = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: number | ""
    onChange: (value: number | "") => void
}) => {
    const [focused, setFocused] = React.useState(false)
    const [draftValue, setDraftValue] = React.useState("")

    React.useEffect(() => {
        if (!focused) {
            setDraftValue(typeof value === "number" ? String(value) : "")
        }
    }, [focused, value])

    const displayValue = focused
        ? draftValue
        : typeof value === "number"
            ? formatCurrencyVN(value)
            : ""

    return (
        <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onFocus={() => {
                    setFocused(true)
                    setDraftValue(typeof value === "number" ? String(value) : "")
                }}
                onBlur={() => {
                    setFocused(false)
                }}
                onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^\d]/g, "")

                    setDraftValue(digitsOnly)

                    if (!digitsOnly) {
                        onChange("")
                        return
                    }

                    const parsed = Number(digitsOnly)
                    onChange(Number.isNaN(parsed) ? "" : parsed)
                }}
                placeholder="Nhập số tiền"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
        </label>
    )
}

export const InfoRow = ({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) => (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
        <span className="text-slate-500">{label}</span>
        <span className="text-right font-medium text-slate-900">
            {value === null || value === undefined || value === "" ? "—" : value}
        </span>
    </div>
)
