import { useCallback, useRef, useState } from "react";
import { showAlert } from "../alerts";
import {
    clearAuthToken,
    getAuthToken,
    loginWithPassword,
    setStoredAuthToken,
} from "../dataClient";

export function useAuth() {
    const [authToken, setAuthToken] = useState(() => getAuthToken());
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const authTokenRef = useRef(authToken);
    const hasShownAuthResetToastRef = useRef(false);

    const setCurrentAuthToken = useCallback((token) => {
        authTokenRef.current = token;
        setAuthToken(token);
    }, []);

    const resetAuth = useCallback(
        (expectedToken, operation, reason) => {
            if (expectedToken && expectedToken !== authTokenRef.current) {
                return;
            }

            const shouldShowAlert = !hasShownAuthResetToastRef.current;
            hasShownAuthResetToastRef.current = true;
            clearAuthToken();
            setCurrentAuthToken("");

            if (shouldShowAlert) {
                const detail = reason
                    ? `${operation ?? "인증 확인"}: ${reason}`
                    : `${operation ?? "인증 확인"} 중 인증에 실패했습니다.`;
                showAlert(`${detail} 비밀번호를 다시 입력해 주세요.`);
            }
        },
        [setCurrentAuthToken],
    );

    const handleRemoteError = useCallback(
        (remoteError, errorHandler, expectedToken) => {
            if (remoteError.status === 401) {
                resetAuth(
                    expectedToken,
                    remoteError.operation,
                    remoteError.message,
                );
                return;
            }

            errorHandler({ message: remoteError.message, id: Date.now() });
        },
        [resetAuth],
    );

    const login = useCallback(
        async (event) => {
            event.preventDefault();
            const trimmedPassword = password.trim();

            if (!trimmedPassword) {
                setAuthError("비밀번호를 입력해 주세요.");
                return;
            }

            setAuthError("");
            setIsAuthenticating(true);
            hasShownAuthResetToastRef.current = false;

            try {
                const authSession = await loginWithPassword(trimmedPassword);
                await setStoredAuthToken(authSession);
                setPassword("");
                setCurrentAuthToken(authSession.accessToken);
            } catch (loginError) {
                clearAuthToken();
                setAuthError(loginError.message);
            } finally {
                setIsAuthenticating(false);
            }
        },
        [password, setCurrentAuthToken],
    );

    return {
        authError,
        authToken,
        handleRemoteError,
        isAuthenticating,
        login,
        password,
        setPassword,
    };
}
