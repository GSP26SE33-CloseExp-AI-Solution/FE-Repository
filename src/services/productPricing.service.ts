import { priceSuggestionMock } from "../mocks/fakePriceSuggestion.mock";

export type PriceSuggestionResponse = typeof priceSuggestionMock;

export function getPriceSuggestion(): Promise<PriceSuggestionResponse> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(priceSuggestionMock);
        }, 800);
    });
}
