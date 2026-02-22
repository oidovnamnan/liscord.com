import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Phone, Smile } from 'lucide-react';
import {
    createUserWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { userService } from '../../services/db';
import { toast } from 'react-hot-toast';
import './AuthPage.css';

export function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !phone) {
            toast.error('Бүх талбарыг бөглөнө үү');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Auth User
            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // 2. Update Auth Profile
            await updateProfile(user, { displayName: name });

            // 3. Create Firestore Profile
            await userService.createUser({
                uid: user.uid,
                phone: phone,
                email: email,
                displayName: name,
                photoURL: null,
                businessIds: [],
                activeBusiness: null,
                language: 'mn',
                createdAt: new Date(),
            });

            toast.success('Амжилттай бүртгүүллээ!');
            navigate('/app');
        } catch (error: any) {
            console.error(error);
            let message = 'Бүртгэлд алдаа гарлаа';

            if (error.code === 'auth/email-already-in-use') {
                message = 'Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна';
            } else if (error.code === 'auth/invalid-email') {
                message = 'И-мэйл хаяг буруу байна';
            } else if (error.code === 'auth/weak-password') {
                message = 'Нууц үг хэтэрхий сул байна';
            } else if (error.code === 'auth/phone-number-already-exists') {
                message = 'Энэ утасны дугаар аль хэдийн бүртгэлтэй байна';
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-glow" />
            <div className="auth-card animate-scale-in">
                <div className="auth-logo">
                    <div className="landing-logo" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>L</div>
                    <h1 className="auth-title">Бүртгүүлэх</h1>
                    <p className="auth-subtitle">Liscord-д тавтай морил</p>
                </div>

                <form onSubmit={handleRegister} className="auth-form">
                    <div className="input-group">
                        <label className="input-label"><Smile size={14} /> Нэр</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Бат-Эрдэнэ"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label"><Phone size={14} /> Утас</label>
                        <input
                            type="tel"
                            className="input"
                            placeholder="+976 9900 1234"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label"><Mail size={14} /> И-мэйл</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label"><Lock size={14} /> Нууц үг</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Бүртгүүлэх <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Бүртгэлтэй юу?{' '}
                        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                            Нэвтрэх
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
