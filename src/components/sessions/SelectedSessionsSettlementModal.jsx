import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatSignedMoney, getSignedMoneyClass } from "../../lib/utils";
import { CloseIcon, LoadingIcon } from "../shared/ActionIcons";
import { AnimatedNumber } from "../shared/motion";
import { Button, EmptyState } from "../shared/ui";

function SettlementRow({ row }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5">
            <div className="min-w-0">
                <strong className="block truncate text-sm font-extrabold text-slate-200">
                    {row.name}
                </strong>
                <span className="mt-0.5 block text-xs font-bold text-slate-400">
                    <span className="text-cyan-300">{row.wins}승</span>{" "}
                    <span className="text-rose-300">{row.losses}패</span>
                </span>
            </div>
            <strong className={`text-base font-black ${getSignedMoneyClass(row.net)}`}>
                <AnimatedNumber
                    animateInitial
                    format={formatSignedMoney}
                    value={row.net}
                />
            </strong>
        </div>
    );
}

export function SelectedSessionsSettlementModal({
    error,
    isLoading,
    isOpen,
    rows,
    selectedCount,
    totalGames,
    onClose,
}) {
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const scrollY = window.scrollY;
        const { body, documentElement } = document;
        const previousStyles = {
            overflow: body.style.overflow,
            paddingRight: body.style.paddingRight,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
        };
        const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";

        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousStyles.overflow;
            body.style.paddingRight = previousStyles.paddingRight;
            body.style.position = previousStyles.position;
            body.style.top = previousStyles.top;
            body.style.width = previousStyles.width;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="선택 세션 합산 정산"
                    transition={{ duration: 0.2 }}
                >
                    <motion.section
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-auto rounded-3xl border border-white/10 bg-[#111722] p-4 shadow-2xl shadow-black/40 sm:p-6"
                        exit={{ opacity: 0, scale: 0.88 }}
                        initial={{ opacity: 0, scale: 0.88 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-slate-50">
                                    합산 정산
                                </h2>
                                <p className="mt-1 text-sm font-bold text-slate-400">
                                    {selectedCount}개 세션 · {totalGames}게임
                                </p>
                            </div>
                            <Button
                                aria-label="닫기"
                                type="button"
                                title="닫기"
                                onClick={onClose}
                            >
                                <CloseIcon />
                            </Button>
                        </div>

                        <div className="mt-5 grid gap-2">
                            {isLoading ? (
                                <div className="grid min-h-40 place-items-center rounded-2xl bg-white/[0.04] text-sm font-bold text-slate-400">
                                    <span className="inline-flex items-center gap-2">
                                        <LoadingIcon className="size-4" />
                                        정산을 계산하는 중입니다.
                                    </span>
                                </div>
                            ) : error ? (
                                <EmptyState>{error}</EmptyState>
                            ) : totalGames === 0 ? (
                                <EmptyState>선택한 세션에 승패 기록이 없습니다.</EmptyState>
                            ) : (
                                rows.map((row) => (
                                    <SettlementRow key={row.id} row={row} />
                                ))
                            )}
                        </div>
                    </motion.section>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
