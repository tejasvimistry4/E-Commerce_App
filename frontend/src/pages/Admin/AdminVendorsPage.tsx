import React, { useEffect, useState } from "react";
import { getAdminVendorsApi, updateVendorStatusApi } from "../../api/auth.api";
import { VendorListItem, VendorStatus } from "../../types/auth";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SearchInput,
  Badge,
  StatsCard,
  Button,
  EmptyState,
  Modal,
  Icon,
} from "../../components/common";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export const AdminVendorsPage: React.FC = () => {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // State for Action / Reject Modal
  const [selectedVendor, setSelectedVendor] = useState<VendorListItem | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "INACTIVE" | "VIEW" | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [debouncedSearch, statusFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await getAdminVendorsApi({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: debouncedSearch.trim() || undefined,
      });

      if (res.data) {
        setVendors(res.data.vendors);
        setCounts(res.data.counts);
      }
    } catch (err: any) {
      toast.error(String(err?.response?.data?.message || "Failed to load vendors list"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    vendor: VendorListItem,
    newStatus: "APPROVED" | "REJECTED" | "INACTIVE"
  ) => {
    try {
      setActionLoading(true);
      await updateVendorStatusApi(vendor.id, {
        status: newStatus,
        adminFeedback: adminFeedback.trim() || undefined,
      });

      toast.success(
        newStatus === "APPROVED"
          ? `Vendor "${vendor.businessName || vendor.name}" has been approved!`
          : newStatus === "REJECTED"
            ? `Vendor "${vendor.businessName || vendor.name}" has been rejected.`
            : `Vendor "${vendor.businessName || vendor.name}" has been set to inactive.`
      );

      setSelectedVendor(null);
      setActionType(null);
      setAdminFeedback("");
      fetchVendors();
    } catch (err: any) {
      toast.error(String(err?.response?.data?.message || "Failed to update vendor status"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Vendor ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status?: VendorStatus | null) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success" size="sm">APPROVED</Badge>;
      case "PENDING":
        return <Badge variant="warning" size="sm">PENDING APPROVAL</Badge>;
      case "REJECTED":
        return <Badge variant="danger" size="sm">REJECTED</Badge>;
      case "INACTIVE":
        return <Badge variant="neutral" size="sm">INACTIVE</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || "UNKNOWN"}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Vendor Directory & Approvals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage vendor merchant applications, approve accounts, inspect performance metrics, and control access permissions.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Vendors"
          value={counts.total}
          subtitle="Registered Vendor Accounts"
          icon={<span className="text-lg">🏪</span>}
          iconBg="bg-slate-100 border border-slate-200"
          loading={loading}
        />
        <StatsCard
          title="Pending Approval"
          value={counts.pending}
          subtitle="Action Required by Super Admin"
          icon={<span className="text-lg">⏳</span>}
          iconBg="bg-amber-50 border border-amber-200"
          valueClassName={counts.pending > 0 ? "text-amber-600 font-black animate-pulse" : "text-slate-800"}
          badge={counts.pending > 0 ? { text: "Needs Review", variant: "warning" } : undefined}
          loading={loading}
        />
        <StatsCard
          title="Approved Partners"
          value={counts.approved}
          subtitle="Active Selling Merchants"
          icon={<span className="text-lg">✅</span>}
          iconBg="bg-emerald-50 border border-emerald-200"
          valueClassName="text-emerald-700 font-black"
          badge={{ text: "Active", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title="Rejected / Inactive"
          value={counts.rejected + counts.inactive}
          subtitle="Deactivated or Denied"
          icon={<span className="text-lg">⛔</span>}
          iconBg="bg-rose-50 border border-rose-200"
          valueClassName="text-rose-700"
          loading={loading}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by store name, vendor name..."
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All", count: counts.total },
            { id: "PENDING", label: "Pending", count: counts.pending, alert: counts.pending > 0 },
            { id: "APPROVED", label: "Approved", count: counts.approved },
            { id: "REJECTED", label: "Rejected", count: counts.rejected },
            { id: "INACTIVE", label: "Inactive", count: counts.inactive },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected
                    ? "bg-white/20 text-white"
                    : tab.alert
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-slate-200 text-slate-700"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vendors List Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Store & Vendor</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Products</th>
                <th className="py-3.5 px-4 sm:px-6">Total Sales</th>
                <th className="py-3.5 px-4 sm:px-6">Applied Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Store & Vendor Info: Display Store Name and Vendor Name ONLY */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                        {v.businessName ? v.businessName.charAt(0).toUpperCase() : v.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-black text-slate-900 block truncate max-w-[220px]">
                          {v.businessName || "Unnamed Store"}
                        </span>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                          <span className="text-slate-400 font-normal">Vendor:</span>
                          <span className="font-semibold text-slate-700">{v.name}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Clean Status Badge */}
                  <td className="py-4 px-4 sm:px-6">
                    {getStatusBadge(v.vendorStatus)}
                  </td>

                  {/* Total Catalog Items */}
                  <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 text-sm">
                    {v.productCount ?? v.metrics?.productsCount ?? 0} items
                  </td>

                  {/* Total Completed Sales */}
                  <td className="py-4 px-4 sm:px-6 font-black text-slate-900 text-sm">
                    ₹{(v.totalRevenue ?? v.metrics?.totalRevenue ?? 0).toLocaleString()}
                  </td>

                  {/* Registration Date */}
                  <td className="py-4 px-4 sm:px-6 text-slate-500 text-xs">
                    {new Date(v.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVendor(v);
                          setActionType("VIEW");
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="View Full Profile"
                      >
                        Details
                      </button>

                      {v.vendorStatus === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v, "APPROVED")}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVendor(v);
                              setActionType("REJECT");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {v.vendorStatus === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVendor(v);
                            setActionType("INACTIVE");
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                        >
                          Deactivate
                        </button>
                      )}

                      {(v.vendorStatus === "INACTIVE" || v.vendorStatus === "REJECTED") && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(v, "APPROVED")}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {vendors.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      title="No vendors found"
                      description="No vendor accounts matched your active filters or search query."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject / Feedback Modal */}
      {actionType === "REJECT" && selectedVendor && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedVendor(null);
            setActionType(null);
            setAdminFeedback("");
          }}
          title={`Reject Application: ${selectedVendor.businessName || selectedVendor.name}`}
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to reject this vendor application? You can provide optional feedback or a reason for the applicant.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Reason / Feedback Note (Optional)
              </label>
              <textarea
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                placeholder="e.g., Incomplete business documentation or duplicate store name..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedVendor(null);
                  setActionType(null);
                  setAdminFeedback("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                onClick={() => handleStatusChange(selectedVendor, "REJECTED")}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate Modal */}
      {actionType === "INACTIVE" && selectedVendor && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedVendor(null);
            setActionType(null);
          }}
          title={`Deactivate Vendor: ${selectedVendor.businessName || selectedVendor.name}`}
          size="md"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Deactivating this vendor will suspend their store access and ability to modify catalog or receive new orders until reactivated.
            </p>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedVendor(null);
                  setActionType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                onClick={() => handleStatusChange(selectedVendor, "INACTIVE")}
              >
                Deactivate Account
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Details Modal (Clean, Spacious & Structured) */}
      {actionType === "VIEW" && selectedVendor && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedVendor(null);
            setActionType(null);
          }}
          title="Vendor Merchant Details"
          subtitle="Full store profile, contact information, performance metrics, and governance"
          size="xl"
        >
          <div className="p-6 space-y-6">
            {/* Header Hero Card (Light Theme) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50 border border-emerald-100/80 text-slate-900 shadow-2xs relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-sm border border-emerald-500/20 flex-shrink-0">
                    {selectedVendor.businessName
                      ? selectedVendor.businessName.charAt(0).toUpperCase()
                      : selectedVendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                        {selectedVendor.businessName || "Unnamed Store"}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                        Merchant Partner
                      </span>
                    </div>

                  </div>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 flex-shrink-0">
                  <div>{getStatusBadge(selectedVendor.vendorStatus)}</div>
                  <span className="text-[11px] text-slate-500">
                    Applied: {new Date(selectedVendor.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance KPI Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Products</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {selectedVendor.productCount ?? selectedVendor.metrics?.productsCount ?? 0}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {selectedVendor.activeProductCount ?? selectedVendor.metrics?.activeProductsCount ?? 0} active in catalog
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
                <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                  ₹{(selectedVendor.totalRevenue ?? selectedVendor.metrics?.totalRevenue ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Completed Revenue</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Orders</span>
                <span className="text-lg font-black text-indigo-700 mt-0.5 block">
                  {selectedVendor.orderCount ?? selectedVendor.metrics?.ordersCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedVendor.orderCount ?? selectedVendor.metrics?.ordersCount ?? 0} customer orders
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                <span className="text-sm font-black text-slate-800 mt-1 block">
                  {selectedVendor.isActive ? "Active" : "Disabled / Pending"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Login Permission</span>
              </div>
            </div>

            {/* Contact & Business Profile Information */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Icon name="user" size={13} className="text-slate-400" />
                <span>Contact & Business Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Vendor / Owner Name
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{selectedVendor.name}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedVendor.email}`}
                    className="font-mono text-indigo-600 hover:text-indigo-800 hover:underline font-semibold text-sm block truncate"
                  >
                    {selectedVendor.email}
                  </a>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Business Phone
                  </span>
                  {selectedVendor.businessPhone ? (
                    <a
                      href={`tel:${selectedVendor.businessPhone}`}
                      className="text-slate-900 hover:text-emerald-700 font-bold text-sm block"
                    >
                      📞 {selectedVendor.businessPhone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not provided</span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Store / Business Address
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {selectedVendor.businessAddress || <span className="text-slate-400 italic">Not provided</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Description */}
            {selectedVendor.businessDescription && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Icon name="file-text" size={13} className="text-slate-400" />
                  <span>Store / Business Description</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedVendor.businessDescription}
                </div>
              </div>
            )}

            {/* Admin Feedback / Reason Note (if any) */}
            {selectedVendor.adminFeedback && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px] block mb-1">
                  Admin Feedback / Note
                </span>
                <p className="text-amber-800 leading-relaxed font-medium">
                  {selectedVendor.adminFeedback}
                </p>
              </div>
            )}

            {/* Approval / Rejection Timestamps */}
            {(selectedVendor.approvedAt || selectedVendor.rejectedAt) && (
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                {selectedVendor.approvedAt && (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Icon name="check-circle" size={13} />
                    Approved on {new Date(selectedVendor.approvedAt).toLocaleString()}
                  </span>
                )}
                {selectedVendor.rejectedAt && (
                  <span className="flex items-center gap-1 text-rose-700 font-medium">
                    <Icon name="x-circle" size={13} />
                    Rejected on {new Date(selectedVendor.rejectedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Modal Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                {selectedVendor.vendorStatus === "PENDING" && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setActionType("REJECT")}
                    >
                      Reject Application
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      loading={actionLoading}
                      onClick={() => handleStatusChange(selectedVendor, "APPROVED")}
                    >
                      Approve Application
                    </Button>
                  </>
                )}

                {selectedVendor.vendorStatus === "APPROVED" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setActionType("INACTIVE")}
                  >
                    Deactivate Account
                  </Button>
                )}

                {(selectedVendor.vendorStatus === "INACTIVE" || selectedVendor.vendorStatus === "REJECTED") && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    loading={actionLoading}
                    onClick={() => handleStatusChange(selectedVendor, "APPROVED")}
                  >
                    Reactivate Account
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedVendor(null);
                  setActionType(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminVendorsPage;
