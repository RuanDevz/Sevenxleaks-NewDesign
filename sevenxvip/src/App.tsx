import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import Chooser from "./components/Chooser/Chooser";
import AsianPage from "./pages/AsianPage";
import WesternPage from "./pages/WesternPage";
import Header from "./components/Header";
import HeaderLogged from "./components/HeaderLogged";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import YourAccount from "./pages/Youraccount";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import ForgotPassword from "./pages/Forgotpassword";
import ResetPassword from "./pages/ResetPassword";
import Plans from "./pages/Plans";
import VIPcontent from "./pages/VIPcontent";
// Removido import duplicado/ambíguo de FreeContentDetails/AsianContentDetails
import WesternContentDetails from "./pages/WesternContentDetails";
import AsianContentDetails from "./components/AsianContentDetails";
import AdminPainel from "./pages/AdminPainel";
import AdminVipUsers from "./pages/AdminVipUsers";
import AdminContentRequests from "./pages/AdminContentRequests";
import SupportPage from "./pages/SupportPage";
import ViewStats from "./pages/Viewstats";
import ViewRequests from "./pages/ViewRequests";
import AccessDenied from "./pages/AccessDenied";
import AdminDisabledVipUsers from "./pages/AdminDisabledVipUsers";
import BannedContent from "./pages/BannedContent";
import UnknownContent from "./pages/UnknownContent";
import BannedContentDetails from "./pages/BannedContentDetails";
import UnknownContentDetails from "./pages/UnknownContentDetails";
import VIPChooser from "./components/VIP/VIPChooser";
import VIPAsianPage from "./pages/VIPAsianPage";
import VIPWesternPage from "./pages/VIPWesternPage";
import VIPBannedPage from "./pages/VIPBannedPage";
import VIPUnknownPage from "./pages/VIPUnknownPage";
import VIPAsianContentDetails from "./components/VIP/VIPAsianContentDetails";
import VIPWesternContentDetails from "./components/VIP/VIPWesternContentDetails";
import VIPBannedContentDetails from "./pages/VIPBannedContentDetails";
import VIPUnknownContentDetails from "./pages/VIPUnknownContentDetails";
import VIPHeader from "./components/VIP/VIPHeader";
import RecommendContent from "./pages/RecommendContent";

const App = () => {
  const [hasPermission, setHasPermission] = useState({ vip: false, admin: false });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const token = localStorage.getItem("Token");

  useEffect(() => {
    const checkPermissions = async () => {
      if (!token) {
        setHasPermission({ vip: false, admin: false });
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { isAdmin, isVip } = response.data;
        setHasPermission({ vip: Boolean(isVip), admin: Boolean(isAdmin) });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setHasPermission({ vip: false, admin: false });
        setIsAuthenticated(false);
        localStorage.removeItem("Token");
      }
    };

    checkPermissions();
  }, [token]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {hasPermission.vip ? (
          <VIPHeader />
        ) : isAuthenticated ? (
          <HeaderLogged />
        ) : (
          <Header />
        )}

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Chooser />} />
            <Route path="/asian" element={<AsianPage />} />
            <Route path="/asian/:slug" element={<AsianContentDetails />} />
            <Route path="/western" element={<WesternPage />} />
            <Route path="/western/:slug" element={<WesternContentDetails />} />
            <Route path="/banned" element={<BannedContent />} />
            <Route path="/banned/:slug" element={<BannedContentDetails />} />
            <Route path="/unknown" element={<UnknownContent />} />
            <Route path="/unknown/:slug" element={<UnknownContentDetails />} />

            <Route
              path="/vip"
              element={
                hasPermission.vip ? <VIPChooser /> : <AccessDenied message="You are not a VIP to access this page." />
              }
            />

            <Route
              path="/vip-asian"
              element={
                hasPermission.vip ? <VIPAsianPage /> : <AccessDenied message="You are not a VIP to access this page." />
              }
            />

            <Route
              path="/vip-western"
              element={
                hasPermission.vip ? <VIPWesternPage /> : <AccessDenied message="You are not a VIP to access this page." />
              }
            />

            <Route
              path="/vip-banned"
              element={
                hasPermission.vip ? <VIPBannedPage /> : <AccessDenied message="You are not a VIP to access this page." />
              }
            />

            <Route
              path="/vip-unknown"
              element={
                hasPermission.vip ? <VIPUnknownPage /> : <AccessDenied message="You are not a VIP to access this page." />
              }
            />

            <Route
              path="/vip-asian/:slug"
              element={
                hasPermission.vip ? (
                  <VIPAsianContentDetails />
                ) : (
                  <AccessDenied message="You are not a VIP to access this page." />
                )
              }
            />

              <Route
              path="/recommend"
              element={
                hasPermission.vip ? (
                  <RecommendContent />
                ) : (
                  <AccessDenied message="You are not a VIP to access this page." />
                )
              }
            />

            <Route
              path="/vip-western/:slug"
              element={
                hasPermission.vip ? (
                  <VIPWesternContentDetails />
                ) : (
                  <AccessDenied message="You are not a VIP to access this page." />
                )
              }
            />

            <Route
              path="/vip-banned/:slug"
              element={
                hasPermission.vip ? (
                  <VIPBannedContentDetails />
                ) : (
                  <AccessDenied message="You are not a VIP to access this page." />
                )
              }
            />

            <Route
              path="/vip-unknown/:slug"
              element={
                hasPermission.vip ? (
                  <VIPUnknownContentDetails />
                ) : (
                  <AccessDenied message="You are not a VIP to access this page." />
                )
              }
            />

            <Route
              path="/vip/:slug"
              element={
                hasPermission.vip ? <VIPcontent /> : <AccessDenied message="You are not a VIP to access this page." />
              }
            />

            <Route
              path="/admin/settings"
              element={
                hasPermission.admin ? <AdminPainel /> : <AccessDenied message="You are not an administrator to access this page." />
              }
            />
            <Route
              path="/admin/stats"
              element={
                hasPermission.admin ? <ViewStats /> : <AccessDenied message="You are not an administrator to access this page." />
              }
            />
            <Route
              path="/admin/requests"
              element={
                hasPermission.admin ? <ViewRequests /> : <AccessDenied message="You are not an administrator to access this page." />
              }
            />
            <Route
              path="/admin/content-requests"
              element={
                hasPermission.admin ? <AdminContentRequests /> : <AccessDenied message="You are not an administrator to access this page." />
              }
            />
            <Route
              path="/admin-vip-users"
              element={
                hasPermission.admin ? <AdminVipUsers /> : <AccessDenied message="You are not an administrator to access this page." />
              }
            />
            <Route
              path="/admin-vip-disabled"
              element={
                hasPermission.admin ? (
                  <AdminDisabledVipUsers />
                ) : (
                  <AccessDenied message="You are not an administrator to access this page." />
                )
              }
            />

            <Route path="/chooser" element={<Chooser />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<YourAccount />} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;
