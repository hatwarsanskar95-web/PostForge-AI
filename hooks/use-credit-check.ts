"use client";

import { useCreditModal } from "@/components/ui/credit-modal-provider";
import { checkGenerationAccess } from "@/app/actions/usage";

export function useCreditCheck() {
  const { showModal } = useCreditModal();

  const verifyCredits = async () => {
    try {
      const res = await checkGenerationAccess();
      if (!res?.ok) {
        let resetStr = null;
        if (res?.usage?.next_reset_date) {
          const dateObj = new Date(res.usage.next_reset_date);
          resetStr = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        }
        showModal(resetStr);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Failed to verify credits:", err);
      // Fail safe or fail secure? Since we are enforcing credits, fail secure.
      showModal(null);
      return false;
    }
  };

  return { verifyCredits };
}
