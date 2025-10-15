import type { FieldError } from "react-hook-form";
import React from "react";

interface FormInputProps {
    label: string;
    name: string;
    type?: string;
    register: any;
    error?: FieldError;
    placeholder?: string;
}

const FormInput: React.FC<FormInputProps> = ({
                                                 label,
                                                 name,
                                                 type = "text",
                                                 register,
                                                 error,
                                                 placeholder,
                                             }) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="text-sm font-medium text-[var(--dark)] mb-1">
            {label}
        </label>
        <input
            id={name}
            type={type}
            {...register(name)}
            placeholder={placeholder}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition ${
                error ? "border-red-500" : "border-gray-300"
            }`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
);

export default FormInput;
