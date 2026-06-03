declare module "jsbarcode" {
    type JsBarcodeOptions = {
        format?: string
        width?: number
        height?: number
        displayValue?: boolean
        fontSize?: number
        margin?: number
        background?: string
        lineColor?: string
    }

    function JsBarcode(
        element: SVGSVGElement | string,
        value: string,
        options?: JsBarcodeOptions,
    ): void

    export default JsBarcode
}
