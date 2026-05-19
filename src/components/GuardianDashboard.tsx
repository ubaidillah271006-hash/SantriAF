import { useState, useEffect } from "react";
import { 
  LogOut, ClipboardList, CreditCard, AlertCircle, Info, 
  Search, CheckCircle2, XCircle, User, RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { firebaseService } from "../services/firebaseService";
import { db } from "../lib/firebase";

export default function GuardianDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [santriData, setSantriData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>({});
  const [violations, setViolations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tanggunganTotal, setTanggunganTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const refreshData = async () => {
    setLoading(true);
    try {
      let foundSantri = null;
      const normalizedTarget = user.linkedWa?.replace(/\D/g, '');

      if (db) {
        // In reality, we'd need a better way to query santri by WA if privacy is concern
        // But for now, we get all and match if db is small, or specific query if service supports it
        const allSantri = await firebaseService.getSantri(null as any); // get all genders or specific one
        foundSantri = allSantri.find(s => s.noWa?.replace(/\D/g, '') === normalizedTarget);
      } else {
        const allSantri = JSON.parse(localStorage.getItem("santri_data") || "[]");
        foundSantri = allSantri.find((s: any) => s.noWa?.replace(/\D/g, '') === normalizedTarget);
      }

      setSantriData(foundSantri);

      if (foundSantri) {
        if (db) {
          const [att, viol, pays, info] = await Promise.all([
            firebaseService.getAttendance(new Date().toISOString().split('T')[0]), // Note: this only gets today's for now in service, might need range
            firebaseService.getViolations([foundSantri.nis]),
            firebaseService.getPayments([foundSantri.nis]),
            firebaseService.getInformation()
          ]);
          
          // Actually we need last 7 days for attendance
          const sevenDaysAtt: any = {};
          for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = await firebaseService.getAttendance(dateStr);
            Object.assign(sevenDaysAtt, dayData);
          }

          setAttendance(sevenDaysAtt);
          setViolations(viol);
          setPayments(pays);
          setAnnouncements(info);
          
          const totalTang = pays
            .filter((p: any) => p.type === 'tanggungan')
            .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
          setTanggunganTotal(totalTang);
        } else {
          setAttendance(JSON.parse(localStorage.getItem("attendance_data") || "{}"));
          
          const allViolations = JSON.parse(localStorage.getItem("violations_data") || "[]");
          setViolations(allViolations.filter((v: any) => v.santriId === foundSantri.nis));

          const allPayments = JSON.parse(localStorage.getItem("payments_data") || "[]");
          const santriPayments = allPayments.filter((p: any) => p.santriId === foundSantri.nis);
          setPayments(santriPayments);
          setAnnouncements(JSON.parse(localStorage.getItem("info_data") || "[]"));

          const totalTang = santriPayments
            .filter((p: any) => p.type === 'tanggungan')
            .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
          setTanggunganTotal(totalTang);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user.linkedWa]);

  const bulananStatus = payments.find(p => p.type === 'bulanan' && p.status === 'Tunggakan') ? 'Ada Tunggakan' : 'Lunas';

  if (loading) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <RefreshCw size={32} className="text-emerald-900 animate-spin" />
      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
    </div>
  );

  if (!santriData) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <p className="text-gray-500">Data santri tidak ditemukan untuk nomor WA ini.</p>
      <button onClick={onLogout} className="text-[#5A5A40] underline">Keluar</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black serif tracking-tight text-slate-900">Wali Santri</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-block h-2 w-2 rounded-full", db ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {db ? "Cloud Sync Active" : "Local Mode (Offline)"}
            </span>
          </div>
          <p className="text-slate-500 font-medium mt-2">Selamat datang, orang tua dari {santriData.nama}</p>
        </div>
        <button onClick={onLogout} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-rose-100 shadow-sm bg-white">
          <LogOut size={24} />
        </button>
      </header>

      {/* Santri Info Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-10">
        <div className="h-32 w-32 rounded-[2rem] bg-emerald-900 flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-emerald-900/30 shrink-0">
          {santriData.nama ? santriData.nama[0].toUpperCase() : "?"}
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6 flex-1 w-full">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1 leading-none">Nomor Induk Santri</div>
            <div className="font-mono text-xl font-bold text-slate-800">{santriData.nis}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1 leading-none">Sekolah Umum</div>
            <div className="font-bold text-lg text-slate-800">{santriData.sekolahUmum}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1 leading-none">Alamat Domisili</div>
            <div className="text-sm font-medium text-slate-600 line-clamp-1">{santriData.alamat}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1 leading-none">Sekolah Diniyah</div>
            <div className="font-bold text-lg text-slate-700">{santriData.sekolahDiniyah}</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Status" value={santriData.status || "Aktif"} icon={User} color="bg-indigo-600" />
        <StatCard title="Uang Makan" value={bulananStatus} icon={CreditCard} color="bg-emerald-600" />
        <StatCard title="Tanggungan" value={`Rp ${tanggunganTotal.toLocaleString()}`} icon={CreditCard} color="bg-amber-600" />
        <StatCard title="Pelanggaran" value={violations.length.toString()} icon={AlertCircle} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Bulanan & Tanggungan Detail */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black serif flex items-center gap-3 text-slate-800">
              <CreditCard size={24} className="text-emerald-900" />
              Detail Pembayaran
            </h3>
            
            <div className="space-y-6">
              {/* Uang Makan / Bulanan List */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Riwayat Uang Makan</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">Bulanan</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {payments.filter(p => p.type === 'bulanan').length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Belum ada catatan pembayaran bulanan</div>
                  ) : (
                    payments.filter(p => p.type === 'bulanan').map((p, idx) => (
                      <div key={`${p.id}_${idx}`} className="p-6 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">{p.month} {p.year}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 pr-1 inline-block border-r border-slate-200">{new Date(p.date).toLocaleDateString()}</p>
                          <span className="text-[10px] text-slate-400 font-bold ml-1 pl-1 uppercase tracking-widest">{p.status}</span>
                        </div>
                        <p className="font-mono font-black text-emerald-600 text-lg">Rp {p.amount.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tanggungan List */}
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daftar Tanggungan</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">Lain-lain</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {payments.filter(p => p.type === 'tanggungan').length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Tidak ada tanggungan lain</div>
                  ) : (
                    payments.filter(p => p.type === 'tanggungan').map((p, idx) => (
                      <div key={`${p.id}_${idx}`} className="p-6 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800">{p.month || 'Tanggungan'}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">{new Date(p.date || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <p className="font-mono font-black text-amber-600 text-lg">Rp {p.amount.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                  {payments.filter(p => p.type === 'tanggungan').length > 0 && (
                    <div className="p-6 bg-amber-50/50 flex justify-between items-center">
                      <span className="font-bold text-amber-900 text-sm">Total Terbayar</span>
                      <span className="font-black text-amber-700">Rp {tanggunganTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Attendance Detail */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black serif flex items-center gap-3 text-slate-800">
              <ClipboardList size={24} className="text-emerald-900" />
              Kehadiran (7 Hari Terakhir)
            </h3>
            <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                    <th className="p-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sbh</th>
                    <th className="p-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Umm</th>
                    <th className="p-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Din</th>
                    <th className="p-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mlm</th>
                    <th className="p-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bljr</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                    const d = new Date();
                    d.setDate(d.getDate() - dayOffset);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayKey = `${dateStr}_${santriData.nis}`;
                    const data = attendance[dayKey] || {};

                    return (
                      <tr key={dayOffset} className="border-b border-gray-50 last:border-none transition-colors hover:bg-gray-50/30">
                        <td className="p-5">
                          <div className="font-bold text-sm text-gray-700">{new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                        </td>
                        {['subuh', 'umum', 'diniyah', 'malam', 'belajar'].map(act => (
                          <td key={act} className="p-5 text-center">
                            {data[act] ? (
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                                <CheckCircle2 size={18} />
                              </div>
                            ) : (
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-200">
                                <XCircle size={18} />
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Violations */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black serif flex items-center gap-3">
              <AlertCircle size={24} className="text-rose-500" />
              Kedisiplinan
            </h3>
            <div className="space-y-4">
              {violations.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm italic">
                  Tidak ada catatan pelanggaran
                </div>
              ) : (
                violations.map((v, idx) => (
                  <div key={`${v.id}_${idx}`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", v.level === "Ringan" ? "bg-yellow-400" : v.level === "Sedang" ? "bg-orange-400" : "bg-rose-500")} />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{v.description}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium italic">{new Date(v.date).toLocaleDateString()}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest", v.level === "Ringan" ? "bg-yellow-50 text-yellow-600" : v.level === "Sedang" ? "bg-orange-50 text-orange-600" : "bg-rose-50 text-rose-600")}>
                        {v.level}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Announcements Sidebar */}
        <aside className="space-y-6">
          <h3 className="text-2xl font-black serif flex items-center gap-3 text-slate-800">
            <Info size={24} className="text-indigo-600" />
            Informasi
          </h3>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-slate-100/50 p-8 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                Belum ada pengumuman hari ini
              </div>
            ) : (
              announcements.map((info, idx) => (
                <div key={`${info.id}_${idx}`} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{new Date(info.date).toLocaleDateString()}</span>
                  <h4 className="font-bold text-slate-900 leading-snug">{info.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{info.content}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{title}</p>
        <p className="text-3xl font-black tracking-tight text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
