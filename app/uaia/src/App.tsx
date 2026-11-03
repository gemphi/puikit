import React from 'react';
import { PuiProvider } from '@pui/providers';
import { RouterProvider, Routes, type Route } from './router';
import { AppShell } from './components/layout/shell';
import { HomePage } from './pages/home';
import { AboutPage } from './pages/about';
import { MissionPage } from './pages/mission';
import { GovernancePage } from './pages/governance';
import { LeadershipPage } from './pages/leadership';
import { FrameworkPage } from './pages/framework';
import { EvaluationsPage } from './pages/evaluations';
import { CertificationPage } from './pages/certification';
import { StandardsPage } from './pages/standards';
import { PartnershipsPage } from './pages/partnerships';
import { NewsroomPage } from './pages/newsroom';
import { ResearchPage } from './pages/research';
import { PolicyPage } from './pages/policy';
import { CareersPage } from './pages/careers';
import { ContactPage } from './pages/contact';
import { LegalPage } from './pages/legal';
import { NotFoundPage } from './pages/not-found';

const routeTable: Route[] = [
  { path: '/', render: () => <HomePage /> },
  { path: '/about', render: () => <AboutPage /> },
  { path: '/mission', render: () => <MissionPage /> },
  { path: '/governance', render: () => <GovernancePage /> },
  { path: '/leadership', render: () => <LeadershipPage /> },
  { path: '/framework', render: () => <FrameworkPage /> },
  { path: '/evaluations', render: () => <EvaluationsPage /> },
  { path: '/certification', render: () => <CertificationPage /> },
  { path: '/standards', render: () => <StandardsPage /> },
  { path: '/partnerships', render: () => <PartnershipsPage /> },
  { path: '/newsroom', render: () => <NewsroomPage /> },
  { path: '/research', render: () => <ResearchPage /> },
  { path: '/policy', render: () => <PolicyPage /> },
  { path: '/careers', render: () => <CareersPage /> },
  { path: '/contact', render: () => <ContactPage /> },
  { path: '/legal', render: () => <LegalPage /> },
];

/** uaiagency.org — dark by default, glass surfaces, the `uaia` signal brand. */
export const App: React.FC = () => (
  <PuiProvider defaultTheme="dark" defaultThemeStyle="glass" defaultArchetype="portal" defaultBrand="uaia">
    <RouterProvider>
      <AppShell>
        <Routes routes={routeTable} fallback={<NotFoundPage />} />
      </AppShell>
    </RouterProvider>
  </PuiProvider>
);
