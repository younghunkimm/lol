import { AnimatePresence, animate, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const numberFormatter = new Intl.NumberFormat("ko-KR");

function getMetricParts(metric) {
    const text = String(metric);
    const value = Number(text.replace(/[^\d.-]/g, ""));

    return {
        value: Number.isFinite(value) ? value : null,
        prefix: text.startsWith("+") ? "+" : "",
        suffix: text.includes("%") ? "%" : text.includes("원") ? "원" : "",
    };
}

function AnimatedMetric({ metric }) {
    const { value: target, prefix, suffix } = getMetricParts(metric);
    const previousTarget = useRef(target);
    const [value, setValue] = useState(target);

    useEffect(() => {
        if (target === null) {
            return undefined;
        }

        const from = previousTarget.current ?? target;
        previousTarget.current = target;

        const controls = animate(from, target, {
            duration: 0.5,
            ease: "easeOut",
            onUpdate: (latest) => setValue(Math.round(latest)),
        });

        return () => controls.stop();
    }, [target]);

    if (value === null) {
        return metric;
    }

    return `${prefix}${numberFormatter.format(value)}${suffix}`;
}

function AnimatedLeaderValue({ value }) {
    const names = Array.isArray(value) ? value : [value];
    const valueKey = names.join("|");

    return (
        <AnimatePresence initial={false} mode="wait">
            <motion.span
                className="block"
                key={valueKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
            >
                {names.map((name) => (
                    <span className="block truncate" key={name}>
                        {name}
                    </span>
                ))}
            </motion.span>
        </AnimatePresence>
    );
}

export function LeaderSummary({ leaders }) {
    return (
        <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            {leaders.map((leader) => {
                return (
                    <article
                        className={`flex flex-col justify-between items-start gap-2 rounded-2xl border p-3 shadow-sm shadow-black/20 sm:p-4 ${leader.borderColor} ${leader.bgColor}`}
                        key={leader.label}
                    >
                        <span
                            className={`block text-[11px] font-extrabold sm:text-xs ${leader.textColor}`}
                        >
                            {leader.label}
                        </span>
                        <strong className="block w-full text-lg font-black leading-tight text-slate-50 sm:text-xl">
                            <AnimatedLeaderValue value={leader.value} />
                        </strong>
                        <em
                            className={`inline-flex rounded-full px-2.5 py-1 text-sm font-black not-italic ${leader.borderColor} ${leader.bgColor}`}
                        >
                            <AnimatedMetric metric={leader.metric} />
                        </em>
                    </article>
                );
            })}
        </section>
    );
}
