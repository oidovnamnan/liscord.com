import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore, useAuthStore } from '../../store';
import { toast } from 'react-hot-toast';
import { PINModal } from './PINModal';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea' | 'toggle' | 'phone' | 'email' | 'currency';

export interface CrudField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    defaultValue?: string | number | boolean;
    suffix?: string;         // e.g. '₮', '%'
    min?: number;
    max?: number;
    span?: 1 | 2;           // Grid column span (1 = half, 2 = full width)
}

export interface GenericCrudModalProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    collectionPath: string;  // e.g. 'businesses/{bizId}/expenses'
    fields: CrudField[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editingItem?: any;       // If editing, pass the existing document
    onClose: () => void;
    onSuccess?: () => void;
    deleteEnabled?: boolean;
    deleteRequiresPIN?: boolean;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function GenericCrudModal({
    title,
    subtitle,
    icon,
    collectionPath,
    fields,
    editingItem,
    onClose,
    onSuccess,
    deleteEnabled = true,
    deleteRequiresPIN = true,
}: GenericCrudModalProps) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showDeletePIN, setShowDeletePIN] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const isEditing = !!editingItem;
    const bizId = business?.id || '';

    // Resolve collection path
    const resolvedPath = collectionPath.replace('{bizId}', bizId);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!bizId) return;

        const fd = new FormData(e.currentTarget);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {};

        for (const field of fields) {
            const raw = fd.get(field.name);
            switch (field.type) {
                case 'number':
                case 'currency':
                    data[field.name] = Number(raw) || 0;
                    break;
                case 'toggle':
                    data[field.name] = raw === 'on';
                    break;
                default:
                    data[field.name] = (raw as string)?.trim() || '';
            }
        }

        setLoading(true);
        try {
            if (isEditing) {
                const docRef = doc(db, resolvedPath, editingItem.id);
                await updateDoc(docRef, {
                    ...data,
                    updatedAt: serverTimestamp(),
                    updatedBy: user?.uid || '',
                });
                toast.success('Амжилттай засагдлаа');
            } else {
                await addDoc(collection(db, resolvedPath), {
                    ...data,
                    createdAt: serverTimestamp(),
                    createdBy: user?.uid || '',
                    createdByName: user?.displayName || '',
                    isDeleted: false,
                });
                toast.success('Амжилттай үүсгэлээ');
            }
            onSuccess?.();
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingItem?.id || !bizId) return;
        try {
            const docRef = doc(db, resolvedPath, editingItem.id);
            await updateDoc(docRef, { isDeleted: true, deletedAt: serverTimestamp() });
            toast.success('Устгагдлаа');
            onSuccess?.();
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        }
    };

    const renderField = (field: CrudField) => {
        const defaultVal = isEditing ? editingItem?.[field.name] : field.defaultValue;

        switch (field.type) {
            case 'textarea':
                return (
                    <div className="input-group" key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined }}>
                        <label className="input-label">{field.label} {field.required && <span className="required">*</span>}</label>
                        <textarea
                            className="input"
                            name={field.name}
                            placeholder={field.placeholder}
                            defaultValue={defaultVal || ''}
                            required={field.required}
                            rows={3}
                            style={{ minHeight: 80, resize: 'vertical' }}
                        />
                    </div>
                );

            case 'select':
                return (
                    <div className="input-group" key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined }}>
                        <label className="input-label">{field.label} {field.required && <span className="required">*</span>}</label>
                        <select
                            className="input select"
                            name={field.name}
                            defaultValue={defaultVal || ''}
                            required={field.required}
                            style={{ height: 44 }}
                        >
                            <option value="">Сонгох...</option>
                            {field.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );

            case 'toggle':
                return (
                    <div className="input-group" key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="input-label" style={{ margin: 0 }}>{field.label}</label>
                        <label className="toggle">
                            <input type="checkbox" name={field.name} defaultChecked={!!defaultVal} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                );

            case 'currency':
                return (
                    <div className="input-group" key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined }}>
                        <label className="input-label">{field.label} {field.required && <span className="required">*</span>}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input"
                                name={field.name}
                                type="number"
                                placeholder={field.placeholder || '0'}
                                defaultValue={defaultVal || ''}
                                required={field.required}
                                min={field.min}
                                max={field.max}
                                style={{ height: 44, paddingRight: 36 }}
                            />
                            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                                {field.suffix || '₮'}
                            </span>
                        </div>
                    </div>
                );

            case 'date':
                return (
                    <div className="input-group" key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined }}>
                        <label className="input-label">{field.label} {field.required && <span className="required">*</span>}</label>
                        <input
                            className="input"
                            name={field.name}
                            type="date"
                            defaultValue={defaultVal || ''}
                            required={field.required}
                            style={{ height: 44 }}
                        />
                    </div>
                );

            default: // text, number, phone, email
                return (
                    <div className="input-group" key={field.name} style={{ gridColumn: field.span === 2 ? '1 / -1' : undefined }}>
                        <label className="input-label">{field.label} {field.required && <span className="required">*</span>}</label>
                        <input
                            className="input"
                            name={field.name}
                            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                            placeholder={field.placeholder}
                            defaultValue={defaultVal ?? ''}
                            required={field.required}
                            min={field.min}
                            max={field.max}
                            style={{ height: 44 }}
                        />
                    </div>
                );
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 560, width: '90%' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {icon && <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}>{icon}</div>}
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{isEditing ? `${title} засах` : title}</h2>
                            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Form */}
                <form ref={formRef} onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {fields.map(renderField)}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        {isEditing && deleteEnabled && (
                            <button
                                type="button"
                                className="btn btn-ghost text-danger"
                                onClick={() => deleteRequiresPIN ? setShowDeletePIN(true) : handleDelete()}
                            >
                                <Trash2 size={14} /> Устгах
                            </button>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                            <button type="submit" className="btn btn-primary gradient-btn" disabled={loading}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : isEditing ? <><Save size={14} /> Хадгалах</> : <><Plus size={14} /> Нэмэх</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {showDeletePIN && (
                <PINModal
                    title="Устгах баталгаажуулалт"
                    description="Устгахын тулд PIN кодыг оруулна уу."
                    onSuccess={handleDelete}
                    onClose={() => setShowDeletePIN(false)}
                />
            )}
        </div>,
        document.body
    );
}
