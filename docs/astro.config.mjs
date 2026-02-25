import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://jakobgabriel.github.io",
  base: "/gemba-management-app",
  integrations: [
    starlight({
      title: "Gemba Management",
      description:
        "Documentation for the Gemba Management System — a shopfloor manufacturing management platform.",
      social: {
        github: "https://github.com/jakobgabriel/gemba-management-app",
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "getting-started/introduction" },
            { label: "Quick Start", slug: "getting-started/quick-start" },
          ],
        },
        {
          label: "App",
          items: [
            { label: "Overview", slug: "app/overview" },
            { label: "Login", slug: "app/login" },
            { label: "Level 1 - Team", slug: "app/level1" },
            { label: "Level 2 - Area", slug: "app/level2" },
            { label: "Level 3 - Plant", slug: "app/level3" },
            { label: "Issue Management", slug: "app/issues" },
            { label: "Safety Cross", slug: "app/safety" },
            { label: "Gemba Walk", slug: "app/gemba-walk" },
            { label: "Shift Handover", slug: "app/handover" },
            { label: "Analytics", slug: "app/analytics" },
            { label: "Admin Configuration", slug: "app/admin" },
          ],
        },
        {
          label: "Architecture",
          items: [
            { label: "Overview", slug: "architecture/overview" },
            { label: "Domain Model", slug: "architecture/domain-model" },
            { label: "Technology Stack", slug: "architecture/tech-stack" },
          ],
        },
        {
          label: "Deployment",
          items: [
            { label: "Docker", slug: "deployment/docker" },
            { label: "Kubernetes", slug: "deployment/kubernetes" },
            { label: "ArgoCD", slug: "deployment/argocd" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Configuration", slug: "guides/configuration" },
            { label: "Contributing", slug: "guides/contributing" },
          ],
        },
      ],
    }),
  ],
});
