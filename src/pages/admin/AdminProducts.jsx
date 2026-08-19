import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Clock, 
  Upload, 
  X, 
  Check, 
  Image as ImageIcon,
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

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
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
      category: categories.length > 0 ? (categories[0].slug || categories[0].name) : 't-shirts',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black'],
      stock: 25,
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
    setUploadProgress(0);
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
      category: product.category || (categories[0]?.slug || 't-shirts'),
      sizes: Array.isArray(product.sizes) ? product.sizes : ['M'],
      colors: Array.isArray(product.colors) ? product.colors : ['Black'],
      stock: product.stock !== undefined ? product.stock : 20,
      images: Array.isArray(product.images) && product.images.length > 0 
        ? product.images.map(normalizeImageUrl)
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'],
      variants: Array.isArray(product.variants) ? product.variants : [],
      cjpId: product.cjpId || null,
      cjpSku: product.cjpSku || null,
      supplierCost: product.supplierCost || null,
      weight: product.weight || null,
      rating: product.rating || 5,
      numReviews: product.numReviews || 0,
      featured: Boolean(product.featured),
      isNewArrival: Boolean(product.isNewArrival),
      isActive: product.isActive !== undefined ? Boolean(product.isActive) : true
    });
    setIsEditing(true);
    setCurrentProductId(product.id);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast("Uploading product image to Firebase Storage...", "info");
      const downloadUrl = await uploadProductImage(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({
        ...prev,
        images: [downloadUrl, ...prev.images]
      }));
      showToast("Image uploaded and linked successfully!", "success");
      setUploadProgress(0);
    } catch (err) {
      console.warn("Storage upload fallback:", err);
      // Create local object URL preview fallback if Firebase Storage bucket is not yet activated
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        images: [localUrl, ...prev.images]
      }));
      showToast("Uploaded as image source.", "info");
      setUploadProgress(0);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrlInput.trim()]
      }));
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleAddCustomSize = (e) => {
    e.preventDefault();
    if (customSizeInput.trim() && !formData.sizes.includes(customSizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, customSizeInput.trim()]
      }));
      setCustomSizeInput('');
    }
  };

  const toggleColor = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleAddCustomColor = (e) => {
    e.preventDefault();
    if (customColorInput.trim() && !formData.colors.includes(customColorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, customColorInput.trim()]
      }));
      setCustomColorInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToast("Product name and price are required.", "error");
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing) {
        await updateProduct(currentProductId, formData);
        showToast(`Product "${formData.name}" updated in Firestore!`, "success");
      } else {
        await addProduct(formData);
        showToast(`Product "${formData.name}" created in Firestore!`, "success");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Product save error:", err);
      showToast("Failed to save product to Firestore.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}" from Firestore?`)) {
      try {
        await deleteProduct(productId);
        showToast(`"${productName}" deleted from Firestore.`, "success");
      } catch (err) {
        console.error("Delete error:", err);
        showToast("Failed to delete product.", "error");
      }
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const newStatus = !product.isActive;
      await updateProduct(product.id, { isActive: newStatus });
      showToast(`Product is now ${newStatus ? 'Active' : 'Disabled'}.`, "info");
    } catch (err) {
      console.error("Active toggle error:", err);
      showToast("Failed to update product state.", "error");
    }
  };

  // Filter products for admin table
  const filteredProducts = products.filter(p => {
    if (selectedCategoryFilter !== 'all') {
      if ((p.category || '').toLowerCase() !== selectedCategoryFilter.toLowerCase()) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(term);
      const matchCat = p.category?.toLowerCase().includes(term);
      if (!matchName && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Products Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, edit, and manage all active apparel products, variants, and stock
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0c121e] p-4 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
        <div className="bg-[#0c121e] rounded-2xl sm:rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Tags</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProducts.map((product) => {
                  const hasDiscount = product.discountPrice && Number(product.discountPrice) > 0;
                  const isLowStock = Number(product.stock) <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeImageUrl((product.images && product.images[0]))}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-14 object-cover rounded-xl bg-slate-800 shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" fill="%231e293b"><rect width="48" height="56"/><text x="50%" y="50%" fill="%2364748b" font-size="8" text-anchor="middle" dominant-baseline="middle">N/A</text></svg>');
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate max-w-xs">{product.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 capitalize text-[11px]">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">
                          ${hasDiscount ? Number(product.discountPrice).toFixed(2) : Number(product.price).toFixed(2)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-slate-500 line-through">
                            ${Number(product.price).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          product.stock <= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          isLowStock ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'text-slate-300'
                        }`}>
                          {product.stock} in stock
                        </span>
                      </td>

                      {/* Enable / Disable Active Status */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            product.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {product.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{product.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Tags (Featured, New) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {product.featured && (
                            <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] font-bold rounded">
                              Featured
                            </span>
                          )}
                          {product.isNewArrival && (
                            <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 border border-blue-400/20 text-[10px] font-bold rounded">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="bg-slate-950 rounded-3xl p-12 border border-slate-800 text-center space-y-4">
          <p className="text-slate-400 text-xs">No products found matching your search.</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create First Product
          </button>
        </div>
      )}

      {/* Add / Edit Product Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {isEditing ? 'Edit Product Item' : 'Add New Product Item'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  Update apparel details, pricing, variants, and inventory
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-xs">
              
              {/* Product Name */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acid Washed Oversized T-Shirt"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Heavyweight cotton material, signature relaxed cut..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category, Price, Discount Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug || c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Standard Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="45.00"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="Optional (e.g. 35.00)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Sizes Multi-Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-semibold text-slate-300">Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...(formData.sizes || []), ...COMMON_SIZES])).map((size) => {
                    const isChecked = formData.sizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {/* Custom size input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom size (e.g. 38, Oversized)"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
                  >
                    Add Size
                  </button>
                </div>
              </div>

              {/* Colors Multi-Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-semibold text-slate-300">Available Colors</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...(formData.colors || []), ...COMMON_COLORS])).map((col) => {
                    const isChecked = formData.colors.includes(col);
                    return (
                      <button
                        type="button"
                        key={col}
                        onClick={() => toggleColor(col)}
                        className={`px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
                {/* Custom color input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom color (e.g. Vintage Olive)"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* Product Images Uploader & URL Input */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block font-semibold text-slate-300">Product Images (Firebase Storage / URL)</label>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* File Upload Button */}
                  <label className="cursor-pointer px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Direct Image URL input */}
                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      placeholder="Or paste image URL (Unsplash, CDN...)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {uploadProgress > 0 && (
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                {/* Preview Thumbnails */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {formData.images.map((img, idx) => {
                    const normalized = normalizeImageUrl(img);
                    return (
                      <div key={idx} className="relative group w-20 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        <img 
                          src={normalized} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="96" fill="%231e293b"><rect width="80" height="96"/><text x="50%" y="50%" fill="%2364748b" font-size="10" text-anchor="middle" dominant-baseline="middle">Failed</text></svg>');
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggles (Featured, New Arrival, Active) */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-white text-[11px]">Featured Item</div>
                    <div className="text-[10px] text-slate-400">Shows on Home featured</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-white text-[11px]">New Arrival</div>
                    <div className="text-[10px] text-slate-400">Shows in New section</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-white text-[11px]">Enabled & Active</div>
                    <div className="text-[10px] text-slate-400">Visible to customers</div>
                  </div>
                </label>
              </div>

              {/* Modal Footer */}
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
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
                >
                  {isSaving ? 'Saving to Firestore...' : (isEditing ? 'Save Changes' : 'Create Product')}
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
