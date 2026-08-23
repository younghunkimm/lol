const iconClassName = "block size-5";

export function PlusIcon({ className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`${iconClassName} ${className}`.trim()}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function TrashIcon({ className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`${iconClassName} ${className}`.trim()}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
        </svg>
    );
}

export function CloseIcon({ className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`${iconClassName} ${className}`.trim()}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m6 6 12 12M18 6 6 18" />
        </svg>
    );
}

export function PencilIcon({ className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`${iconClassName} ${className}`.trim()}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m14.5 5.5 4 4M4 20l3.5-.8L19.2 7.5a2.8 2.8 0 0 0-4-4L3.5 15.2 4 20Z" />
        </svg>
    );
}

export function MoreIcon({ className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`${iconClassName} ${className}`.trim()}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function LoadingIcon({ className = "" }) {
    return (
        <svg
            aria-hidden="true"
            className={`${iconClassName} animate-spin ${className}`.trim()}
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
            />
            <path
                className="opacity-75"
                d="M12 3a9 9 0 0 1 9 9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
            />
        </svg>
    );
}
