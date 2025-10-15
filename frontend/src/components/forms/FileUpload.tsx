import React, { useEffect } from "react";
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
    const uppy = new Uppy({
        restrictions: {
            maxNumberOfFiles: 1,
            maxFileSize: 2 * 1024 * 1024, // 2MB
            allowedFileTypes: ["image/*"],
        },
        autoProceed: true,
    });

    useEffect(() => {
        uppy.on("file-added", (file) => onFileSelect(file.data));
        return () => uppy.destroy();
    }, [uppy, onFileSelect]);

    return (
        <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50 hover:bg-gray-100 transition-all">
            <label className="text-base font-semibold text-[var(--dark)] mb-2 block">
                {label}
            </label>
            <Dashboard uppy={uppy} height={180} proudlyDisplayPoweredByUppy={false} />
        </div>
    );
};

export default FileUpload;
