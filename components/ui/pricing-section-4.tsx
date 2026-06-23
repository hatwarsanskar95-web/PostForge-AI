"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Free",
    planId: "free",
    description: "Experience the platform for free.",
    price: 0,
    yearlyPrice: 0,
    buttonText: "Current Plan",
    buttonVariant: "outline" as const,
    includes: [
      "3 AI Generations per Week",
      "Post Generator",
      "Content Improver",
      "Achievement Generator",
      "Case Study Forge",
      "Resume To Posts",
      "Image To Post"
    ],
  },
  {
    name: "Starter Pack",
    planId: "starter",
    description: "Perfect for students and job seekers.",
    price: 250,
    yearlyPrice: 2500,
    buttonText: "Upgrade to Starter",
    buttonVariant: "outline" as const,
    includes: [
      "10 AI Generations per Month",
      "Post Generator",
      "Content Improver",
      "Achievement Generator",
      "Case Study Forge",
      "Resume To Posts",
      "Image To Post"
    ],
  },
  {
    name: "Growth Pack",
    planId: "growth",
    description: "Ideal for professionals looking to grow their personal brand.",
    price: 450,
    yearlyPrice: 4499,
    yearlyPlanId: "annual",
    buttonText: "Upgrade to Growth",
    buttonVariant: "default" as const,
    popular: true,
    includes: [
      "30 AI Generations per Month",
      "Post Generator",
      "Content Improver",
      "Achievement Generator",
      "Case Study Forge",
      "Resume To Posts",
      "Image To Post"
    ],
  },
  {
    name: "Pro Pack",
    planId: "pro",
    description: "Designed for creators, freelancers, and agencies.",
    price: 899,
    yearlyPrice: 8990,
    buttonText: "Upgrade to Pro",
    buttonVariant: "outline" as const,
    includes: [
      "75 AI Generations per Month",
      "Post Generator",
      "Content Improver",
      "Achievement Generator",
      "Case Study Forge",
      "Resume To Posts",
      "Image To Post"
    ],
  },
];

const PricingSwitch = ({ isYearly, onSwitch }: { isYearly: boolean, onSwitch: (value: boolean) => void }) => {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-neutral-900 border border-gray-700 p-1">
        <button
          onClick={() => onSwitch(false)}
          className={cn(
            "relative z-10 w-fit h-10  rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors",
            !isYearly ? "text-white" : "text-gray-200",
          )}
        >
          {!isYearly && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full rounded-full border-4 shadow-sm shadow-indigo-600 border-indigo-600 bg-gradient-to-t from-indigo-500 to-indigo-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => onSwitch(true)}
          className={cn(
            "relative z-10 w-fit h-10 flex-shrink-0 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors",
            isYearly ? "text-white" : "text-gray-200",
          )}
        >
          {isYearly && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 h-10 w-full  rounded-full border-4 shadow-sm shadow-indigo-600 border-indigo-600 bg-gradient-to-t from-indigo-500 to-indigo-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">Yearly</span>
        </button>
      </div>
    </div>
  );
};

interface PricingSection4Props {
  prefill?: {
    name: string;
    email: string;
    contact: string;
  }
}

export default function PricingSection6({ prefill }: PricingSection4Props) {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };


  const handleCheckout = async (plan: any, isYearly: boolean) => {
    if (plan.price === 0) return; // Free plan
    
    try {
      setIsLoading(plan.name);
      const planId = isYearly && plan.yearlyPlanId ? plan.yearlyPlanId : plan.planId;
      const amount = isYearly ? plan.yearlyPrice : plan.price;
      
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        body: JSON.stringify({ planId, amount })
      });
      const order = await res.json();
      
      if (order.error) {
        alert(order.error);
        setIsLoading(null);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "PostForge AI",
        description: plan.name,
        order_id: order.id,
        prefill: prefill || {
          name: "",
          email: "",
          contact: ""
        },
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId: planId
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Subscription activated successfully!");
            window.location.href = "/dashboard";
          } else {
            alert("Payment verification failed");
          }
        },
        theme: { color: "#7c3aed" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        alert("Payment failed or cancelled");
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Failed to initiate checkout");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div
      className=" min-h-screen  mx-auto relative bg-transparent overflow-x-hidden pb-32"
      ref={pricingRef}
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0  h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] "
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px] "></div>
        <SparklesComp
          density={1800}
          direction="bottom"
          speed={1}
          color="#FFFFFF"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>
      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute left-0 top-[-114px] w-full h-[113.625vh] flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0 pointer-events-none"
      >
        <div className="framer-1i5axl2">
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full pointer-events-none"
            style={{
              border: "200px solid #4f46e5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
              opacity: 0.2
            }}
            data-border="true"
            data-framer-name="Ellipse 1"
          ></div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full pointer-events-none"
            style={{
              border: "200px solid #4f46e5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
              opacity: 0.2
            }}
            data-border="true"
            data-framer-name="Ellipse 2"
          ></div>
        </div>
      </TimelineContent>

      <article className="text-center mb-6 pt-32 max-w-3xl mx-auto space-y-2 relative z-50">
        <h2 className="text-4xl font-medium text-white">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center "
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0, 
            }}
          >
            Plans that work best for you
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-gray-300"
        >
          Trusted by thousands, we help creators all around the world. Explore which
          option is right for you.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
        >
          <div className="mt-8">
            <PricingSwitch isYearly={isYearly} onSwitch={setIsYearly} />
          </div>
        </TimelineContent>
      </article>

      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
        radial-gradient(circle at center, #4f46e5 0%, transparent 70%)
      `,
          opacity: 0.3,
          mixBlendMode: "screen",
        }}
      />

      <div className={`grid ${isYearly ? 'grid-cols-1 max-w-sm' : 'md:grid-cols-2 lg:grid-cols-4 max-w-7xl'} gap-6 py-6 mx-auto px-4`}>
        {plans
          .filter(p => !isYearly || p.planId === "growth")
          .map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="h-full"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="h-full"
            >
              <Card
                className={`relative h-full flex flex-col text-white border-neutral-800 ${
                  plan.popular && !isYearly
                    ? "bg-gradient-to-r from-neutral-900 via-[#10162a] to-neutral-900 shadow-[0px_-13px_100px_0px_rgba(79,70,229,0.3)] z-20 scale-105"
                    : isYearly 
                    ? "bg-gradient-to-r from-neutral-900 via-[#10162a] to-neutral-900 shadow-[0px_-13px_100px_0px_rgba(79,70,229,0.3)] z-20"
                    : "bg-[#0d1117] z-10"
                }`}
              >
                <CardHeader className="text-left pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {isYearly && <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2 py-1 rounded-full border border-indigo-500/30">Save 16%</span>}
                  </div>
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-semibold ">
                      ₹
                      <NumberFlow
                        format={{
                          currency: "INR",
                        }}
                        value={isYearly ? plan.yearlyPrice : plan.price}
                        className="text-4xl font-semibold"
                      />
                    </span>
                    <span className="text-gray-400 ml-1 text-sm font-medium">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 min-h-[40px]">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col">
                  <button
                    onClick={() => handleCheckout(plan, isYearly)}
                    disabled={isLoading === plan.name || plan.price === 0}
                    className={`w-full mb-6 p-3 text-sm font-semibold rounded-xl transition-all flex justify-center items-center gap-2 ${
                      plan.price > 0
                        ? "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 border border-indigo-500 text-white"
                        : "bg-neutral-800 text-gray-300 cursor-default"
                    }`}
                  >
                    {isLoading === plan.name ? "Processing..." : plan.buttonText}
                  </button>

                  <div className="space-y-3 pt-4 border-t border-[#1e2a4a] flex-1">
                    <h4 className="font-semibold text-sm mb-3 text-indigo-300">
                      {plan.includes[0]}
                    </h4>
                    <ul className="space-y-3">
                      {plan.includes.slice(1).map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full grid place-content-center flex-shrink-0 mt-2"></span>
                          <span className="text-[13px] text-gray-300 leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TimelineContent>
        ))}
      </div>
    </div>
  );
}
