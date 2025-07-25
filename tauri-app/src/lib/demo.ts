/**
 * Detects if the app is running in demo mode (on GitHub Pages)
 */
export function isDemoMode(): boolean {
    // Check if we're running on GitHub Pages
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        // GitHub Pages detection - group pages or project pages
        if (
            hostname.includes("github.io") &&
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
        // For GitHub Pages organization site, use /gitinspectorgui as base
        if (window.location.pathname.includes("/gitinspectorgui")) {
            return "/gitinspectorgui";
        }
        // For GitHub Pages project site, use root
        return "";
    }
    return "";
}
