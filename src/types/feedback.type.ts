export type FeedbackItem = {
    feedbackId: string
    userId: string
    userName: string
    orderId: string
    rating: number
    comment: string | null
    createdAt: string
    updatedAt?: string | null
}

export type CreateFeedbackPayload = {
    orderId: string
    rating: number
    comment?: string | null
}

export type UpdateFeedbackPayload = {
    rating?: number
    comment?: string | null
}
