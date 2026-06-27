'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Film, Globe, Share2, Play, Users2 } from 'lucide-react';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    label: 'Product',
    links: [
      { title: 'Features', href: '/features' },
      { title: 'Testimonials', href: '/testimonials' },
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'About', href: '/about' },
    ],
  },
  {
    label: 'Company',
    links: [
      { title: 'About Us', href: '/about' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
      { title: 'Contact', href: '#' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { title: 'Documentation', href: '#' },
      { title: 'Malayalam AI', href: '#' },
      { title: 'Scene Citations', href: '#' },
      { title: 'Help', href: '#' },
    ],
  },
  {
    label: 'Social Links',
    links: [
      { title: 'Facebook', href: '#', icon: Globe },
      { title: 'Instagram', href: '#', icon: Share2 },
      { title: 'Youtube', href: '#', icon: Play },
      { title: 'LinkedIn', href: '#', icon: Users2 },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative w-full border-t border-white/8 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.04),transparent)] px-6 py-12 lg:py-16">
      <div className="bg-white/10 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="mx-auto max-w-6xl grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-amber-400" />
            <span className="text-lg font-bold tracking-tight text-white">CineRAG</span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
            AI-powered screenplay analysis for Mollywood film crews. Query in Malayalam or English.
          </p>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} CineRAG. All rights reserved.
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  {section.label}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-white"
                      >
                        {link.icon && <link.icon className="h-3.5 w-3.5" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
