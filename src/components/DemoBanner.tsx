import { AlertCircle, Download, ExternalLink } from "lucide-react";

export function DemoBanner() {
    return (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">
                            Demo Mode - Sample Data
                        </p>
                        <p className="text-xs text-blue-700">
                            This is a demonstration with sample git analysis
                            data. Download the desktop app for real repository
                            analysis.
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <a
                        href="/gitinspectorgui/docs/"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Docs
                    </a>
                    <a
                        href="https://gitlab.com/edu-boost/gitinspectorgui/-/releases"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Download App
                    </a>
                </div>
            </div>
        </div>
    );
}
