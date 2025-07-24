import { useState } from "react";
import { useIntl } from "@umijs/max";

type Props = {
  onOk: () => void;
  onCancel: () => void;
  selectedFlowId: string;
  selectedCycle: number | null;
  selectedTurnBackMode: "true" | "false" | null;
};

function useStep({
  onOk,
  onCancel,
  selectedFlowId,
  selectedCycle,
  selectedTurnBackMode,
}: Props) {
  const { formatMessage } = useIntl();
  const [currentStep, setCurrentStep] = useState<"init" | "backTo" | "forceQA">(
    "init"
  );

  const next = () => {
    if (currentStep === "init") {
      setCurrentStep("backTo");
    } else if (currentStep === "backTo") {
      setCurrentStep("forceQA");
    } else if (currentStep === "forceQA") {
      onOk();
    }
  };

  const prev = () => {
    if (currentStep === "init") {
      onCancel();
    } else if (currentStep === "backTo") {
      setCurrentStep("init");
    } else if (currentStep === "forceQA") {
      setCurrentStep("backTo");
    }
  };

  const isNextBtnDisabled = () => {
    if (currentStep === "init") {
      return !selectedFlowId;
    }
    if (currentStep === "backTo") {
      return selectedCycle === null;
    }

    if (currentStep === "forceQA") {
      return selectedTurnBackMode === null;
    }

    return false;
  };

  return {
    currentStep,
    reset: () => {
      setCurrentStep("init");
    },
    next: {
      goto: next,
      text:
        currentStep === "forceQA"
          ? formatMessage({ id: "common.ok" })
          : formatMessage({ id: "common.next-step" }),
      disabled: isNextBtnDisabled(),
    },
    prev: {
      goto: prev,
      text:
        currentStep === "init"
          ? formatMessage({ id: "common.close" })
          : formatMessage({ id: "common.prev-step" }),
    },
  };
}

export default useStep;
