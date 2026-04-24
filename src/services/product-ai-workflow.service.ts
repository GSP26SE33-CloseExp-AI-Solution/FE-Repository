import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    GetWorkflowMarketPriceReferenceQuery,
    WorkflowAnalyzeImageResultDto,
    WorkflowCreateAndPublishLotRequestDto,
    WorkflowCreateAndPublishLotResultDto,
    WorkflowCreateProductRequestDto,
    WorkflowCreateProductResultDto,
    WorkflowIdentifyResultDto,
    WorkflowMarketPriceReferenceDto,
} from "@/types/product-ai-workflow.type"

type WorkflowIdentifyRequestDto = {
    barcode: string
}

const unwrap = <T,>(response?: ApiResponse<T> | null): T => {
    if (!response) {
        throw new Error("Không nhận được phản hồi từ máy chủ")
    }

    if (!response.success) {
        const message =
            response.errors?.filter(Boolean).join(", ") ||
            response.message ||
            "Yêu cầu thất bại"

        throw new Error(message)
    }

    return response.data
}

export const productAiService = {
    async identifyWorkflow(
        payload: WorkflowIdentifyRequestDto,
    ): Promise<WorkflowIdentifyResultDto> {
        const response = await axiosClient.post<ApiResponse<WorkflowIdentifyResultDto>>(
            "/Products/workflow/identify",
            payload,
        )

        return unwrap(response.data)
    },

    async analyzeWorkflowImage(
        file: File,
        manualFallback = false,
    ): Promise<WorkflowAnalyzeImageResultDto> {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("manualFallback", String(manualFallback))

        const response = await axiosClient.post<ApiResponse<WorkflowAnalyzeImageResultDto>>(
            "/Products/workflow/analyze-image",
            formData,
        )

        return unwrap(response.data)
    },

    async createWorkflowProduct(
        payload: WorkflowCreateProductRequestDto,
    ): Promise<WorkflowCreateProductResultDto> {
        const response = await axiosClient.post<ApiResponse<WorkflowCreateProductResultDto>>(
            "/Products/workflow/products",
            payload,
        )

        return unwrap(response.data)
    },

    async createAndPublishWorkflowLot(
        payload: WorkflowCreateAndPublishLotRequestDto,
    ): Promise<WorkflowCreateAndPublishLotResultDto> {
        const response =
            await axiosClient.post<ApiResponse<WorkflowCreateAndPublishLotResultDto>>(
                "/Products/workflow/lots/create-and-publish",
                payload,
            )

        return unwrap(response.data)
    },

    async getMarketPriceReference(
        query: GetWorkflowMarketPriceReferenceQuery,
    ): Promise<WorkflowMarketPriceReferenceDto> {
        const response = await axiosClient.get<ApiResponse<WorkflowMarketPriceReferenceDto>>(
            "/Products/workflow/market-price-reference",
            {
                params: {
                    barcode: query.barcode?.trim() || undefined,
                    productName: query.productName?.trim() || undefined,
                    autoCrawl: query.autoCrawl ?? true,
                },
            },
        )

        return unwrap(response.data)
    },
}
