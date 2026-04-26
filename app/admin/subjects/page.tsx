'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Book, 
  Landmark, 
  Calculator, 
  TrendingUp, 
  Handshake,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const icons = [
  { name: 'Book', icon: Book },
  { name: 'Landmark', icon: Landmark },
  { name: 'Calculator', icon: Calculator },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Handshake', icon: Handshake },
];

export default function SubjectsAdmin() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('Book');

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'subjects'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => fetchSubjects(), 0);
  }, [fetchSubjects]);

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSubject) {
        await updateDoc(doc(db, 'subjects', editingSubject.id), {
          name,
          description: desc,
          icon,
        });
        setEditingSubject(null);
        alert('Subject updated successfully!');
      } else {
        await addDoc(collection(db, 'subjects'), {
          name,
          description: desc,
          icon,
          createdAt: new Date().toISOString(),
        });
        alert('Subject created successfully!');
      }
      setName('');
      setDesc('');
      setIcon('Book');
      fetchSubjects();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSubject = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'subjects', deleteId));
      alert('Subject deleted!');
      setDeleteId(null);
      fetchSubjects();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setDesc(sub.description);
    setIcon(sub.icon);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingSubject(null);
    setName('');
    setDesc('');
    setIcon('Book');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        <header className="mb-12">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 italic font-serif">Curriculum Sync</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Define learning tracks and modules</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Add Subject Form */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
               <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">
                 {editingSubject ? 'Edit Subject' : 'Add New Subject'}
               </h3>
               <form onSubmit={addSubject} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Subject Name</label>
                    <input 
                      required
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-500"
                      placeholder="e.g. Economics"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea 
                      required
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-500 min-h-[100px]"
                      placeholder="Brief overview..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Visual Icon</label>
                    <div className="grid grid-cols-5 gap-3">
                       {icons.map(item => (
                         <button
                           key={item.name}
                           type="button"
                           onClick={() => setIcon(item.name)}
                           className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${
                             icon === item.name ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                           }`}
                         >
                           <item.icon className="h-5 w-5" />
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 bg-gray-900 text-white font-black rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : editingSubject ? (
                        <>
                          <Edit3 className="h-5 w-5" />
                          Update Subject
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          Create Subject
                        </>
                      )}
                    </button>
                    {editingSubject && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-6 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
               </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:w-2/3">
             <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 min-h-[500px]">
                <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-10">Active Subjects ({subjects.length})</div>
                
                {loading ? (
                   <div className="flex items-center justify-center h-48">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                ) : (
                  <div className="space-y-4">
                    {subjects.map(sub => {
                        const IconComp = icons.find(i => i.name === sub.icon)?.icon || Book;
                        return (
                           <div key={sub.id} className="flex items-center justify-between p-6 rounded-[2rem] border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-xl transition-all group">
                              <div className="flex items-center gap-6">
                                 <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <IconComp className="h-6 w-6 text-blue-600" />
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-bold text-gray-900">{sub.name}</h4>
                                    <p className="text-sm text-gray-400 font-medium line-clamp-1">{sub.description}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => startEdit(sub)}
                                  className="p-3 bg-white text-gray-400 rounded-xl hover:text-blue-600 border border-gray-100 hover:border-blue-100 transition-all"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => setDeleteId(sub.id)}
                                  className="p-3 bg-white text-gray-400 rounded-xl hover:text-red-600 border border-gray-100 hover:border-red-100 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                           </div>
                        );
                    })}
                    {subjects.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No modules defined yet.</p>
                        </div>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full border border-gray-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Are you sure?</h3>
              <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed">
                This action will delete the subject from the system. Linked questions will remain but won&apos;t be easily accessible.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={isDeleting}
                  onClick={deleteSubject}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete it'}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setDeleteId(null)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
