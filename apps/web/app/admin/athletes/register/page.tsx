"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

interface AthleteFormData {
    name: string;
    age: string;
    gender: string;
    category: string;
    schoolId: string;
    personalBest: string;
}

interface FormErrors {
    name?: string;
    age?: string;
    gender?: string;
    category?: string;
    schoolId?: string;
}

interface School {
    id: string;
    name: string;
}

export default function AthleteRegistrationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<AthleteFormData>({
        name: '',
        age: '',
        gender: '',
        category: '',
        schoolId: '',
        personalBest: ''
    });

    const [schools, setSchools] = useState<School[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [bibNumber, setBibNumber] = useState<number | null>(null);
    const { user, isLoading: authLoading } = useAuth();
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'ADMIN') {
                setIsUnauthorized(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        }
    }, [user, authLoading, router]);

    // Fetch schools for dropdown
    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            const fetchSchools = async () => {
                try {
                    const response = await fetch('http://localhost:3001/api/admin/reports/schools', {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSchools((data.schools || []).map((s: any) => ({
                            id: s.schoolId,
                            name: s.schoolName
                        })));
                    }
                } catch (err) {
                    console.error('Failed to fetch schools', err);
                }
            };
            fetchSchools();
        }
    }, [user]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Athlete name is required';
        }

        // Age validation
        if (!formData.age) {
            newErrors.age = 'Age is required';
        } else {
            const ageNum = parseInt(formData.age);
            if (isNaN(ageNum) || ageNum < 10 || ageNum > 19) {
                newErrors.age = 'Age must be between 10 and 19';
            }
        }

        // Gender validation
        if (!formData.gender) {
            newErrors.gender = 'Gender is required';
        }

        // Category validation
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        // School validation
        if (!formData.schoolId) {
            newErrors.schoolId = 'School is required';
        }

        // Age-Category validation
        if (formData.age && formData.category) {
            const ageNum = parseInt(formData.age);
            if (!isNaN(ageNum)) {
                if (formData.category === 'U14' && (ageNum < 10 || ageNum > 13)) {
                    newErrors.age = 'Age must be 10-13 for U14 category';
                } else if (formData.category === 'U17' && (ageNum < 14 || ageNum > 16)) {
                    newErrors.age = 'Age must be 14-16 for U17 category';
                } else if (formData.category === 'U19' && (ageNum < 17 || ageNum > 19)) {
                    newErrors.age = 'Age must be 17-19 for U19 category';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof AthleteFormData, value: string) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous messages
        setApiError(null);
        setBibNumber(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:3001/api/athletes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    category: formData.category,
                    schoolId: formData.schoolId,
                    personalBest: formData.personalBest || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Handle validation errors (422)
                if (response.status === 422) {
                    if (errorData.message && Array.isArray(errorData.message)) {
                        setApiError(errorData.message.join(', '));
                    } else {
                        setApiError(errorData.message || 'Validation failed. Please check your inputs.');
                    }
                    setIsSubmitting(false);
                    return;
                }

                // Handle business logic errors (400)
                if (response.status === 400) {
                    setApiError(errorData.message || 'Failed to register athlete');
                    setIsSubmitting(false);
                    return;
                }

                throw new Error(errorData.message || 'Failed to register athlete');
            }

            const result = await response.json();

            // Success! Show bib number briefly, then redirect
            setBibNumber(result.bibNumber);

            // Refresh the router to ensure the athletes list will be fresh when we redirect
            router.refresh();

            // Redirect after showing bib number for 2 seconds
            setTimeout(() => {
                router.push('/admin/athletes');
            }, 2000);

        } catch (err: any) {
            setApiError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: '',
            age: '',
            gender: '',
            category: '',
            schoolId: '',
            personalBest: ''
        });
        setErrors({});
        setApiError(null);
        setBibNumber(null);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (isUnauthorized) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="bg-red-500/10 border-2 border-red-500/30 p-8 rounded-[2rem] max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-500/5">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8V7m0 0a2 2 0 100-4 2 2 0 000 4zm0 0v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
                        <p className="text-neutral-400 text-sm font-medium">
                            Only administrators can access the registration system.
                        </p>
                    </div>
                    <div className="pt-4 flex flex-col items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Redirecting to Login</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="p-8 space-y-8 max-w-5xl mx-auto">
            <header className="border-b border-neutral-800 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        Athlete Registration
                    </h1>
                    <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                        Tournament Management • New Athlete Entry
                    </p>
                </div>
            </header>

            {/* Success Message with Bib Number */}
            {bibNumber && (
                <div className="bg-green-500/10 border-2 border-green-500/30 text-green-500 py-6 px-8 rounded-2xl flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-lg">Athlete Registered Successfully!</span>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-green-400 mb-2">Generated Bib Number:</p>
                        <p className="text-5xl font-black tracking-tight">{bibNumber}</p>
                    </div>
                    <p className="text-xs text-green-400">Redirecting to Athletes list...</p>
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
                {/* Athlete Information Section */}
                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] p-8 space-y-6">
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        Athlete Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Athlete Name */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Athlete Name
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.name ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                placeholder="Enter athlete's full name"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Age */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Age
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="19"
                                value={formData.age}
                                onChange={(e) => handleInputChange('age', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.age ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors`}
                                placeholder="10-19"
                            />
                            {errors.age && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.age}
                                </p>
                            )}
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Gender
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.gender ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer`}
                            >
                                <option value="">Select Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                            {errors.gender && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.gender}
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Category
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.category ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer`}
                            >
                                <option value="">Select Category</option>
                                <option value="U14">U14 (Ages 10-13)</option>
                                <option value="U17">U17 (Ages 14-16)</option>
                                <option value="U19">U19 (Ages 17-19)</option>
                            </select>
                            {errors.category && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        {/* School */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                School
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.schoolId}
                                onChange={(e) => handleInputChange('schoolId', e.target.value)}
                                className={`w-full bg-neutral-900 border ${errors.schoolId ? 'border-red-500/50' : 'border-neutral-800'} rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer`}
                            >
                                <option value="">Select School</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>
                            {errors.schoolId && (
                                <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.schoolId}
                                </p>
                            )}
                        </div>

                        {/* Personal Best */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                Personal Best
                                <span className="text-neutral-600 text-[9px] normal-case font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.personalBest}
                                onChange={(e) => handleInputChange('personalBest', e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                placeholder="e.g., 100m - 12.5s, Long Jump - 5.2m"
                            />
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
