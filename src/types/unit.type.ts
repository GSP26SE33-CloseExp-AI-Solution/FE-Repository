export type UnitItem = {
    unitId: string
    name: string
    type?: string | null
    symbol?: string | null

    createdAt?: string | null
    updatedAt?: string | null
    relatedStockLotCount?: number | null
    isInUse?: boolean | null
}

export type UnitOption = {
    unitId: string
    label: string
    value: string
    unitType?: string
    unitSymbol?: string
}
