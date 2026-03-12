import { Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage/LandingPage";
import LoginPage from "./Pages/Auth/LoginPage";
import SignupPage from "./Pages/Auth/SignupPage";
import ForgotPasswordPage from "./Pages/Auth/ForgotPasswordPage";
import HomePage from "./Pages/Main/HomePage";
import MeetingsListPage from "./Pages/Meetings/MeetingsListPage";
import CreateMeetingPage from "./Pages/Meetings/CreateMeetingPage";
import JoinMeetingPage from "./Pages/Meetings/JoinMeetingPage";
import MeetingPage from "./Pages/Meetings/MeetingPage";
import GroupsListPage from "./Pages/Groups/GroupsListPage";
import CreateGroupPage from "./Pages/Groups/CreateGroupPage";
import JoinGroupPage from "./Pages/Groups/JoinGroupPage";
import GroupDetailsPage from "./Pages/Groups/GroupDetailsPage";
import ProfilePage from "./Pages/Profile/ProfilePage";
import ResetPassword from "./Pages/Auth/ResetPassword";
import OTPVerification from "./Pages/Auth/OTPVerification";
import NotFound from "./Pages/NotFoundPage.jsx/NotFound";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Landing & Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/otp-verification" element={<OTPVerification />} />

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
        path="/meetings/:id"
        element={
          <ProtectedRoute>
            <MeetingPage />
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
        path="/groups/:id"
        element={
          <ProtectedRoute>
            <GroupDetailsPage />
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
