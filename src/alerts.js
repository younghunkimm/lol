import Swal from "sweetalert2";

export function showToast(message, icon = "info") {
    if (!message) {
        return;
    }

    Swal.fire({
        toast: true,
        position: "bottom",
        icon,
        title: message,
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
        background: "#111722",
        color: "#e2e8f0",
    });
}

export function showAlert(message, icon = "error") {
    if (!message) {
        return;
    }

    return Swal.fire({
        title: "확인 필요",
        text: message,
        icon,
        confirmButtonText: "확인",
        background: "#111722",
        color: "#e2e8f0",
        confirmButtonColor: "#22d3ee",
    });
}

export async function confirmAction({
    title,
    text,
    confirmButtonText = "확인",
    cancelButtonText = "취소",
}) {
    const result = await Swal.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        background: "#111722",
        color: "#e2e8f0",
        confirmButtonColor: "#f43f5e",
        cancelButtonColor: "#334155",
    });

    return result.isConfirmed;
}
