import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function AnimatedList({
    as = "div",
    className,
    getKey,
    itemProps,
    items,
    ready = true,
    renderItem,
}) {
    const reducedMotion = useReducedMotion();
    const [canAnimate, setCanAnimate] = useState(false);
    const MotionItem = motion[as];
    const layoutDependency = items.map(getKey).join("|");

    useEffect(() => {
        if (!ready || reducedMotion) {
            const frame = window.requestAnimationFrame(() => {
                setCanAnimate(false);
            });

            return () => window.cancelAnimationFrame(frame);
        }

        const frame = window.requestAnimationFrame(() => {
            setCanAnimate(true);
        });

        return () => window.cancelAnimationFrame(frame);
    }, [ready, reducedMotion]);

    return (
        <AnimatePresence initial={false}>
            {items.map((item, index) => (
                <MotionItem
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={
                        typeof className === "function"
                            ? className(item, index)
                            : className
                    }
                    exit={
                        canAnimate
                            ? { opacity: 0, scale: 0.96 }
                            : undefined
                    }
                    initial={
                        canAnimate
                            ? { opacity: 0, y: 16, scale: 0.96 }
                            : false
                    }
                    key={getKey(item)}
                    layout={canAnimate}
                    layoutDependency={layoutDependency}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    {...(itemProps ? itemProps(item, index) : {})}
                >
                    {renderItem(item, index)}
                </MotionItem>
            ))}
        </AnimatePresence>
    );
}

export function AnimatedNumber({
    animateInitial = false,
    enabled = true,
    format,
    value,
}) {
    const reducedMotion = useReducedMotion();
    const initialValue = animateInitial ? 0 : value;
    const previousValue = useRef(initialValue);
    const [displayValue, setDisplayValue] = useState(initialValue);

    useEffect(() => {
        if (!enabled || reducedMotion) {
            previousValue.current = value;
            return undefined;
        }

        const controls = animate(previousValue.current, value, {
            duration: 0.6,
            ease: "easeOut",
            onUpdate: (nextValue) => setDisplayValue(Math.round(nextValue)),
            onComplete: () => {
                previousValue.current = value;
            },
        });

        return () => controls.stop();
    }, [enabled, reducedMotion, value]);

    return format(enabled && !reducedMotion ? displayValue : value);
}

export function AnimatedText({ animateInitial = false, children, value }) {
    const reducedMotion = useReducedMotion();

    return (
        <AnimatePresence initial={animateInitial} mode="wait">
            <motion.span
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                key={value}
                transition={{ duration: 0.24, ease: "easeOut" }}
            >
                {children}
            </motion.span>
        </AnimatePresence>
    );
}
