/**
 * Detects if the app is running in demo mode (on GitLab Pages)
 */
export function isDemoMode(): boolean {
    // Check if we're running on GitLab Pages
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;

        // GitLab Pages detection - any gitlab.io domain
        if (hostname.includes("gitlab.io")) {
            return true;
        }
    }

    return false;
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
    // Always use root path since we're deploying to root of GitLab Pages
    return "";
}
