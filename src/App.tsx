import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/layouts/AppLayout";
import LanguageSync from "@/components/LanguageSync";

import CourtDetailPage from "./pages/CourtDetailPage";
import CourtsPage from "@/pages/CourtsPage";

import LoginPage from "@/pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "@/pages/RegisterPage";

import CourtProposalsAdminPage from "@/pages/CourtProposalsAdminPage";
import CourtReportPage from "@/pages/CourtReportPage";
import MyReportsPage from "@/pages/MyReportsPage";
import ReportDetailPage from "@/pages/ReportDetailPage";

import MunicipalityDashboardPage from "@/pages/MunicipalityDashboardPage";
import MunicipalityDetailPage from "@/pages/MunicipalityDetailPage";
import MunicipalityCourtsPage from "@/pages/MunicipalityCourtsPage";
import MunicipalityCourtEditPage from "@/pages/MunicipalityCourtEditPage";

import EventsPage from "@/pages/EventsPage";
import EventDetailPage from "@/pages/EventDetailPage";
import EventCreatePage from "@/pages/EventCreatePage";
import EventEditPage from "@/pages/EventEditPage";
import EventCalendarPage from "@/pages/EventCalendarPage";

import ClubsPage from "@/pages/ClubsPage";
import ClubDetailPage from "@/pages/ClubDetailPage";
import ClubEditPage from "@/pages/ClubEditPage";

import TeamsPage from "@/pages/TeamsPage";
import TeamDetailPage from "@/pages/TeamDetailPage";
import TeamEditPage from "@/pages/TeamEditPage";
import TeamCreatePage from "@/pages/TeamCreatePage";

import LeaguesPage from "@/pages/LeaguesPage";
import LeagueDetailPage from "@/pages/LeagueDetailPage";

import GameDetailPage from "@/pages/GameDetailPage";
import GameEditPage from "@/pages/GameEditPage";

import ProfilePage from "@/pages/ProfilePage";
import ProfileEditPage from "@/pages/ProfileEditPage";

import AuthCallbackPage from "@/pages/AuthCallbackPage";

function App() {
  return (
    <BrowserRouter basename="BallerzHub">
      <LanguageSync />
      <Routes>
        <Route element={<AppLayout />}>
          {/* Startseite */}
          <Route path="/" element={<Navigate to="/courts" replace />} />

          {/* Authentifizierung */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="/register" element={<RegisterPage />} />

          {/* Courts */}
          <Route path="/courts" element={<CourtsPage />} />

          <Route path="/courts/:courtId" element={<CourtDetailPage />} />

          {/* Vereine */}
          <Route path="/clubs" element={<ClubsPage />} />

          <Route path="/clubs/:clubId" element={<ClubDetailPage />} />

          {/* Mannschaften */}
          <Route path="/teams" element={<TeamsPage />} />

          <Route
            path="/clubs/:clubId/teams/:teamId"
            element={<TeamDetailPage />}
          />

          {/* Ligen */}
          <Route path="/leagues" element={<LeaguesPage />} />

          <Route path="/leagues/easycredit-bbl" element={<LeaguesPage />} />

          <Route
            path="/leagues/bezirksliga-herren-niers"
            element={<LeaguesPage />}
          />

          <Route path="/leagues/:leagueId" element={<LeagueDetailPage />} />

          {/* Spiele */}
          <Route
            path="/leagues/:leagueId/games/:gameId"
            element={<GameDetailPage />}
          />

          {/* Geschützte Bereiche */}
          <Route element={<ProtectedRoute />}>
            {/* Court-Verwaltung */}
            <Route
              path="/admin/court-proposals"
              element={<CourtProposalsAdminPage />}
            />

            <Route
              path="/courts/:courtId/report"
              element={<CourtReportPage />}
            />

            {/* Kommunalverwaltung */}
            <Route
              path="/municipality/dashboard"
              element={<MunicipalityDashboardPage />}
            />

            {/* Reports führen zum Kommunen-Dashboard */}
            <Route
              path="/municipality/reports"
              element={<MunicipalityDashboardPage />}
            />

            {/* Einzelne Meldung / Ticket */}
            <Route
              path="/municipality/reports/:reportId"
              element={<MunicipalityDetailPage />}
            />

            <Route
              path="/municipality/courts"
              element={<MunicipalityCourtsPage />}
            />

            <Route
              path="/municipality/courts/:courtId/edit"
              element={<MunicipalityCourtEditPage />}
            />

            {/* Events */}
            <Route path="/events" element={<EventsPage />} />

            <Route path="/events/calendar" element={<EventCalendarPage />} />

            <Route path="/events/create" element={<EventCreatePage />} />

            <Route path="/events/:eventId/edit" element={<EventEditPage />} />

            <Route path="/events/:eventId" element={<EventDetailPage />} />

            {/* Vereinsverwaltung */}
            <Route path="/clubs/:clubId/edit" element={<ClubEditPage />} />

            {/* Mannschaftsverwaltung */}
            <Route
              path="/clubs/:clubId/teams/create"
              element={<TeamCreatePage />}
            />

            <Route
              path="/clubs/:clubId/teams/:teamId/edit"
              element={<TeamEditPage />}
            />

            {/* Spielverwaltung */}
            <Route
              path="/leagues/:leagueId/games/create"
              element={<GameEditPage />}
            />

            <Route
              path="/leagues/:leagueId/games/:gameId/edit"
              element={<GameEditPage />}
            />
          </Route>

          {/* Profil */}
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/profile/edit" element={<ProfileEditPage />} />

          {/* Benutzerbereich */}
          <Route path="/profile/reports" element={<MyReportsPage />} />

          <Route path="/reports/:reportId" element={<ReportDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
