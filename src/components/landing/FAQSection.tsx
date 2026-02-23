import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How does Viewport capture screenshots?",
    a: "Viewport uses a server-side Chromium browser to render your page exactly as a real user would see it. We wait for animations, lazy-loaded content, and network requests to complete before capturing.",
  },
  {
    q: "Can I capture pages behind authentication?",
    a: "Not yet, but we're working on cookie injection and authenticated sessions for a future release.",
  },
  {
    q: "What devices are supported?",
    a: "We support desktop (1440×900, 1920×1080), iPhone 15 Pro, Pixel 8, and iPad Pro — all in both portrait and landscape orientations.",
  },
  {
    q: "How do shareable links work?",
    a: "You can generate a public URL for any screenshot. Optionally set an expiry date, add password protection, or disable downloads.",
  },
  {
    q: "Is there an API?",
    a: "Yes — Agency plan users get full REST API access with API keys. POST a URL and device config, and we return screenshots programmatically.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. You can upgrade, downgrade, or cancel at any time from the billing page. No lock-in.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-24 bg-background">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-4xl font-bold mb-4">
          Frequently asked questions
        </h2>
        <p className="text-muted-foreground">
          Can't find what you're looking for? Reach out to our support team.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border rounded-xl px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQSection;
