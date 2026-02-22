import React, { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';

interface ImageUploadProps {
    images: string[];
    onImagesChange: (urls: string[]) => void;
    onFilesChange?: (files: File[]) => void;
    maxImages?: number;
    label?: string;
}

export function ImageUpload({ images, onImagesChange, onFilesChange, maxImages = 5, label = "Барааны зураг" }: ImageUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length + selectedFiles.length > maxImages) {
            alert(`Дээд тал нь ${maxImages} зураг оруулах боломжтой`);
            return;
        }

        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);
        onFilesChange?.(newFiles);

        // Create local previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeExistingImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onImagesChange(newImages);
    };

    const removeSelectedFile = (index: number) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        onFilesChange?.(newFiles);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12, marginTop: 8 }}>
                {/* Existing Images */}
                {images.map((url, i) => (
                    <div key={`existing-${i}`} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                            type="button"
                            onClick={() => removeExistingImage(i)}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Local Previews */}
                {previews.map((url, i) => (
                    <div key={`preview-${i}`} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--primary)', opacity: 0.8 }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                            type="button"
                            onClick={() => removeSelectedFile(i)}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {(images.length + selectedFiles.length) < maxImages && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            aspectRatio: '1/1',
                            borderRadius: 8,
                            border: '2px dashed var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            gap: 4
                        }}
                    >
                        <Plus size={20} />
                        <span style={{ fontSize: '0.7rem' }}>Нэмэх</span>
                    </button>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
            />
        </div>
    );
}
