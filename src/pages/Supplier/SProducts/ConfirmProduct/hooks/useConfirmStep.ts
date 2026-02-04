import { useState } from "react";

export const useConfirmStep = () => {
    const [step, setStep] = useState<"edit" | "ai" | "review">("edit");

    const locked = step !== "edit";

    return { step, setStep, locked };
};
