import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "Gemba Management",
      description:
        "Documentation for the Gemba Management System — a shopfloor manufacturing management platform.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/jakobgabriel/gemba-management-app",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "getting-started/introduction" },
            { label: "Quick Start", slug: "getting-started/quick-start" },
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
