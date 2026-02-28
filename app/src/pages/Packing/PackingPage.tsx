import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Box, Printer, Check, List as ListIcon, Search, Package, ArrowRight, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function PackingPage() {
    const [view, setView] = useState<'orders' | 'detail'>('orders');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const mockOrders = [
        { id: '1', number: 'ORD-8821', customer: 'Анунгоо ХХК', items: 12, status: 'packing' },
        { id: '2', number: 'ORD-8825', customer: 'Номин Холдинг', items: 5, status: 'ready' },
    ];

    const boxTypes = [
        { name: 'Small Box', dims: '30x20x15cm', capacity: '5kg' },
        { name: 'Medium Box', dims: '45x30x25cm', capacity: '15kg' },
        { name: 'Large Box', dims: '60x40x40cm', capacity: '30kg' },
    ];

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Савлалт & Шошгожилт"
                subtitle="Барааг хайрцаглах, баглах болон хүргэлтийн шошго хэвлэх"
                action={{
                    label: "Шошгоны загвар",
                    onClick: () => toast('Шошгоны загвар засах хэсэг удахгүй...')
                }}
            />

            <div className="page-content mt-6">
                {view === 'orders' ? (
                    <div className="flex flex-col gap-6">
                        <div className="grid-3 gap-4">
                            <div className="card p-5 bg-surface-1 border-l-4 border-l-primary flex justify-between items-center">
                                <div>
                                    <div className="text-2xl font-bold">8</div>
                                    <div className="text-xs text-muted uppercase font-bold">Савлаж буй</div>
                                </div>
                                <Box className="text-primary opacity-40" size={32} />
                            </div>
                            <div className="card p-5 bg-surface-1 border-l-4 border-l-success flex justify-between items-center">
                                <div>
                                    <div className="text-2xl font-bold">45</div>
                                    <div className="text-xs text-muted uppercase font-bold">Бэлэн болсон</div>
                                </div>
                                <Check className="text-success opacity-40" size={32} />
                            </div>
                            <div className="card p-5 bg-surface-1 border-l-4 border-l-secondary flex justify-between items-center">
                                <div>
                                    <div className="text-2xl font-bold">12</div>
                                    <div className="text-xs text-muted uppercase font-bold">Хайрцагны нөөц бага</div>
                                </div>
                                <Tag className="text-secondary opacity-40" size={32} />
                            </div>
                        </div>

                        <div className="card p-0">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="m-0 text-sm font-bold uppercase text-muted">Савлах захиалгууд</h3>
                                <div className="search-wrap relative max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                    <input type="text" className="input input-sm pl-9" placeholder="Захиалгын №..." />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr>
                                            <th className="p-4 text-left">Захиалгын №</th>
                                            <th className="p-4 text-left">Харилцагч</th>
                                            <th className="p-4 text-right">Барааны тоо</th>
                                            <th className="p-4 text-left">Төлөв</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mockOrders.map(o => (
                                            <tr key={o.id} className="hover:bg-surface-2 transition-colors">
                                                <td className="p-4 font-bold">{o.number}</td>
                                                <td className="p-4">{o.customer}</td>
                                                <td className="p-4 text-right">{o.items}</td>
                                                <td className="p-4">
                                                    <span className={`badge ${o.status === 'ready' ? 'badge-success' : 'badge-preparing'}`}>
                                                        {o.status === 'ready' ? 'Бэлэн' : 'Савлаж буй'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedOrder(o); setView('detail'); }}>
                                                        <Box size={14} /> Савлах
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="packing-detail card p-0 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-surface-2">
                            <div className="flex items-center gap-4">
                                <button className="btn btn-ghost btn-sm" onClick={() => setView('orders')}>&lt; Буцах</button>
                                <h3 className="m-0">Захиалга: {selectedOrder?.number}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-outline btn-sm"><Printer size={14} /> Шошго хэвлэх</button>
                                <button className="btn btn-success btn-sm"><Check size={14} /> Дуусгах</button>
                            </div>
                        </div>
                        <div className="grid-12 p-6 gap-8">
                            <div className="col-7 flex flex-col gap-6">
                                <section>
                                    <h4 className="text-xs font-bold uppercase text-muted mb-4 flex items-center gap-2">
                                        <ListIcon size={14} /> Савлах барааны жагсаалт
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="card p-3 flex justify-between items-center bg-surface-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-surface-3 rounded flex items-center justify-center text-xs font-bold">{i}</div>
                                                    <div>
                                                        <div className="text-sm font-bold">Барааны нэр {i}</div>
                                                        <div className="text-xs text-muted">SKU: PD-1002{i}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-sm font-bold">x5</div>
                                                    <input type="checkbox" className="w-5 h-5 cursor-pointer accent-primary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                            <div className="col-5 flex flex-col gap-6">
                                <section className="p-5 bg-surface-2 rounded-xl border border-dashed border-border-color">
                                    <h4 className="text-xs font-bold uppercase text-muted mb-4 flex items-center gap-2">
                                        <Package size={14} /> Хайрцаг сонгох
                                    </h4>
                                    <div className="flex flex-col gap-3">
                                        {boxTypes.map((box, i) => (
                                            <div key={i} className={`card p-4 hover:border-primary cursor-pointer transition-all ${i === 1 ? 'border-primary ring-1 ring-primary' : ''}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-sm">{box.name}</div>
                                                        <div className="text-xs text-muted">{box.dims} • Max {box.capacity}</div>
                                                    </div>
                                                    {i === 1 && <div className="p-1 bg-primary rounded-full"><Check size={12} className="text-white" /></div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-secondary w-full mt-6 flex justify-between items-center">
                                        Шинэ хайрцаг нэмэх <ArrowRight size={14} />
                                    </button>
                                </section>

                                <div className="card p-4 bg-primary-light border-primary/20">
                                    <div className="flex gap-3 text-primary">
                                        <Printer size={20} />
                                        <div>
                                            <div className="font-bold text-sm">Шошго бэлэн</div>
                                            <div className="text-xs">Zebra хэвлэгч холбогдсон байна.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </HubLayout>
    );
}
