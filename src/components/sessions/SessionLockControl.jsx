import { motion, useReducedMotion } from "motion/react";
import { LockIcon } from "../shared/LockIcon";

export function SessionLockControl({
    isLocked,
    isUpdating = false,
    onToggle,
    className = "size-10",
    variant = "box",
}) {
    const reducedMotion = useReducedMotion();
    const isInteractive = typeof onToggle === "function";
    const isIconOnly = variant === "icon";
    const label = isInteractive
        ? isLocked
            ? "세션 잠금 해제"
            : "세션 잠금 설정"
        : isLocked
          ? "잠금 활성"
          : "잠금 비활성";
    const MotionElement = isInteractive ? motion.button : motion.span;

    return (
        <MotionElement
            animate={reducedMotion ? undefined : { scale: isLocked ? 1 : 0.96 }}
            aria-label={label}
            aria-pressed={isInteractive ? isLocked : undefined}
            className={`grid place-items-center duration-200 ${
                isIconOnly
                    ? "transition-colors"
                    : "min-h-10 rounded-xl border transition-[color,background-color,border-color,box-shadow]"
            } ${
                isInteractive
                    ? "hover:shadow-lg hover:shadow-amber-400/10 disabled:opacity-60"
                    : ""
            } ${
                isLocked
                    ? isIconOnly
                        ? "text-amber-300"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                    : isIconOnly
                      ? "text-slate-500"
                      : "border-white/10 bg-white/[0.06] text-slate-500"
            } ${className}`.trim()}
            disabled={isInteractive ? isUpdating : undefined}
            role={isInteractive ? undefined : "img"}
            title={label}
            transition={{ duration: 0.22, ease: "easeOut" }}
            type={isInteractive ? "button" : undefined}
            onClick={onToggle}
        >
            <motion.span transition={{ duration: 0.22, ease: "easeOut" }}>
                <LockIcon />
            </motion.span>
        </MotionElement>
    );
}
