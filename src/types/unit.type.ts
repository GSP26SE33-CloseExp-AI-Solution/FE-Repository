export type UnitItem = {
    unitId: string
    name: string
    type?: string | null
    symbol?: string | null
    conversionRate?: number | null
}

export type UnitOption = {
    unitId: string
    label: string
    value: string
    unitType?: string
    unitSymbol?: string
    conversionRate?: number
}
