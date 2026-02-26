import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth, PLAN_TIERS } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    key: "free",
    price: "$0",
    period: "forever",
    description: "Get started with basic captures",
    features: [
      "10 screenshots per day",
      "1x resolution",
      "Standard capture",
      "PNG & JPG export",
      "Basic history",
    ],
    cta: "Start free",
    variant: "brand-outline" as const,
    popular: false,
    priceId: null,
  },
  {
    name: "Pro",
    key: "pro",
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
    priceId: PLAN_TIERS.pro.price_id,
  },
  {
    name: "Agency",
    key: "agency",
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
    cta: "Upgrade to Agency",
    variant: "brand-outline" as const,
    popular: false,
    priceId: PLAN_TIERS.agency.price_id,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();
  const { user, plan: currentPlan } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | null, planKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!priceId || planKey === "free") return;
    
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
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
          {plans.map((plan, i) => {
            const isCurrentPlan = currentPlan === plan.key;
            return (
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
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-accent rounded-full text-xs font-semibold text-accent-foreground">
                    Your Plan
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
                <Button
                  variant={plan.variant}
                  className="w-full"
                  size="lg"
                  disabled={isCurrentPlan || loadingPlan === plan.key}
                  onClick={() => handleSubscribe(plan.priceId, plan.key)}
                >
                  {loadingPlan === plan.key && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isCurrentPlan ? "Current Plan" : plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
