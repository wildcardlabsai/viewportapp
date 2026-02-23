import { motion } from "framer-motion";
import {
  Monitor, Smartphone, RotateCcw, Maximize2,
  ImageIcon, EyeOff, Link2, Code2
} from "lucide-react";

const features = [
  {
    icon: Monitor,
    title: "Multi-device capture",
    description: "Desktop, mobile, and tablet presets — iPhone, Pixel, iPad, and custom viewports.",
  },
  {
    icon: RotateCcw,
    title: "Portrait & landscape",
    description: "Capture both orientations automatically with a single click.",
  },
  {
    icon: Maximize2,
    title: "Full-page screenshots",
    description: "Scroll the entire page and stitch together a complete capture.",
  },
  {
    icon: ImageIcon,
    title: "High-resolution exports",
    description: "Export at 1x, 2x, or 3x resolution in PNG, JPG, WebP, or PDF.",
  },
  {
    icon: EyeOff,
    title: "Hide cookie banners & popups",
    description: "Automatically remove intrusive UI elements before capture.",
  },
  {
    icon: Link2,
    title: "Shareable links",
    description: "Generate public links with optional expiry and password protection.",
  },
  {
    icon: Code2,
    title: "API access",
    description: "Integrate captures into your CI/CD pipeline or docs workflow.",
  },
  {
    icon: Smartphone,
    title: "Delay before capture",
    description: "Wait for animations, lazy-loaded content, and dynamic elements.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-background relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Everything you need to{" "}
          <span className="text-gradient">capture the web</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          From quick viewport screenshots to full-page captures at retina resolution — Viewport handles it all.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={item}
            className="group p-6 rounded-2xl border bg-card hover:shadow-brand transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center mb-4">
              <feature.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
