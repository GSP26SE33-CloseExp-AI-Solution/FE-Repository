export type UnitItem = {
    unitId: string
    name: string
    type?: string | null
    symbol?: string | null
}

export type UnitOption = {
    unitId: string
    label: string
    value: string
    unitType?: string
    unitSymbol?: string
}
