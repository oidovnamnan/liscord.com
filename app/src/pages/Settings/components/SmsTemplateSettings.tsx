import { useState, useEffect, useMemo } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'react-hot-toast';
import {
    MessageSquare, Plus, Trash2, Edit3,
    Check, X, ToggleLeft, ToggleRight, Banknote, TestTube, Eye
} from 'lucide-react';
import { tryParseWithTemplate, type SmsTemplate } from '../../../utils/smsParser';
import './SmsTemplateSettings.css';


const DEFAULT_TEMPLATES: Omit<SmsTemplate, 'id'>[] = [
    {
        bankName: 'Golomt',
        senderNumbers: ['132525'],
        incomeKeywords: ['dungeer', 'orlogiin guilgee'],
        amountPrefix: 'dansand ',
        amountSuffix: ' dungeer',
        utgaPrefix: 'Utga: ',
        utgaSuffix: ' Uldegdel:',
        sampleSms: '270*****32 dansand 5,000.00 dungeer orlogiin guilgee hiigdlee. Ognoo: 2026-03-14, Utga: 5468-OIDOVJAMTS N Uldegdel: 30,350.00',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'Khan Bank',
        senderNumbers: ['1900', '19001917', '19001918'],
        incomeKeywords: ['Orlogo', 'орлого'],
        amountPrefix: 'Orlogo: ',
        amountSuffix: 'MNT',
        utgaPrefix: 'Utga: ',
        utgaSuffix: '',
        sampleSms: 'Orlogo: 150,000.00MNT Dan: 5021XXXX Utga: 90007878',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'Golomt Bank',
        senderNumbers: ['1800', '18001800'],
        incomeKeywords: ['ORLOGO', 'guilgeenii utga'],
        amountPrefix: 'ORLOGO ',
        amountSuffix: 'MNT',
        utgaPrefix: 'guilgeenii utga: ',
        utgaSuffix: '',
        sampleSms: 'ORLOGO 250000.00MNT guilgeenii utga: Zahialga#123',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'TDB',
        senderNumbers: ['1500', '15001500'],
        incomeKeywords: ['Orlogo', 'орлого'],
        amountPrefix: 'Orlogo ',
        amountSuffix: 'MNT',
        utgaPrefix: 'Utga: ',
        utgaSuffix: '',
        sampleSms: 'Orlogo 1975000.00MNT Utga: Tulbur toloo',
        isActive: true,
        isDefault: true,
    },
];

export function SmsTemplateSettings({ bizId }: { bizId: string }) {
    const [templates, setTemplates] = useState<SmsTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [testSms, setTestSms] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SmsTemplate>>({});
    const [showAddForm, setShowAddForm] = useState(false);

    // Load templates
    useEffect(() => {
        if (!bizId) return;
        loadTemplates();
    }, [bizId]);

    const loadTemplates = async () => {
        try {
            const snap = await getDocs(collection(db, 'businesses', bizId, 'smsTemplates'));
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as SmsTemplate));

            if (items.length === 0) {
                const seeded: SmsTemplate[] = [];
                for (const tmpl of DEFAULT_TEMPLATES) {
                    const id = tmpl.bankName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    await setDoc(doc(db, 'businesses', bizId, 'smsTemplates', id), tmpl);
                    seeded.push({ ...tmpl, id });
                }
                setTemplates(seeded);
                toast.success(`${DEFAULT_TEMPLATES.length} банкны бэлэн загвар үүсгэлээ`);
            } else {
                setTemplates(items);
            }
        } catch (err) {
            console.error('Failed to load templates:', err);
            toast.error('Загвар ачаалахад алдаа');
        } finally {
            setLoading(false);
        }
    };

    // Test SMS with all templates
    const testResult = useMemo(() => {
        if (!testSms.trim()) return null;
        for (const tmpl of templates) {
            if (!tmpl.isActive) continue;
            const result = tryParseWithTemplate(tmpl, testSms);
            if (result.matched) return result;
        }
        return { amount: 0, utga: '', bank: 'Тодорхойгүй', matched: false };
    }, [testSms, templates]);

    const toggleTemplate = async (tmpl: SmsTemplate) => {
        try {
            await updateDoc(doc(db, 'businesses', bizId, 'smsTemplates', tmpl.id), { isActive: !tmpl.isActive });
            setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, isActive: !t.isActive } : t));
        } catch { toast.error('Төлөв солиход алдаа'); }
    };

    const startEdit = (tmpl: SmsTemplate) => {
        setEditingId(tmpl.id);
        setEditForm({
            bankName: tmpl.bankName,
            senderNumbers: tmpl.senderNumbers,
            incomeKeywords: tmpl.incomeKeywords,
            amountPrefix: tmpl.amountPrefix || '',
            amountSuffix: tmpl.amountSuffix || '',
            utgaPrefix: tmpl.utgaPrefix || '',
            utgaSuffix: tmpl.utgaSuffix || '',
            sampleSms: tmpl.sampleSms,
        });
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await updateDoc(doc(db, 'businesses', bizId, 'smsTemplates', editingId), editForm);
            setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, ...editForm } as SmsTemplate : t));
            setEditingId(null);
            toast.success('Загвар хадгалагдлаа');
        } catch { toast.error('Хадгалахад алдаа'); }
    };

    const deleteTemplate = async (tmpl: SmsTemplate) => {
        if (!confirm(`"${tmpl.bankName}" загварыг устгах уу?`)) return;
        try {
            await deleteDoc(doc(db, 'businesses', bizId, 'smsTemplates', tmpl.id));
            setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
            toast.success('Устгалаа');
        } catch { toast.error('Устгахад алдаа'); }
    };

    const addTemplate = async () => {
        if (!editForm.bankName?.trim()) return;
        const id = editForm.bankName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
        const newTmpl: SmsTemplate = {
            id,
            bankName: editForm.bankName || '',
            senderNumbers: editForm.senderNumbers || [],
            incomeKeywords: editForm.incomeKeywords || ['Orlogo', 'орлого'],
            amountPrefix: editForm.amountPrefix || '',
            amountSuffix: editForm.amountSuffix || '',
            utgaPrefix: editForm.utgaPrefix || '',
            utgaSuffix: editForm.utgaSuffix || '',
            sampleSms: editForm.sampleSms || '',
            isActive: true,
            isDefault: false,
        };
        try {
            const { id: _, ...data } = newTmpl;
            await setDoc(doc(db, 'businesses', bizId, 'smsTemplates', id), data);
            setTemplates(prev => [...prev, newTmpl]);
            setShowAddForm(false);
            setEditForm({});
            toast.success('Шинэ загвар нэмлээ');
        } catch { toast.error('Нэмэхэд алдаа'); }
    };

    // Preview live
    const editPreview = useMemo(() => {
        if (!editForm.sampleSms) return null;
        const mockTemplate: SmsTemplate = {
            id: 'preview',
            bankName: editForm.bankName || '',
            senderNumbers: editForm.senderNumbers || [],
            incomeKeywords: editForm.incomeKeywords || ['Orlogo', 'орлого', 'dungeer'],
            amountPrefix: editForm.amountPrefix || '',
            amountSuffix: editForm.amountSuffix || '',
            utgaPrefix: editForm.utgaPrefix || '',
            utgaSuffix: editForm.utgaSuffix || '',
            sampleSms: editForm.sampleSms || '',
            isActive: true,
            isDefault: false,
        };
        return tryParseWithTemplate(mockTemplate, editForm.sampleSms);
    }, [editForm]);

    if (loading) {
        return <div className="sms-tmpl-loading">Ачаалж байна...</div>;
    }

    return (
        <div className="sms-tmpl-container">
            {/* Test SMS Section */}
            <div className="sms-tmpl-card sms-tmpl-test-card">
                <div className="sms-tmpl-card-header">
                    <div className="sms-tmpl-card-icon test">
                        <TestTube size={18} />
                    </div>
                    <div>
                        <h3>SMS Тест</h3>
                        <p>Банкны мессежийг paste хийж загвар зөв таньж байгааг шалгана</p>
                    </div>
                </div>
                <textarea
                    className="sms-tmpl-test-input"
                    placeholder="Банкнаас ирсэн SMS мессежийг энд paste хийнэ үү..."
                    value={testSms}
                    onChange={e => setTestSms(e.target.value)}
                    rows={3}
                />
                {testResult && (
                    <div className={`sms-tmpl-test-result ${testResult.matched ? 'matched' : 'unmatched'}`}>
                        <div className="sms-tmpl-test-result-header">
                            {testResult.matched ? (
                                <><Check size={14} /> <span>✅ Амжилттай таниллаа — {testResult.bank}</span></>
                            ) : (
                                <><X size={14} /> <span>❌ Танигдсангүй. Загвар тохируулна уу.</span></>
                            )}
                        </div>
                        {testResult.matched && (
                            <div className="sms-tmpl-test-fields">
                                <div className="sms-tmpl-test-field">
                                    <label>Дүн</label>
                                    <span className="amount">{testResult.amount.toLocaleString()}₮</span>
                                </div>
                                <div className="sms-tmpl-test-field">
                                    <label>Утга</label>
                                    <span>{testResult.utga || '—'}</span>
                                </div>
                                <div className="sms-tmpl-test-field">
                                    <label>Банк</label>
                                    <span>{testResult.bank}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Templates List */}
            <div className="sms-tmpl-card">
                <div className="sms-tmpl-card-header">
                    <div className="sms-tmpl-card-icon templates">
                        <Banknote size={18} />
                    </div>
                    <div>
                        <h3>Банкны загварууд</h3>
                        <p>Банк бүрийн SMS-ийн өмнөх/арын тэмдэгтээр орлого, утга таниулна</p>
                    </div>
                    <button className="sms-tmpl-add-btn" onClick={() => { setShowAddForm(true); setEditForm({}); }}>
                        <Plus size={14} /> Банк нэмэх
                    </button>
                </div>

                {showAddForm && (
                    <div className="sms-tmpl-edit-form">
                        <h4>Шинэ банк нэмэх</h4>
                        <TemplateForm editForm={editForm} setEditForm={setEditForm} preview={editPreview} />
                        <div className="sms-tmpl-edit-actions">
                            <button className="sms-tmpl-save-btn" onClick={addTemplate}>
                                <Check size={14} /> Нэмэх
                            </button>
                            <button className="sms-tmpl-cancel-btn" onClick={() => setShowAddForm(false)}>
                                <X size={14} /> Цуцлах
                            </button>
                        </div>
                    </div>
                )}

                <div className="sms-tmpl-list">
                    {templates.map(tmpl => (
                        <div key={tmpl.id} className={`sms-tmpl-item ${tmpl.isActive ? 'active' : 'inactive'}`}>
                            {editingId === tmpl.id ? (
                                <div className="sms-tmpl-edit-form">
                                    <TemplateForm editForm={editForm} setEditForm={setEditForm} preview={editPreview} />
                                    <div className="sms-tmpl-edit-actions">
                                        <button className="sms-tmpl-save-btn" onClick={saveEdit}>
                                            <Check size={14} /> Хадгалах
                                        </button>
                                        <button className="sms-tmpl-cancel-btn" onClick={() => setEditingId(null)}>
                                            <X size={14} /> Цуцлах
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="sms-tmpl-item-main">
                                        <div className="sms-tmpl-item-info">
                                            <div className="sms-tmpl-bank-name">{tmpl.bankName}</div>
                                            <div className="sms-tmpl-senders">
                                                {tmpl.senderNumbers.map(s => (
                                                    <span key={s} className="sms-tmpl-sender-chip">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="sms-tmpl-item-actions">
                                            <button
                                                className={`sms-tmpl-toggle ${tmpl.isActive ? 'on' : 'off'}`}
                                                onClick={() => toggleTemplate(tmpl)}
                                                title={tmpl.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                            >
                                                {tmpl.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                            <button className="sms-tmpl-edit-btn" onClick={() => startEdit(tmpl)}>
                                                <Edit3 size={14} />
                                            </button>
                                            {!tmpl.isDefault && (
                                                <button className="sms-tmpl-delete-btn" onClick={() => deleteTemplate(tmpl)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Show markers summary */}
                                    <div className="sms-tmpl-markers">
                                        {tmpl.amountPrefix && (
                                            <div className="sms-tmpl-marker-row">
                                                <span className="marker-label">💰 Дүн:</span>
                                                <span className="marker-prefix">{tmpl.amountPrefix}</span>
                                                <span className="marker-value">ДҮНГИЙН ТОО</span>
                                                {tmpl.amountSuffix && <span className="marker-suffix">{tmpl.amountSuffix}</span>}
                                            </div>
                                        )}
                                        {tmpl.utgaPrefix && (
                                            <div className="sms-tmpl-marker-row">
                                                <span className="marker-label">📝 Утга:</span>
                                                <span className="marker-prefix">{tmpl.utgaPrefix}</span>
                                                <span className="marker-value">УТГЫН ТЕКСТ</span>
                                                {tmpl.utgaSuffix && <span className="marker-suffix">{tmpl.utgaSuffix}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {tmpl.sampleSms && (
                                        <div className="sms-tmpl-sample">
                                            <MessageSquare size={12} />
                                            <span>{tmpl.sampleSms}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TemplateForm({
    editForm,
    setEditForm,
    preview,
}: {
    editForm: Partial<SmsTemplate>;
    setEditForm: (f: Partial<SmsTemplate>) => void;
    preview: { amount: number; utga: string; bank: string; matched: boolean } | null;
}) {
    return (
        <div className="sms-tmpl-form-fields">
            <div className="sms-tmpl-form-row">
                <label>Банкны нэр</label>
                <input
                    type="text"
                    value={editForm.bankName || ''}
                    onChange={e => setEditForm({ ...editForm, bankName: e.target.value })}
                    placeholder="жнь: Khan Bank, Golomt, TDB"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Илгээгчийн дугаарууд <span className="sms-tmpl-hint">SMS ирж байгаа дугаар</span></label>
                <input
                    type="text"
                    value={(editForm.senderNumbers || []).join(', ')}
                    onChange={e => setEditForm({ ...editForm, senderNumbers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="жнь: 1900, 132525 (таслалаар тусгаарлана)"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Орлогын түлхүүр үгс <span className="sms-tmpl-hint">SMS-д орлого гэдгийг илтгэх үгс</span></label>
                <input
                    type="text"
                    value={(editForm.incomeKeywords || []).join(', ')}
                    onChange={e => setEditForm({ ...editForm, incomeKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="Orlogo, орлого, dungeer, guilgee, credited"
                />
            </div>

            {/* Prefix/Suffix markers */}
            <div className="sms-tmpl-marker-section">
                <div className="sms-tmpl-marker-title">
                    <Eye size={14} /> Дүн таних тэмдэгт
                    <span className="sms-tmpl-hint">Дүнгийн тооны өмнө/ард ямар текст байдгийг зааж өгнө</span>
                </div>
                <div className="sms-tmpl-marker-inputs">
                    <div className="sms-tmpl-form-row compact">
                        <label>Өмнөх текст</label>
                        <input
                            type="text"
                            value={editForm.amountPrefix || ''}
                            onChange={e => setEditForm({ ...editForm, amountPrefix: e.target.value })}
                            placeholder="жнь: dansand "
                            className="mono"
                        />
                    </div>
                    <div className="sms-tmpl-form-row compact">
                        <label>Арын текст <span className="sms-tmpl-hint">(хоосон = мөрийн төгсгөл)</span></label>
                        <input
                            type="text"
                            value={editForm.amountSuffix || ''}
                            onChange={e => setEditForm({ ...editForm, amountSuffix: e.target.value })}
                            placeholder="жнь: dungeer (хоосон байж болно)"
                            className="mono"
                        />
                    </div>
                </div>
            </div>

            <div className="sms-tmpl-marker-section">
                <div className="sms-tmpl-marker-title">
                    <Eye size={14} /> Утга таних тэмдэгт
                    <span className="sms-tmpl-hint">Утгын текстийн өмнө/ард ямар текст байдгийг зааж өгнө</span>
                </div>
                <div className="sms-tmpl-marker-inputs">
                    <div className="sms-tmpl-form-row compact">
                        <label>Өмнөх текст</label>
                        <input
                            type="text"
                            value={editForm.utgaPrefix || ''}
                            onChange={e => setEditForm({ ...editForm, utgaPrefix: e.target.value })}
                            placeholder="жнь: Utga: "
                            className="mono"
                        />
                    </div>
                    <div className="sms-tmpl-form-row compact">
                        <label>Арын текст <span className="sms-tmpl-hint">(хоосон = мөрийн төгсгөл)</span></label>
                        <input
                            type="text"
                            value={editForm.utgaSuffix || ''}
                            onChange={e => setEditForm({ ...editForm, utgaSuffix: e.target.value })}
                            placeholder="жнь: Uldegdel: (хоосон байж болно)"
                            className="mono"
                        />
                    </div>
                </div>
            </div>

            <div className="sms-tmpl-form-row">
                <label>Жишиг SMS <span className="sms-tmpl-hint">Банкнаас ирсэн орлогын мессеж paste хийнэ</span></label>
                <textarea
                    value={editForm.sampleSms || ''}
                    onChange={e => setEditForm({ ...editForm, sampleSms: e.target.value })}
                    placeholder="Банкнаас ирсэн жишиг SMS бичнэ үү"
                    rows={2}
                />
            </div>

            {preview && editForm.sampleSms && (
                <div className={`sms-tmpl-form-preview ${preview.matched ? 'ok' : 'fail'}`}>
                    <strong>Үр дүн:</strong>{' '}
                    {preview.matched ? '✅' : '❌'}{' '}
                    Дүн: {preview.amount ? preview.amount.toLocaleString() + '₮' : '—'} |{' '}
                    Утга: {preview.utga || '—'}
                </div>
            )}
        </div>
    );
}
