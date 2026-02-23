import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic captures",
    features: [
      "10 screenshots per day",
      "1x resolution",
      "Viewport-only capture",
      "PNG & JPG export",
      "Basic history",
    ],
    cta: "Start free",
    variant: "brand-outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For designers and developers",
    features: [
      "100 screenshots per day",
      "2x & 3x resolution",
      "Full-page screenshots",
      "All device presets",
      "Element hiding",
      "Shareable links",
      "PNG, JPG, WebP & PDF",
    ],
    cta: "Upgrade to Pro",
    variant: "brand" as const,
    popular: true,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/month",
    description: "For teams and automation",
    features: [
      "Unlimited screenshots",
      "Team members",
      "REST API access",
      "White-label exports",
      "Priority queue",
      "Projects & folders",
      "Custom branding",
    ],
    cta: "Contact sales",
    variant: "brand-outline" as const,
    popular: false,
  },
];

const PricingSection = () => (
  <section id="pricing" className="py-24 bg-brand-gradient-subtle relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-muted-foreground">
          Start free. Upgrade when you need more.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-8 rounded-2xl border bg-card ${
              plan.popular ? "border-primary shadow-brand scale-105" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-gradient rounded-full text-xs font-semibold text-primary-foreground">
                Most popular
              </div>
            )}
            <div className="mb-6">
              <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant={plan.variant} className="w-full" size="lg">
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
