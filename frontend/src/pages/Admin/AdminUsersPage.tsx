import React, { useEffect, useState } from "react";
import { getUsersApi, AuthUser } from "../../api/auth.api";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SearchInput,
  Badge,
  StatsCard,
  Button,
  EmptyState,
  Icon,
} from "../../components/common";
import { MESSAGES } from "../../constants/messages";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState<"all" | "SUPER_ADMIN" | "VENDOR" | "USER">("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsersApi();
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      toast.error(String(err?.response?.data?.message || t("messages.auth.usersLoadFailed", { defaultValue: MESSAGES.AUTH.USERS_LOAD_FAILED })));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term);

      if (!matchesSearch) return false;
    }

    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const adminCount = users.filter((u) => u.role === "SUPER_ADMIN").length;
  const vendorCount = users.filter((u) => u.role === "VENDOR").length;
  const customerCount = users.filter((u) => u.role === "USER").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("admin.users", { defaultValue: "Users & Roles" })}
          </h1>
        </div>

        <Button
          onClick={fetchUsers}
          variant="outline"
          size="md"
          loading={loading}
          icon={<span>↻</span>}
        >
          {t("admin.refreshDirectory", { defaultValue: "Refresh Directory" })}
        </Button>
      </div>

      {/* Reusable KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title={t("admin.totalAccounts", { defaultValue: "Total Accounts" })}
          value={users.length}
          subtitle={t("admin.registeredProfiles", { defaultValue: "Registered User Profiles" })}
          icon={<Icon name="users" className="w-5 h-5 text-slate-700" />}
          iconBg="bg-slate-100 border border-slate-200"
          loading={loading}
        />
        <StatsCard
          title={t("admin.administrators", { defaultValue: "Administrators" })}
          value={adminCount}
          subtitle={t("admin.privilegedStaff", { defaultValue: "Staff & Management Roles" })}
          icon={<Icon name="shield" className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50 border border-purple-100"
          valueClassName="text-purple-700"
          badge={{ text: "Admin Role", variant: "info" }}
          loading={loading}
        />
        <StatsCard
          title="Vendors & Sellers"
          value={vendorCount}
          subtitle="Registered Merchant Partners"
          icon={<Icon name="tag" className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50 border border-emerald-100"
          valueClassName="text-emerald-700"
          badge={{ text: "Vendor Role", variant: "success" }}
          loading={loading}
        />
        <StatsCard
          title={t("admin.shoppersCustomers", { defaultValue: "Shoppers & Customers" })}
          value={customerCount}
          subtitle={t("admin.regularShoppers", { defaultValue: "Active Store Shoppers" })}
          icon={<Icon name="shopping-bag" className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50 border border-indigo-100"
          valueClassName="text-indigo-700"
          badge={{ text: "Customer Role", variant: "info" }}
          loading={loading}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t("admin.searchUsersPlaceholder", { defaultValue: "Search by name, email, or UUID..." })}
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${roleFilter === "all"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
          >
            {t("common.all", { defaultValue: "All" })} ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("SUPER_ADMIN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${roleFilter === "SUPER_ADMIN"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
          >
            {t("admin.administrators", { defaultValue: "Admins" })} ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("VENDOR")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${roleFilter === "VENDOR"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
          >
            Vendors ({vendorCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("USER")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${roleFilter === "USER"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
          >
            {t("customer.dashboard", { defaultValue: "Customers" })} ({customerCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">{t("admin.userProfile", { defaultValue: "User Profile" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("auth.email", { defaultValue: "Email Address" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("admin.assignedRole", { defaultValue: "Assigned Role" })}</th>
                <th className="py-3.5 px-4 sm:px-6">{t("admin.accountId", { defaultValue: "Account ID" })}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{t("admin.registrationDate", { defaultValue: "Registration Date" })}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/80 flex items-center justify-center font-bold shadow-2xs text-xs flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-mono text-slate-600 font-medium">{u.email}</td>
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6">
                    <Badge
                      variant={
                        u.role === "SUPER_ADMIN"
                          ? "primary"
                          : u.role === "VENDOR"
                          ? "success"
                          : "info"
                      }
                      size="sm"
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 font-mono text-slate-500 text-[11px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                      {u.id.slice(0, 14)}...
                    </span>
                  </td>
                  <td className="py-3.5 sm:py-4 px-4 sm:px-6 text-slate-500 text-[11px] text-right">
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8">
                    <EmptyState
                      title={t("admin.noUsersMatching", { defaultValue: "No users matching criteria" })}
                      description={t("admin.noUsersMatchingDesc", { defaultValue: "Try searching with a different name or email." })}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
