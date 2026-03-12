import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'react-hot-toast';
import {
    MessageSquare, Plus, Trash2, Edit3, TestTube,
    Check, X, ToggleLeft, ToggleRight, Banknote, Sparkles, Zap, Loader2
} from 'lucide-react';
import { parseSmsWithAi, type AiSmsParseResult } from '../../../services/ai/aiSmsParser';
import './SmsTemplateSettings.css';

interface SmsTemplate {
    id: string;
    bankName: string;
    senderNumbers: string[];
    incomeKeywords: string[];
    amountPattern: string;
    utgaPattern: string;
    sampleSms: string;
    isActive: boolean;
    isDefault: boolean;
}

const DEFAULT_TEMPLATES: Omit<SmsTemplate, 'id'>[] = [
    {
        bankName: 'Khan Bank',
        senderNumbers: ['1900', '19001917', '19001918'],
        incomeKeywords: ['Orlogo', 'орлого', 'ORLOGO'],
        amountPattern: '(?:orlogo|Orlogo|ORLOGO|орлого)[:\\s]*(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)',
        utgaPattern: '(?:guilgeenii\\s*)?(?:utga|Utga|UTGA|утга|Утга)[:\\s]*([^\\n,.]+)',
        sampleSms: 'Orlogo: 150,000.00MNT Dan: 5021XXXX Utga: 90007878',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'Golomt Bank',
        senderNumbers: ['1800', '18001800'],
        incomeKeywords: ['ORLOGO', 'орлого', 'credited'],
        amountPattern: '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)',
        utgaPattern: '(?:guilgeenii\\s*)?(?:utga|Utga|утга|Утга)[:\\s]*([^\\n,.]+)',
        sampleSms: 'ORLOGO 250000.00MNT guilgeenii utga: Zahialga#123',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'TDB (Худалдаа Хөгжлийн)',
        senderNumbers: ['1500', '15001500'],
        incomeKeywords: ['Orlogo', 'орлого', 'credited'],
        amountPattern: '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)',
        utgaPattern: '(?:utga|Utga|утга|Утга|Ref)[:\\s]*([^\\n,.]+)',
        sampleSms: 'Orlogo 1975000.00MNT Utga: Tulbur toloo',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'XacBank',
        senderNumbers: ['7575'],
        incomeKeywords: ['Orlogo', 'орлого', 'received'],
        amountPattern: '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)',
        utgaPattern: '(?:utga|Utga|утга|Утга)[:\\s]*([^\\n,.]+)',
        sampleSms: 'Orlogo: 50,000MNT Утга: test123',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'Төрийн Банк',
        senderNumbers: ['1234'],
        incomeKeywords: ['Orlogo', 'орлого', 'credited'],
        amountPattern: '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)',
        utgaPattern: '(?:utga|Utga|утга|Утга)[:\\s]*([^\\n,.]+)',
        sampleSms: 'Orlogo 300000MNT utga: salary',
        isActive: true,
        isDefault: true,
    },
    {
        bankName: 'Bogd Bank',
        senderNumbers: ['2525'],
        incomeKeywords: ['Orlogo', 'орлого'],
        amountPattern: '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)',
        utgaPattern: '(?:utga|Utga|утга|Утга)[:\\s]*([^\\n,.]+)',
        sampleSms: 'ORLOGO: 80,000.00MNT Utga: test',
        isActive: true,
        isDefault: true,
    },
];

function tryParseWithTemplate(template: SmsTemplate, smsBody: string): { amount: number; utga: string; bank: string; matched: boolean } {
    let amount = 0;
    let utga = '';
    let matched = false;

    // Check income keywords
    const hasKeyword = template.incomeKeywords.some(kw =>
        smsBody.toLowerCase().includes(kw.toLowerCase())
    );
    if (!hasKeyword) return { amount, utga, bank: template.bankName, matched: false };

    // Parse amount — try template pattern first
    try {
        const amountRegex = new RegExp(template.amountPattern, 'i');
        const amountMatch = smsBody.match(amountRegex);
        if (amountMatch?.[1]) {
            amount = parseFloat(amountMatch[1].replace(/[,\s]/g, ''));
            matched = true;
        }
    } catch (_e) { /* invalid regex */ }

    // Parse utga
    try {
        const utgaRegex = new RegExp(template.utgaPattern, 'i');
        const utgaMatch = smsBody.match(utgaRegex);
        if (utgaMatch?.[1]) {
            utga = utgaMatch[1].trim();
        }
    } catch (_e) { /* invalid regex */ }

    // Fallback 1: try standard MNT/₮ amount pattern
    if (!matched) {
        const mntFallback = smsBody.match(/(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|mnt)/i);
        if (mntFallback) {
            amount = parseFloat(mntFallback[1].replace(/,/g, ''));
            matched = amount > 0;
        }
    }

    // Fallback 2: keyword matched but no MNT — find largest number > 100 in SMS
    if (!matched && hasKeyword) {
        const numbers = smsBody.match(/\d[\d,]*(?:\.\d{1,2})?/g);
        if (numbers) {
            const parsed = numbers
                .map(n => parseFloat(n.replace(/,/g, '')))
                .filter(n => n > 100);
            if (parsed.length > 0) {
                amount = Math.max(...parsed);
                matched = true;
            }
        }
    }

    return { amount, utga, bank: template.bankName, matched };
}

export function SmsTemplateSettings({ bizId }: { bizId: string }) {
    const [templates, setTemplates] = useState<SmsTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [testSms, setTestSms] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SmsTemplate>>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [aiTestResult, setAiTestResult] = useState<AiSmsParseResult | null>(null);
    const [aiTesting, setAiTesting] = useState(false);

    // Load Gemini API key from global settings
    useEffect(() => {
        const loadApiKey = async () => {
            try {
                const snap = await getDoc(doc(db, 'settings', 'global'));
                const data = snap.data();
                if (data?.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
            } catch (_e) { /* ignore */ }
        };
        loadApiKey();
    }, []);

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
                // First time: seed default templates
                const seeded: SmsTemplate[] = [];
                for (const tmpl of DEFAULT_TEMPLATES) {
                    const id = tmpl.bankName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    await setDoc(doc(db, 'businesses', bizId, 'smsTemplates', id), tmpl);
                    seeded.push({ ...tmpl, id });
                }
                setTemplates(seeded);
                toast.success('6 банкны бэлэн загвар үүсгэлээ');
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

    // AI-powered SMS test
    const handleAiTest = useCallback(async () => {
        if (!testSms.trim()) return;
        if (!geminiApiKey) {
            toast.error('Gemini API Key тохируулаагүй байна. Super Admin → Тохиргоо хэсгээс нэмнэ үү.');
            return;
        }
        setAiTesting(true);
        setAiTestResult(null);
        try {
            const result = await parseSmsWithAi(geminiApiKey, testSms);
            setAiTestResult(result);
        } catch (err) {
            console.error('AI test error:', err);
            toast.error('AI задлалт амжилтгүй');
        } finally {
            setAiTesting(false);
        }
    }, [testSms, geminiApiKey]);

    const toggleTemplate = async (tmpl: SmsTemplate) => {
        try {
            await updateDoc(doc(db, 'businesses', bizId, 'smsTemplates', tmpl.id), {
                isActive: !tmpl.isActive,
            });
            setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, isActive: !t.isActive } : t));
        } catch {
            toast.error('Төлөв солиход алдаа');
        }
    };

    const startEdit = (tmpl: SmsTemplate) => {
        setEditingId(tmpl.id);
        setEditForm({
            bankName: tmpl.bankName,
            senderNumbers: tmpl.senderNumbers,
            incomeKeywords: tmpl.incomeKeywords,
            amountPattern: tmpl.amountPattern,
            utgaPattern: tmpl.utgaPattern,
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
        } catch {
            toast.error('Хадгалахад алдаа');
        }
    };

    const deleteTemplate = async (tmpl: SmsTemplate) => {
        if (!confirm(`"${tmpl.bankName}" загварыг устгах уу?`)) return;
        try {
            await deleteDoc(doc(db, 'businesses', bizId, 'smsTemplates', tmpl.id));
            setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
            toast.success('Устгалаа');
        } catch {
            toast.error('Устгахад алдаа');
        }
    };

    const addTemplate = async () => {
        if (!editForm.bankName?.trim()) return;
        const id = editForm.bankName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
        const newTmpl: SmsTemplate = {
            id,
            bankName: editForm.bankName || '',
            senderNumbers: editForm.senderNumbers || [],
            incomeKeywords: editForm.incomeKeywords || ['Orlogo', 'орлого'],
            amountPattern: editForm.amountPattern || '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮)',
            utgaPattern: editForm.utgaPattern || '(?:utga|утга)[:\\s]*([^\\n,.]+)',
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
        } catch {
            toast.error('Нэмэхэд алдаа');
        }
    };

    // Preview edit form's pattern on the sample SMS
    const editPreview = useMemo(() => {
        if (!editForm.sampleSms || !editForm.amountPattern) return null;
        const mockTemplate: SmsTemplate = {
            id: 'preview',
            bankName: editForm.bankName || '',
            senderNumbers: editForm.senderNumbers || [],
            incomeKeywords: editForm.incomeKeywords || ['Orlogo', 'орлого'],
            amountPattern: editForm.amountPattern || '',
            utgaPattern: editForm.utgaPattern || '',
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
            {/* AI SMS Test Section */}
            <div className="sms-tmpl-card sms-tmpl-test-card">
                <div className="sms-tmpl-card-header">
                    <div className="sms-tmpl-card-icon test">
                        <Zap size={18} />
                    </div>
                    <div>
                        <h3>AI SMS Задлалт</h3>
                        <p>Банкны мессежийг хуулж paste хийнэ үү — AI автоматаар танина</p>
                    </div>
                </div>
                <textarea
                    className="sms-tmpl-test-input"
                    placeholder="Банкнаас ирсэн SMS мессежийг энд paste хийнэ үү..."
                    value={testSms}
                    onChange={e => { setTestSms(e.target.value); setAiTestResult(null); }}
                    rows={3}
                />
                {testSms.trim() && (
                    <button
                        className="sms-ai-test-btn"
                        onClick={handleAiTest}
                        disabled={aiTesting}
                    >
                        {aiTesting ? (
                            <><Loader2 size={16} className="spin" /> AI задалж байна...</>
                        ) : (
                            <><Sparkles size={16} /> AI-аар задлах</>
                        )}
                    </button>
                )}
                {aiTestResult && (
                    <div className={`sms-tmpl-test-result ${aiTestResult.confidence !== 'low' ? 'matched' : 'unmatched'}`}>
                        <div className="sms-tmpl-test-result-header">
                            {aiTestResult.confidence !== 'low' ? (
                                <><Sparkles size={14} /> <span>AI амжилттай таниллаа ({aiTestResult.confidence === 'high' ? '🟢 Өндөр' : '🟡 Дунд'} итгэлтэй)</span></>
                            ) : (
                                <><Zap size={14} /> <span>Банкны SMS биш байх магадлалтай</span></>
                            )}
                        </div>
                        <div className="sms-tmpl-test-fields">
                            <div className="sms-tmpl-test-field">
                                <label>Банк</label>
                                <span>{aiTestResult.bank}</span>
                            </div>
                            <div className="sms-tmpl-test-field">
                                <label>Дүн</label>
                                <span className="amount">{aiTestResult.amount ? aiTestResult.amount.toLocaleString() + '₮' : '—'}</span>
                            </div>
                            <div className="sms-tmpl-test-field">
                                <label>Утга</label>
                                <span>{aiTestResult.utga || '—'}</span>
                            </div>
                            <div className="sms-tmpl-test-field">
                                <label>Төрөл</label>
                                <span style={{ color: aiTestResult.isIncome ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                    {aiTestResult.isIncome ? '📥 Орлого' : '📤 Зарлага'}
                                </span>
                            </div>
                            {aiTestResult.accountNumber && (
                                <div className="sms-tmpl-test-field">
                                    <label>Данс</label>
                                    <span>{aiTestResult.accountNumber}</span>
                                </div>
                            )}
                            {aiTestResult.balance && (
                                <div className="sms-tmpl-test-field">
                                    <label>Үлдэгдэл</label>
                                    <span>{aiTestResult.balance}</span>
                                </div>
                            )}
                            {aiTestResult.date && (
                                <div className="sms-tmpl-test-field">
                                    <label>Огноо</label>
                                    <span>{aiTestResult.date}</span>
                                </div>
                            )}
                        </div>
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
                        <p>Банк бүрийн SMS формат тохиргоо</p>
                    </div>
                    <button className="sms-tmpl-add-btn" onClick={() => { setShowAddForm(true); setEditForm({}); }}>
                        <Plus size={14} /> Банк нэмэх
                    </button>
                </div>

                {/* Add new template form */}
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

// Reusable form for editing/adding templates
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
                    placeholder="жнь: Khan Bank"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Илгээгчийн дугаарууд</label>
                <input
                    type="text"
                    value={(editForm.senderNumbers || []).join(', ')}
                    onChange={e => setEditForm({ ...editForm, senderNumbers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="1900, 19001917 (таслалаар тусгаарлана)"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Орлогын түлхүүр үгс</label>
                <input
                    type="text"
                    value={(editForm.incomeKeywords || []).join(', ')}
                    onChange={e => setEditForm({ ...editForm, incomeKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="Orlogo, орлого, credited"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Дүн (regex pattern)</label>
                <input
                    type="text"
                    value={editForm.amountPattern || ''}
                    onChange={e => setEditForm({ ...editForm, amountPattern: e.target.value })}
                    placeholder="(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮)"
                    className="mono"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Утга (regex pattern)</label>
                <input
                    type="text"
                    value={editForm.utgaPattern || ''}
                    onChange={e => setEditForm({ ...editForm, utgaPattern: e.target.value })}
                    placeholder="(?:utga|утга)[:\s]*([^\n,.]+)"
                    className="mono"
                />
            </div>
            <div className="sms-tmpl-form-row">
                <label>Жишиг SMS</label>
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
