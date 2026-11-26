"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  buildAdminCustomerStatusMessage,
  getCustomerWhatsAppUrl,
  getWhatsAppOrderUrl,
} from "@/lib/whatsapp-order";
import ProductDescription from "@/components/product/ProductDescription";
import BlogManager from "@/components/admin/BlogManager";
import CrmManager from "@/components/admin/CrmManager";

interface Category {
  id: string;
  name: string;
  slug: string;
  showInNav?: boolean;
  navOrder?: number;
  navLabel?: string | null;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  images: string[];
  stock: number;
  sku: string;
  isNew: boolean;
  isFeatured: boolean;
  isHotDeal: boolean;
  isActive: boolean;
  statusNote: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  newArrivals: number;
  hotDeals: number;
  featured: number;
  inactive: number;
  outOfStock?: number;
}

interface AbandonedAnalytics {
  totalAbandoned: number;
  recoveredCarts: number;
  recoveredRevenue: number;
  recoveryRate: number;
  emailsSent: {
    tier1: number;
    tier2: number;
    tier3: number;
    total: number;
  };
}

interface AdminOrder {
  id: string;
  orderNumberDisplay?: string;
  createdAt: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: string;
  deliveryMethod: "DELIVERY" | "PICKUP";
  county?: string | null;
  subtotal: number;
  deliveryFee: number;
  engravingFee: number;
  discountAmount: number;
  total: number;
  amountDueNow: number;
  amountDueOnDelivery: number;
  shippingAddress: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    addressLine?: string;
    county?: string;
    engravingText?: string;
    engravingFee?: number;
    customerNote?: string;
    mpesaTransactionCode?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: number;
    variantName?: string | null;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
      sku: string;
    };
  }>;
  whatsAppMessage: string;
  whatsAppPayload: any;
}

interface OrderStats {
  totalOrders: number;
  pending: number;
  processing: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    newArrivals: 0,
    hotDeals: 0,
    featured: 0,
    inactive: 0,
    outOfStock: 0,
  });

  const [analytics, setAnalytics] = useState<AbandonedAnalytics>({
    totalAbandoned: 0,
    recoveredCarts: 0,
    recoveredRevenue: 0,
    recoveryRate: 0,
    emailsSent: { tier1: 0, tier2: 0, tier3: 0, total: 0 },
  });

  const [runningRecovery, setRunningRecovery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<string>("50");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [descTab, setDescTab] = useState<"edit" | "preview">("edit");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInputs, setShowUrlInputs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast / Alert
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Form State for Adding Product
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    price: "",
    compareAtPrice: "",
    stock: "15",
    sku: "",
    isNew: false,
    isFeatured: false,
    isHotDeal: false,
    isActive: true,
    statusNote: "",
    images: [] as Array<{ url: string; color: string; priceModifier: string; stock: string }>,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<"catalog" | "categories" | "orders" | "blog" | "crm">("catalog");
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const [newCatInputName, setNewCatInputName] = useState("");
  const [creatingCatInline, setCreatingCatInline] = useState(false);
  const [editingCatFields, setEditingCatFields] = useState<
    Record<string, { navLabel: string; navOrder: number }>
  >({});

  // Orders Management State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    pending: 0,
    processing: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderForWhatsApp, setSelectedOrderForWhatsApp] = useState<AdminOrder | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (data.categories.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch {
      showToast("Failed to load categories", "error");
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (selectedOrderStatus !== "all") params.append("status", selectedOrderStatus);
      if (orderSearchQuery.trim()) params.append("search", orderSearchQuery.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.stats) setOrderStats(data.stats);
      } else {
        showToast(data.error || "Failed to load orders", "error");
      }
    } catch {
      showToast("Network error fetching orders", "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSection !== "all") params.append("section", selectedSection);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("page", currentPage.toString());
      params.append("limit", pageSize);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.stats) setStats(data.stats);
        if (data.abandonedCartAnalytics) setAnalytics(data.abandonedCartAnalytics);
        if (data.pagination) setPagination(data.pagination);
      } else {
        showToast(data.error || "Failed to load products", "error");
      }
    } catch {
      showToast("Network error fetching products", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRecovery = async () => {
    try {
      setRunningRecovery(true);
      const res = await fetch("/api/admin/abandoned-carts", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(
          `Recovery completed: ${data.summary?.sent || 0} reminder email(s) dispatched`,
          "success"
        );
        fetchProducts();
      } else {
        showToast(data.error || "Recovery failed", "error");
      }
    } catch {
      showToast("Network error running recovery", "error");
    } finally {
      setRunningRecovery(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSection, selectedCategory, searchQuery, pageSize]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [selectedSection, selectedCategory, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timeout);
  }, [selectedOrderStatus, orderSearchQuery]);

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
        fetchOrders();
        showToast(`Order #${orderId.slice(-6)} status updated to ${newStatus}`);
      } else {
        showToast(data.error || "Failed to update order status", "error");
      }
    } catch {
      showToast("Error updating order status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getOrderCustomerMessage = (order: AdminOrder) =>
    buildAdminCustomerStatusMessage({
      orderId: order.id,
      orderNumberDisplay: order.orderNumberDisplay,
      status: order.status,
      customerName: order.shippingAddress.fullName,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        variantName: item.variantName,
      })),
    });

  // Copy WhatsApp message to clipboard
  const handleCopyWhatsAppMessage = async (order: AdminOrder) => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(getOrderCustomerMessage(order));
      setCopiedOrderId(order.id);
      showToast(`WhatsApp status message for ${order.orderNumberDisplay || `#${order.id.slice(-6)}`} copied!`);
      setTimeout(() => setCopiedOrderId(null), 3000);
    } catch {
      showToast("Failed to copy message", "error");
    }
  };

  // Form Input Change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Handle Image inputs & color attachment
  const handleImageUrlChange = (index: number, val: string) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[index] = { ...newImages[index], url: val };
      return { ...prev, images: newImages };
    });
  };

  const updateImageColor = (index: number, color: string) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[index] = { ...newImages[index], color };
      return { ...prev, images: newImages };
    });
  };

  const updateImageDetail = (
    index: number,
    field: "priceModifier" | "stock",
    val: string
  ) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[index] = { ...newImages[index], [field]: val };
      return { ...prev, images: newImages };
    });
  };

  const addImageUrlField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: "", color: "", priceModifier: "0", stock: prev.stock || "10" },
      ],
    }));
  };

  const removeImageItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const makeImagePrimary = (index: number) => {
    setFormData((prev) => {
      const selected = prev.images[index];
      const rest = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: [selected, ...rest] };
    });
    showToast("Set as primary cover photo");
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach((file) => {
        uploadFormData.append("file", file);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { success: false, error: `Upload response error (Status: ${res.status})` };
      }

      if (res.ok && data.success && data.urls && data.urls.length > 0) {
        setFormData((prev) => {
          const currentNonEmpty = prev.images.filter((img) => img.url.trim().length > 0);
          const newItems = data.urls.map((url: string) => ({
            url,
            color: "",
            priceModifier: "0",
            stock: prev.stock || "10",
          }));
          return {
            ...prev,
            images: [...currentNonEmpty, ...newItems],
          };
        });
        showToast(`Uploaded ${data.urls.length} photo${data.urls.length > 1 ? "s" : ""} successfully`);
      } else {
        showToast(data.error || "Failed to upload images. Please check file format.", "error");
      }
    } catch {
      showToast("Network error uploading images", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Discount preview calculation
  const discountPercent = useMemo(() => {
    const priceNum = parseFloat(formData.price);
    const compareNum = parseFloat(formData.compareAtPrice);
    if (!isNaN(priceNum) && !isNaN(compareNum) && compareNum > priceNum && priceNum > 0) {
      return Math.round(((compareNum - priceNum) / compareNum) * 100);
    }
    return null;
  }, [formData.price, formData.compareAtPrice]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      categoryId: categories[0]?.id || "",
      price: "",
      compareAtPrice: "",
      stock: "15",
      sku: "",
      isNew: false,
      isFeatured: false,
      isHotDeal: false,
      isActive: true,
      statusNote: "",
      images: [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal with Pre-populated Product & Variants
  const handleOpenEditModal = async (product: Product) => {
    setEditingProductId(product.id);
    setFormErrors({});
    try {
      const res = await fetch(`/api/admin/products/${product.id}`);
      const data = await res.json();
      const p = data.success ? data.product : product;

      const variants = (p.variants || []) as Array<{ name: string; image?: string; priceModifier?: number; stock?: number }>;
      const parentStockStr = p.stock !== undefined && p.stock !== null ? String(p.stock) : "15";

      const imageItems: Array<{ url: string; color: string; priceModifier: string; stock: string }> = (
        p.images || []
      ).map((imgUrl: string) => {
        const matched = variants.find((v) => v.image === imgUrl);
        return {
          url: imgUrl,
          color: matched?.name || "",
          priceModifier: matched && Number(matched.priceModifier) > 0 ? String(matched.priceModifier) : "0",
          stock: matched && matched.stock !== undefined && matched.stock !== null ? String(matched.stock) : parentStockStr,
        };
      });

      variants.forEach((v) => {
        if (v.image && !imageItems.some((item) => item.url === v.image)) {
          imageItems.push({
            url: v.image,
            color: v.name,
            priceModifier: Number(v.priceModifier) > 0 ? String(v.priceModifier) : "0",
            stock: v.stock !== undefined && v.stock !== null ? String(v.stock) : parentStockStr,
          });
        }
      });

      setFormData({
        name: p.name || "",
        slug: p.slug || "",
        description: p.description || "",
        categoryId: p.categoryId || categories[0]?.id || "",
        price: p.price !== undefined && p.price !== null ? String(p.price) : "",
        compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
        stock: parentStockStr,
        sku: p.sku || "",
        isNew: Boolean(p.isNew),
        isFeatured: Boolean(p.isFeatured),
        isHotDeal: Boolean(p.isHotDeal),
        isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
        statusNote: p.statusNote || "",
        images: imageItems,
      });
      setIsModalOpen(true);
    } catch {
      showToast("Failed to load product details", "error");
    }
  };

  // Create a new category inline
  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCategories();
        setFormData((prev) => ({ ...prev, categoryId: data.category.id }));
        setNewCategoryName("");
        showToast(`Category "${data.category.name}" ready`);
      } else {
        showToast(data.error || "Failed to create category", "error");
      }
    } catch {
      showToast("Error creating category", "error");
    } finally {
      setCreatingCategory(false);
    }
  };

  // Toggle Show In Nav
  const handleToggleCategoryNav = async (cat: Category) => {
    setUpdatingCategoryId(cat.id);
    const newShowInNav = !cat.showInNav;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInNav: newShowInNav }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, showInNav: newShowInNav } : c))
        );
        showToast(
          `"${cat.name}" ${newShowInNav ? "added to" : "removed from"} store navigation`
        );
      } else {
        showToast(data.error || "Failed to update category", "error");
      }
    } catch {
      showToast("Error updating category", "error");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  // Save Nav Details (navLabel, navOrder)
  const handleSaveCategoryNavDetails = async (cat: Category) => {
    const fields = editingCatFields[cat.id] || {
      navLabel: cat.navLabel ?? "",
      navOrder: cat.navOrder || 0,
    };
    const navLabelTrimmed = fields.navLabel.trim() || null;
    const navOrderNum = Number(fields.navOrder) || 0;
    setUpdatingCategoryId(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          navLabel: navLabelTrimmed,
          navOrder: navOrderNum,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id
              ? { ...c, navLabel: navLabelTrimmed, navOrder: navOrderNum }
              : c
          )
        );
        showToast(`Saved navigation settings for "${cat.name}"`);
      } else {
        showToast(data.error || "Failed to update category", "error");
      }
    } catch {
      showToast("Error updating category", "error");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  // Create Category from Categories tab
  const handleCreateCategoryFromTab = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatInputName.trim();
    if (!name) return;
    setCreatingCatInline(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatInputName("");
        await fetchCategories();
        showToast(`Category "${data.category.name}" created successfully`);
      } else {
        showToast(data.error || "Failed to create category", "error");
      }
    } catch {
      showToast("Error creating category", "error");
    } finally {
      setCreatingCatInline(false);
    }
  };

  // Form Submit (Create or Update)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Product name is required";
    if (!formData.categoryId || formData.categoryId === "__new__") errors.categoryId = "Please select or save a category";
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      errors.price = "Enter a valid positive price";
    }

    const validImageItems = formData.images.filter((img) => img.url && img.url.trim().length > 0);
    const validImageUrls = validImageItems.map((img) => img.url.trim());
    if (validImageUrls.length === 0) {
      validImageUrls.push("/halisi-logo.png");
    }

    const variants = validImageItems
      .filter((img) => img.color && img.color.trim().length > 0)
      .map((img) => ({
        name: img.color.trim(),
        image: img.url.trim(),
        priceModifier: img.priceModifier.trim() || "0",
        stock: img.stock ? String(img.stock) : formData.stock || "15",
      }));

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const url = editingProductId
        ? `/api/admin/products/${editingProductId}`
        : "/api/admin/products";
      const method = editingProductId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim() || undefined,
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          price: formData.price,
          compareAtPrice: formData.compareAtPrice || null,
          stock: formData.stock || "0",
          sku: formData.sku.trim() || undefined,
          isNew: formData.isNew,
          isFeatured: formData.isFeatured,
          isHotDeal: formData.isHotDeal,
          isActive: formData.isActive,
          statusNote: formData.statusNote.trim() || null,
          images: validImageUrls,
          variants,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          editingProductId
            ? `Product "${data.product.name}" updated successfully`
            : `Product "${data.product.name}" created successfully`
        );
        setIsModalOpen(false);
        setEditingProductId(null);
        fetchProducts();
      } else {
        showToast(data.error || "Failed to save product", "error");
      }
    } catch {
      showToast("An unexpected error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Section / Status Quick Action
  const handleToggle = async (
    product: Product,
    field: "isNew" | "isHotDeal" | "isFeatured" | "isActive"
  ) => {
    setTogglingId(product.id);
    const newValue = !product[field];

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, [field]: newValue } : p))
        );
        fetchProducts();
        showToast(`Updated ${field.replace("is", "")} status for "${product.name}"`);
      } else {
        showToast(data.error || "Failed to update product", "error");
      }
    } catch {
      showToast("Error updating product", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Whole Product Stock (In Stock vs Out of Stock)
  const handleToggleStock = async (product: Product) => {
    setTogglingId(product.id);
    const newStock = product.stock > 0 ? 0 : 15;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
        fetchProducts();
        showToast(
          newStock === 0
            ? `Marked "${product.name}" as Out of Stock`
            : `Marked "${product.name}" as In Stock (15 units)`
        );
      } else {
        showToast(data.error || "Failed to update stock", "error");
      }
    } catch {
      showToast("Error updating stock", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
      return;
    }

    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Product "${product.name}" deleted successfully`);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        fetchProducts();
      } else {
        showToast(data.error || "Failed to delete product", "error");
      }
    } catch {
      showToast("Error deleting product", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-[#1B1C1C] text-white border-l-4 border-[#266e00]"
              : "bg-red-900 text-white border-l-4 border-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1B1C1C]">
            Product &amp; Section Catalog
          </h1>
          <p className="text-sm text-black/60 mt-1">
            Create new products and assign them to specific homepage sections or the general store catalog.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B1C1C] hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all border border-[#266e00]/40"
        >
          <svg className="w-4 h-4 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-black/10 gap-4 sm:gap-6 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveAdminTab("catalog")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === "catalog"
              ? "border-[#266e00] text-[#1B1C1C]"
              : "border-transparent text-black/50 hover:text-black"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products &amp; Catalog ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab("categories")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === "categories"
              ? "border-[#266e00] text-[#1B1C1C]"
              : "border-transparent text-black/50 hover:text-black"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Categories &amp; Store Navigation ({categories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab("orders")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === "orders"
              ? "border-[#266e00] text-[#1B1C1C]"
              : "border-transparent text-black/50 hover:text-black"
          }`}
        >
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Customer Orders &amp; WhatsApp ({orderStats.totalOrders})
          {orderStats.pending > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
              {orderStats.pending} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab("blog")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === "blog"
              ? "border-[#266e00] text-[#1B1C1C]"
              : "border-transparent text-black/50 hover:text-black"
          }`}
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          Blog &amp; Gift Guides
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab("crm")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === "crm"
              ? "border-[#266e00] text-[#1B1C1C]"
              : "border-transparent text-black/50 hover:text-black"
          }`}
        >
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          CRM &amp; Marketing
        </button>
      </div>

      {activeAdminTab === "catalog" && (
        <div className="space-y-8">
          {/* Abandoned Cart & Recovery Stats */}
          <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/10 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#266e00]"></div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1B1C1C]">
              Abandoned Cart Recovery Performance
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-black/50 hidden sm:inline">
              Tiered Auto-Reminders (1h, 24h, 72h)
            </span>
            <button
              type="button"
              onClick={handleTriggerRecovery}
              disabled={runningRecovery}
              className="text-xs bg-black text-white hover:bg-[#266e00] transition-colors font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>{runningRecovery ? "Dispatching..." : "Run Recovery Now"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-black/5">
            <span className="text-[11px] font-semibold text-black/50 uppercase block">
              Total Abandoned
            </span>
            <span className="text-xl font-serif font-bold text-black mt-1 block">
              {analytics.totalAbandoned}
            </span>
            <span className="text-[10px] text-black/40">Incomplete checkouts</span>
          </div>

          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-black/5">
            <span className="text-[11px] font-semibold text-blue-700 uppercase block">
              Emails Dispatched
            </span>
            <span className="text-xl font-serif font-bold text-black mt-1 block">
              {analytics.emailsSent.total}
            </span>
            <span className="text-[10px] text-blue-600">
              T1: {analytics.emailsSent.tier1} | T2: {analytics.emailsSent.tier2} | T3: {analytics.emailsSent.tier3}
            </span>
          </div>

          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-black/5">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase block">
              Recovered Carts
            </span>
            <span className="text-xl font-serif font-bold text-emerald-700 mt-1 block">
              {analytics.recoveredCarts}
            </span>
            <span className="text-[10px] text-emerald-600">Completed via reminder</span>
          </div>

          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-black/5">
            <span className="text-[11px] font-semibold text-[#064022] uppercase block">
              Recovered Revenue
            </span>
            <span className="text-xl font-serif font-bold text-black mt-1 block">
              KES {analytics.recoveredRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#064022]">Attributed sales</span>
          </div>

          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-black/5">
            <span className="text-[11px] font-semibold text-purple-700 uppercase block">
              Recovery Rate
            </span>
            <span className="text-xl font-serif font-bold text-purple-800 mt-1 block">
              {analytics.recoveryRate}%
            </span>
            <span className="text-[10px] text-purple-600">Conversion efficiency</span>
          </div>
        </div>
      </div>

      {/* Catalog Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedSection("all")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedSection === "all"
              ? "border-[#266e00] ring-2 ring-[#266e00]/20 shadow-sm"
              : "border-black/10 hover:border-black/20"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-black/50 block">
            Total Catalog
          </span>
          <span className="text-2xl font-serif font-bold text-[#1B1C1C] mt-1 block">
            {stats.total}
          </span>
          <span className="text-[11px] text-black/50 mt-1 block">All live &amp; draft products</span>
        </div>

        <div
          onClick={() => setSelectedSection("new_arrivals")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedSection === "new_arrivals"
              ? "border-[#266e00] ring-2 ring-[#266e00]/20 shadow-sm"
              : "border-black/10 hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 block">
              New Arrivals
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
          <span className="text-2xl font-serif font-bold text-[#1B1C1C] mt-1 block">
            {stats.newArrivals}
          </span>
          <span className="text-[11px] text-black/50 mt-1 block">Homepage Slider</span>
        </div>

        <div
          onClick={() => setSelectedSection("hot_deals")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedSection === "hot_deals"
              ? "border-[#266e00] ring-2 ring-[#266e00]/20 shadow-sm"
              : "border-black/10 hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 block">
              Hot Deals
            </span>
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
          </div>
          <span className="text-2xl font-serif font-bold text-[#1B1C1C] mt-1 block">
            {stats.hotDeals}
          </span>
          <span className="text-[11px] text-black/50 mt-1 block">Discount Showcase</span>
        </div>

        <div
          onClick={() => setSelectedSection("featured")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedSection === "featured"
              ? "border-[#266e00] ring-2 ring-[#266e00]/20 shadow-sm"
              : "border-black/10 hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#266e00] block">
              Featured
            </span>
            <span className="w-2 h-2 rounded-full bg-[#266e00]"></span>
          </div>
          <span className="text-2xl font-serif font-bold text-[#1B1C1C] mt-1 block">
            {stats.featured}
          </span>
          <span className="text-[11px] text-black/50 mt-1 block">Featured Grid</span>
        </div>

        <div
          onClick={() => setSelectedSection("inactive")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            selectedSection === "inactive"
              ? "border-[#266e00] ring-2 ring-[#266e00]/20 shadow-sm"
              : "border-black/10 hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
              Inactive
            </span>
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          </div>
          <span className="text-2xl font-serif font-bold text-[#1B1C1C] mt-1 block">
            {stats.inactive}
          </span>
          <span className="text-[11px] text-black/50 mt-1 block">Hidden from store</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-black/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Section Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedSection("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "all"
                  ? "bg-[#1B1C1C] text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setSelectedSection("new_arrivals")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "new_arrivals"
                  ? "bg-blue-900 text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              New Arrivals ({stats.newArrivals})
            </button>
            <button
              onClick={() => setSelectedSection("hot_deals")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "hot_deals"
                  ? "bg-red-900 text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              Hot Deals ({stats.hotDeals})
            </button>
            <button
              onClick={() => setSelectedSection("featured")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "featured"
                  ? "bg-[#266e00] text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              Featured ({stats.featured})
            </button>
            <button
              onClick={() => setSelectedSection("inactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "inactive"
                  ? "bg-gray-700 text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              Inactive ({stats.inactive})
            </button>
            <button
              onClick={() => setSelectedSection("out_of_stock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "out_of_stock"
                  ? "bg-amber-700 text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              Out of Stock ({stats.outOfStock ?? 0})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search name, SKU, desc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-black/15 rounded-lg focus:outline-none focus:border-[#266e00] focus:ring-1 focus:ring-[#266e00]"
              />
              <svg
                className="w-4 h-4 text-black/40 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-48 py-1.5 px-3 text-xs bg-[#F8F9FA] border border-black/15 rounded-lg focus:outline-none focus:border-[#266e00]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-[#F8F9FA] text-[11px] uppercase tracking-wider text-black/60 font-semibold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Section Assignments</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-black/50">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#266e00] border-t-transparent rounded-full mb-2"></div>
                    <p>Loading catalog items...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-black/50">
                    <p className="text-sm font-medium text-black">No products found</p>
                    <p className="text-xs text-black/50 mt-1">
                      Try adjusting your filters or click &quot;Add New Product&quot; to create one.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const firstImage = product.images?.[0] || "/halisi-logo.png";
                  const isBusy = togglingId === product.id || deletingId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-black/[0.02] transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-black/5 border border-black/10 flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                            <img
                              src={firstImage}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/halisi-logo.png";
                              }}
                            />
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
                            <div className="font-semibold text-black truncate">{product.name}</div>
                            <div className="text-[11px] text-black/50 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{product.sku}</span>
                              {product.statusNote && (
                                <span className="bg-[#266e00]/15 text-[#064022] px-1.5 py-0.2 rounded text-[10px] font-medium truncate">
                                  {product.statusNote}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-black/5 rounded text-[11px] text-black/80 font-medium whitespace-nowrap">
                          {product.category?.name || "Unassigned"}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-black">
                          KES {product.price.toLocaleString()}
                        </div>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <div className="text-[10px] text-black/40 line-through">
                            KES {product.compareAtPrice.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Section Quick Toggles */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* New Arrival Toggle */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggle(product, "isNew")}
                            title="Toggle New Arrival section"
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                              product.isNew
                                ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                : "bg-white text-black/40 border-black/15 hover:border-black/30"
                            }`}
                          >
                            {product.isNew ? "New Arrival" : "+ New"}
                          </button>

                          {/* Hot Deal Toggle */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggle(product, "isHotDeal")}
                            title="Toggle Hot Deal section"
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                              product.isHotDeal
                                ? "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                : "bg-white text-black/40 border-black/15 hover:border-black/30"
                            }`}
                          >
                            {product.isHotDeal ? "Hot Deal" : "+ Deal"}
                          </button>

                          {/* Featured Toggle */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggle(product, "isFeatured")}
                            title="Toggle Featured Showcase section"
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                              product.isFeatured
                                ? "bg-[#266e00]/15 text-[#064022] border-[#266e00]/40 hover:bg-[#266e00]/25"
                                : "bg-white text-black/40 border-black/15 hover:border-black/30"
                            }`}
                          >
                            {product.isFeatured ? "Featured" : "+ Featured"}
                          </button>
                        </div>
                      </td>

                      {/* Active & Stock Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggle(product, "isActive")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                              product.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                product.isActive ? "bg-emerald-600" : "bg-gray-400"
                              }`}
                            ></span>
                            {product.isActive ? "Active" : "Draft"}
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggleStock(product)}
                            title="Toggle In Stock / Out of Stock"
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                              product.stock > 0
                                ? "bg-black/5 text-black/75 hover:bg-amber-100 hover:text-amber-800"
                                : "bg-red-50 text-red-700 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            {product.stock > 0 ? `Stock: ${product.stock}` : "Out of Stock"}
                          </button>
                        </div>
                      </td>

                      {/* Action Links */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={isBusy}
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-black/70 hover:text-[#266e00] hover:bg-[#266e00]/10 rounded transition-colors"
                            title="Edit product"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-black/60 hover:text-black hover:bg-black/5 rounded transition-colors"
                            title="View on store"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>

                          <button
                            disabled={isBusy}
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete product"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Page Size Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-black/10 bg-[#F8F9FA] text-xs text-black/70">
          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <strong className="text-black">
                {products.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-black">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              of <strong className="text-black">{pagination.total}</strong> products
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              aria-label="Products per page"
              className="bg-white border border-black/15 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#266e00]"
            >
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="all">Show All</option>
            </select>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md border border-black/15 bg-white hover:bg-black hover:text-white disabled:opacity-40 transition-colors font-medium"
              >
                Previous
              </button>
              <span className="font-medium text-black">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= pagination.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-md border border-black/15 bg-white hover:bg-black hover:text-white disabled:opacity-40 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {activeAdminTab === "categories" && (
        <div className="space-y-6">
          {/* Quick Category Add Bar */}
          <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
              <div>
                <h2 className="text-base font-serif text-[#1B1C1C]">
                  Create New Category
                </h2>
                <p className="text-xs text-black/60 mt-0.5">
                  Add a new category to your store. You can feature it directly in the store navigation bar.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCategoryFromTab} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCatInputName}
                onChange={(e) => setNewCatInputName(e.target.value)}
                placeholder="e.g. Luxury Handbags, Perfumes & Fragrances, Smart Tech..."
                className="flex-1 px-4 py-2.5 text-xs border border-black/20 rounded-xl focus:outline-none focus:border-[#266e00]"
              />
              <button
                type="submit"
                disabled={creatingCatInline || !newCatInputName.trim()}
                className="px-5 py-2.5 bg-[#1B1C1C] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm border border-[#266e00]/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingCatInline ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Navigation Guide Callout */}
          <div className="bg-[#F8FAF9] border border-[#266e00]/30 p-4 rounded-xl flex items-start gap-3 text-xs text-[#064022]">
            <svg className="w-5 h-5 text-[#266e00] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold block mb-0.5">Storefront Header Navigation Control</span>
              Categories with <strong>Show in Nav</strong> enabled appear directly in the top header on desktop and inside the mobile menu drawer. You can customize their short display label and order sequence below.
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/10 bg-[#F8F9FA] text-[11px] uppercase tracking-wider text-black/60 font-semibold">
                    <th className="py-3 px-4">Category Name &amp; Slug</th>
                    <th className="py-3 px-4 text-center">Products</th>
                    <th className="py-3 px-4 text-center">In Store Nav</th>
                    <th className="py-3 px-4">Nav Display Label</th>
                    <th className="py-3 px-4 text-center">Nav Order</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-xs">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-black/50">
                        No categories found. Use the form above to create one.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => {
                      const isBusy = updatingCategoryId === cat.id;
                      const currentFields = editingCatFields[cat.id] || {
                        navLabel: cat.navLabel ?? "",
                        navOrder: cat.navOrder || 0,
                      };

                      return (
                        <tr key={cat.id} className="hover:bg-black/[0.02] transition-colors">
                          {/* Name & Slug */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-black">{cat.name}</div>
                            <div className="text-[11px] font-mono text-black/40 mt-0.5">
                              /category/{cat.slug}
                            </div>
                          </td>

                          {/* Products Count */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-black/5 rounded-full text-[11px] font-medium text-black/70">
                              {cat._count?.products ?? 0}
                            </span>
                          </td>

                          {/* Show in Nav Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleCategoryNav(cat)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                cat.showInNav
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                  : "bg-black/5 text-black/50 border border-black/10 hover:bg-black/10"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  cat.showInNav ? "bg-emerald-600" : "bg-black/30"
                                }`}
                              ></span>
                              {cat.showInNav ? "Visible in Nav" : "Hidden"}
                            </button>
                          </td>

                          {/* Nav Display Label Input */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentFields.navLabel}
                              onChange={(e) =>
                                setEditingCatFields((prev) => ({
                                  ...prev,
                                  [cat.id]: {
                                    ...currentFields,
                                    navLabel: e.target.value,
                                  },
                                }))
                              }
                              placeholder={cat.name}
                              className="w-full max-w-[180px] px-2.5 py-1 text-xs border border-black/15 rounded-lg focus:outline-none focus:border-[#266e00]"
                            />
                          </td>

                          {/* Nav Sort Order Input */}
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={currentFields.navOrder}
                              onChange={(e) =>
                                setEditingCatFields((prev) => ({
                                  ...prev,
                                  [cat.id]: {
                                    ...currentFields,
                                    navOrder: parseInt(e.target.value, 10) || 0,
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 text-xs text-center border border-black/15 rounded-lg focus:outline-none focus:border-[#266e00]"
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSaveCategoryNavDetails(cat)}
                                className="px-3 py-1 bg-[#1B1C1C] hover:bg-black text-white text-[11px] font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                              >
                                {isBusy ? "Saving..." : "Save Settings"}
                              </button>

                              <Link
                                href={`/category/${cat.slug}`}
                                target="_blank"
                                className="p-1.5 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                                title="View on live store"
                              >
                                <svg
                                  className="w-4 h-4 text-[#266e00]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders & WhatsApp Section */}
      {activeAdminTab === "orders" && (
        <div className="space-y-6">
          {/* Order Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm">
              <span className="text-[11px] font-semibold text-black/50 uppercase block">Total Revenue</span>
              <span className="text-xl font-serif font-bold text-black mt-1 block">
                KES {orderStats.totalRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-black/40">Gross completed sales</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm">
              <span className="text-[11px] font-semibold text-black/50 uppercase block">Total Orders</span>
              <span className="text-xl font-serif font-bold text-black mt-1 block">
                {orderStats.totalOrders}
              </span>
              <span className="text-[10px] text-black/40">All customer orders</span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-800 uppercase block">Pending</span>
              <span className="text-xl font-serif font-bold text-amber-900 mt-1 block">
                {orderStats.pending}
              </span>
              <span className="text-[10px] text-amber-700">Awaiting confirmation</span>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
              <span className="text-[11px] font-semibold text-blue-800 uppercase block">Processing</span>
              <span className="text-xl font-serif font-bold text-blue-900 mt-1 block">
                {orderStats.processing}
              </span>
              <span className="text-[10px] text-blue-700">In packing/prep</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Paid</span>
              <span className="text-xl font-serif font-bold text-emerald-900 mt-1 block">
                {orderStats.paid}
              </span>
              <span className="text-[10px] text-emerald-700">Confirmed M-Pesa</span>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm">
              <span className="text-[11px] font-semibold text-purple-800 uppercase block">Shipped / Done</span>
              <span className="text-xl font-serif font-bold text-purple-900 mt-1 block">
                {orderStats.shipped + orderStats.delivered}
              </span>
              <span className="text-[10px] text-purple-700">Dispatched &amp; Delivered</span>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white p-4 rounded-xl border border-black/10 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by order number (HG-10001), order ID, email, county or M-Pesa code..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-black/15 rounded-lg focus:outline-none focus:border-[#266e00] bg-[#F8F9FA]"
                />
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="px-3.5 py-2 text-xs font-medium bg-[#F8F9FA] hover:bg-black/5 text-black border border-black/15 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <svg className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Orders</span>
              </button>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-black/5">
              {[
                { label: "All Orders", value: "all", count: orderStats.totalOrders },
                { label: "Pending", value: "PENDING", count: orderStats.pending },
                { label: "Processing", value: "PROCESSING", count: orderStats.processing },
                { label: "Paid", value: "PAID", count: orderStats.paid },
                { label: "Shipped", value: "SHIPPED", count: orderStats.shipped },
                { label: "Delivered", value: "DELIVERED", count: orderStats.delivered },
                { label: "Cancelled", value: "CANCELLED", count: orderStats.cancelled },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSelectedOrderStatus(pill.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedOrderStatus === pill.value
                      ? "bg-[#1B1C1C] text-white shadow-sm font-semibold"
                      : "bg-[#F8F9FA] text-black/70 hover:bg-black/5 border border-black/10"
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedOrderStatus === pill.value ? "bg-white/20 text-white" : "bg-black/10 text-black/60"
                  }`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loadingOrders ? (
            <div className="py-16 text-center text-black/50 bg-white rounded-xl border border-black/10">
              <svg className="w-8 h-8 animate-spin mx-auto text-[#266e00] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-xs">Loading customer orders and WhatsApp details...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-black/50 bg-white rounded-xl border border-black/10 space-y-2">
              <svg className="w-12 h-12 mx-auto text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="font-serif text-black text-sm">No Orders Found</h3>
              <p className="text-xs text-black/50">No customer orders match your active search or status filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const customerPhone = order.shippingAddress.phoneNumber || "";
                const statusWhatsAppMessage = getOrderCustomerMessage(order);
                const customerWhatsAppLink = customerPhone
                  ? getCustomerWhatsAppUrl(customerPhone, statusWhatsAppMessage)
                  : getWhatsAppOrderUrl(order.whatsAppPayload);

                const statusColorMap: Record<string, string> = {
                  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
                  PROCESSING: "bg-blue-100 text-blue-800 border-blue-300",
                  PAID: "bg-emerald-100 text-emerald-800 border-emerald-300",
                  SHIPPED: "bg-purple-100 text-purple-800 border-purple-300",
                  DELIVERED: "bg-green-100 text-green-800 border-green-300",
                  CANCELLED: "bg-red-100 text-red-800 border-red-300",
                };

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden transition-all hover:border-[#266e00]/40 hover:shadow-md"
                  >
                    {/* Top Order Card Header */}
                    <div className="bg-[#F8F9FA] px-5 py-3.5 border-b border-black/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-black bg-white px-2.5 py-1 rounded border border-black/10">
                          {order.orderNumberDisplay || `#${order.id.slice(-8).toUpperCase()}`}
                        </span>
                        <span className="text-xs text-black/60">
                          {new Date(order.createdAt).toLocaleString("en-KE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-black/50 font-medium">Status:</span>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            statusColorMap[order.status] || "bg-gray-100 text-gray-800 border-gray-300"
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="PAID">PAID</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Customer & Delivery Column (4 cols) */}
                      <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-r border-black/10 pb-4 lg:pb-0 lg:pr-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1C1C] uppercase tracking-wider">
                          <svg className="w-4 h-4 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Customer &amp; Delivery</span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="font-bold text-black text-sm">
                            {order.shippingAddress.fullName || "Customer"}
                          </div>

                          {order.shippingAddress.phoneNumber && (
                            <div className="flex items-center gap-2 text-black/80 font-mono">
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <a href={`tel:${order.shippingAddress.phoneNumber}`} className="hover:underline font-semibold">
                                {order.shippingAddress.phoneNumber}
                              </a>
                            </div>
                          )}

                          {order.shippingAddress.email && (
                            <div className="text-black/60 text-[11px] truncate">
                              {order.shippingAddress.email}
                            </div>
                          )}

                          <div className="pt-2 border-t border-black/5 space-y-1">
                            <div className="flex items-center gap-1.5 text-black/80">
                              <span className="font-semibold">Fulfillment:</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.deliveryMethod === "DELIVERY"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {order.deliveryMethod === "DELIVERY" ? "Doorstep Delivery" : "Shop Pickup (Free)"}
                              </span>
                            </div>

                            {order.deliveryMethod === "DELIVERY" && (
                              <div className="text-black/70 text-[11px]">
                                {order.shippingAddress.county && (
                                  <span className="font-medium text-black">{order.shippingAddress.county}: </span>
                                )}
                                {order.shippingAddress.addressLine || "No specific address provided"}
                              </div>
                            )}
                          </div>

                          {/* Custom Engraving */}
                          {order.shippingAddress.engravingText && (
                            <div className="p-2.5 bg-[#266e00]/10 border border-[#266e00]/30 rounded-lg text-xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#266e00] block">
                                Custom Engraving Request:
                              </span>
                              <span className="font-serif italic font-semibold text-black mt-0.5 block">
                                &ldquo;{order.shippingAddress.engravingText}&rdquo;
                              </span>
                            </div>
                          )}

                          {/* Customer Note */}
                          {order.shippingAddress.customerNote && (
                            <div className="p-2 bg-black/5 rounded-lg text-[11px] text-black/70">
                              <span className="font-semibold text-black">Customer Note:</span> {order.shippingAddress.customerNote}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Column (5 cols) */}
                      <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-black/10 pb-4 lg:pb-0 lg:pr-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1C1C] uppercase tracking-wider">
                          <svg className="w-4 h-4 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>Ordered Items ({order.items.reduce((acc, it) => acc + it.quantity, 0)})</span>
                        </div>

                        <div className="divide-y divide-black/5 space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-11 h-11 rounded-lg border border-black/10 overflow-hidden bg-white relative flex-shrink-0">
                                  <img
                                    src={item.product?.images?.[0] || "/halisi-logo.png"}
                                    alt={item.product?.name || "Product"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/halisi-logo.png";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-black truncate">
                                    {item.product?.name || "Product"}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {item.variantName && (
                                      <span className="px-1.5 py-0.2 bg-[#266e00]/15 text-[#266e00] text-[10px] font-bold rounded">
                                        Color: {item.variantName}
                                      </span>
                                    )}
                                    <span className="text-[11px] text-black/50">
                                      Qty: {item.quantity} × KES {item.priceAtPurchase.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="font-mono font-bold text-black whitespace-nowrap text-right">
                                KES {(item.priceAtPurchase * item.quantity).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment & Summary Column (3 cols) */}
                      <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1C1C] uppercase tracking-wider mb-2">
                            <svg className="w-4 h-4 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                            </svg>
                            <span>Payment Summary</span>
                          </div>

                          <div className="space-y-1.5 text-xs text-black/70">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="font-mono font-medium">KES {order.subtotal.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between">
                              <span>Delivery:</span>
                              <span className="font-mono font-medium">
                                {order.deliveryFee > 0 ? `KES ${order.deliveryFee.toLocaleString()}` : "Free"}
                              </span>
                            </div>

                            {order.engravingFee > 0 && (
                              <div className="flex justify-between text-[#266e00]">
                                <span>Engraving:</span>
                                <span className="font-mono font-medium">+KES {order.engravingFee.toLocaleString()}</span>
                              </div>
                            )}

                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-emerald-700">
                                <span>Discount:</span>
                                <span className="font-mono font-medium">-KES {order.discountAmount.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="pt-2 border-t border-black/10 flex justify-between font-bold text-black text-sm">
                              <span>Total:</span>
                              <span className="text-[#266e00] font-mono">KES {order.total.toLocaleString()}</span>
                            </div>

                            <div className="pt-2 text-[11px] space-y-1">
                              <div>
                                <span className="text-black/50">Method: </span>
                                <span className="font-semibold text-black">
                                  {order.paymentMethod === "MPESA" ? "Lipa na M-Pesa" : "Cash on Delivery"}
                                </span>
                              </div>
                              {order.shippingAddress.mpesaTransactionCode && (
                                <div>
                                  <span className="text-black/50">M-Pesa Code: </span>
                                  <span className="font-mono font-bold text-emerald-700">
                                    {order.shippingAddress.mpesaTransactionCode}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom WhatsApp Order Details Bar */}
                    <div className="bg-[#1B1C1C] text-white px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#266e00]/30">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-semibold text-white/90">WhatsApp Order Message Format</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1-Click Copy WhatsApp Text */}
                        <button
                          type="button"
                          onClick={() => handleCopyWhatsAppMessage(order)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-white/20"
                        >
                          <svg className="w-3.5 h-3.5 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{copiedOrderId === order.id ? "Copied!" : "Copy WhatsApp Text"}</span>
                        </button>

                        {/* Direct Chat with Customer */}
                        <a
                          href={customerWhatsAppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                          <span>Chat on WhatsApp</span>
                        </a>

                        {/* View Preview Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForWhatsApp(order)}
                          className="px-3 py-1.5 bg-[#266e00] hover:bg-[#095c32] text-white text-xs font-semibold rounded-lg shadow transition-colors"
                        >
                          View Full Text
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: WhatsApp Order Message Preview */}
      {selectedOrderForWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-black/15 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-serif text-black text-base">
                  WhatsApp Order Message - {selectedOrderForWhatsApp.orderNumberDisplay || `#${selectedOrderForWhatsApp.id.slice(-8).toUpperCase()}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForWhatsApp(null)}
                className="text-black/50 hover:text-black p-1 rounded-lg hover:bg-black/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-black/60">
                Below is the exact formatted message generated for this order. You can copy it with 1 click or open it directly in WhatsApp.
              </p>

              <pre className="p-4 bg-[#F8F9FA] border border-black/15 rounded-xl font-mono text-xs text-black leading-relaxed whitespace-pre-wrap select-all">
                {getOrderCustomerMessage(selectedOrderForWhatsApp)}
              </pre>
            </div>

            <div className="px-6 py-4 border-t border-black/10 bg-[#F8F9FA] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrderForWhatsApp(null)}
                className="px-4 py-2 text-xs font-medium text-black/70 hover:text-black rounded-lg"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppMessage(selectedOrderForWhatsApp)}
                  className="px-4 py-2 bg-white text-black border border-black/20 hover:border-black text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copiedOrderId === selectedOrderForWhatsApp.id ? "Copied!" : "Copy Text"}</span>
                </button>

                <a
                  href={
                    selectedOrderForWhatsApp.shippingAddress.phoneNumber
                      ? getCustomerWhatsAppUrl(
                          selectedOrderForWhatsApp.shippingAddress.phoneNumber,
                          getOrderCustomerMessage(selectedOrderForWhatsApp)
                        )
                      : getWhatsAppOrderUrl(selectedOrderForWhatsApp.whatsAppPayload)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Open in WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === "blog" && <BlogManager onNotify={showToast} />}

      {activeAdminTab === "crm" && (
        <CrmManager
          onNotify={showToast}
          availableProducts={products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            images: p.images,
          }))}
        />
      )}

      {/* Modal: Add New Product / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-black/15 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <h2 className="text-lg font-serif text-black">
                  {editingProductId ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-black/60">
                  {editingProductId
                    ? "Update product details, photos, and color variants."
                    : "Assign section placement and inventory details."}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProductId(null);
                }}
                className="text-black/50 hover:text-black p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#266e00] border-b border-black/10 pb-1">
                  1. Product Identification
                </h3>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Royal Tourbillon Rose Gold Edition"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none ${
                      formErrors.name
                        ? "border-red-500 bg-red-50/20"
                        : "border-black/20 focus:border-[#266e00]"
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-[11px] text-red-600 mt-1 block">{formErrors.name}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setFormData((prev) => ({ ...prev, categoryId: "__new__" }));
                        } else {
                          handleInputChange(e);
                          setNewCategoryName("");
                        }
                      }}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none ${
                        formErrors.categoryId
                          ? "border-red-500 bg-red-50/20"
                          : "border-black/20 focus:border-[#266e00]"
                      }`}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__new__">+ Create new category...</option>
                    </select>
                    {formErrors.categoryId && (
                      <span className="text-[11px] text-red-600 mt-1 block">{formErrors.categoryId}</span>
                    )}
                    {formData.categoryId === "__new__" && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                          placeholder="New category name"
                          className="flex-1 px-3 py-1.5 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={creatingCategory || !newCategoryName.trim()}
                          onClick={handleCreateCategory}
                          className="px-3 py-1.5 text-xs bg-[#1B1C1C] text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {creatingCategory ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      SKU (Optional)
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Leave blank to auto-generate"
                      className="w-full px-3 py-2 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-black">
                      Description
                    </label>
                    <div className="inline-flex rounded-md border border-black/15 overflow-hidden text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDescTab("edit")}
                        className={`px-2.5 py-0.5 font-medium transition-colors ${
                          descTab === "edit"
                            ? "bg-[#1B1C1C] text-white"
                            : "bg-white text-black/60 hover:text-black"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescTab("preview")}
                        className={`px-2.5 py-0.5 font-medium transition-colors ${
                          descTab === "preview"
                            ? "bg-[#1B1C1C] text-white"
                            : "bg-white text-black/60 hover:text-black"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  {descTab === "edit" ? (
                    <textarea
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe craftsmanship, materials, Key Features, dimensions, warranty..."
                      className="w-full px-3 py-2 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                    ></textarea>
                  ) : (
                    <div className="w-full min-h-[120px] p-3.5 border border-black/15 rounded-lg bg-[#F8FAF9]">
                      {formData.description.trim() ? (
                        <ProductDescription description={formData.description} />
                      ) : (
                        <p className="text-xs text-black/40 italic">
                          Enter a description to preview structured formatting and bold keywords.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Storefront Section Assignment */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#266e00] border-b border-black/10 pb-1">
                  2. Section &amp; Storefront Placement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* New Arrival */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.isNew
                        ? "bg-blue-50/60 border-blue-400 ring-1 ring-blue-400/30"
                        : "border-black/15 hover:border-black/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="isNew"
                      checked={formData.isNew}
                      onChange={handleInputChange}
                      className="mt-0.5 rounded border-black/30 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-black block">New Arrival</span>
                      <span className="text-[11px] text-black/60 block mt-0.5">
                        Features on homepage New Arrivals slider
                      </span>
                    </div>
                  </label>

                  {/* Hot Deal */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.isHotDeal
                        ? "bg-red-50/60 border-red-400 ring-1 ring-red-400/30"
                        : "border-black/15 hover:border-black/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="isHotDeal"
                      checked={formData.isHotDeal}
                      onChange={handleInputChange}
                      className="mt-0.5 rounded border-black/30 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-black block">Hot Deal</span>
                      <span className="text-[11px] text-black/60 block mt-0.5">
                        Highlights in homepage discount showcase
                      </span>
                    </div>
                  </label>

                  {/* Featured */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.isFeatured
                        ? "bg-[#266e00]/15 border-[#266e00] ring-1 ring-[#266e00]/30"
                        : "border-black/15 hover:border-black/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="mt-0.5 rounded border-black/30 text-[#266e00] focus:ring-[#266e00]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-black block">Featured Product</span>
                      <span className="text-[11px] text-black/60 block mt-0.5">
                        Displays in the homepage Featured Grid
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Promotional Tag / Badge (Optional)
                    </label>
                    <input
                      type="text"
                      name="statusNote"
                      value={formData.statusNote}
                      onChange={handleInputChange}
                      placeholder="e.g. Limited Edition, Best Seller, 20% OFF"
                      className="w-full px-3 py-2 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-black/30 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-medium text-black">
                        Active &amp; Published to Customer Store
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-[#266e00] border-b border-black/10 pb-1">
                  3. Pricing, Offers &amp; Inventory
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Selling Price (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="1"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 1500"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none ${
                        formErrors.price
                          ? "border-red-500 bg-red-50/20"
                          : "border-black/20 focus:border-[#266e00]"
                      }`}
                    />
                    {formErrors.price && (
                      <span className="text-[11px] text-red-600 mt-1 block">{formErrors.price}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Original / Strike-through Price (KES)
                    </label>
                    <input
                      type="number"
                      name="compareAtPrice"
                      min="0"
                      step="1"
                      value={formData.compareAtPrice}
                      onChange={handleInputChange}
                      placeholder="e.g. 2000"
                      className="w-full px-3 py-2 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                    />
                    {discountPercent !== null && (
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                        Customer Saves {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Stock Quantity (Units) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="e.g. 15 (0 = Out of Stock)"
                      className="w-full px-3 py-2 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                    />
                    <span className="text-[10px] text-black/50 mt-1 block">
                      {parseInt(formData.stock || "0", 10) > 0
                        ? "Available for purchase"
                        : "Marked Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Photos & Color Variant Attachment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-1">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-[#266e00]">
                      4. Product Photos &amp; Color / Option Assignment
                    </h3>
                    <p className="text-[11px] text-black/60 mt-0.5">
                      Upload photos and attach specific colors or variant options (e.g. Option 1, Option 2, Gold, Black) directly to each image for customer selection.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUrlInputs(!showUrlInputs)}
                    className="text-xs text-black font-semibold hover:text-[#266e00] transition-colors whitespace-nowrap"
                  >
                    {showUrlInputs ? "- Hide URL Inputs" : "+ Add via URL"}
                  </button>
                </div>

                {/* File Manager Dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,image/jfif,image/gif,image/bmp,image/svg+xml,.png,.jpg,.jpeg,.webp,.avif,.jfif,.gif,.bmp,.svg"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-[#266e00] bg-[#266e00]/10 scale-[1.01]"
                      : "border-black/20 hover:border-[#266e00] hover:bg-black/5 bg-[#F8F9FA]"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-[#266e00]/15 flex items-center justify-center text-[#266e00]">
                      {uploadingImage ? (
                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-black">
                        {uploadingImage ? "Uploading photos..." : "Click to browse from your File Manager or drag & drop"}
                      </p>
                      <p className="text-[11px] text-black/50">
                        Supports multiple photos (JPG, PNG, WEBP, AVIF, JFIF)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-0.5 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-[#266e00] transition-colors"
                    >
                      {uploadingImage ? "Uploading..." : "Choose Files from Device"}
                    </button>
                  </div>
                </div>

                {/* Uploaded Photos Cards with Direct Color Attachment */}
                {formData.images.filter((img) => img.url && img.url.trim().length > 0).length > 0 && (
                  <div className="space-y-3 pt-1">
                    <span className="text-xs font-semibold text-black block">
                      Uploaded Photos &amp; Attached Options ({formData.images.filter((img) => img.url && img.url.trim().length > 0).length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {formData.images
                        .filter((img) => img.url && img.url.trim().length > 0)
                        .map((img, i) => (
                          <div
                            key={i}
                            className={`rounded-xl border bg-[#F8F9FA] p-3 flex flex-col justify-between space-y-3 transition-all ${
                              i === 0 ? "border-[#266e00] ring-2 ring-[#266e00]/20" : "border-black/15"
                            }`}
                          >
                            <div className="flex gap-3">
                              {/* Photo Preview Thumbnail */}
                              <div className="w-24 h-24 aspect-square rounded-lg border border-black/15 overflow-hidden bg-white relative flex-shrink-0">
                                <img
                                  src={img.url}
                                  alt={`Product photo ${i + 1}`}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/halisi-logo.png";
                                  }}
                                />
                                {i === 0 && (
                                  <span className="absolute top-1 left-1 bg-[#266e00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                    Cover Photo
                                  </span>
                                )}
                              </div>

                              {/* Color / Variant Option Attachment Controls */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-semibold text-black flex items-center gap-1">
                                    <span>Attach Color / Option:</span>
                                    {img.color && (
                                      <span className="text-[#266e00] font-bold">({img.color})</span>
                                    )}
                                  </label>
                                  {img.color && (
                                    <button
                                      type="button"
                                      onClick={() => updateImageColor(i, "")}
                                      className="text-[10px] text-black/50 hover:text-black underline"
                                    >
                                      Clear Option
                                    </button>
                                  )}
                                </div>

                                <input
                                  type="text"
                                  value={img.color}
                                  onChange={(e) => updateImageColor(i, e.target.value)}
                                  placeholder="e.g. Option 1, Gold, Pair..."
                                  className="w-full text-xs bg-white px-2.5 py-1.5 border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                                />

                                {/* Quick-Pick Preset Badges */}
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {[
                                    { name: "Option 1", color: "#266e00" },
                                    { name: "Option 2", color: "#2563EB" },
                                    { name: "Option 3", color: "#059669" },
                                    { name: "Option 4", color: "#D97706" },
                                    { name: "Option 5", color: "#7C3AED" },
                                    { name: "Gold", color: "#266e00" },
                                    { name: "Black", color: "#111827" },
                                    { name: "Silver", color: "#9CA3AF" },
                                    { name: "Rose Gold", color: "#B76E79" },
                                    { name: "Two-Tone", color: "linear-gradient(135deg, #266e00 50%, #9CA3AF 50%)" },
                                    { name: "Blue", color: "#1E40AF" },
                                    { name: "Green", color: "#065F46" },
                                    { name: "Brown", color: "#78350F" },
                                    { name: "White", color: "#F3F4F6" },
                                    { name: "Red", color: "#991B1B" },
                                  ].map((preset) => {
                                    const isSelected = img.color.toLowerCase() === preset.name.toLowerCase();
                                    return (
                                      <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => updateImageColor(i, preset.name)}
                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all ${
                                          isSelected
                                            ? "bg-[#266e00] text-white border-[#266e00] shadow-sm font-semibold"
                                            : "bg-white text-black/80 border-black/15 hover:border-[#266e00]"
                                        }`}
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full border border-black/20 flex-shrink-0"
                                          style={{ background: preset.color }}
                                        />
                                        <span>{preset.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Optional Details for Attached Color (Price Modifier & Stock) */}
                            {img.color.trim().length > 0 && (
                              <div className="pt-2 border-t border-black/10 bg-white/70 p-2 rounded-lg grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-medium text-black/60 mb-0.5">
                                    Price Diff (KES)
                                  </label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={img.priceModifier}
                                    onChange={(e) => updateImageDetail(i, "priceModifier", e.target.value)}
                                    placeholder="+0"
                                    className="w-full text-xs bg-white px-2 py-1 border border-black/20 rounded focus:outline-none focus:border-[#266e00]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-black/60 mb-0.5">
                                    Color Stock (Units)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={img.stock}
                                    onChange={(e) => updateImageDetail(i, "stock", e.target.value)}
                                    placeholder={formData.stock || "15"}
                                    className="w-full text-xs bg-white px-2 py-1 border border-black/20 rounded focus:outline-none focus:border-[#266e00]"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between pt-1 border-t border-black/10">
                              {i !== 0 ? (
                                <button
                                  type="button"
                                  onClick={() => makeImagePrimary(i)}
                                  className="text-[11px] text-black/70 hover:text-[#266e00] font-medium"
                                >
                                  Make Cover Photo
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#266e00] font-semibold flex items-center gap-1">
                                  <span>Primary Product Photo</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImageItem(i)}
                                className="text-[11px] text-red-500 hover:text-red-700 font-medium ml-auto"
                              >
                                Delete Photo
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Direct Image URL Inputs (Accordion) */}
                {showUrlInputs && (
                  <div className="space-y-2 border-t border-black/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-black/70">Direct Image URLs:</span>
                      <button
                        type="button"
                        onClick={addImageUrlField}
                        className="text-[11px] text-[#266e00] font-semibold hover:underline"
                      >
                        + Add URL Field
                      </button>
                    </div>
                    {formData.images.map((imgItem, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={imgItem.url}
                          onChange={(e) => handleImageUrlChange(index, e.target.value)}
                          placeholder="https://... or /products/... or /logo.png"
                          className="flex-1 px-3 py-2 text-xs border border-black/20 rounded-lg focus:outline-none focus:border-[#266e00]"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageItem(index)}
                          className="text-red-500 hover:text-red-700 p-2 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="border-t border-black/10 pt-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProductId(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-black/70 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#1B1C1C] hover:bg-black text-white rounded-lg shadow-sm border border-[#266e00]/50 transition-all disabled:opacity-50"
                >
                  {submitting
                    ? "Saving Changes..."
                    : editingProductId
                    ? "Save & Publish Changes"
                    : "Create & Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
