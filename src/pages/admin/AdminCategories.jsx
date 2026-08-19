import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  Image as ImageIcon, 
  X, 
  Upload,
  CheckCircle2 
} from 'lucide-react';
import { 
  listenToCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/categoryService';
import { listenToProducts } from '../../services/productService';
import { uploadProductImage } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    isActive: true
  });

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubCategories = listenToCategories(
      (cats) => {
        setCategories(cats);
        setLoading(false);
      },
      (err) => {
        console.error("Categories stream error:", err);
        setLoading(false);
      }
    );

    const unsubProducts = listenToProducts((prods) => setProducts(prods));

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true
    });
    setIsEditing(false);
    setCurrentCategoryId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      isActive: category.isActive !== undefined ? Boolean(category.isActive) : true
    });
    setIsEditing(true);
    setCurrentCategoryId(category.id);
    setIsModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData(prev => ({
      ...prev,
      name: val,
      ...(!isEditing ? { slug: generatedSlug } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Category name is required.", "error");
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing) {
        await updateCategory(currentCategoryId, formData);
        showToast(`Category "${formData.name}" updated!`, "success");
      } else {
        await addCategory(formData);
        showToast(`Category "${formData.name}" created!`, "success");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save category error:", err);
      showToast("Failed to save category.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await deleteCategory(categoryId);
        showToast(`Category "${name}" deleted.`, "success");
      } catch (err) {
        console.error("Delete category error:", err);
        showToast("Failed to delete category.", "error");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Collections & Categories
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize catalog apparel, streetwear drops, and season collections
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Cards Grid (No Photos - Clean Typography & Badge Design) */}
      {loading ? (
        <LoadingSpinner message="Loading collections..." />
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const productCount = products.filter(
              p => (p.category || '').toLowerCase() === (cat.slug || cat.name).toLowerCase()
            ).length;

            return (
              <div
                key={cat.id}
                className="bg-[#0c121e] rounded-2xl sm:rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl hover:border-slate-700/80 transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded inline-block mt-0.5">
                          /{cat.slug || cat.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-800 shadow-sm"
                        title="Edit Category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 bg-slate-900 hover:bg-rose-950 text-rose-400 rounded-xl transition-colors border border-slate-800 shadow-sm"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {cat.description || 'Dynamic streetwear collection for Ryanz Clothes.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="font-semibold">{productCount} active item{productCount === 1 ? '' : 's'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cat.isActive !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[11px] font-bold text-slate-300">
                      {cat.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0c121e] rounded-2xl sm:rounded-3xl p-12 border border-slate-800/80 text-center space-y-4">
          <p className="text-slate-400 text-xs">No categories found in store. Add categories to structure the catalog filters!</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add First Category
          </button>
        </div>
      )}

      {/* Add / Edit Category Modal (No Photo Requirement) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Hoodies & Sweats"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. hoodies-sweats"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Cozy french terry and fleece streetwear pieces..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
                >
                  {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategories;
