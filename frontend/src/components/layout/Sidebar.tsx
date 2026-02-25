// ============================================================================
// Gemba Management System - Sidebar Navigation
// ============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { useTranslation } from '../../i18n/index';
import type { TranslationKeys } from '../../i18n/translations';

// ---------------------------------------------------------------------------
// Supported languages for the language selector
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
];

// ---------------------------------------------------------------------------
// Navigation item definition
// ---------------------------------------------------------------------------

interface NavItemDef {
  path: string;
  labelKey?: keyof TranslationKeys;
  labelText?: string;
  /** Minimum role_level required to see this item */
  minLevel: number;
  /** If true, only visible to admin role */
  adminOnly?: boolean;
}

interface NavSectionDef {
  titleKey: keyof TranslationKeys;
  items: NavItemDef[];
}

// ---------------------------------------------------------------------------
// Access control rules:
//   L1 (role_level=1): level1, escalations, safety-cross, handover
//   L2 (role_level=2): L1 + level2, resolution, dashboard, issue-history, gemba-walk
//   L3 (role_level=3): all non-admin pages
//   Admin (role=admin): admin config pages only
// ---------------------------------------------------------------------------

const NAV_SECTIONS: NavSectionDef[] = [
  {
    titleKey: 'managementLevels',
    items: [
      { path: '/level1', labelKey: 'level1Teams', minLevel: 1 },
      { path: '/level2', labelKey: 'level2Areas', minLevel: 2 },
      { path: '/level3', labelKey: 'level3Plant', minLevel: 3 },
    ],
  },
  {
    titleKey: 'issueManagement',
    items: [
      { path: '/escalations', labelKey: 'issueEscalations', minLevel: 1 },
      { path: '/resolution', labelKey: 'issueResolution', minLevel: 2 },
      { path: '/dashboard', labelKey: 'issueDashboard', minLevel: 2 },
      { path: '/issue-history', labelText: 'Issue History', minLevel: 2 },
    ],
  },
  {
    titleKey: 'managementTools',
    items: [
      { path: '/safety-cross', labelKey: 'safetyCross', minLevel: 1 },
      { path: '/gemba-walk', labelKey: 'gembaWalk', minLevel: 2 },
      { path: '/handover', labelKey: 'shiftHandover', minLevel: 1 },
    ],
  },
  {
    titleKey: 'admin',
    items: [
      { path: '/admin/config', labelKey: 'configuration', minLevel: 99, adminOnly: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { setCurrentView } = useApp();
  const { language, setLanguage, t } = useTranslation();

  if (!user) return null;

  const roleLevel = user.role_level;
  const isAdmin = user.role === 'admin';

  // Filter sections and items based on role
  const visibleSections = NAV_SECTIONS
    .map((section) => {
      const visibleItems = section.items.filter((item) => {
        // Admin-only items are only shown to admins
        if (item.adminOnly) return isAdmin;
        // Non-admin items are hidden from admin users
        if (isAdmin) return false;
        // Regular role-level gating
        return roleLevel >= item.minLevel;
      });
      return { ...section, items: visibleItems };
    })
    .filter((section) => section.items.length > 0);

  const handleNavClick = (path: string) => {
    const view = path.replace(/^\//, '').replace(/\//g, '-');
    setCurrentView(view);
  };

  const getItemLabel = (item: NavItemDef): string => {
    if (item.labelKey) return t(item.labelKey);
    return item.labelText ?? '';
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">GEMBA</div>
        <div className="subtitle">Shopfloor Management</div>
        <div className="user-info">
          <div><strong>{user.display_name}</strong></div>
          <div>{user.role.replace('_', ' ').toUpperCase()}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleSections.map((section) => (
          <div className="nav-section" key={section.titleKey}>
            <div className="nav-section-title">
              {t(section.titleKey)}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
                onClick={() => handleNavClick(item.path)}
              >
                {getItemLabel(item)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Language Selector */}
        <div className="language-selector">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-btn${language === lang.code ? ' active' : ''}`}
              onClick={() => setLanguage(lang.code)}
              type="button"
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          className="logout-btn"
          onClick={logout}
          type="button"
          style={{ marginTop: '1rem' }}
        >
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
