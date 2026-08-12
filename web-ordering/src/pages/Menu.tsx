import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { MenuCategory, MenuItem } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Save,
  Loader2,
  Coffee,
  AlertCircle
} from 'lucide-react';

export const Menu: React.FC = () => {
  const { cafe } = useAuth();
  
  // State lists
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Modal Category States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'add' | 'edit'>('add');
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Modal Item States
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<'add' | 'edit'>('add');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [submittingItem, setSubmittingItem] = useState(false);

  // Delete Confirm States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'category' | 'item'>('item');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => {
    if (cafe) {
      fetchMenuData();
    }
  }, [cafe]);

  const fetchMenuData = async () => {
    if (!cafe) return;
    setLoading(true);
    try {
      // 1. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('name', { ascending: true });

      if (catError) throw catError;
      setCategories(catData || []);

      // 2. Fetch items
      const { data: itemData, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('cafe_id', cafe.id)
        .order('name', { ascending: true });

      if (itemError) throw itemError;
      setItems(itemData || []);

      // Set active category to first one if available
      if (catData && catData.length > 0) {
        setActiveCategoryId(catData[0].id);
      } else {
        setActiveCategoryId(null);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Category Handlers ---
  const openAddCategory = () => {
    setCategoryModalMode('add');
    setCategoryName('');
    setEditingCategoryId(null);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setCategoryModalMode('edit');
    setCategoryName(cat.name);
    setEditingCategoryId(cat.id);
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe || !categoryName.trim()) return;
    setSubmittingCategory(true);

    try {
      if (categoryModalMode === 'add') {
        const { data, error } = await supabase
          .from('menu_categories')
          .insert({
            cafe_id: cafe.id,
            name: categoryName.trim()
          })
          .select()
          .single();

        if (error) throw error;
        setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        if (!activeCategoryId) {
          setActiveCategoryId(data.id);
        }
      } else if (categoryModalMode === 'edit' && editingCategoryId) {
        const { data, error } = await supabase
          .from('menu_categories')
          .update({
            name: categoryName.trim()
          })
          .eq('id', editingCategoryId)
          .select()
          .single();

        if (error) throw error;
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategoryId ? data : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      setShowCategoryModal(false);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category');
    } finally {
      setSubmittingCategory(false);
    }
  };

  // --- Item Handlers ---
  const openAddItem = () => {
    if (!activeCategoryId) {
      alert('Please create a category first.');
      return;
    }
    setItemModalMode('add');
    setItemName('');
    setItemPrice('');
    setItemDescription('');
    setEditingItemId(null);
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setItemModalMode('edit');
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemDescription(item.description || '');
    setEditingItemId(item.id);
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafe || !activeCategoryId || !itemName.trim() || !itemPrice) return;
    setSubmittingItem(true);

    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Please enter a valid price');
      setSubmittingItem(false);
      return;
    }

    try {
      if (itemModalMode === 'add') {
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            cafe_id: cafe.id,
            category_id: activeCategoryId,
            name: itemName.trim(),
            price: priceNum,
            description: itemDescription.trim() || null
          })
          .select()
          .single();

        if (error) throw error;
        setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (itemModalMode === 'edit' && editingItemId) {
        const { data, error } = await supabase
          .from('menu_items')
          .update({
            name: itemName.trim(),
            price: priceNum,
            description: itemDescription.trim() || null
          })
          .eq('id', editingItemId)
          .select()
          .single();

        if (error) throw error;
        setItems((prev) => prev.map((i) => (i.id === editingItemId ? data : i)).sort((a, b) => a.name.localeCompare(b.name)));
      }
      setShowItemModal(false);
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save menu item');
    } finally {
      setSubmittingItem(false);
    }
  };

  // --- Delete Handlers ---
  const triggerDeleteCategory = (id: string) => {
    setDeleteType('category');
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const triggerDeleteItem = (id: string) => {
    setDeleteType('item');
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeletingLoading(true);

    try {
      if (deleteType === 'category') {
        const { error } = await supabase
          .from('menu_categories')
          .delete()
          .eq('id', deletingId);

        if (error) throw error;
        
        // Remove category and its items locally
        setCategories((prev) => prev.filter((c) => c.id !== deletingId));
        setItems((prev) => prev.filter((i) => i.category_id !== deletingId));
        
        // Re-set active category
        const remaining = categories.filter((c) => c.id !== deletingId);
        if (remaining.length > 0) {
          setActiveCategoryId(remaining[0].id);
        } else {
          setActiveCategoryId(null);
        }
      } else if (deleteType === 'item') {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', deletingId);

        if (error) throw error;
        setItems((prev) => prev.filter((i) => i.id !== deletingId));
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Delete operation failed.');
    } finally {
      setDeletingLoading(false);
      setDeletingId(null);
    }
  };

  // Filter items based on active category
  const activeItems = items.filter((item) => item.category_id === activeCategoryId);
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight m-0">Menu Customization</h2>
          <p className="text-xs text-slate-400 mt-1">Configure your cafe menu sections and set customizable pricing.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openAddCategory}
            className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <FolderPlus className="w-4 h-4 text-brand-400" />
            Add Section
          </button>
          <button
            onClick={openAddItem}
            disabled={!activeCategoryId}
            className={`font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md ${
              activeCategoryId
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] py-16 px-6 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Your Menu is Empty</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-normal">Get started by creating categories (e.g. Beverages, South Indian) and adding delicious items under them.</p>
          </div>
          <button
            onClick={openAddCategory}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 inline-flex items-center gap-2 text-xs shadow-md shadow-brand-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categories Tab Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1e293b]">
            {categories.map((cat) => {
              const isActive = cat.id === activeCategoryId;
              return (
                <div key={cat.id} className="relative shrink-0 flex items-center">
                  <button
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all duration-200 border-t border-x cursor-pointer ${
                      isActive
                        ? 'bg-[#0f172a] text-brand-400 border-[#1e293b] font-extrabold pb-3 -mb-2 z-10'
                        : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active Category Actions Panel */}
          {activeCategory && (
            <div className="flex items-center justify-between bg-[#1e293b]/20 border border-[#1e293b] p-4 rounded-2xl text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Active Section:</span>
                <span className="text-white font-bold text-sm">{activeCategory.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditCategory(activeCategory)}
                  className="bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  title="Rename Section"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  Rename
                </button>
                <button
                  onClick={() => triggerDeleteCategory(activeCategory.id)}
                  className="bg-transparent hover:bg-rose-950/20 border border-[#334155] hover:border-rose-900/30 text-slate-300 hover:text-rose-400 font-semibold p-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  title="Delete Section"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Items List under Active Category */}
          {activeItems.length === 0 ? (
            <div className="bg-[#0f172a] border border-[#1e293b] py-16 text-center rounded-3xl shadow-sm">
              <p className="text-slate-400 text-sm font-semibold">No items under this section.</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Add your beverages or snacks to populate this category.</p>
              <button
                onClick={openAddItem}
                className="bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 inline-flex items-center gap-2 text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-brand-400" />
                Create Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0f172a] border border-[#1e293b] hover:border-[#334155] p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-all duration-250 group relative"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-base text-white tracking-tight leading-tight m-0 truncate">
                        {item.name}
                      </h3>
                      <span className="font-mono text-sm font-bold text-brand-400 shrink-0">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 leading-normal line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-[#1e293b] mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEditItem(item)}
                      className="bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={() => triggerDeleteItem(item.id)}
                      className="bg-transparent hover:bg-rose-950/20 border border-[#334155] hover:border-rose-900/30 text-slate-300 hover:text-rose-400 font-semibold p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Category Add/Edit */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
          <div className="relative w-full max-w-sm bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-white tracking-tight m-0">
              {categoryModalMode === 'add' ? 'Create Category' : 'Rename Category'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">E.g., Beverages, South Indian, Desserts.</p>

            <form onSubmit={handleCategorySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full bg-[#1e293b] text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md animate-pulse"
                >
                  {submittingCategory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Menu Item Add/Edit */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
          <div className="relative w-full max-w-md bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-white tracking-tight m-0">
              {itemModalMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure item pricing and descriptions.</p>

            <form onSubmit={handleItemSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Cappuccino, Masala Dosa, etc."
                  className="w-full bg-[#1e293b] text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Price in Rupees (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="120.00"
                    className="w-full bg-[#1e293b] text-white pl-8 pr-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Double shot espresso with steamed velvety textured micro-foam milk."
                  className="w-full bg-[#1e293b] text-white px-4 py-2.5 rounded-xl border border-[#334155] focus:border-brand-500/70 focus:outline-none text-sm placeholder:text-slate-500 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItem}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {submittingItem ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#07090e]/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[#0f172a] border border-[#1e293b] p-6 rounded-3xl shadow-2xl animate-scaleUp text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-sm shadow-rose-500/5">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight m-0">Confirm Deletion</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to delete this {deleteType === 'category' ? 'category and all items under it' : 'menu item'}?
              </p>
              <p className="text-[10px] text-slate-500 mt-1">This action cannot be undone.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-transparent hover:bg-slate-800 border border-[#334155] text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors duration-200 cursor-pointer"
              >
                No, Keep It
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleDeleteConfirm}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {deletingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Menu;
