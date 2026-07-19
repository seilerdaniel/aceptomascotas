import { useState, useMemo } from "react";
import { MessageSquare, Home, Users, Loader2, Flag, Link2, Stethoscope, Megaphone, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import AdminAccessGuard from "@/components/admin/AdminAccessGuard";

// ---------- Authentication ----------
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";

// ---------- Queries ----------
import { useContactMessages, usePropertyReports, useAllAds } from "@/hooks/useAdmin";
import { useAdminActionLog } from "@/hooks/useAdminActionLog";

// ---------- Paginated tables ----------
import {
  useAdminPropertiesPaginated,
  useAdminServicesPaginated,
  useAdminUsersPaginated,
  useAdminPendingServicesCount,
  type PropertyStatusFilter,
  type ServiceStatusFilter,
  type UserStatusFilter,
  type AdminTableState,
} from "@/hooks/useAdminTables";
import { useAdminTableHandlers } from "@/hooks/useAdminTableHandlers";

// ---------- Mutations ----------
import { useAdminMutations } from "@/hooks/useAdminMutations";

// ---------- Tabs ----------
import MessagesTab from "@/components/admin/tabs/MessagesTab";
import ReportsTab from "@/components/admin/tabs/ReportsTab";
import ServicesTab from "@/components/admin/tabs/ServicesTab";
import PropertiesTab from "@/components/admin/tabs/PropertiesTab";
import UsersTab from "@/components/admin/tabs/UsersTab";
import UtmTab from "@/components/admin/tabs/UtmTab";
import AdsTab from "@/components/admin/tabs/AdsTab";
import ActivityTab from "@/components/admin/tabs/ActivityTab";

const AdminPage = () => {
  // ---------- Authentication ----------
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  // ---------- Queries ----------
  const { data: messages = [], isLoading: messagesLoading } = useContactMessages();
  const { data: reports = [], isLoading: reportsLoading } = usePropertyReports();
  const { data: ads = [], isLoading: adsLoading } = useAllAds();
  const {
    data: actionLogData,
    isLoading: actionLogLoading,
    loadMore: loadMoreActionLog,
    hasMore: hasMoreActionLog,
  } = useAdminActionLog();
  // Conteo real de servicios pendientes para el badge del tab: independiente
  // de la búsqueda/filtro/página actual de la tabla de Servicios.
  const { data: pendingServicesCount = 0 } = useAdminPendingServicesCount();

  // ---------- Paginated tables ----------
  const [propertiesState, setPropertiesState] = useState<
    AdminTableState & { status: PropertyStatusFilter }
  >({ page: 1, search: "", sortBy: "created_at", sortAscending: false, status: "todas" });
  const { data: propertiesPage, isLoading: propertiesLoading } = useAdminPropertiesPaginated(propertiesState);
  const propertiesHandlers = useAdminTableHandlers(setPropertiesState);

  const [servicesState, setServicesState] = useState<AdminTableState & { status: ServiceStatusFilter }>({
    page: 1,
    search: "",
    sortBy: "created_at",
    sortAscending: false,
    status: "todos",
  });
  const { data: servicesPage, isLoading: servicesLoading } = useAdminServicesPaginated(servicesState);
  const servicesHandlers = useAdminTableHandlers(setServicesState);

  const [usersState, setUsersState] = useState<AdminTableState & { status: UserStatusFilter }>({
    page: 1,
    search: "",
    sortBy: "created_at",
    sortAscending: false,
    status: "todos",
  });
  const { data: usersPage, isLoading: profilesLoading } = useAdminUsersPaginated(usersState);
  const usersHandlers = useAdminTableHandlers(setUsersState);

  // ---------- UI state ----------
  const pendingReportsCount = useMemo(
    () => reports.filter((report) => report.status === "pending").length,
    [reports]
  );
  const nextAdSortOrder = useMemo(
    () => Math.max(0, ...ads.map((ad) => Number(ad.sort_order ?? 0))) + 1,
    [ads]
  );

  // ---------- Mutations ----------
  const mutations = useAdminMutations();

  // Access guards
  if (authLoading || adminLoading || isAdmin === undefined) {
    return <AdminAccessGuard state="loading" />;
  }
  if (!user) {
    return <AdminAccessGuard state="unauthenticated" />;
  }
  if (!isAdmin) {
    return <AdminAccessGuard state="unauthorized" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Panel de administración" description="Panel de administración de Acepto Mascotas." path="/admin" noIndex />
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">Gestioná mensajes, propiedades y usuarios</p>
        </div>

        <AdminStatsCards
          messagesCount={messages.length}
          propertiesCount={propertiesPage?.totalCount ?? 0}
          usersCount={usersPage?.totalCount ?? 0}
        />

        <Tabs defaultValue="messages" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-2">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="messages" className="gap-2 shrink-0">
                <MessageSquare className="h-4 w-4" />
                Mensajes
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2 shrink-0">
                <Flag className="h-4 w-4" />
                Reportes
                {pendingReportsCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingReportsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2 shrink-0">
                <Stethoscope className="h-4 w-4" />
                Servicios
                {pendingServicesCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingServicesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="properties" className="gap-2 shrink-0">
                <Home className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2 shrink-0">
                <Users className="h-4 w-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="utm" className="gap-2 shrink-0">
                <Link2 className="h-4 w-4" />
                Links UTM
              </TabsTrigger>
              <TabsTrigger value="ads" className="gap-2 shrink-0">
                <Megaphone className="h-4 w-4" />
                Publicidad
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 shrink-0">
                <History className="h-4 w-4" />
                Actividad
              </TabsTrigger>
            </TabsList>
          </div>

          <MessagesTab messages={messages} isLoading={messagesLoading} onDelete={mutations.handleDeleteMessage} />

          <ReportsTab
            reports={reports}
            isLoading={reportsLoading}
            onUpdateStatus={mutations.handleUpdateReportStatus}
            onDelete={mutations.handleDeleteReport}
          />

          <ServicesTab
            services={servicesPage?.rows ?? []}
            isLoading={servicesLoading}
            state={servicesState}
            handlers={servicesHandlers}
            pageCount={servicesPage?.pageCount ?? 1}
            totalCount={servicesPage?.totalCount ?? 0}
            onToggleApproval={mutations.handleToggleServiceApproval}
            onToggleVerified={mutations.handleToggleServiceVerified}
            onDelete={mutations.handleDeleteService}
          />

          <PropertiesTab
            properties={propertiesPage?.rows ?? []}
            isLoading={propertiesLoading}
            state={propertiesState}
            handlers={propertiesHandlers}
            pageCount={propertiesPage?.pageCount ?? 1}
            totalCount={propertiesPage?.totalCount ?? 0}
            onToggleActive={mutations.handleToggleProperty}
            onToggleVerified={mutations.handleToggleVerified}
            onDelete={mutations.handleDeleteProperty}
          />

          <UsersTab
            profiles={usersPage?.rows ?? []}
            isLoading={profilesLoading}
            state={usersState}
            handlers={usersHandlers}
            pageCount={usersPage?.pageCount ?? 1}
            totalCount={usersPage?.totalCount ?? 0}
            onToggleVerification={mutations.handleToggleVerification}
          />

          <UtmTab />

          <AdsTab
            ads={ads}
            isLoading={adsLoading}
            nextSortOrder={nextAdSortOrder}
            isCreating={mutations.isCreatingAd}
            userId={user?.id}
            onCreate={mutations.handleCreateAd}
            onToggleActive={mutations.handleToggleAdActive}
            onDelete={mutations.handleDeleteAd}
          />

          <ActivityTab
            entries={actionLogData?.rows}
            isLoading={actionLogLoading}
            hasMore={hasMoreActionLog}
            onLoadMore={loadMoreActionLog}
          />
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
