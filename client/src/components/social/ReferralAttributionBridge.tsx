import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef } from "react";

const PENDING_REFERRAL_KEY = "ice-snow-city:pending-referral";
const REFERRAL_CODE_PATTERN = /^[1-9]\d{0,9}$/;

export default function ReferralAttributionBridge() {
  const { user } = useAuth();
  const claimReferral = trpc.referrals.claim.useMutation();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && REFERRAL_CODE_PATTERN.test(ref)) {
      window.localStorage.setItem(PENDING_REFERRAL_KEY, ref);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const pendingReferral = window.localStorage.getItem(PENDING_REFERRAL_KEY);
    if (!pendingReferral || attemptedRef.current === pendingReferral) return;

    attemptedRef.current = pendingReferral;
    claimReferral
      .mutateAsync({
        referrerUserId: Number(pendingReferral),
        referralCode: pendingReferral,
      })
      .then((result) => {
        if (
          result.claimed ||
          result.reason === "already_claimed" ||
          result.reason === "self_referral" ||
          result.reason === "referrer_not_found" ||
          result.reason === "invalid_code"
        ) {
          window.localStorage.removeItem(PENDING_REFERRAL_KEY);
        }
      })
      .catch(() => {
        attemptedRef.current = null;
      });
  }, [user?.id]);

  return null;
}
