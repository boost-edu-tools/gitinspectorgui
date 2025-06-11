/**
 * Detects if the app is running in demo mode (on GitLab Pages)
 */
export function isDemoMode(): boolean {
    // Check if we're running on GitLab Pages
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // GitLab Pages detection
        if (
            hostname.includes("gitlab.io") &&
            pathname.includes("/gitinspectorgui")
        ) {
            return true;
        }
    }

    // Check for production build with GitLab Pages base URL
    return window.location.pathname.startsWith("/gitinspectorgui");
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
    if (isDemoMode()) {
        return "/gitinspectorgui";
    }
    return "";
}
