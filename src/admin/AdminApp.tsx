import "./admin-dashboard.css";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { DataGate } from "../components/DataGate";
import { PageLoader } from "../components/Lazy";
import { RequireAdmin } from "./RequireAdmin";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";

// the admin panel is one lazy chunk (visitors never download it), and each screen inside it loads on demand
const AdminProducts = lazy(() => import("./AdminProducts"));
const AdminArranger = lazy(() => import("./AdminArranger"));
const AdminContent = lazy(() => import("./AdminContent"));
const AdminGallery = lazy(() => import("./AdminGallery"));
const AdminDocuments = lazy(() => import("./AdminDocuments"));
const AdminReviews = lazy(() => import("./AdminReviews"));
const AdminEnquiries = lazy(() => import("./AdminEnquiries"));
const AdminActivity = lazy(() => import("./AdminActivity"));
const AdminSettings = lazy(() => import("./AdminSettings"));

/** Everything under /admin. Imported lazily by App so the public site stays small. */
export default function AdminApp() {
  return (
    <RequireAdmin>
      <AdminLayout>
        <DataGate minHeight="40vh">
        <Suspense fallback={<PageLoader label="Loading" minHeight="40vh" />}>
          <Routes>
            <Route path="products" element={<AdminProducts />} />
            <Route path="arranger" element={<AdminArranger />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route index element={<AdminDashboard />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
        </DataGate>
      </AdminLayout>
    </RequireAdmin>
  );
}
