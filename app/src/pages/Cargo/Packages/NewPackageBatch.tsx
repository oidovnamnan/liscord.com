import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Loader2, Camera, ArrowRight, CheckCircle2, Image as ImageIcon, Plus, Package as PackageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBusinessStore } from '../../../store';
import { scanPackageLabel, type ExtractedData } from '../../../services/ai/aiScannerService';
import { shelfService, packageService, orderService } from '../../../services/db';
import type { Shelf, ScannedItem } from '../../../types';
// Removed unused import

export interface ScannedItemState extends ExtractedData {
    id: string;
    file: File;
    previewUrl: string;
    status: 'pending' | 'scanning' | 'success' | 'error';
    errorMessage?: string;
}

export function NewPackageBatch({ onCancel }: { onCancel: () => void }) {
    const { business } = useBusinessStore();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [activeTab, setActiveTab] = useState<'matched' | 'unidentified' | 'conflicted'>('matched');

    const [scannedItems, setScannedItems] = useState<ScannedItemState[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [itemShelves, setItemShelves] = useState<Record<string, string>>({}); // itemId -> locationCode mapping
    const [isCreatingShelf, setIsCreatingShelf] = useState(false);

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = shelfService.subscribeShelves(business.id, (data) => {
            setShelves(data as Shelf[]);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newItems: ScannedItemState[] = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending',
            extractedText: '',
            matchedOrderNumber: null,
            rawResponse: ''
        }));

        setScannedItems(prev => [...prev, ...newItems]);
        setStep(2);
        startScanning(newItems);
    };

    const startScanning = async (items: ScannedItemState[]) => {
        setIsScanning(true);
        const prefix = business?.settings?.orderPrefix || 'ORD-';

        for (const item of items) {
            // Update item status to scanning
            setScannedItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'scanning' } : p));

            try {
                // Convert file to base64
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        // remove data:image/jpeg;base64, prefix
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(item.file);
                });

                const result = await scanPackageLabel(base64, item.file.type, prefix);

                // Update item status to success
                setScannedItems(prev => prev.map(p => p.id === item.id ? {
                    ...p,
                    status: 'success',
                    extractedText: result.extractedText,
                    matchedOrderNumber: result.matchedOrderNumber,
                    rawResponse: result.rawResponse
                } : p));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                // Update item status to error
                setScannedItems(prev => prev.map(p => p.id === item.id ? {
                    ...p,
                    status: 'error',
                    errorMessage: error.message
                } : p));
                toast.error(`Алдаа: ${item.file.name} зургийг уншиж чадсангүй`);
            }
        }

        setIsScanning(false);
    };

    const handleShelfChange = (itemId: string, val: string) => {
        setItemShelves(prev => ({ ...prev, [itemId]: val.toUpperCase() }));
    };

    const handleCreateShelf = async (locationCode: string) => {
        if (!business?.id) return;
        setIsCreatingShelf(true);
        try {
            await shelfService.createShelf(business.id, {
                locationCode,
                level: 'middle', // Default level
                isFull: false,
                createdBy: 'system' // Should be specific user ID in real app
            });
            toast.success(`Тавиур ${locationCode} үүсгэлээ`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Тавиур үүсгэхэд алдаа гарлаа');
        } finally {
            setIsCreatingShelf(false);
        }
    };

    const handleBatchSubmit = async () => {
        if (!business?.id) return;
        setIsSubmitting(true);
        try {
            const finalItems: ScannedItem[] = scannedItems
                .filter(i => i.status === 'success')
                .map(item => ({
                    id: item.id,
                    imageUrl: item.previewUrl,
                    extractedText: item.extractedText || '',
                    matchedOrderId: item.matchedOrderNumber, // Assuming ID is same as number for MVP
                    matchedOrderNumber: item.matchedOrderNumber,
                    isConflicted: false,
                    locationCode: itemShelves[item.id]
                }));

            // Create Batch
            await packageService.createBatch(business.id, {
                batchName: `Ачаа ${new Date().toLocaleDateString()}`,
                status: 'completed',
                scannedItems: finalItems,
                createdBy: 'system' // Should be specific user ID in real app
            });

            // Update Orders (Matched)
            for (const item of finalItems) {
                if (item.matchedOrderNumber) {
                    await orderService.updateOrderRaw(business.id, item.matchedOrderNumber, {
                        status: 'arrived',
                        locationCode: item.locationCode || null
                    });

                    // Add timeline history
                    await orderService.addTimelineEvent(business.id, item.matchedOrderNumber, {
                        statusId: 'arrived',
                        note: item.locationCode ? `AI: Ачаа ирсэн. Тавиур: ${item.locationCode}` : 'AI: Ачаа ирсэн',
                        createdBy: 'system'
                    });
                }
            }

            toast.success('Ачаа амжилттай бүртгэгдлээ!');
            onCancel(); // Close the modal/page
        } catch (error) {
            console.error(error);
            toast.error('Бүртгэхэд алдаа гарлаа');
        } finally {
            setIsSubmitting(false);
        }
    };

    const completedCount = scannedItems.filter(i => i.status === 'success' || i.status === 'error').length;
    const totalCount = scannedItems.length;

    const matchedItems = scannedItems.filter(i => i.matchedOrderNumber);
    const unidentifiedItems = scannedItems.filter(i => !i.matchedOrderNumber && i.status === 'success');
    const conflictedItems = []; // To be implemented if we find duplicate orders in DB

    return (
        <div className="new-package-batch">
            <div className="batch-header">
                <h2>Шинэ Ачаа Бүртгэл</h2>
                <div className="batch-steps">
                    <span className={step >= 1 ? 'active' : ''}>1. Зураг оруулах</span>
                    <span className={step >= 2 ? 'active' : ''}>2. AI Уншилт</span>
                    <span className={step >= 3 ? 'active' : ''}>3. Тулгалт</span>
                    <span className={step >= 4 ? 'active' : ''}>4. Батлах & Байршуулах</span>
                </div>
            </div>

            <div className="batch-body card">
                {step === 1 && (
                    <div className="upload-step">
                        <div
                            className="upload-zone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud size={48} className="text-primary mb-4" />
                            <h3>Ачааны шошгоны зургийг энд хуулна уу</h3>
                            <p>Нэг дор олон зураг сонгож оруулах боломжтой</p>
                            <button className="btn btn-primary mt-4">
                                <Camera size={18} /> Зураг сонгох
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                hidden
                                onChange={handleFileSelect}
                            />
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="processing-step w-full max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            {isScanning ? (
                                <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                            ) : (
                                <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
                            )}
                            <h3>{isScanning ? 'AI Зургийг шинжилж байна...' : 'Уншиж дууслаа'}</h3>
                            <p>Нийт {totalCount} зургаас {completedCount}-ыг нь уншиж дууслаа.</p>
                        </div>

                        <div className="scanned-items-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            {scannedItems.map(item => (
                                <div key={item.id} className={`scanned-item-card status-${item.status}`} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', position: 'relative' }}>
                                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', marginBottom: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--surface-2)' }}>
                                        {item.previewUrl ? (
                                            <img src={item.previewUrl} alt="preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ImageIcon className="text-muted" />
                                            </div>
                                        )}
                                        {item.status === 'scanning' && (
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Loader2 className="animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', textAlign: 'center', height: '40px', overflow: 'hidden' }}>
                                        {item.status === 'success' && (
                                            <>
                                                <div style={{ fontWeight: 600, color: item.matchedOrderNumber ? 'var(--success)' : 'var(--warning)' }}>
                                                    {item.matchedOrderNumber || 'Олдсонгүй'}
                                                </div>
                                            </>
                                        )}
                                        {item.status === 'error' && <span className="text-danger">Алдаа</span>}
                                        {item.status === 'pending' && <span className="text-muted">Хүлээгдэж байна...</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                className="btn btn-primary"
                                onClick={() => setStep(3)}
                                disabled={isScanning}
                            >
                                Үр дүнг тулгах <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="review-step w-full" style={{ textAlign: 'left' }}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold m-0">Олдсон захиалгууд</h3>
                                <p className="text-muted m-0 mt-1">AI нийт {scannedItems.length} зураг уншлаа. Үүнээс {matchedItems.length} захиалга таарсан байна.</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setStep(4)}>
                                Батлах шат руу очих <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className="tabs" style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
                            <button
                                className={`tab ${activeTab === 'matched' ? 'active' : ''}`}
                                onClick={() => setActiveTab('matched')}
                                style={{ padding: '8px 16px', borderBottom: activeTab === 'matched' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'matched' ? 600 : 400, color: activeTab === 'matched' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
                            >
                                Таарсан ({matchedItems.length})
                            </button>
                            <button
                                className={`tab ${activeTab === 'unidentified' ? 'active' : ''}`}
                                onClick={() => setActiveTab('unidentified')}
                                style={{ padding: '8px 16px', borderBottom: activeTab === 'unidentified' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'unidentified' ? 600 : 400, color: activeTab === 'unidentified' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
                            >
                                Танигдаагүй ({unidentifiedItems.length})
                            </button>
                            <button
                                className={`tab ${activeTab === 'conflicted' ? 'active' : ''}`}
                                onClick={() => setActiveTab('conflicted')}
                                style={{ padding: '8px 16px', borderBottom: activeTab === 'conflicted' ? '2px solid var(--primary)' : 'none', fontWeight: activeTab === 'conflicted' ? 600 : 400, color: activeTab === 'conflicted' ? 'var(--primary)' : 'var(--text-muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
                            >
                                Зөрчилтэй ({conflictedItems.length})
                            </button>
                        </div>

                        <div className="scanned-items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {activeTab === 'matched' && matchedItems.map(item => (
                                <div key={item.id} className="card p-4 flex gap-4 items-start" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                                        <img src={item.previewUrl} alt="Label" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="m-0 text-lg" style={{ color: 'var(--primary)' }}>{item.matchedOrderNumber}</h4>
                                            <div className="badge badge-success">Автоматаар таарсан</div>
                                        </div>
                                        <div className="text-sm text-muted mb-4 p-3 rounded" style={{ background: 'var(--surface-2)' }}>
                                            <strong>AI-ийн уншсан текст:</strong> {item.extractedText}
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                                <label className="input-label" style={{ fontSize: '0.8rem' }}>Хадгалах тавиур (Агуулах)</label>
                                                <input
                                                    type="text"
                                                    className="input input-sm"
                                                    placeholder="Жишээ нь: A-01"
                                                    value={itemShelves[item.id] || ''}
                                                    onChange={(e) => handleShelfChange(item.id, e.target.value)}
                                                />
                                            </div>
                                            <div style={{ flex: 2, display: 'flex', gap: 8, alignItems: 'end', paddingBottom: 4 }}>
                                                {(() => {
                                                    const val = itemShelves[item.id] || '';
                                                    if (!val) return <span className="text-muted text-sm">Тавиур сонгоно уу</span>;

                                                    const existing = shelves.find(s => s.locationCode === val);
                                                    if (existing) {
                                                        return <span className="badge badge-success">Бэлэн ({existing.locationCode})</span>;
                                                    } else {
                                                        return (
                                                            <button
                                                                className="btn btn-outline btn-sm pointer"
                                                                onClick={() => handleCreateShelf(val)}
                                                                disabled={isCreatingShelf}
                                                            >
                                                                <Plus size={14} /> {val} шинээр үүсгэх
                                                            </button>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'unidentified' && unidentifiedItems.map(item => (
                                <div key={item.id} className="card p-4 flex gap-4 items-start" style={{ border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                                        <img src={item.previewUrl} alt="Label" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="m-0 text-lg" style={{ color: 'var(--warning)' }}>Захиалга олдсонгүй</h4>
                                            <div className="badge badge-warning">Гараар холбох шаардлагатай</div>
                                        </div>
                                        <div className="text-sm text-muted mb-4 p-3 rounded" style={{ background: 'var(--surface-2)' }}>
                                            <strong>AI-ийн уншсан текст:</strong> {item.extractedText || 'Текст олдсонгүй'}
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1">
                                                <button className="btn btn-outline btn-sm w-full">Одоо байгаа захиалга руу холбох</button>
                                            </div>
                                            <div className="flex-1">
                                                <button className="btn btn-outline btn-sm w-full border-dashed" style={{ color: 'var(--text-muted)' }}>Эзэнгүй ачаа үүсгэх</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'matched' && matchedItems.length === 0 && (
                                <div className="text-center p-8 text-muted border-dashed" style={{ borderRadius: 8, border: '1px dashed var(--border-color)' }}>
                                    Таарсан захиалга олдсонгүй
                                </div>
                            )}

                            {activeTab === 'unidentified' && unidentifiedItems.length === 0 && (
                                <div className="text-center p-8 text-muted border-dashed" style={{ borderRadius: 8, border: '1px dashed var(--border-color)' }}>
                                    Бүх захиалга таарсан байна
                                </div>
                            )}

                            {activeTab === 'conflicted' && conflictedItems.length === 0 && (
                                <div className="text-center p-8 text-muted border-dashed" style={{ borderRadius: 8, border: '1px dashed var(--border-color)' }}>
                                    Зөрчилтэй захиалга алга
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {step === 4 && (
                    <div className="final-step w-full max-w-lg mx-auto text-center py-8">
                        <PackageIcon size={64} className="text-primary mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-2">Ачааг бүртгэхэд бэлэн боллоо</h3>
                        <p className="text-muted mb-8">
                            Нийт <strong>{matchedItems.length}</strong> захиалга автоматаар хуваарилагдаж, төлөв нь "Монголд ирсэн" болгон өөрчлөгдөнө.
                            Эзэнгүй <strong>{unidentifiedItems.length}</strong> ачаа системд бүртгэгдэнэ.
                        </p>

                        <div className="flex gap-4 justify-center">
                            <button className="btn btn-outline" onClick={() => setStep(3)} disabled={isSubmitting}>
                                Буцах
                            </button>
                            <button className="btn btn-primary" onClick={handleBatchSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                                Ачааг баталгаажуулж хадгалах
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
