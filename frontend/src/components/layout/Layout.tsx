// ============================================================================
// Gemba Management System - Layout Wrapper
// ============================================================================

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTranslation } from '../../i18n/index';
import type { TranslationKeys } from '../../i18n/translations';

// ---------------------------------------------------------------------------
// Route-to-title mapping
// ---------------------------------------------------------------------------

interface RouteInfo {
  titleKey?: keyof TranslationKeys;
  titleText?: string;
  breadcrumb: string;
}

const ROUTE_MAP: Record<string, RouteInfo> = {
  '/level1': { titleKey: 'level1Teams', breadcrumb: 'Management Levels / Level 1' },
  '/level2': { titleKey: 'level2Areas', breadcrumb: 'Management Levels / Level 2' },
  '/level3': { titleKey: 'level3Plant', breadcrumb: 'Management Levels / Level 3' },
  '/escalations': { titleKey: 'issueEscalations', breadcrumb: 'Issue Management / Escalations' },
  '/resolution': { titleKey: 'issueResolution', breadcrumb: 'Issue Management / Resolution' },
  '/dashboard': { titleKey: 'issueDashboard', breadcrumb: 'Issue Management / Dashboard' },
  '/issue-history': { titleText: 'Issue History', breadcrumb: 'Issue Management / History' },
  '/safety-cross': { titleKey: 'safetyCross', breadcrumb: 'Management Tools / Safety Cross' },
  '/gemba-walk': { titleKey: 'gembaWalk', breadcrumb: 'Management Tools / Gemba Walk' },
  '/handover': { titleKey: 'shiftHandover', breadcrumb: 'Management Tools / Shift Handover' },
  '/analytics': { titleKey: 'analytics', breadcrumb: 'Analytics' },
  '/admin/config': { titleKey: 'configuration', breadcrumb: 'Admin / Configuration' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Layout: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const routeInfo = ROUTE_MAP[location.pathname];

  const pageTitle = routeInfo
    ? (routeInfo.titleKey ? t(routeInfo.titleKey) : routeInfo.titleText ?? 'Page')
    : 'Page';

  const breadcrumb = routeInfo?.breadcrumb ?? location.pathname;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-container">
        <div className="content-header">
          <h1>{pageTitle}</h1>
          <div className="breadcrumb">{breadcrumb}</div>
        </div>
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
