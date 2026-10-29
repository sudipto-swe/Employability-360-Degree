"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Crown,
  Loader2,
  Star,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SubscriptionInfo {
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  aiUsageCount: number;
}

export default function JobseekerSubscriptionPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    async function fetchSubInfo() {
      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setSubInfo(result.data);
          }
        }
      } catch (err) {
        console.error("Error fetching subscription info:", err);
      }
    }
    fetchSubInfo();
  }, []);

  async function handleSubscribe(planId: string) {
    if (planId === "FREE") return;
    setIsLoading(planId);
    try {
      const res = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.gatewayUrl) {
        window.location.assign(data.gatewayUrl);
      } else {
        toast.error("Could not initialize payment.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setIsLoading(null);
    }
  }

  const currentTier = subInfo?.subscriptionTier?.toUpperCase() || "FREE";
  const isExpired = subInfo?.subscriptionExpiresAt
    ? new Date() > new Date(subInfo.subscriptionExpiresAt)
    : false;

  const PLANS = [
    {
      name: "FREE",
      price: 0,
      period: "forever",
      features: [
        "Total 5 AI Feature usages",
        "AI CV builder basic generation",
        "Mock interview basic coach (1 job title)",
        "Standard job circular views",
      ],
      icon: Zap,
      badge: "Free",
    },
    {
      name: "SILVER",
      price: 199,
      period: "month",
      features: [
        "Total 25 AI Feature usages",
        "AI Professional CV summary polish",
        "Mock interview coach (3 job titles)",
        "AI circular match scoring",
      ],
      icon: Crown,
      badge: "Pro Seeker",
      popular: true,
    },
    {
      name: "GOLD",
      price: 249,
      period: "month",
      features: [
        "Total 50 AI Feature usages",
        "Speech-to-text voice answer coach",
        "Mock interview coach (10 job titles)",
        "Resume parser structured imports",
        "Recommended jobs matching feed",
      ],
      icon: Star,
      badge: "Elite",
    },
    {
      name: "PLATINUM",
      price: 299,
      period: "month",
      features: [
        "Total 100 AI Feature usages",
        "Direct LinkedIn summary generator",
        "Uncapped interview coach job categories",
        "Detailed correct answers guide & advice",
        "Voice call simulation on Messaging",
        "Premium dashboard metrics & visitors logs",
      ],
      icon: Award,
      badge: "Ultimate Seeker",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-gradient">
          Job Seeker Subscription Tiers
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Supercharge your career prep. Upgrade to unlock advanced AI capabilities, resume builders, and interview coaches.
        </p>
      </div>

      {subInfo && (
        <Card className="max-w-md mx-auto border bg-card/50 backdrop-blur-md shadow-sm">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active Tier</p>
              <h3 className="font-bold text-lg text-primary flex items-center gap-1.5 mt-0.5">
                {isExpired ? "FREE (Expired)" : currentTier}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-semibold">AI Usages</p>
              <p className="font-bold text-base mt-0.5">
                {subInfo.aiUsageCount} / {currentTier === "FREE" || isExpired ? 5 : currentTier === "SILVER" ? 25 : currentTier === "GOLD" ? 50 : 100}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isPlanActive = !isExpired && currentTier === plan.name;
          const isFree = plan.name === "FREE";

          return (
            <Card
              key={plan.name}
              className={`flex flex-col py-6 relative border transition-all duration-300 ${
                plan.popular ? "border-primary shadow-md scale-[1.02]" : "hover:border-primary/50"
              } ${isPlanActive ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-brand text-white border-0 px-3">
                  Best Value
                </Badge>
              )}

              <CardHeader className="pt-0 text-center flex-grow-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <plan.icon className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary" className="mx-auto mb-1">
                  {plan.badge}
                </Badge>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="mt-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    ৳{plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-grow space-y-6 pt-4">
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <Button variant="outline" className="w-full text-xs font-semibold" disabled>
                    {currentTier === "FREE" ? "Current Plan" : "Included"}
                  </Button>
                ) : isPlanActive ? (
                  <Button variant="outline" className="w-full text-xs font-semibold border-primary text-primary hover:bg-primary/5" disabled>
                    Active Plan
                  </Button>
                ) : (
                  <Button
                    className={`w-full text-xs font-semibold ${
                      plan.popular
                        ? "gradient-brand text-white border-0 hover:opacity-90 shadow"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={!!isLoading}
                  >
                    {isLoading === plan.name ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Upgrade Tier
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground space-y-1 mt-6">
        <p>Payments are securely processed via SSLCommerz 🔒</p>
        <p>All plans are subject to monthly renewal cycles. Upgrade upgrades instantly.</p>
      </div>
    </div>
  );
}
