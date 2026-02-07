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
      className={`grid gap-6 sm:gap-8 ${
        categoriesToShow.length === 1 ? "max-w-md mx-auto" : categoriesToShow.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
      }`}
    >
      {categoriesToShow.map((category) => {
        const items = grouped[category];
        const label = PLAN_GROUP_LABELS[category];
        const features = PLAN_GROUP_FEATURES[category];
        const isPopular = category === "PT";

        return (
          <article
            key={category}
            className={`liquid-glass rounded-2xl overflow-hidden border flex flex-col ${
              isPopular
                ? "border-brand-red/50 shadow-[0_0_0_1px_rgba(255,0,0,0.25),0_12px_40px_rgba(0,0,0,0.4),0_0_24px_rgba(255,0,0,0.12)] md:-mt-2 md:mb-2"
                : "border-white/10 hover:border-brand-red/30 transition-colors"
            }`}
          >
            <div className="p-6 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-stone-100 uppercase tracking-tight">
                  {label}
                </h3>
                {isPopular && (
                  <span className="text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-brand-red/15 text-brand-red border border-brand-red/30">
                    Popular
                  </span>
                )}
              </div>
            </div>

            {/* Pricing table */}
            <div className="p-6 pt-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                Pricing
              </p>
              <ul className="space-y-2 mb-6">
                {items.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-stone-300 text-sm">{getDurationLabel(plan)}</span>
                    <span className="text-stone-100 font-semibold">{formatPrice(getTotalPrice(plan))}</span>
                  </li>
                ))}
              </ul>

              {/* Feature list */}
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                What&apos;s included
              </p>
              <ul className="space-y-2.5 mb-6">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-stone-300">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleGetStarted}
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition ${
                  isPopular
                    ? "bg-brand-red text-white hover:opacity-90"
                    : "border border-stone-600 text-stone-100 hover:border-brand-red/50 hover:text-brand-red"
                }`}
              >
                Get started
              </button>
            </div>
          </article>
        );
      })}

      {/* Call / contact prompt when coming from Get started */}
      {showCallPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="get-started-prompt-title"
          onClick={() => setShowCallPrompt(false)}
        >
          <div
            className="liquid-glass rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="get-started-prompt-title" className="text-lg font-bold text-stone-100 mb-2">
              Get started
            </h3>
            <p className="text-stone-300 text-sm mb-4">
              Call us now to join or ask about plans. You can also use the contact section below.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={CONTACT_PHONE.tel}
                onClick={handleCallNow}
                className="flex-1 text-center py-3 rounded-xl font-semibold text-sm bg-brand-red text-white hover:opacity-90 transition"
              >
                Call {CONTACT_PHONE.display}
              </a>
              <button
                type="button"
                onClick={handleViewContact}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border border-stone-600 text-stone-100 hover:border-brand-red/50 hover:text-brand-red transition"
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
