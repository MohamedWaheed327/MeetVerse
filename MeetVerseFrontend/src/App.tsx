import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage/LandingPage";
import LoginPage from "./Pages/Auth/LoginPage";
import SignupPage from "./Pages/Auth/SignupPage";
import ForgotPasswordPage from "./Pages/Auth/ForgotPasswordPage";
import HomePage from "./Pages/Main/HomePage";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import MeetingsListPage from "./Pages/Meetings/MeetingsListPage";
import CreateMeetingPage from "./Pages/Meetings/CreateMeetingPage";
import JoinMeetingPage from "./Pages/Meetings/JoinMeetingPage";
import GroupsListPage from "./Pages/Groups/GroupsListPage";
import CreateGroupPage from "./Pages/Groups/CreateGroupPage";
import JoinGroupPage from "./Pages/Groups/JoinGroupPage";
import ProfilePage from "./Pages/Profile/ProfilePage";
import ResetPassword from "./Pages/Auth/ResetPassword";
import OTPVerification from "./Pages/Auth/OTPVerification";
import NotFound from "./Pages/NotFoundPage.tsx/NotFound";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import GuestRoute from "./components/GuestRoute/GuestRoute";
//
const MeetingPage = lazy(() => import("./Pages/Meetings/MeetingPage/MeetingPage"));
const GroupDetailsPage = lazy(() => import("./Pages/Groups/GroupDetailsPage"));
const GroupRequestsPage = lazy(() => import("./Pages/Groups/GroupRequestsPage"));
const GroupInvitePage = lazy(() => import("./Pages/Groups/GroupInvitePage"));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D0F16]">
      <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Landing & Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/otp-verification" element={<GuestRoute><OTPVerification /></GuestRoute>} />

      {/* Protected Main Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Protected Meetings Routes */}
      <Route
        path="/meetings"
        element={
          <ProtectedRoute>
            <MeetingsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings/create"
        element={
          <ProtectedRoute>
            <CreateMeetingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings/join"
        element={
          <ProtectedRoute>
            <JoinMeetingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings/:meetingId"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <MeetingPage />
              </Suspense>
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Protected Groups Routes */}
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/create"
        element={
          <ProtectedRoute>
            <CreateGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/join"
        element={
          <ProtectedRoute>
            <JoinGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoader />}>
              <GroupDetailsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId/requests"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoader />}>
              <GroupRequestsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/:groupId/invite"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoader />}>
              <GroupInvitePage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
