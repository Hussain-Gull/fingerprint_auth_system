import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import FormInput from "./FormInput";
import FileUpload from "./FileUpload";
import SubjectSelect from "./SubjectSelect";
import {applicationSchema, type ApplicationData} from "@/lib/validation.ts";
import {useNavigate} from "react-router-dom";
import axiosClient from "@/utils/axiosClient.ts";

const subjects = ["Mathematics", "Physics", "Chemistry", "English", "History"];

export default function ApplicationForm() {
    const {
        register,
        handleSubmit,
        setValue,
        formState: {errors},
    } = useForm<ApplicationData>({
        resolver: zodResolver(applicationSchema),
    });
    const navigate = useNavigate();

    const onSubmit = async (data: ApplicationData) => {
        try {
            // Sanitize file data - ensure empty objects become null
            const sanitizedData = {
                ...data,
                cnicFront: data.cnicFront && Object.keys(data.cnicFront).length > 0 ? data.cnicFront : null,
                cnicBack: data.cnicBack && Object.keys(data.cnicBack).length > 0 ? data.cnicBack : null,
                studentImage: data.studentImage && Object.keys(data.studentImage).length > 0 ? data.studentImage : null,
            };
            
            console.log("Sanitized form data before saving:", sanitizedData);
            
            // Create FormData for multipart upload
            const formData = new FormData();
            
            // Add form fields (backend expects camelCase)
            formData.append('fullName', data.fullName);
            formData.append('fatherName', data.fatherName);
            formData.append('dateOfBirth', data.dateOfBirth);
            formData.append('gender', data.gender);
            formData.append('country', data.country);
            formData.append('identityNumber', data.identityNumber);
            formData.append('address', data.address);
            formData.append('subject', data.subject);
            
            // Add files if they exist
            if (sanitizedData.cnicFront) {
                formData.append('cnicFront', sanitizedData.cnicFront);
            }
            if (sanitizedData.cnicBack) {
                formData.append('cnicBack', sanitizedData.cnicBack);
            }
            if (sanitizedData.studentImage) {
                formData.append('studentImage', sanitizedData.studentImage);
            }
            
            // Submit to backend
            const response = await axiosClient.post('/applications', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            console.log('Application submitted successfully:', response.data);
            
            // Save student data to session storage for fingerprint page
            sessionStorage.setItem("studentDetails", JSON.stringify(sanitizedData));
            
            // Redirect to fingerprint page
            navigate("/fingerprint-authentication");
            
        } catch (error: any) {
            console.error('Error submitting application:', error);
            
            let errorMessage = "Failed to submit application";
            
            if (error.response?.data?.detail) {
                // Handle FastAPI validation errors
                if (Array.isArray(error.response.data.detail)) {
                    const validationErrors = error.response.data.detail.map((err: any) => 
                        `${err.loc.join('.')}: ${err.msg}`
                    ).join(', ');
                    errorMessage = `Validation errors: ${validationErrors}`;
                } else {
                    errorMessage = error.response.data.detail;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(`Error submitting application: ${errorMessage}`);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-10 rounded-2xl shadow-2xl max-w-5xl mx-auto my-20 font-sans border border-gray-100"
        >
            <h2 className="text-3xl font-bold text-center text-[var(--primary)] mb-8 tracking-tight">
                Student Application Form
            </h2>

            {/* Two-column grid for better layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Full Name" name="fullName" register={register} error={errors.fullName}/>
                <FormInput label="Father Name" name="fatherName" register={register} error={errors.fatherName}/>

                <FormInput
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    register={register}
                    error={errors.dateOfBirth}
                />
                <FormInput label="Gender" name="gender" register={register} error={errors.gender}/>

                <FormInput label="Country" name="country" register={register} error={errors.country}/>
                <FormInput
                    label="Identity Number (CNIC)"
                    name="identityNumber"
                    register={register}
                    error={errors.identityNumber}
                />

                <div className="md:col-span-2">
                    <FormInput label="Address" name="address" register={register} error={errors.address}/>
                </div>

                <div className="md:col-span-2">
                    <SubjectSelect subjects={subjects} register={register} error={errors.subject}/>
                </div>
            </div>

            {/* File uploads in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <FileUpload label="CNIC Front Image" id="cnicFront"
                            onFileSelect={(file) => setValue("cnicFront", file)}/>
                <FileUpload label="CNIC Back Image" id="cnicBack" onFileSelect={(file) => setValue("cnicBack", file)}/>
                <div className="md:col-span-1">
                    <FileUpload label="Student Image" id="studentImage"
                                onFileSelect={(file) => setValue("studentImage", file)}/>
                </div>
            </div>

            {/* Submit button */}
            <div className="text-center mt-10">
                <button
                    type="submit"
                    className="bg-[var(--primary)] text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[var(--teal-dark)] transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    Submit Application
                </button>
            </div>
        </form>
    );
}
