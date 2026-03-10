"use client";

import { useState, useCallback } from "react";
import type { MembershipPlan } from "@/models/membership_plan";
import {
  PLAN_CATEGORIES,
  PLAN_GROUP_LABELS,
  PLAN_GROUP_FEATURES,
  getPlanGroup,
  type PlanCategory,
} from "@/data/plans";
import { MobileInViewHover } from "@/components/ui/mobile-in-view-hover";

const CONTACT_PHONE = { display: "999 666 7714", tel: "tel:+919996667714" };

type GroupedPlans = Record<PlanCategory, MembershipPlan[]>;

function groupPlans(plans: MembershipPlan[]): GroupedPlans {
  const grouped: GroupedPlans = { GT: [], PT: [], FT: [] };
  for (const p of plans) {
    const g = getPlanGroup(p.name);
    grouped[g].push(p);
  }
  return grouped;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDurationLabel(plan: MembershipPlan): string {
  const months = plan.duration_days / 30;
  if (months >= 12) return "12 months";
  if (months >= 6) return "6 months";
  if (months >= 3) return "3 months";
  if (plan.name.includes("Functional")) return "Functional classes";
  if (plan.name.includes("Group")) return "Group (3 members)";
  return "1 month";
}

function getTotalPrice(plan: MembershipPlan): number {
  if (plan.total_fee != null) return plan.total_fee;
  const months = plan.duration_days / 30;
  return Math.round(plan.price_monthly * months);
}

const CheckIcon = () => (
  <svg className="w-5 h-5 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

type Props = { plans: MembershipPlan[] };

export function PlanGroups({ plans }: Props) {
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const grouped = groupPlans(plans);
  const categoriesToShow = PLAN_CATEGORIES.filter((c) => grouped[c].length > 0);

  const handleGetStarted = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    setShowCallPrompt(true);
  }, []);

  const handleCallNow = useCallback(() => {
    setShowCallPrompt(false);
    window.location.href = CONTACT_PHONE.tel;
  }, []);

  const handleViewContact = useCallback(() => {
    setShowCallPrompt(false);
  }, []);

  return (
    <div
      className={`grid gap-6 sm:gap-8 items-stretch justify-items-center md:justify-items-stretch ${categoriesToShow.length === 1 ? "max-w-md mx-auto" : categoriesToShow.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
        }`}
    >
      {categoriesToShow.map((category) => {
        const items = grouped[category];
        const label = PLAN_GROUP_LABELS[category];
        const features = PLAN_GROUP_FEATURES[category];
        const isPopular = category === "PT";

        return (
          <div key={category} className="flex justify-center md:block w-full">
            <MobileInViewHover className="w-full max-w-md md:max-w-none h-full min-h-0 p-3 md:p-0">
              <article
                className={`bg-white rounded-2xl overflow-hidden shadow-md flex flex-col h-full transition-all duration-300 ease-out border ${isPopular
                    ? "border-[#EE2A24] md:-mt-2 md:mb-2 hover:scale-[1.04] hover:shadow-xl"
                    : "border-stone-200 hover:scale-[1.04] hover:shadow-lg hover:border-red-300"
                  }`}
              >
                <div className="p-6 pb-4 border-b border-stone-100">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-black uppercase tracking-tight">
                      {label}
                    </h3>
                    {isPopular && (
                      <span className="text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-red-100 text-[#EE2A24] border border-red-200">
                        Popular
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing table + features + button: flex-1 so button sits at bottom on desktop */}
                <div className="p-6 pt-4 flex flex-col flex-1 min-h-0">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                    Pricing
                  </p>
                  <ul className="space-y-2 mb-6">
                    {items.map((plan) => (
                      <li
                        key={plan.id}
                        className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 last:border-0"
                      >
                        <span className="text-stone-600 text-sm">{getDurationLabel(plan)}</span>
                        <span className="text-stone-900 font-semibold">{formatPrice(getTotalPrice(plan))}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Feature list */}
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                    What&apos;s included
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-stone-600">
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className={`mt-auto block w-full text-center py-3 rounded-xl font-semibold text-sm transition ${isPopular
                        ? "bg-[#EE2A24] text-white hover:bg-red-700"
                        : "border border-stone-300 text-stone-700 hover:border-red-300 hover:text-[#EE2A24]"
                      }`}
                  >
                    Get started
                  </button>
                </div>
              </article>
            </MobileInViewHover>
          </div>
        );
      })}

      {/* Call / contact prompt when coming from Get started */}
      {showCallPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="get-started-prompt-title"
          onClick={() => setShowCallPrompt(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="get-started-prompt-title" className="text-lg font-bold text-stone-900 mb-2">
              Get started
            </h3>
            <p className="text-stone-600 text-sm mb-4">
              Call us now to join or ask about plans. You can also use the contact section below.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={CONTACT_PHONE.tel}
                onClick={handleCallNow}
                className="flex-1 text-center py-3 rounded-xl font-semibold text-sm bg-[#EE2A24] text-white hover:bg-red-700 transition"
              >
                Call {CONTACT_PHONE.display}
              </a>
              <button
                type="button"
                onClick={handleViewContact}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border border-stone-300 text-stone-700 hover:border-red-300 hover:text-[#EE2A24] transition"
              >
                View contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
