/**
 * Detects if the app is running in demo mode (on GitLab Pages)
 */
export function isDemoMode(): boolean {
    // Check if we're running on GitLab Pages
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // GitLab Pages detection - group pages or project pages
        if (
            hostname.includes("gitlab.io") &&
            (pathname.includes("/gitinspectorgui") ||
                hostname.includes("gitinspectorgui"))
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
    if (isDemoMode()) {
        // For group pages, use /gitinspectorgui as base
        if (window.location.pathname.includes("/gitinspectorgui")) {
            return "/gitinspectorgui";
        }
        // For project pages, use root
        return "";
    }
    return "";
}
