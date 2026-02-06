import type { MembershipPlan } from "@/models/membership_plan";

type PlanCardProps = {
  plan: MembershipPlan;
};

export function PlanCard({ plan }: PlanCardProps) {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(plan.price_monthly);

  const isPopular = /most popular/i.test(plan.description ?? "") || /core/i.test(plan.name);

  return (
    <article
      className={[
        "liquid-glass p-6 flex flex-col relative overflow-hidden",
        isPopular &&
          "border-lime-400/50 shadow-[0_0_0_1px_rgba(163,230,53,0.2),0_12px_40px_rgba(0,0,0,0.4),0_0_24px_rgba(163,230,53,0.08)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(34,211,238,0.10),transparent)]" />
      {isPopular && (
        <div className="absolute top-4 right-4 z-10 text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-lime-400/15 text-lime-300 border border-lime-400/30">
          Most popular
        </div>
      )}
      <h3
        className={[
          "text-xl font-semibold text-stone-100 mb-2 relative",
          isPopular && "pr-32",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {plan.name}
      </h3>
      {plan.description && (
        <p
          className={[
            "text-stone-300/80 text-sm mb-5 flex-1 relative",
            isPopular && "pr-32",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {plan.description}
        </p>
      )}
      <p className="text-3xl font-bold text-lime-300 mb-1 relative">
        {price}
        <span className="text-stone-400 text-base font-normal">/month</span>
      </p>
      <p className="text-stone-400 text-sm mb-6 relative">
        {plan.duration_days} days
      </p>
      <a
        href="#plans"
        className={[
          "inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm transition relative",
          isPopular
            ? "bg-lime-400 text-stone-950 hover:bg-lime-300"
            : "border border-stone-600 text-stone-100 hover:border-stone-500 hover:bg-stone-800/40",
        ].join(" ")}
      >
        Get started
      </a>
    </article>
  );
}
