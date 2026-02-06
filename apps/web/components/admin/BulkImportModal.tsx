"use client";

import React, { useState } from 'react';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    endpoint: string;
    onSuccess: () => void;
    templateHeaders: string;
    sampleData: string;
    entityName: string;
}

export default function BulkImportModal({
    isOpen,
    onClose,
    title,
    endpoint,
    onSuccess,
    templateHeaders,
    sampleData,
    entityName
}: BulkImportModalProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<any>(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResults(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Bulk import failed');
            }

            const data = await response.json();
            setImportResults(data);
            onSuccess();
        } catch (err: any) {
            alert(`Import failed: ${err.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = `${templateHeaders}\n${sampleData}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entityName.toLowerCase().replace(/ /g, '-')}-template.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-neutral-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">{title}</h3>
                        <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mt-1">Upload CSV Data</p>
                    </div>
                    <button onClick={() => { onClose(); setImportResults(null); }} className="text-neutral-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto space-y-6">
                    {!importResults ? (
                        <>
                            <div className="space-y-4">
                                <p className="text-neutral-400 text-sm">
                                    Prepare a CSV file with the following headers:
                                    <code className="block bg-black p-3 rounded-xl mt-2 text-blue-500 font-mono text-xs">
                                        {templateHeaders}
                                    </code>
                                </p>
                                <button onClick={downloadTemplate} className="text-xs text-blue-500 font-bold uppercase tracking-widest hover:underline">
                                    Download Template CSV
                                </button>
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImport}
                                    disabled={isImporting}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="border-2 border-dashed border-neutral-800 rounded-3xl p-12 text-center group-hover:border-blue-500/50 transition-all bg-neutral-900/50">
                                    {isImporting ? (
                                        <div className="space-y-4">
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Processing CSV...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <svg className="w-12 h-12 text-neutral-700 mx-auto group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4-4m4 4v12" />
                                            </svg>
                                            <p className="text-sm font-bold text-neutral-400 italic">Click or drag CSV file here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Imported</p>
                                    <p className="text-4xl font-black italic text-emerald-500">{importResults.success}</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Failed</p>
                                    <p className="text-4xl font-black italic text-red-500">{importResults.failed}</p>
                                </div>
                            </div>

                            {importResults.errors && importResults.errors.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Errors Found:</p>
                                    <div className="bg-black rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                                        {importResults.errors.map((err: string, i: number) => (
                                            <p key={i} className="text-[10px] font-mono text-red-400">{err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => { onClose(); setImportResults(null); }}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase rounded-2xl transition-all tracking-tighter"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
