import { Suspense, lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout.jsx";

// Components
import LoadingScreen from "../components/common/LoadingScreen.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";

// Path Constants
import { PATH_PAGE, PATH_DASHBOARD } from "./paths";

// ----------------------------------------------------------------------

const Loadable = (Component) => (props) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { element: <Home />, index: true },
        { path: PATH_PAGE.search, element: <Search /> },
        { path: PATH_PAGE.labs, element: <NearbyLabs /> },
        { path: PATH_PAGE.clinics, element: <ClinicList /> },
        { path: PATH_PAGE.doctorProfile, element: <DoctorProfile /> },
        { path: PATH_PAGE.bookAppointment, element: <BookAppointment /> },
        { path: PATH_PAGE.login, element: <Login /> },
        { path: PATH_PAGE.forgotPassword, element: <ForgotPassword /> },
        { path: PATH_PAGE.resetPassword, element: <ResetPassword /> },
      ],
    },
    {
      path: PATH_DASHBOARD.patient,
      element: (
        <ProtectedRoute allowedRoles={["patient"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [{ element: <PatientDashboard />, index: true }],
    },
    {
      path: PATH_DASHBOARD.doctor,
      element: (
        <ProtectedRoute allowedRoles={["doctor"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [{ element: <DoctorDashboard />, index: true }],
    },
    {
      path: PATH_DASHBOARD.admin,
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [{ element: <AdminDashboard />, index: true }],
    },
    {
      path: "/dashboard",
      element: <Navigate to={PATH_DASHBOARD.patient} replace />,
    },
    {
      path: "*",
      element: <MainLayout />,
      children: [
        { path: "404", element: <NotFound /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
  ]);
}

// Pages
const Home = Loadable(lazy(() => import("../pages/Home")));
const Search = Loadable(lazy(() => import("../pages/Search")));
const NearbyLabs = Loadable(lazy(() => import("../pages/NearbyLabs")));
const ClinicList = Loadable(lazy(() => import("../pages/ClinicList")));
const DoctorProfile = Loadable(lazy(() => import("../pages/DoctorProfile")));
const BookAppointment = Loadable(
  lazy(() => import("../pages/BookAppointment")),
);
const Login = Loadable(lazy(() => import("../pages/Login")));
const ForgotPassword = Loadable(lazy(() => import("../pages/ForgotPassword")));
const ResetPassword = Loadable(lazy(() => import("../pages/ResetPassword")));
const PatientDashboard = Loadable(
  lazy(() => import("../pages/PatientDashboard")),
);
const DoctorDashboard = Loadable(
  lazy(() => import("../pages/DoctorDashboard")),
);
const AdminDashboard = Loadable(lazy(() => import("../pages/AdminDashboard")));
const NotFound = Loadable(lazy(() => import("../pages/NotFound")));
