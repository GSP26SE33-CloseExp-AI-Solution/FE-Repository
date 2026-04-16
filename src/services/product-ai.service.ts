// src/services/product-ai.service.ts

import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    WorkflowAnalyzeImageResultDto,
    WorkflowCreateAndPublishLotRequestDto,
    WorkflowCreateAndPublishLotResultDto,
    WorkflowCreateProductRequestDto,
    WorkflowCreateProductResultDto,
    WorkflowIdentifyResultDto,
} from "@/types/product-ai-workflow.type"

type WorkflowIdentifyRequestDto = {
    barcode: string
}

const unwrap = <T>(response: ApiResponse<T>): T => {
    if (!response?.success) {
        const message =
            response?.errors?.filter(Boolean).join(", ") ||
            response?.message ||
            "Yêu cầu thất bại"

        throw new Error(message)
    }

    return response.data
}

export const productAiService = {
    async identifyWorkflow(payload: WorkflowIdentifyRequestDto) {
        const response = await axiosClient.post<ApiResponse<WorkflowIdentifyResultDto>>(
            "/Products/workflow/identify",
            payload,
        )

        return unwrap(response.data)
    },

    async analyzeWorkflowImage(file: File, manualFallback = false) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("manualFallback", String(manualFallback))

        const response = await axiosClient.post<ApiResponse<WorkflowAnalyzeImageResultDto>>(
            "/Products/workflow/analyze-image",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        )

        return unwrap(response.data)
    },

    async createWorkflowProduct(payload: WorkflowCreateProductRequestDto) {
        const response = await axiosClient.post<ApiResponse<WorkflowCreateProductResultDto>>(
            "/Products/workflow/products",
            payload,
        )

        return unwrap(response.data)
    },

    async createAndPublishWorkflowLot(payload: WorkflowCreateAndPublishLotRequestDto) {
        console.log(
            "productAiService.createAndPublishWorkflowLot -> request payload:",
            payload,
        )

        try {
            const response =
                await axiosClient.post<ApiResponse<WorkflowCreateAndPublishLotResultDto>>(
                    "/Products/workflow/lots/create-and-publish",
                    payload,
                )

            console.log(
                "productAiService.createAndPublishWorkflowLot -> raw response:",
                response.data,
            )

            return unwrap(response.data)
        } catch (error: any) {
            console.error(
                "productAiService.createAndPublishWorkflowLot -> error:",
                error,
            )
            console.error(
                "productAiService.createAndPublishWorkflowLot -> error.response?.data:",
                error?.response?.data,
            )
            console.error(
                "productAiService.createAndPublishWorkflowLot -> error.response?.status:",
                error?.response?.status,
            )

            throw error
        }
    },
}
