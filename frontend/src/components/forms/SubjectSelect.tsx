import React from "react";
import type { FieldError } from "react-hook-form";

interface SubjectSelectProps {
    subjects: string[];
    register: any;
    error?: FieldError;
}

const SubjectSelect: React.FC<SubjectSelectProps> = ({ subjects, register, error }) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium text-[var(--dark)] mb-1">Select Subject</label>
        <select
            {...register("subject")}
            className={`border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition ${
                error ? "border-red-500" : "border-gray-300"
            }`}
        >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s, i) => (
                <option key={i} value={s}>
                    {s}
                </option>
            ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
);

export default SubjectSelect;
