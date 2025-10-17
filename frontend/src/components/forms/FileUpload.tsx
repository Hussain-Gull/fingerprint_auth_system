import React, { useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/css/style.css";
import "@uppy/dashboard/css/style.css";

interface FileUploadProps {
    label: string;
    id: string;
    onFileSelect: (file: File | Blob) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, id, onFileSelect }) => {
    const uppyRef = useRef<Uppy | null>(null);
    const [isUppyReady, setIsUppyReady] = useState(false);

    // Initialize Uppy only once
    useEffect(() => {
        if (!uppyRef.current) {
            uppyRef.current = new Uppy({
                restrictions: {
                    maxNumberOfFiles: 1,
                    maxFileSize: 2 * 1024 * 1024, // 2MB
                    allowedFileTypes: ["image/*"],
                },
                autoProceed: true,
            });
            setIsUppyReady(true);
        }
    }, []);

    useEffect(() => {
        if (!uppyRef.current || !isUppyReady) return;
        
        const uppy = uppyRef.current;
        
        // Add event listener
        uppy.on("file-added", (file) => onFileSelect(file.data));
        
        // Cleanup function
        return () => {
            // Don't destroy uppy on cleanup, just remove the event listener
            if (uppy) {
                uppy.off("file-added");
            }
        };
    }, [onFileSelect, isUppyReady]);

    // Cleanup uppy only when component unmounts
    useEffect(() => {
        return () => {
            if (uppyRef.current) {
                uppyRef.current.destroy();
                uppyRef.current = null;
            }
        };
    }, []);

    // Don't render Dashboard until Uppy is ready
    if (!isUppyReady || !uppyRef.current) {
        return (
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50 hover:bg-gray-100 transition-all">
                <label className="text-base font-semibold text-[var(--dark)] mb-2 block">
                    {label}
                </label>
                <div className="h-[180px] flex items-center justify-center text-gray-500">
                    Loading file uploader...
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50 hover:bg-gray-100 transition-all">
            <label className="text-base font-semibold text-[var(--dark)] mb-2 block">
                {label}
            </label>
            <Dashboard uppy={uppyRef.current} height={180} proudlyDisplayPoweredByUppy={false} />
        </div>
    );
};

export default FileUpload;
