import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteDataProvider, useSiteData } from "./data/SiteDataProvider";
import { useThemeApplier } from "./data/theme";
import { Footer, MessageButton, Nav, ScrollTrack, TopBar } from "./components/SiteChrome";
import { RequireAdmin } from "./admin/RequireAdmin";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminArranger from "./admin/AdminArranger";
import AdminContent from "./admin/AdminContent";
import AdminGallery from "./admin/AdminGallery";
import AdminReviews from "./admin/AdminReviews";
import AdminEnquiries from "./admin/AdminEnquiries";
import AdminActivity from "./admin/AdminActivity";
import AdminSettings from "./admin/AdminSettings";
import Home from "./pages/Home";
import About from "./pages/About";
import { ProductsPage, ProductDetailPage } from "./pages/Products";
import Gallery from "./pages/Gallery";
import Reviews from "./pages/Reviews";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

function ThemeRoot() {
  const { settings } = useSiteData();
  useThemeApplier(settings.theme);
  return null;
}

function Chrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { settings } = useSiteData();

  // restart at the top on every navigation (anchor-style scroll stays smooth)
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname, location.hash]);

  return (
    <>
      <TopBar phone={settings.phone} email={settings.email} phoneAlt={settings.phoneAlt} />
      <ScrollTrack />
      <Nav />
      {children}
      <Footer settings={settings} />
      <MessageButton facebook={settings.facebook} />
    </>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SiteDataProvider>
      <ThemeRoot />
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireAdmin>
                <AdminLayout>
                  <Routes>
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="arranger" element={<AdminArranger />} />
                    <Route path="content" element={<AdminContent />} />
                    <Route path="gallery" element={<AdminGallery />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="enquiries" element={<AdminEnquiries />} />
                    <Route path="activity" element={<AdminActivity />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route index element={<AdminDashboard />} />
                    <Route path="*" element={<AdminDashboard />} />
                  </Routes>
                </AdminLayout>
              </RequireAdmin>
            }
          />
          <Route
            path="*"
            element={
              <Chrome>
                <PublicRoutes />
              </Chrome>
            }
          />
        </Routes>
      </BrowserRouter>
    </SiteDataProvider>
  );
}
