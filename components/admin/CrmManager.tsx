"use client";

import { useEffect, useState, useMemo } from "react";

export interface CrmContactItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  source: string;
  tags: string[];
  notes: string | null;
  marketingEmailsSent: number;
  marketingWhatsappSent: number;
  isSubscribedEmail: boolean;
  isSubscribedWhatsapp: boolean;
  lastContactedAt: string | null;
  createdAt: string;
}

export interface CrmCampaignItem {
  id: string;
  title: string;
  channel: string;
  subject: string | null;
  message: string;
  productIds: string[];
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface CrmManagerProps {
  onNotify?: (message: string, type: "success" | "error") => void;
  availableProducts?: CatalogProductSummary[];
}

export default function CrmManager({
  onNotify,
  availableProducts = [],
}: CrmManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"composer" | "contacts" | "history">("composer");

  const [contacts, setContacts] = useState<CrmContactItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | "email" | "whatsapp">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  const [campaigns, setCampaigns] = useState<CrmCampaignItem[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactNotes, setNewContactNotes] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [syncingCustomers, setSyncingCustomers] = useState(false);

  const [campaignChannel, setCampaignChannel] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignMessage, setCampaignMessage] = useState(
    "Hello {{firstName}},\n\nWe have handpicked a signature collection of original watches, luxury perfumes, and curated gift sets for you. Every piece comes with free gift packaging.\n\nDiscover the featured selection below and enjoy swift delivery across Kenya."
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [dispatching, setDispatching] = useState(false);

  const [campaignResult, setCampaignResult] = useState<{
    success: boolean;
    channel: string;
    sentCount: number;
    failedCount?: number;
    csvData?: string;
    previewList?: Array<{ id: string; name: string; phone: string; url: string | null; text: string }>;
  } | null>(null);

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
      });
      if (searchQuery) params.set("search", searchQuery);
      if (channelFilter !== "all") params.set("channel", channelFilter);

      const res = await fetch(`/api/admin/crm/contacts?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalContacts(data.pagination?.total || 0);
      }
    } catch {
      onNotify?.("Failed to fetch CRM contacts", "error");
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch("/api/admin/crm/campaign");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch {
      onNotify?.("Failed to fetch campaigns", "error");
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "contacts") {
      fetchContacts();
    } else if (activeSubTab === "history") {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, currentPage, channelFilter]);

  const handleSyncHistorical = async () => {
    setSyncingCustomers(true);
    try {
      const res = await fetch("/api/admin/crm/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const { ordersProcessed, cartsProcessed, usersProcessed, totalSynced } = data.result;
        onNotify?.(
          `Sync completed: ${totalSynced} customer record(s) unified from ${ordersProcessed} orders, ${cartsProcessed} carts, and ${usersProcessed} users.`,
          "success"
        );
        fetchContacts();
      } else {
        onNotify?.(data.error || "Customer sync failed", "error");
      }
    } catch {
      onNotify?.("Network error during customer sync", "error");
    } finally {
      setSyncingCustomers(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail && !newContactPhone) {
      onNotify?.("Provide either an email or a phone number", "error");
      return;
    }

    setSavingContact(true);
    try {
      const res = await fetch("/api/admin/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newContactName.trim() || "Customer",
          email: newContactEmail.trim() || null,
          phone: newContactPhone.trim() || null,
          notes: newContactNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onNotify?.("Customer contact saved successfully", "success");
        setIsAddContactModalOpen(false);
        setNewContactName("");
        setNewContactEmail("");
        setNewContactPhone("");
        setNewContactNotes("");
        fetchContacts();
      } else {
        onNotify?.(data.error || "Failed to save contact", "error");
      }
    } catch {
      onNotify?.("Network error saving contact", "error");
    } finally {
      setSavingContact(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts.slice(0, 30);
    const q = productSearch.toLowerCase();
    return availableProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [availableProducts, productSearch]);

  const selectedProducts = useMemo(() => {
    return availableProducts.filter((p) => selectedProductIds.includes(p.id));
  }, [availableProducts, selectedProductIds]);

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const insertVariable = (varName: string) => {
    setCampaignMessage((prev) => `${prev} {{${varName}}}`);
  };

  const handleDispatchCampaign = async () => {
    if (!campaignMessage.trim()) {
      onNotify?.("Campaign message cannot be empty", "error");
      return;
    }
    if (campaignChannel === "EMAIL" && !campaignSubject.trim()) {
      onNotify?.("Email subject is required for email campaigns", "error");
      return;
    }

    setDispatching(true);
    setCampaignResult(null);

    try {
      const res = await fetch("/api/admin/crm/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignTitle.trim() || undefined,
          channel: campaignChannel,
          subject: campaignSubject.trim() || undefined,
          message: campaignMessage.trim(),
          productIds: selectedProductIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (campaignChannel === "EMAIL") {
          const sent = data.summary?.batch1Sent ?? data.summary?.sentCount ?? 0;
          const isComplete = data.summary?.completed;
          const nextDate = data.summary?.nextBatchAt
            ? new Date(data.summary.nextBatchAt).toLocaleString()
            : null;

          onNotify?.(
            isComplete
              ? `Campaign completed: ${sent} email(s) dispatched`
              : `Batch 1 (${sent} emails) sent immediately. Next batch of 50 scheduled for ${nextDate}`,
            "success"
          );
          setCampaignResult({
            success: true,
            channel: "EMAIL",
            sentCount: sent,
            failedCount: 0,
          });
        } else {
          onNotify?.(
            `WhatsApp broadcasts generated for ${data.recipientCount} customer(s)`,
            "success"
          );
          setCampaignResult({
            success: true,
            channel: "WHATSAPP",
            sentCount: data.recipientCount,
            csvData: data.csvData,
            previewList: data.previewList,
          });
        }
      } else {
        onNotify?.(data.error || "Campaign failed to run", "error");
      }
    } catch {
      onNotify?.("Network error dispatching campaign", "error");
    } finally {
      setDispatching(false);
    }
  };

  const downloadWhatsAppCsv = () => {
    if (!campaignResult?.csvData) return;
    const blob = new Blob([campaignResult.csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `whatsapp_broadcast_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const samplePersonalizedText = useMemo(() => {
    const firstName = "Grace";
    const fullName = "Grace Wanjiku";
    return campaignMessage
      .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
      .replace(/\{\{\s*name\s*\}\}/gi, firstName)
      .replace(/\{\{\s*fullName\s*\}\}/gi, fullName);
  }, [campaignMessage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-black flex items-center gap-2">
            CRM &amp; Marketing Campaigns
          </h1>
          <p className="text-xs text-black/60 mt-0.5">
            Collect customer leads, automate personalized bulk marketing emails, and manage WhatsApp broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab("composer")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "composer"
                ? "bg-white text-black shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            Campaign Composer
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("contacts")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "contacts"
                ? "bg-white text-black shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            Customer Contacts
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "history"
                ? "bg-white text-black shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            Campaign History
          </button>
        </div>
      </div>

      {activeSubTab === "composer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-black/10 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-black">
                1. Campaign Details
              </h2>
              <div className="inline-flex rounded-lg border border-black/10 p-0.5 bg-black/5 text-xs">
                <button
                  type="button"
                  onClick={() => setCampaignChannel("EMAIL")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    campaignChannel === "EMAIL"
                      ? "bg-black text-white shadow-sm"
                      : "text-black/70 hover:text-black"
                  }`}
                >
                  Email Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignChannel("WHATSAPP")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    campaignChannel === "WHATSAPP"
                      ? "bg-[#25D366] text-white shadow-sm"
                      : "text-black/70 hover:text-black"
                  }`}
                >
                  WhatsApp Broadcast
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black/80 mb-1">
                  Campaign Title (Internal Reference)
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. New Luxury Watch Arrivals"
                  className="w-full text-xs px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              {campaignChannel === "EMAIL" && (
                <div>
                  <label className="block text-xs font-semibold text-black/80 mb-1">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="e.g. Curated Watches & Gift Sets Just Arrived"
                    className="w-full text-xs px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                  />
                  <p className="text-[11px] text-black/50 mt-1">
                    Sent via Halisi Gifts Resend mailbox (orders@halisigifts.com)
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-black/80">
                    Message Body *
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-black/50">Insert Tag:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable("firstName")}
                      className="px-2 py-0.5 bg-black/5 hover:bg-black/10 rounded text-black font-mono transition-colors"
                    >
                      {"{{firstName}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("fullName")}
                      className="px-2 py-0.5 bg-black/5 hover:bg-black/10 rounded text-black font-mono transition-colors"
                    >
                      {"{{fullName}}"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black leading-relaxed"
                />
                <p className="text-[11px] text-black/50 mt-1">
                  The system automatically resolves customer names and falls back naturally to &quot;Valued Customer&quot; if absent.
                </p>
              </div>

              <div className="pt-2 border-t border-black/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-black">
                    2. Attach Products for Showcase ({selectedProductIds.length} selected)
                  </label>
                  {selectedProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="text-[11px] text-[#DC2626] hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search watches, perfumes, or gifts to attach..."
                    className="w-full text-xs px-3 py-1.5 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto border border-black/10 rounded-lg p-2 space-y-1.5 bg-black/[0.02]">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProductSelect(p.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? "bg-black/10 border border-black/20 font-semibold"
                            : "hover:bg-black/5 bg-white border border-black/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-black"
                          />
                          {p.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-7 h-7 rounded object-cover border border-black/10"
                            />
                          )}
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-[#266e00] font-bold whitespace-nowrap ml-2">
                          KES {Number(p.price).toLocaleString("en-KE")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                <div className="text-xs text-black/60">
                  Target: All active {campaignChannel === "EMAIL" ? "Email" : "WhatsApp"} subscribers
                </div>

                <button
                  type="button"
                  onClick={handleDispatchCampaign}
                  disabled={dispatching}
                  className="px-5 py-2.5 rounded-lg bg-black text-white hover:bg-[#266e00] text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {dispatching
                    ? "Dispatching Campaign..."
                    : campaignChannel === "EMAIL"
                    ? "Send Bulk Marketing Emails"
                    : "Generate WhatsApp Broadcast"}
                </button>
              </div>

              {campaignResult && (
                <div className="p-4 rounded-xl bg-black/5 border border-black/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-black">
                      Campaign Execution Summary
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                      Dispatched Successfully
                    </span>
                  </div>

                  <p className="text-xs text-black/70">
                    Processed {campaignResult.sentCount} recipient(s)
                    {campaignResult.failedCount ? ` (${campaignResult.failedCount} failures logged)` : ""}.
                  </p>

                  {campaignResult.channel === "WHATSAPP" && campaignResult.csvData && (
                    <div className="space-y-2 pt-2 border-t border-black/10">
                      <button
                        type="button"
                        onClick={downloadWhatsAppCsv}
                        className="text-xs px-3 py-1.5 bg-[#25D366] text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Download WhatsApp Broadcast CSV
                      </button>

                      {campaignResult.previewList && campaignResult.previewList.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pt-2">
                          <div className="text-[11px] font-semibold text-black/60 uppercase">
                            Direct WhatsApp Launch Links (First 50):
                          </div>
                          {campaignResult.previewList.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-1.5 bg-white rounded border border-black/10 text-xs"
                            >
                              <span className="truncate text-black/80">
                                {item.name} ({item.phone})
                              </span>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-medium text-emerald-600 hover:underline ml-2"
                                >
                                  Open Chat
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black">
                  Live Subscriber Preview
                </h3>
                <span className="text-[11px] text-black/50">
                  Recipient: Grace (Sample)
                </span>
              </div>

              {campaignChannel === "EMAIL" ? (
                <div className="border border-black/15 rounded-xl overflow-hidden bg-[#F8F9FA] shadow-inner text-left">
                  <div className="bg-black text-white px-4 py-3 text-center">
                    <div className="font-serif font-bold text-sm tracking-widest uppercase">
                      Halisi Gifts Shop
                    </div>
                    <div className="text-[10px] text-emerald-200 uppercase tracking-wider">
                      Original Watches, Perfumes &amp; Curated Gifts
                    </div>
                  </div>

                  <div className="p-4 bg-white space-y-3">
                    <div className="text-xs text-black/80 whitespace-pre-wrap leading-relaxed">
                      {samplePersonalizedText}
                    </div>

                    {selectedProducts.length > 0 && (
                      <div className="pt-3 border-t border-black/10 space-y-3">
                        <div className="text-[11px] font-serif font-bold uppercase tracking-wider text-center text-black">
                          Featured Collections
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                          {selectedProducts.map((p) => (
                            <div
                              key={p.id}
                              className="border border-black/10 rounded-lg p-2.5 text-center bg-white shadow-xs"
                            >
                              <div className="w-full h-28 bg-black/5 rounded mb-2 overflow-hidden">
                                {p.images[0] && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="text-[11px] font-semibold text-black line-clamp-2 leading-tight min-h-[28px]">
                                {p.name}
                              </div>
                              <div className="text-xs font-bold text-[#266e00] mt-1">
                                KES {Number(p.price).toLocaleString("en-KE")}
                              </div>
                              <div className="mt-2 text-[10px] bg-black text-white py-1.5 rounded font-medium tracking-wide uppercase">
                                View Product
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-center pt-2">
                          <span className="inline-block bg-[#266e00] text-white text-[11px] font-semibold uppercase tracking-wider px-4 py-2 rounded-md">
                            Explore Complete Catalog
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[#F9FAFB] border-t border-black/10 text-center text-[10px] text-black/50">
                    <div>Halisi Gifts Shop Kenya &middot; WhatsApp +254 729 596 165</div>
                    <div className="underline text-black/40 mt-1">Unsubscribe from marketing emails</div>
                  </div>
                </div>
              ) : (
                <div className="border border-emerald-200 bg-[#EFEAE2] p-4 rounded-xl text-xs space-y-2 shadow-inner">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100 max-w-sm ml-auto space-y-2">
                    <div className="whitespace-pre-wrap text-black/80 leading-relaxed font-sans">
                      {samplePersonalizedText}
                    </div>

                    {selectedProducts.length > 0 && (
                      <div className="pt-2 border-t border-black/10 text-[11px] space-y-1">
                        <div className="font-semibold text-black">Featured Collections:</div>
                        {selectedProducts.map((p, idx) => (
                          <div key={p.id} className="text-black/80">
                            {idx + 1}. <span className="font-semibold">{p.name}</span> (KES {Number(p.price).toLocaleString("en-KE")})
                            <div className="text-emerald-700 underline text-[10px]">
                              https://halisigifts.com/product/{p.slug}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-black/40 pt-1 text-right">
                      Halisi Gifts Shop Broadcast
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "contacts" && (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-black">
                Customer Contacts Directory ({totalContacts})
              </h2>
              <p className="text-xs text-black/50">
                Unified profiles captured from Checkout, Abandoned Carts, and Customer Accounts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncHistorical}
                disabled={syncingCustomers}
                className="px-3.5 py-1.5 rounded-lg border border-black/15 text-xs font-semibold text-black hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {syncingCustomers ? "Syncing Past Orders..." : "Sync Past Customers"}
              </button>

              <button
                type="button"
                onClick={() => setIsAddContactModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-black text-white hover:bg-[#266e00] text-xs font-semibold transition-colors cursor-pointer"
              >
                Add Contact
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setCurrentPage(1);
                    fetchContacts();
                  }
                }}
                placeholder="Search by name, email, or phone..."
                className="w-full text-xs pl-3 pr-8 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-2 text-xs text-black/40 hover:text-black"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setChannelFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  channelFilter === "all"
                    ? "bg-black text-white border-black"
                    : "border-black/15 text-black/70 hover:bg-black/5"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannelFilter("email");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  channelFilter === "email"
                    ? "bg-black text-white border-black"
                    : "border-black/15 text-black/70 hover:bg-black/5"
                }`}
              >
                Email Subscribers
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannelFilter("whatsapp");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  channelFilter === "whatsapp"
                    ? "bg-[#25D366] text-white border-[#25D366]"
                    : "border-black/15 text-black/70 hover:bg-black/5"
                }`}
              >
                WhatsApp Subscribers
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-black/10 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/5 border-b border-black/10 text-black/70 font-semibold uppercase text-[11px]">
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Source</th>
                  <th className="p-3 text-center">Subscribed</th>
                  <th className="p-3 text-center">Campaigns Sent</th>
                  <th className="p-3">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {contactsLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-black/50">
                      Loading contacts directory...
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-black/50">
                      No contacts found. Click &quot;Sync Past Customers&quot; to import existing buyers.
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="p-3 font-semibold text-black">{c.name}</td>
                      <td className="p-3 text-black/80">{c.email || "No email"}</td>
                      <td className="p-3 text-black/80 font-mono text-[11px]">
                        {c.normalizedPhone || c.phone || "No phone"}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 text-black/70 border border-black/10">
                          {c.source}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            title={c.isSubscribedEmail ? "Email subscribed" : "Email unsubscribed"}
                            className={`w-2 h-2 rounded-full ${
                              c.isSubscribedEmail ? "bg-emerald-500" : "bg-black/20"
                            }`}
                          />
                          <span
                            title={c.isSubscribedWhatsapp ? "WhatsApp subscribed" : "WhatsApp unsubscribed"}
                            className={`w-2 h-2 rounded-full ${
                              c.isSubscribedWhatsapp ? "bg-[#25D366]" : "bg-black/20"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px]">
                        {c.marketingEmailsSent + c.marketingWhatsappSent}
                      </td>
                      <td className="p-3 text-black/50 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-black/50">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-black/15 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-black/15 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "history" && (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-6 space-y-4">
          <div className="border-b border-black/10 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black">
              Campaign Execution History
            </h2>
            <p className="text-xs text-black/50">
              Audit log of dispatched bulk emails and generated WhatsApp broadcasts.
            </p>
          </div>

          <div className="overflow-x-auto border border-black/10 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/5 border-b border-black/10 text-black/70 font-semibold uppercase text-[11px]">
                  <th className="p-3">Campaign Title</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Subject / Preview</th>
                  <th className="p-3 text-center">Recipients</th>
                  <th className="p-3 text-center">Sent</th>
                  <th className="p-3 text-center">Failed</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {campaignsLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-black/50">
                      Loading campaign history...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-black/50">
                      No campaigns executed yet. Use the Campaign Composer to run your first broadcast.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="p-3 font-semibold text-black">{c.title}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.channel === "EMAIL"
                              ? "bg-black text-white"
                              : "bg-[#25D366] text-white"
                          }`}
                        >
                          {c.channel}
                        </span>
                      </td>
                      <td className="p-3 text-black/70 truncate max-w-xs">
                        {c.subject || c.message.slice(0, 45) + "..."}
                      </td>
                      <td className="p-3 text-center font-mono">{c.recipientCount}</td>
                      <td className="p-3 text-center font-mono text-emerald-600 font-semibold">
                        {c.sentCount}
                      </td>
                      <td className="p-3 text-center font-mono text-rose-600">
                        {c.failedCount}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/5 border border-black/10">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-black/50 text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/15 space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-sm font-serif font-bold text-black">
                Add Customer Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsAddContactModalOpen(false)}
                className="text-black/50 hover:text-black text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-black/80 mb-1">
                  Customer Full Name
                </label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. Grace Wanjiku"
                  className="w-full text-xs px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/80 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="e.g. grace@example.com"
                  className="w-full text-xs px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/80 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="e.g. 0729596165 or +254729596165"
                  className="w-full text-xs px-3 py-2 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/80 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  placeholder="VIP customer notes or gift preferences..."
                  className="w-full text-xs px-3 py-1.5 border border-black/15 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 border border-black/15 rounded-lg text-xs font-semibold hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-4 py-2 bg-black text-white hover:bg-[#266e00] rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {savingContact ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
