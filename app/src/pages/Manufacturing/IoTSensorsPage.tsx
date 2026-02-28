import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Cpu,
    Search,
    Wifi,
    ArrowRight,
    CheckCircle2,
    Zap,
    Share2,
    Activity,
    Thermometer,
    Gauge,
    Bell,
    Database,
    Settings,
    Power,
    RefreshCw,
    Clock
} from 'lucide-react';

interface SensorDevice {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'offline' | 'alert' | 'maintenance';
    reading: string;
    battery: number;
    lastSeen: string;
}

const MOCK_SENSORS: SensorDevice[] = [
    {
        id: 'IOT-001',
        name: 'Main Temp Sensor',
        location: 'Cold Storage A1',
        status: 'online',
        reading: '-18.5°C',
        battery: 82,
        lastSeen: '10 sec ago'
    },
    {
        id: 'IOT-002',
        name: 'Vibration Monitor',
        location: 'CNC Machine #4',
        status: 'alert',
        reading: '85 Hz',
        battery: 45,
        lastSeen: 'Just now'
    },
    {
        id: 'IOT-003',
        name: 'Humidity Probe',
        location: 'Assembly Area 2',
        status: 'offline',
        reading: '--',
        battery: 0,
        lastSeen: '2 hours ago'
    }
];

export function IoTSensorsPage() {
    const [sensors] = useState<SensorDevice[]>(MOCK_SENSORS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="IoT Мэдрэгч (Sensors)"
                    subtitle="Үйлдвэрийн болон агуулахын орчны мэдээллийг бодит хугацаанд хянах, автомат сэргээш"
                    action={{
                        label: "Төхөөрөмж нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт төхөөрөмж</h4>
                                <div className="text-3xl font-black text-primary">124</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Wifi size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй (Online)</h4>
                                <div className="text-3xl font-black text-success">118</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Сэрэмжлүүлэг</h4>
                                <div className="text-3xl font-black text-danger">4</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><Bell size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Data Stream</h4>
                                <div className="text-xl font-black">ACTIVE SYNC</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Database size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Төхөөрөмжийн нэр, байршил, ID хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Сүлжээ</button>
                        <button className="btn btn-primary h-10 p-3 rounded-2xl"><RefreshCw size={20} /></button>
                    </div>

                    {/* Sensor Cards View */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {sensors.map(sensor => (
                            <div key={sensor.id} className="card p-6 hover-lift shadow-sm bg-surface-1 border-none flex flex-col gap-6 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black border border-border-color/10 shadow-inner group-hover:scale-110 transition-all ${sensor.status === 'online' ? 'bg-success/5 text-success' :
                                                sensor.status === 'alert' ? 'bg-danger/5 text-danger' :
                                                    sensor.status === 'offline' ? 'bg-surface-2 text-muted' : 'bg-warning/5 text-warning'
                                            }`}>
                                            {sensor.name.toLowerCase().includes('temp') ? <Thermometer size={24} /> :
                                                sensor.name.toLowerCase().includes('vibration') ? <Activity size={24} /> : <Gauge size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-primary transition-colors">{sensor.name}</h3>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                <Wifi size={12} className={sensor.status === 'online' ? 'text-success' : 'text-muted'} /> {sensor.location}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Settings size={16} /></button>
                                </div>

                                <div className="py-4 flex flex-col items-center justify-center bg-surface-2 rounded-2xl border border-border-color/5 group-hover:bg-surface-3 transition-colors">
                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">REAL-TIME VALUE</div>
                                    <div className={`text-4xl font-black ${sensor.status === 'alert' ? 'text-danger animate-pulse' :
                                            sensor.status === 'online' ? 'text-primary' : 'text-muted'
                                        }`}>
                                        {sensor.reading}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-t border-border-color/5 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-10 bg-surface-2 rounded-lg p-1 border border-border-color/10">
                                            <div className={`h-full rounded-[2px] ${sensor.battery > 20 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${sensor.battery}%` }} />
                                        </div>
                                        <span className="text-muted">{sensor.battery}% Bat</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted">
                                        <Clock size={12} /> {sensor.lastSeen}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="btn btn-outline border-danger text-danger py-3 rounded-2xl font-black text-xs hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-2">
                                        <Power size={16} /> OFF
                                    </button>
                                    <button className="btn btn-primary py-3 rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                        <ArrowRight size={16} /> DETAILS
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* IoT Hub / Network Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Cpu size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">IoT Hub Configuration</h3>
                                <p className="text-sm text-muted">MQTT, HTTP болон WebSockets протоколоор шинэ мэдрэгч холбох, дата урсгалыг оновчлох.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">СҮЛЖЭЭ НЭЭХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
