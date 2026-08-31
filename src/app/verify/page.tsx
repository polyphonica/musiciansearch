import { Suspense } from "react";
import { isMockOtpEnabled } from "@/lib/config";
import { VerifyForm } from "./verify-form";

export default function VerifyPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <Suspense>
        <VerifyForm mockEnabled={isMockOtpEnabled()} />
      </Suspense>
    </div>
  );
}
