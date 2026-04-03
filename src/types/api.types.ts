/**
 * Matches BE ApiResponse<T> (success, message, data, errors).
 * errors is optional at runtime on some responses.
 */
export type ApiResponse<T> = {
    success: boolean
    message: string
    data: T
    errors?: string[] | null
}

/** Legacy alias — same shape as ApiResponse (order/checkout code). */
export type ApiEnvelope<T> = ApiResponse<T>
