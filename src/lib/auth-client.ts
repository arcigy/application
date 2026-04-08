import { createAuthClient } from "better-auth/react"

const getBaseUrl = () => {
    if (typeof window !== "undefined") return window.location.origin;
    let url = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }
    return url;
};

export const authClient = createAuthClient({
    baseURL: getBaseUrl()
});