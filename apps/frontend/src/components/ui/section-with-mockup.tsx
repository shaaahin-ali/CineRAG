'use client';

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface SectionWithMockupProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    primaryImageSrc: string;
    secondaryImageSrc: string;
    reverseLayout?: boolean;
}

const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
};

export const SectionWithMockup: React.FC<SectionWithMockupProps> = ({
    title,
    description,
    primaryImageSrc,
    secondaryImageSrc,
    reverseLayout = false,
}) => {
    const layoutClasses = reverseLayout
        ? "md:grid-cols-2 md:grid-flow-col-dense"
        : "md:grid-cols-2";

    const textOrderClass = reverseLayout ? "md:col-start-2" : "";
    const imageOrderClass = reverseLayout ? "md:col-start-1" : "";

    return (
        <section className="relative py-24 md:py-40 overflow-hidden z-10">
            <div className="container max-w-[1220px] w-full px-6 md:px-10 relative z-10 mx-auto">
                <motion.div
                    className={`grid grid-cols-1 gap-16 md:gap-8 w-full items-center ${layoutClasses}`}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    {/* Text Content */}
                    <motion.div
                        className={`flex flex-col items-start gap-4 mt-10 md:mt-0 max-w-[546px] mx-auto md:mx-0 ${textOrderClass}`}
                        variants={itemVariants}
                    >
                        <div className="space-y-2 md:space-y-1">
                            <h2 className="text-white text-4xl md:text-[50px] font-bold tracking-tighter leading-tight md:leading-[1.1]">
                                {title}
                            </h2>
                        </div>
                        <p className="text-[#a0a0a0] text-lg md:text-[18px] leading-relaxed mt-4">
                            {description}
                        </p>
                    </motion.div>

                    {/* Image Content */}
                    <motion.div
                        className={`relative mt-10 md:mt-0 mx-auto ${imageOrderClass} w-full max-w-[300px] md:max-w-[471px]`}
                        variants={itemVariants}
                    >
                        {/* Decorative background card */}
                        <div
                            className="absolute w-[300px] h-[317px] md:w-[472px] md:h-[500px] rounded-[32px] z-0 overflow-hidden"
                            style={{
                                top: reverseLayout ? "auto" : "10%",
                                bottom: reverseLayout ? "10%" : "auto",
                                left: reverseLayout ? "auto" : "-20%",
                                right: reverseLayout ? "-20%" : "auto",
                                filter: "blur(8px)",
                                transform: "translateY(10%)",
                            }}
                        >
                            <Image
                                src={secondaryImageSrc}
                                alt=""
                                fill
                                sizes="472px"
                                className="object-cover grayscale contrast-125"
                                loading="lazy"
                            />
                        </div>

                        {/* Main mockup card */}
                        <div className="relative w-full h-[405px] md:h-[637px] bg-[#ffffff0a] rounded-[32px] backdrop-blur-[15px] border border-white/10 z-10 overflow-hidden shadow-2xl">
                            <Image
                                src={primaryImageSrc}
                                alt=""
                                fill
                                sizes="(max-width: 768px) 300px, 471px"
                                className="object-cover grayscale contrast-125 brightness-90"
                                loading="lazy"
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Decorative bottom gradient */}
            <div
                className="absolute w-full h-px bottom-0 left-0 z-0"
                style={{
                    background:
                        "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)",
                }}
            />
        </section>
    );
};
