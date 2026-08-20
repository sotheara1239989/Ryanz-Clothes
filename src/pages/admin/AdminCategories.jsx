import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  X, 
  CheckCircle2 
} from 'lucide-react';
import { 
  listenToCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/categoryService';
import { listenToProducts } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
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

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.isActive !== false).length;
  const assignedProducts = products.filter(p => Boolean(p.category)).length;
  const avgItemsPerCategory = totalCategories > 0 ? (assignedProducts / totalCategories).toFixed(1) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize products into collections and departments
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-500 font-medium">Total Collections</span>
          <span className="font-bold text-gray-900">{totalCategories} categories</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <span className="text-emerald-800 font-medium">Active Collections</span>
          <span className="font-bold text-emerald-950">{activeCategories} live</span>
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 shadow-xs flex items-center justify-between">
          <span className="text-blue-800 font-medium">Catalog Assigned</span>
          <span className="font-bold text-blue-950">{assignedProducts} items</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-500 font-medium">Avg Styles / Drop</span>
          <span className="font-bold text-gray-900">{avgItemsPerCategory} items</span>
        </div>
      </div>

      {/* Categories Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading collections..." />
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const productCount = products.filter(
              p => (p.category || '').toLowerCase() === (cat.slug || cat.name).toLowerCase()
            ).length;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-mono">
                          /{cat.slug || cat.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {productCount} {productCount === 1 ? 'product' : 'products'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    cat.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-xs shadow-xs">
          No categories created yet. Click "Add Category" to get started.
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isEditing ? 'Edit Category' : 'New Category'}
                </h3>
                <p className="text-xs text-gray-500">Category name and URL identifier</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Hoodies & Sweats"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. hoodies-sweats"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category overview..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="accent-black w-4 h-4"
                />
                <label htmlFor="catActive" className="font-semibold text-gray-700 cursor-pointer">
                  Category is Active &amp; Visible
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
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
