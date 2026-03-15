import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { RefreshCw, Globe} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const CURRENCY_FIELDS: CrudField[] = [
    {
        name: 'fromCurrency', label: 'Эх валют', type: 'select', required: true, options: [
            { value: 'MNT', label: '🇲🇳 MNT (Төгрөг)' },
            { value: 'USD', label: '🇺🇸 USD (Доллар)' },
            { value: 'EUR', label: '🇪🇺 EUR (Евро)' },
            { value: 'CNY', label: '🇨🇳 CNY (Юань)' },
            { value: 'KRW', label: '🇰🇷 KRW (Вон)' },
            { value: 'JPY', label: '🇯🇵 JPY (Йен)' },
            { value: 'RUB', label: '🇷🇺 RUB (Рубль)' },
        ]
    },
    {
        name: 'toCurrency', label: 'Зорилтот валют', type: 'select', required: true, options: [
            { value: 'MNT', label: '🇲🇳 MNT' }, { value: 'USD', label: '🇺🇸 USD' }, { value: 'EUR', label: '🇪🇺 EUR' },
            { value: 'CNY', label: '🇨🇳 CNY' }, { value: 'KRW', label: '🇰🇷 KRW' }, { value: 'JPY', label: '🇯🇵 JPY' },
        ]
    },
    { name: 'rate', label: 'Ханш', type: 'number', required: true },
    { name: 'amount', label: 'Дүн', type: 'currency', required: true },
    { name: 'date', label: 'Огноо', type: 'date' },
    {
        name: 'type', label: 'Төрөл', type: 'select', options: [
            { value: 'exchange', label: 'Хөрвүүлэлт' }, { value: 'payment', label: 'Төлбөр' }, { value: 'receipt', label: 'Хүлээн авалт' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function MultiCurrencyPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/currencyExchanges`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Globe size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Олон Валют</h3>
                            <div className="fds-hero-desc">Валютын ханш, хөрвүүлэлт</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Хөрвүүлэлт
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Эх валют</th><th>Зорилтот</th><th>Ханш</th><th>Дүн</th><th>Огноо</th><th>Төрөл</th></tr></thead>
                            <tbody>{records.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                records.map(r => (
                                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(r); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{r.fromCurrency}</td><td>{r.toCurrency}</td>
                                        <td style={{ fontWeight: 600 }}>{r.rate}</td><td>{(r.amount || 0).toLocaleString()}</td>
                                        <td>{r.date || '-'}</td><td><span className="badge">{r.type || '-'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Валютын хөрвүүлэлт" icon={<RefreshCw size={20} />} collectionPath="businesses/{bizId}/currencyExchanges" fields={CURRENCY_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
