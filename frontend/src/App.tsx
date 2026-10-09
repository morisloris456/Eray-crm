import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages lazy
const Account = lazy(() => import("./pages/Account"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Settings = lazy(() => import("./pages/Settings"));
const Projects = lazy(() => import("./pages/Projects"));
const Archives = lazy(() => import("./pages/Archives"));
const UsersPage = lazy(() => import("./pages/Users"));

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public route */}
        <Route
          path="/"
          element={
            <Suspense
              fallback={
                <div className="flex h-screen items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              }
            >
              <Account />
            </Suspense>
          }
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              }
            />

            <Route
              path="/clients"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Clients />
                </Suspense>
              }
            />

            <Route
              path="/pipeline"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Pipeline />
                </Suspense>
              }
            />

            <Route
              path="/agenda"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Agenda />
                </Suspense>
              }
            />

            <Route
              path="/projects"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Projects />
                </Suspense>
              }
            />

            <Route
              path="/archives"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Archives />
                </Suspense>
              }
            />

            <Route
              path="/users"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <UsersPage />
                </Suspense>
              }
            />

            <Route
              path="/settings"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Settings />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
