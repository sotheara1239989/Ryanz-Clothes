import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  listenToProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../../services/productService';
import { listenToCategories } from '../../services/categoryService';
import { normalizeImageUrl } from '../../services/cjDropshippingService';
import { uploadProductImage } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38', 'One Size'];
const COMMON_COLORS = [
  'Black', 'White', 'Pink', 'Sky Blue', 'Blue', 'Navy', 'Rose Red', 'Red',
  'Green', 'Olive', 'Heather Grey', 'Charcoal', 'Brown', 'Beige', 'Khaki',
  'Yellow', 'Purple', 'Washed Indigo', 'Floral', 'Multicolor'
];

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black'],
    stock: 20,
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
    featured: false,
    isNewArrival: true,
    isActive: true
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubProducts = listenToProducts(
      (prods) => {
        setProducts(prods);
        setLoading(false);
      },
      (err) => {
        console.error("Products error:", err);
        setLoading(false);
      }
    );

    const unsubCategories = listenToCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      category: categories[0]?.slug || categories[0]?.name || 'streetwear',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black'],
      stock: 20,
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
      featured: false,
      isNewArrival: true,
      isActive: true
    });
    setImageUrlInput('');
    setCustomSizeInput('');
    setCustomColorInput('');
    setIsEditing(false);
    setCurrentProductId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category || categories[0]?.slug || 'streetwear',
      sizes: Array.isArray(product.sizes) ? product.sizes : ['M'],
      colors: Array.isArray(product.colors) ? product.colors : ['Black'],
      stock: product.stock !== undefined ? product.stock : 20,
      images: Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
      featured: Boolean(product.featured),
      isNewArrival: Boolean(product.isNewArrival),
      isActive: product.isActive !== undefined ? Boolean(product.isActive) : true
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
    setIsModalOpen(true);
  };

  const handleToggleSize = (size) => {
    setFormData(prev => {
      const currentSizes = prev.sizes || [];
      if (currentSizes.includes(size)) {
        return { ...prev, sizes: currentSizes.filter(s => s !== size) };
      } else {
        return { ...prev, sizes: [...currentSizes, size] };
      }
    });
  };

  const handleAddCustomSize = (e) => {
    e.preventDefault();
    if (!customSizeInput.trim()) return;
    const val = customSizeInput.trim();
    if (!formData.sizes.includes(val)) {
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, val] }));
    }
    setCustomSizeInput('');
  };

  const handleToggleColor = (color) => {
    setFormData(prev => {
      const currentColors = prev.colors || [];
      if (currentColors.includes(color)) {
        return { ...prev, colors: currentColors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...currentColors, color] };
      }
    });
  };

  const handleAddCustomColor = (e) => {
    e.preventDefault();
    if (!customColorInput.trim()) return;
    const val = customColorInput.trim();
    if (!formData.colors.includes(val)) {
      setFormData(prev => ({ ...prev, colors: [...prev.colors, val] }));
    }
    setCustomColorInput('');
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast("Uploading image...", "info");
      const downloadURL = await uploadProductImage(file, (progress) => {
        setUploadProgress(progress);
      });
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, downloadURL]
      }));
      showToast("Image uploaded successfully!", "success");
      setUploadProgress(0);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to upload image.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast("Please provide product name and price.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        category: formData.category || 'streetwear',
        sizes: formData.sizes,
        colors: formData.colors,
        stock: Number(formData.stock) || 0,
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
        featured: Boolean(formData.featured),
        isNewArrival: Boolean(formData.isNewArrival),
        isActive: Boolean(formData.isActive)
      };

      if (isEditing) {
        await updateProduct(currentProductId, productPayload);
        showToast(`Product "${formData.name}" updated successfully!`, "success");
      } else {
        await addProduct(productPayload);
        showToast(`Product "${formData.name}" created successfully!`, "success");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save product error:", err);
      showToast("Failed to save product.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct(productId);
        showToast(`Product "${name}" deleted.`, "success");
      } catch (err) {
        console.error("Delete error:", err);
        showToast("Failed to delete product.", "error");
      }
    }
  };

  const handleToggleActive = async (product) => {
    const newStatus = product.isActive === false ? true : false;
    try {
      await updateProduct(product.id, { isActive: newStatus });
      showToast(`Product is now ${newStatus ? 'Active' : 'Disabled'}.`, "success");
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Failed to update status.", "error");
    }
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategoryFilter !== 'all') {
      const matchCat = (p.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase();
      if (!matchCat) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(term);
      const matchCategory = p.category?.toLowerCase().includes(term);
      if (!matchName && !matchCategory) return false;
    }
    return true;
  });

  const totalProducts = products.length;
  const activeCount = products.filter(p => p.isActive !== false).length;
  const lowStockCount = products.filter(p => Number(p.stock) <= 5).length;
  const discountCount = products.filter(p => p.discountPrice && Number(p.discountPrice) > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Products
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your apparel catalog, stock, and pricing
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Catalog Quick Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <span className="text-gray-500 font-medium">Total Styles</span>
          <span className="font-bold text-gray-900">{totalProducts} items</span>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <span className="text-emerald-800 font-medium">Published Live</span>
          <span className="font-bold text-emerald-900">{activeCount} active</span>
        </div>
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <span className="text-amber-800 font-medium">Low Stock</span>
          <span className="font-bold text-amber-900">{lowStockCount} need restock</span>
        </div>
        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200/80 shadow-xs flex items-center justify-between">
          <span className="text-rose-800 font-medium">Promotions</span>
          <span className="font-bold text-rose-900">{discountCount} on sale</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-black transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-xs font-medium text-gray-800 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug || c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <LoadingSpinner message="Loading product catalog..." />
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Product</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Stock</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProducts.map((product) => {
                  const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0;
                  const isLowStock = Number(product.stock) <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeImageUrl((product.images && product.images[0]))}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-12 object-cover rounded-lg bg-gray-100 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" fill="%23f1f5f9"><rect width="40" height="48"/></svg>');
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-xs truncate max-w-xs">{product.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {product.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="capitalize text-gray-700 text-xs">
                          {product.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="font-bold text-gray-900">
                          ${hasDiscount ? Number(product.discountPrice).toFixed(2) : Number(product.price).toFixed(2)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-gray-400 line-through">
                            ${Number(product.price).toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          product.stock <= 0 ? 'bg-rose-50 text-rose-700' :
                          isLowStock ? 'bg-amber-50 text-amber-700' :
                          'text-gray-700'
                        }`}>
                          {product.stock} left
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                            product.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {product.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{product.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-xs shadow-xs">
          No products found matching your search.
        </div>
      )}

      {/* Modal / Drawer for Product Create & Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-gray-500">Update catalog product details and stock</p>
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
                <label className="block font-semibold text-gray-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Heavyweight Boxy Cut Hoodie"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Retail Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="45.00"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="20"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug || c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Streetwear product details, materials, and sizing guide..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:border-black resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="accent-black w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-[11px]">Featured</div>
                    <div className="text-[10px] text-gray-500">Shows on home</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="accent-black w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-[11px]">New Arrival</div>
                    <div className="text-[10px] text-gray-500">Shows in new</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="accent-black w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-[11px]">Active</div>
                    <div className="text-[10px] text-gray-500">Visible in store</div>
                  </div>
                </label>
              </div>

              {/* Modal Footer Actions */}
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
                  {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Product')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
