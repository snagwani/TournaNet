"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SchoolFormData {
    schoolName: string;
    district: string;
    shortCode: string; // Add shortCode
    contactPersonName: string;
    contactEmail: string;
    contactPhone: string;
    schoolLogo: File | null;
}

interface FormErrors {
    schoolName?: string;
    district?: string;
    shortCode?: string;
    contactPersonName?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export default function SchoolRegistrationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<SchoolFormData>({
        schoolName: '',
        district: '',
        shortCode: '',
        contactPersonName: '',
        contactEmail: '',
        contactPhone: '',
        schoolLogo: null
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // School Name validation
        if (!formData.schoolName.trim()) {
            newErrors.schoolName = 'School name is required';
        }

        // District validation
        if (!formData.district.trim()) {
            newErrors.district = 'District/City is required';
        }

        // Contact Person Name validation
        if (!formData.contactPersonName.trim()) {
            newErrors.contactPersonName = 'Contact person name is required';
        }

        // Email validation
        if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
            newErrors.contactEmail = 'Please enter a valid email address';
        }

        // Phone validation (optional, but must be valid if provided)
        if (formData.contactPhone.trim()) {
            // Backend pattern: /^[\d\s\-\+\(\)]+$/
            if (!/^[\d\s\-\+\(\)]+$/.test(formData.contactPhone)) {
                newErrors.contactPhone = 'Phone must contain only digits, spaces, dashes, plus signs, or parentheses';
            }
        }

        // Short Code validation
        if (!formData.shortCode.trim()) {
            newErrors.shortCode = 'Short code is required';
        } else if (!/^[A-Z0-9]+$/.test(formData.shortCode)) {
            newErrors.shortCode = 'Only uppercase letters and numbers allowed';
        } else if (formData.shortCode.length < 2 || formData.shortCode.length > 10) {
            newErrors.shortCode = 'Must be 2-10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof SchoolFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
        // Clear API error when user makes changes
        if (apiError) {
            setApiError(null);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, schoolLogo: file }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous messages
        setSuccessMessage(null);
        setApiError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.schoolName);
            formDataToSend.append('district', formData.district);
            formDataToSend.append('shortCode', formData.shortCode.toUpperCase());
            formDataToSend.append('contactName', formData.contactPersonName);
            formDataToSend.append('contactEmail', formData.contactEmail);
            if (formData.contactPhone) {
                formDataToSend.append('contactPhone', formData.contactPhone);
            }
            if (formData.schoolLogo) {
                formDataToSend.append('logo', formData.schoolLogo);
            }

            const response = await fetch('http://localhost:3001/api/schools', {
                method: 'POST',
                // Content-Type header must be undefined for FormData to set boundary automatically
                // headers: {}, 
                credentials: 'include',
                body: formDataToSend,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Handle validation errors (422)
                if (response.status === 422) {
                    if (errorData.message && Array.isArray(errorData.message)) {
                        // Multiple validation errors
                        setApiError(errorData.message.join(', '));
                    } else {
                        setApiError(errorData.message || 'Validation failed. Please check your inputs.');
                    }
                    setIsSubmitting(false);
                    return;
                }

                // Handle duplicate school error (400)
                if (response.status === 400) {
                    setApiError(errorData.message || 'School with this name already exists in this district');
                    setIsSubmitting(false);
                    return;
                }

                // Handle other errors
                throw new Error(errorData.message || 'Failed to register school');
            }

            const result = await response.json();

            // Success! Redirect to Schools list
            router.push('/admin/schools');

        } catch (err: any) {
            setApiError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            schoolName: '',
            district: '',
            shortCode: '',
            contactPersonName: '',
            contactEmail: '',
            contactPhone: '',
            schoolLogo: null
        });
        setErrors({});
        setLogoPreview(null);
        setApiError(null);
    };

    return (
        <main className="p-8 space-y-8 max-w-5xl mx-auto">
            <header className="border-b border-neutral-800 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        School Registration
                    </h1>
                    <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                        Tournament Management • New School Entry
                    </p>
                </div>
            </header>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm py-4 px-6 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{successMessage}</span>
                    </div>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-green-500/70 hover:text-green-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Error Message */}
            {apiError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm py-4 px-6 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{apiError}</span>
                    </div>
                    <button
                        onClick={() => setApiError(null)}
                        className="text-red-500/70 hover:text-red-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* School Information Section */}
                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] p-8 space-y-6">
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        School Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* School Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                School Name
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.schoolName}
                                onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.schoolName ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                placeholder="Enter school name"
                            />
                            {errors.schoolName && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.schoolName}
                                </p>
                            )}
                        </div>

                        {/* District / City */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                District / City
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.district}
                                onChange={(e) => handleInputChange('district', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.district ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                placeholder="Enter district or city"
                            />
                            {errors.district && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.district}
                                </p>
                            )}
                        </div>

                        {/* Short Code */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                School Short Code
                                <span className="text-red-500">*</span>
                                <span className="text-[8px] normal-case text-neutral-600 font-normal">(Used for Bib Generation, e.g. STJS)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.shortCode}
                                onChange={(e) => handleInputChange('shortCode', e.target.value.toUpperCase())}
                                className={`w-full bg-neutral-900 border ${errors.shortCode ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                placeholder="e.g. STJS"
                                maxLength={10}
                            />
                            {errors.shortCode && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.shortCode}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Contact Information Section */}
                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] p-8 space-y-6">
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-green-500 rounded-full" />
                        Contact Information
                    </h2>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Contact Person Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Contact Person Name
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.contactPersonName}
                                onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.contactPersonName ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                placeholder="Enter contact person's full name"
                            />
                            {errors.contactPersonName && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.contactPersonName}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contact Email */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Contact Email
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                    className={`w-full bg-neutral-900 border ${errors.contactEmail ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                    placeholder="email@example.com"
                                />
                                {errors.contactEmail && (
                                    <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.contactEmail}
                                    </p>
                                )}
                            </div>

                            {/* Contact Phone */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Contact Phone
                                    <span className="text-neutral-600 text-[9px] normal-case font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.contactPhone}
                                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                    className={`w-full bg-neutral-900 border ${errors.contactPhone ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                    placeholder="+1 (555) 123-4567"
                                />
                                {errors.contactPhone && (
                                    <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.contactPhone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* School Logo Section */}
                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] p-8 space-y-6">
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
                        School Logo
                        <span className="text-xs font-normal text-neutral-500 normal-case tracking-normal">(Optional)</span>
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-6">
                            {/* Logo Preview */}
                            <div className="flex-shrink-0">
                                <div className="w-32 h-32 bg-neutral-900 border-2 border-dashed border-neutral-800 rounded-2xl flex items-center justify-center overflow-hidden">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="School logo preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-12 h-12 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Upload Button */}
                            <div className="flex-1 space-y-3">
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all cursor-pointer">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Choose Logo File
                                    </span>
                                </label>
                                <p className="text-xs text-neutral-600">
                                    Recommended: Square image, PNG or JPG, max 2MB
                                </p>
                                {formData.schoolLogo && (
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {formData.schoolLogo.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-800">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Reset Form
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-xl text-sm font-bold text-white uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Submit Registration
                            </>
                        )}
                    </button>
                </div>
            </form>

            <footer className="pt-8 border-t border-neutral-900 text-center">
                <p className="text-[10px] text-neutral-700 uppercase tracking-[0.3em] font-medium">
                    TournaNet Registration System • Build 2026.02.03
                </p>
            </footer>
        </main>
    );
}
