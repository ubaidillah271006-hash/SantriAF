import { useState, useEffect, FormEvent } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { 
  Users, ClipboardList, CreditCard, AlertCircle, Info, 
  LogOut, Plus, Search, Trash2, CheckCircle2, XCircle,
  Edit2, CloudUpload, RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { firebaseService } from "../services/firebaseService";
import { db } from "../lib/firebase";

// Data Management
export default function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const location = useLocation();

  // Lifted state to keep everything in sync
  const [santriList, setSantriList] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      if (db) {
        const santri = await firebaseService.getSantri(user.adminType);
        setSantriList(santri);
        
        const mySantriNis = santri.map(s => s.nis);
        const pays = await firebaseService.getPayments(mySantriNis);
        setPayments(pays);
      } else {
        // Fallback to local storage if Firebase not configured
        const savedSantri = localStorage.getItem("santri_data");
        const allSantri = savedSantri ? JSON.parse(savedSantri) : [];
        const filteredSantri = allSantri.filter((s: any) => s.gender === user.adminType);
        setSantriList(filteredSantri);

        const savedPayments = localStorage.getItem("payments_data");
        const allPayments = savedPayments ? JSON.parse(savedPayments) : [];
        const mySantriNis = filteredSantri.map((s: any) => s.nis);
        setPayments(allPayments.filter((p: any) => mySantriNis.includes(p.santriId)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!db) {
      alert("Firebase belum dikonfigurasi. Silakan ikuti petunjuk setup.");
      return;
    }
    if (!confirm("Data lokal akan diunggah ke Cloud. Lanjutkan?")) return;
    
    setSyncing(true);
    try {
      const allSantri = JSON.parse(localStorage.getItem("santri_data") || "[]");
      const allPayments = JSON.parse(localStorage.getItem("payments_data") || "[]");
      const allViolations = JSON.parse(localStorage.getItem("violations_data") || "[]");
      const allInfo = JSON.parse(localStorage.getItem("info_data") || "[]");
      const allAttendance = JSON.parse(localStorage.getItem("attendance_data") || "{}");

      // Batch migration
      for (const s of allSantri) await firebaseService.saveSantri(s);
      for (const p of allPayments) await firebaseService.savePayment(p);
      for (const v of allViolations) await firebaseService.saveViolation(v);
      for (const i of allInfo) await firebaseService.saveInformation(i);
      
      // Attendance migration
      for (const key of Object.keys(allAttendance)) {
        const [date, santriId] = key.split('_');
        if (date && santriId) {
          await firebaseService.saveAttendance(date, santriId, allAttendance[key]);
        }
      }

      alert("Sinkronisasi berhasil!");
      refreshData();
    } catch (e) {
      alert("Gagal sinkronisasi data.");
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user.adminType]);

  const menuItems = [
    { icon: Users, label: "Data Santri", path: "/dashboard/santri" },
    { icon: ClipboardList, label: "Absensi", path: "/dashboard/absensi" },
    { icon: CreditCard, label: "Pembayaran", path: "/dashboard/pembayaran" },
    { icon: AlertCircle, label: "Pelanggaran", path: "/dashboard/pelanggaran" },
    { icon: Info, label: "Informasi", path: "/dashboard/informasi" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-black text-emerald-900">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">SantriAf</span>
        </div>

        <nav className="flex-1 px-4 py-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                location.pathname === item.path
                  ? "bg-emerald-800/50 text-white shadow-lg shadow-black/10"
                  : "text-emerald-100/60 hover:bg-emerald-800/30"
              )}
            >
              <item.icon size={20} className="opacity-70" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-800/50">
          <div className="px-4 py-3 mb-2">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{user.username}</p>
            <p className="text-[10px] text-emerald-100/40 uppercase font-medium">Administrator</p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-rose-300 hover:bg-rose-50/10 transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md p-6 flex justify-between items-center border-b border-slate-200/50">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 leading-none">
              {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard Admin"}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn("inline-block h-2 w-2 rounded-full", db ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {db ? "Cloud Database Connected" : "Local Database (Offline)"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {loading && <RefreshCw size={16} className="text-emerald-600 animate-spin" />}
             {!db ? (
               <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mb-1">Dukungan Multi-Perangkat Nonaktif</span>
               </div>
             ) : (
               <button 
                 onClick={handleSyncToCloud} 
                 disabled={syncing}
                 className="flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm"
               >
                 <CloudUpload size={14} className={cn(syncing && "animate-bounce")} />
                 {syncing ? "Syncing..." : "Sync ke Cloud"}
               </button>
             )}
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {loading && !santriList.length ? (
            <div className="flex justify-center py-20">
              <RefreshCw className="animate-spin text-emerald-600" size={32} />
            </div>
          ) : (
            <Routes>
              <Route path="santri" element={<SantriManagement user={user} santriList={santriList} onUpdate={refreshData} />} />
              <Route path="absensi" element={<AbsensiManagement user={user} santriList={santriList} />} />
              <Route path="pembayaran" element={<PembayaranManagement user={user} santriList={santriList} payments={payments} onUpdate={refreshData} />} />
              <Route path="pelanggaran" element={<PelanggaranManagement user={user} santriList={santriList} onUpdate={refreshData} />} />
              <Route path="informasi" element={<InformasiManagement />} />
              <Route path="/" element={<Navigate to="santri" />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  );
}

// Sub-components (Simplified for now, will implement data sync)
function SantriManagement({ user, santriList, onUpdate }: { user: any; santriList: any[]; onUpdate: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [newSantri, setNewSantri] = useState({ nis: "", nama: "", sekolahUmum: "", sekolahDiniyah: "", alamat: "", noWa: "", gender: user.adminType, status: "Aktif" });

  const saveSantri = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!editMode && santriList.some((s: any) => s.nis === newSantri.nis)) {
      setError("NIS sudah terdaftar!");
      return;
    }

    const data = { ...newSantri, gender: user.adminType };

    if (db) {
      await firebaseService.saveSantri(data);
    } else {
      const saved = localStorage.getItem("santri_data");
      let all = saved ? JSON.parse(saved) : [];
      if (editMode) {
        all = all.map((s: any) => s.nis === editMode ? data : s);
      } else {
        all = [...all, data];
      }
      localStorage.setItem("santri_data", JSON.stringify(all));
    }
    
    onUpdate();
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(null);
    setError("");
    setNewSantri({ nis: "", nama: "", sekolahUmum: "", sekolahDiniyah: "", alamat: "", noWa: "", gender: user.adminType, status: "Aktif" });
  };

  const deleteSantri = async (nis: string) => {
    if (!confirm("Hapus data santri ini?")) return;
    
    if (db) {
      await firebaseService.deleteSantri(nis);
    } else {
      const saved = localStorage.getItem("santri_data");
      const all = saved ? JSON.parse(saved) : [];
      const updated = all.filter((s: any) => s.nis !== nis);
      localStorage.setItem("santri_data", JSON.stringify(updated));
      
      // Also cleanup linked data
      const allAtt = JSON.parse(localStorage.getItem("attendance_data") || "{}");
      const newAtt = { ...allAtt };
      Object.keys(newAtt).forEach(key => {
        if (key.includes(`_${nis}`)) delete newAtt[key];
      });
      localStorage.setItem("attendance_data", JSON.stringify(newAtt));
    }
    
    onUpdate();
  };

  const openEdit = (s: any) => {
    setNewSantri(s);
    setEditMode(s.nis);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
            placeholder="Cari santri..."
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all font-bold text-sm"
        >
          <Plus size={18} /> Tambah Santri
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">NIS</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Nama</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Sekolah Umum</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Diniyah</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Wali (WA)</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Status</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-none">Alamat</th>
              <th className="p-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest text-center leading-none">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {santriList.map((s, idx) => (
              <tr key={`${s.nis}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-mono text-sm text-slate-500">{s.nis}</td>
                <td className="p-4 font-bold text-slate-800">{s.nama}</td>
                <td className="p-4 text-sm font-medium text-slate-600">{s.sekolahUmum}</td>
                <td className="p-4 text-sm font-medium text-slate-600">{s.sekolahDiniyah}</td>
                <td className="p-4 text-sm font-mono text-emerald-600 font-bold">{s.noWa}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                    s.status === "Aktif" ? "bg-emerald-100 text-emerald-700" : 
                    s.status === "Pulang" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {s.status || "Aktif"}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-[10px] font-medium leading-relaxed max-w-[150px] truncate">{s.alamat}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => openEdit(s)}
                      className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => deleteSantri(s.nis)}
                      className="text-rose-400 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {santriList.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-400 italic">Belum ada data santri</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{editMode ? "Edit Santri" : "Tambah Santri Baru"}</h3>
            <form onSubmit={saveSantri} className="space-y-4">
              {error && <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="NIS" 
                  className="p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-emerald-600" 
                  value={newSantri.nis} 
                  onChange={e => setNewSantri({...newSantri, nis: e.target.value})} 
                  required 
                  disabled={!!editMode}
                />
                <input 
                  placeholder="Nama Lengkap" 
                  className="p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-emerald-600" 
                  value={newSantri.nama} 
                  onChange={e => setNewSantri({...newSantri, nama: e.target.value})} 
                  required 
                />
              </div>
              <input 
                placeholder="Sekolah Umum" 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-emerald-600" 
                value={newSantri.sekolahUmum} 
                onChange={e => setNewSantri({...newSantri, sekolahUmum: e.target.value})} 
                required 
              />
              <input 
                placeholder="Sekolah Diniyah" 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-emerald-600" 
                value={newSantri.sekolahDiniyah} 
                onChange={e => setNewSantri({...newSantri, sekolahDiniyah: e.target.value})} 
                required 
              />
              <input 
                placeholder="Nomor WA Wali (e.g. 08123...)" 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-emerald-600" 
                value={newSantri.noWa} 
                onChange={e => setNewSantri({...newSantri, noWa: e.target.value})} 
                required 
              />
              <select 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-emerald-600" 
                value={newSantri.status} 
                onChange={e => setNewSantri({...newSantri, status: e.target.value})} 
                required
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
                <option value="Pulang">Pulang</option>
              </select>
              <textarea 
                placeholder="Alamat" 
                className="w-full p-3 bg-gray-50 rounded-xl outline-none h-24 border border-transparent focus:border-emerald-600" 
                value={newSantri.alamat} 
                onChange={e => setNewSantri({...newSantri, alamat: e.target.value})} 
                required 
              />
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2 text-gray-400 font-bold text-sm uppercase tracking-widest">Batal</button>
                <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20">{editMode ? "Update" : "Simpan"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AbsensiManagement({ user, santriList }: { user: any; santriList: any[] }) {
  const [attendance, setAttendance] = useState<any>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    if (db) {
      const data = await firebaseService.getAttendance(date);
      setAttendance(data);
    } else {
      setAttendance(JSON.parse(localStorage.getItem("attendance_data") || "{}"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const toggleStatus = async (santriId: string, activity: string) => {
    const dayKey = `${date}_${santriId}`;
    const current = attendance[dayKey] || { subuh: false, umum: false, diniyah: false, malam: false, belajar: false };
    const updatedStatus = { ...current, [activity]: !current[activity] };
    const updatedAttendance = { ...attendance, [dayKey]: updatedStatus };
    
    setAttendance(updatedAttendance);

    if (db) {
      await firebaseService.saveAttendance(date, santriId, updatedStatus);
    } else {
      localStorage.setItem("attendance_data", JSON.stringify(updatedAttendance));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-slate-200 px-6">
        <div className="flex items-center gap-4">
          <label className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Pilih Tanggal</label>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="bg-slate-50 px-4 py-2 rounded-xl outline-none border border-slate-100 font-bold text-sm text-slate-700"
            />
            {loading && <RefreshCw size={14} className="text-emerald-500 animate-spin" />}
          </div>
        </div>
        <button 
          onClick={async () => {
            const updated = { ...attendance };
            const statusFull = { subuh: true, umum: true, diniyah: true, malam: true, belajar: true };
            
            for (const s of santriList) {
              const dayKey = `${date}_${s.nis}`;
              updated[dayKey] = statusFull;
              if (db) {
                await firebaseService.saveAttendance(date, s.nis, statusFull);
              }
            }
            
            setAttendance(updated);
            if (!db) {
              localStorage.setItem("attendance_data", JSON.stringify(updated));
            }
          }}
          className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all uppercase tracking-widest"
        >
          Hadirkan Semua
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
         <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="p-4">Santri</th>
              <th className="p-4 text-center">Subuh</th>
              <th className="p-4 text-center">Sekolah</th>
              <th className="p-4 text-center">Diniyah</th>
              <th className="p-4 text-center">Malam</th>
              <th className="p-4 text-center">Belajar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {santriList.map((s, idx) => {
              const dayKey = `${date}_${s.nis}`;
              const data = attendance[dayKey] || {};
              return (
                <tr key={`${s.nis}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{s.nama}</div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{s.nis}</div>
                  </td>
                  {["subuh", "umum", "diniyah", "malam", "belajar"].map(act => (
                    <td key={act} className="p-4 text-center">
                      <button 
                        onClick={() => toggleStatus(s.nis, act)}
                        className={cn(
                          "transition-all flex mx-auto items-center justify-center h-8 w-8 rounded-full",
                          data[act] ? "bg-emerald-50 text-emerald-500 shadow-inner" : "bg-slate-50 text-slate-200"
                        )}
                      >
                        {data[act] ? <CheckCircle2 size={18} /> : <XCircle size={16} />}
                      </button>
                    </td>
                  ))}
                </tr>
              )
            })}
            {santriList.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400 italic">Belum ada data santri</td>
              </tr>
            )}
          </tbody>
         </table>
      </div>
    </div>
  );
}

function PembayaranManagement({ user, santriList, payments, onUpdate }: { user: any; santriList: any[]; payments: any[]; onUpdate: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bulanan' | 'tanggungan'>('bulanan');
  const [newPay, setNewPay] = useState({ 
    santriId: "", 
    month: "Syawal", 
    year: 1447, 
    amount: 500000, 
    status: "Lunas", 
    tanggungan: 0,
    type: 'bulanan' as 'bulanan' | 'tanggungan'
  });

  const hijriMonths = ["Syawal", "Dzulqa'dah", "Dzulhijjah", "Muharram", "Safar", "Rabiul Awwal", "Rabiul Akhir", "Jumadil Awwal", "Jumadil Akhir", "Rajab", "Syaban", "Ramadhan"];

  const savePay = async (e: FormEvent) => {
    e.preventDefault();
    const data = { ...newPay, id: editMode || Date.now().toString(), date: (newPay as any).date || new Date().toISOString() };
    
    if (db) {
      await firebaseService.savePayment(data);
    } else {
      const all = JSON.parse(localStorage.getItem("payments_data") || "[]");
      let updated;
      if (editMode) {
        updated = all.map((p: any) => p.id === editMode ? data : p);
      } else {
        updated = [...all, data];
      }
      localStorage.setItem("payments_data", JSON.stringify(updated));
    }
    
    onUpdate();
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(null);
    setNewPay({ 
      santriId: "", 
      month: hijriMonths[0], 
      year: 1447, 
      amount: 500000, 
      status: "Lunas", 
      tanggungan: 0,
      type: activeTab
    });
  };

  const deletePay = async (id: string) => {
    if (!confirm("Hapus catatan pembayaran ini?")) return;
    
    if (db) {
      await firebaseService.deletePayment(id);
    } else {
      const all = JSON.parse(localStorage.getItem("payments_data") || "[]");
      const updated = all.filter((p: any) => p.id !== id);
      localStorage.setItem("payments_data", JSON.stringify(updated));
    }
    onUpdate();
  };

  const openEdit = (p: any) => {
    setNewPay(p);
    setEditMode(p.id);
    setShowModal(true);
  };

  const filteredPayments = payments.filter(p => p.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('bulanan')}
            className={cn("px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest", activeTab === 'bulanan' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
          >
            Iuran Bulanan
          </button>
          <button 
            onClick={() => setActiveTab('tanggungan')}
            className={cn("px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest", activeTab === 'tanggungan' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600")}
          >
            Tanggungan
          </button>
        </div>
        <button onClick={() => {
          setNewPay({ ...newPay, type: activeTab });
          setShowModal(true);
        }} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-widest">
          <Plus size={16} /> {activeTab === 'bulanan' ? 'Input Iuran' : 'Input Tanggungan'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="p-4">Santri</th>
              <th className="p-4">{activeTab === 'bulanan' ? 'Bulan' : 'Keterangan'}</th>
              <th className="p-4">Jumlah</th>
              {activeTab === 'bulanan' && <th className="p-4">Status</th>}
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredPayments.map((p, idx) => {
              const s = santriList.find(santri => santri.nis === p.santriId);
              return (
                <tr key={`${p.id}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{s?.nama || p.santriId}</td>
                  <td className="p-4 text-sm text-slate-600">
                    {activeTab === 'bulanan' ? `${p.month} ${p.year}` : (p.month || 'Tanggungan')}
                  </td>
                  <td className="p-4 text-sm font-mono text-emerald-600 font-bold">Rp {p.amount.toLocaleString()}</td>
                  {activeTab === 'bulanan' && (
                    <td className="p-4">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider outline outline-1", p.status === "Lunas" ? "bg-emerald-50 text-emerald-600 outline-emerald-100" : "bg-rose-50 text-rose-600 outline-rose-100")}>
                        {p.status}
                      </span>
                    </td>
                  )}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => openEdit(p)} className="text-emerald-600 hover:text-emerald-700 p-1"><Edit2 size={16} /></button>
                       <button onClick={() => deletePay(p.id)} className="text-rose-400 hover:bg-rose-50 p-1"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400 italic">Belum ada data {activeTab}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">
              {editMode ? "Edit" : "Input"} {activeTab === 'bulanan' ? 'Pembayaran Bulanan' : 'Catatan Tanggungan'}
            </h3>
            <form onSubmit={savePay} className="space-y-4">
              <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={newPay.santriId} onChange={e => setNewPay({...newPay, santriId: e.target.value})} required>
                <option value="">Pilih Santri</option>
                {santriList.map(s => <option key={s.nis} value={s.nis}>{s.nama}</option>)}
              </select>
              
              {activeTab === 'bulanan' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="p-3 bg-gray-50 rounded-xl outline-none" value={newPay.month} onChange={e => setNewPay({...newPay, month: e.target.value})}>
                      {hijriMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input type="number" className="p-3 bg-gray-50 rounded-xl outline-none" value={newPay.year} onChange={e => setNewPay({...newPay, year: parseInt(e.target.value) || 0})} placeholder="Tahun" />
                  </div>
                  <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={newPay.status} onChange={e => setNewPay({...newPay, status: e.target.value})}>
                    <option value="Lunas">Lunas</option>
                    <option value="Tunggakan">Tunggakan</option>
                  </select>
                </>
              ) : (
                <input 
                  placeholder="Keterangan Tanggungan (e.g. Kitab, Seragam)" 
                  className="w-full p-3 bg-gray-50 rounded-xl outline-none" 
                  value={newPay.month} 
                  onChange={e => setNewPay({...newPay, month: e.target.value})} 
                  required 
                />
              )}

              <input type="number" placeholder="Jumlah (Rp)" className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={newPay.amount} onChange={e => setNewPay({...newPay, amount: parseInt(e.target.value) || 0})} required />
              
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2 text-gray-400 font-bold text-xs uppercase tracking-widest">Batal</button>
                <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PelanggaranManagement({ user, santriList, onUpdate }: { user: any; santriList: any[]; onUpdate: () => void }) {
  const [violations, setViolations] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newViol, setNewViol] = useState({ santriId: "", description: "", level: "Ringan" });
  const [loading, setLoading] = useState(false);

  const fetchViolations = async () => {
    setLoading(true);
    const mySantriNis = santriList.map(s => s.nis);
    if (db) {
      const data = await firebaseService.getViolations(mySantriNis);
      setViolations(data);
    } else {
      const all = JSON.parse(localStorage.getItem("violations_data") || "[]");
      setViolations(all.filter((v: any) => mySantriNis.includes(v.santriId)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchViolations();
  }, [santriList]);

  const saveViol = async (e: FormEvent) => {
    e.preventDefault();
    const data = { ...newViol, id: editMode || Date.now().toString(), date: (newViol as any).date || new Date().toISOString() };

    if (db) {
      await firebaseService.saveViolation(data);
    } else {
      const all = JSON.parse(localStorage.getItem("violations_data") || "[]");
      let updated;
      if (editMode) {
        updated = all.map((v: any) => v.id === editMode ? data : v);
      } else {
        updated = [...all, data];
      }
      localStorage.setItem("violations_data", JSON.stringify(updated));
    }
    
    onUpdate();
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(null);
    setNewViol({ santriId: "", description: "", level: "Ringan" });
  };

  const deleteViol = async (id: string) => {
    if (!confirm("Hapus catatan pelanggaran ini?")) return;
    
    if (db) {
      await firebaseService.deleteViolation(id);
    } else {
      const all = JSON.parse(localStorage.getItem("violations_data") || "[]");
      const updated = all.filter((v: any) => v.id !== id);
      localStorage.setItem("violations_data", JSON.stringify(updated));
    }
    onUpdate();
  };

  const openEdit = (v: any) => {
    setNewViol(v);
    setEditMode(v.id);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-widest">
          <Plus size={16} /> Catat Pelanggaran
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {violations.map((v, idx) => {
          const s = santriList.find(santri => santri.nis === v.santriId);
          return (
            <div key={`${v.id}_${idx}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
              <div className={cn("p-2 rounded-xl shrink-0", v.level === "Ringan" ? "bg-amber-100 text-amber-600" : v.level === "Sedang" ? "bg-orange-100 text-orange-600" : "bg-rose-100 text-rose-600")}>
                <AlertCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-slate-800 truncate">{s?.nama || v.santriId}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{v.description}</p>
                <div className="flex justify-between items-center mt-4">
                   <div className="flex gap-1">
                      <button onClick={() => openEdit(v)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"><Edit2 size={12} /></button>
                      <button onClick={() => deleteViol(v.id)} className="text-rose-400 hover:bg-rose-50 p-1.5 rounded-lg"><Trash2 size={12} /></button>
                   </div>
                   <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{new Date(v.date).toLocaleDateString()}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 outline outline-1 outline-slate-200 uppercase tracking-wider">{v.level}</span>
                   </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
       {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{editMode ? "Edit Pelanggaran" : "Catat Pelanggaran"}</h3>
            <form onSubmit={saveViol} className="space-y-4">
              <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={newViol.santriId} onChange={e => setNewViol({...newViol, santriId: e.target.value})} required>
                <option value="">Pilih Santri</option>
                {santriList.map(s => <option key={s.nis} value={s.nis}>{s.nama}</option>)}
              </select>
              <select className="w-full p-3 bg-gray-50 rounded-xl outline-none" value={newViol.level} onChange={e => setNewViol({...newViol, level: e.target.value})}>
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
              </select>
              <textarea placeholder="Deskripsi Pelanggaran" className="w-full p-3 bg-gray-50 rounded-xl h-24 outline-none border border-transparent focus:border-emerald-600" value={newViol.description} onChange={e => setNewViol({...newViol, description: e.target.value})} required />
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2 text-gray-400 font-bold text-xs uppercase tracking-widest">Batal</button>
                <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InformasiManagement() {
  const [messages, setMessages] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newInfo, setNewInfo] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);

  const fetchInfo = async () => {
    setLoading(true);
    if (db) {
      const data = await firebaseService.getInformation();
      setMessages(data);
    } else {
      setMessages(JSON.parse(localStorage.getItem("info_data") || "[]"));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInfo();
  }, []);
  const saveInfo = async (e: FormEvent) => {
    e.preventDefault();
    const data = { ...newInfo, id: editMode || Date.now().toString(), date: (newInfo as any).date || new Date().toISOString() };

    if (db) {
      await firebaseService.saveInformation(data);
    } else {
      let updated;
      if (editMode) {
        updated = messages.map(m => m.id === editMode ? data : m);
      } else {
        updated = [...messages, data];
      }
      setMessages(updated);
      localStorage.setItem("info_data", JSON.stringify(updated));
    }
    
    fetchInfo();
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(null);
    setNewInfo({ title: "", content: "" });
  };

  const deleteInfo = async (id: string) => {
    if (!confirm("Hapus informasi ini?")) return;
    
    if (db) {
      await firebaseService.deleteInformation(id);
    } else {
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      localStorage.setItem("info_data", JSON.stringify(updated));
    }
    fetchInfo();
  };

  const openEdit = (m: any) => {
    setNewInfo(m);
    setEditMode(m.id);
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-widest">
          <Plus size={16} /> Tambah Informasi
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.map((m, idx) => (
          <div key={`${m.id}_${idx}`} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full opacity-50" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{new Date(m.date).toLocaleDateString()}</span>
              <h3 className="text-lg font-bold mt-2 mb-4 text-slate-800 leading-tight">{m.title}</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
            <div className="flex items-center justify-between mt-6">
               <div className="flex gap-2">
                 <span className="bg-emerald-600 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest">Informasi</span>
                 <span className="bg-white border border-emerald-200 text-emerald-700 text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest">Umum</span>
               </div>
               <div className="flex gap-1">
                 <button onClick={() => openEdit(m)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors"><Edit2 size={12} /></button>
                 <button onClick={() => deleteInfo(m.id)} className="text-rose-400 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={12} /></button>
               </div>
            </div>
          </div>
        ))}
      </div>
       {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{editMode ? "Edit Informasi" : "Informasi Baru"}</h3>
            <form onSubmit={saveInfo} className="space-y-4">
              <input placeholder="Judul Informasi" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-lg border border-transparent focus:border-emerald-600" value={newInfo.title} onChange={e => setNewInfo({...newInfo, title: e.target.value})} required />
              <textarea placeholder="Konten Informasi..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none h-48 border border-transparent focus:border-emerald-600" value={newInfo.content} onChange={e => setNewInfo({...newInfo, content: e.target.value})} required />
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2 text-gray-400 font-bold text-xs uppercase tracking-widest">Batal</button>
                <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20">Publikasikan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function Navigate({ to }: { to: string }) {
  const navigate = () => { window.location.hash = to; };
  useEffect(() => { navigate(); }, []);
  return null;
}
