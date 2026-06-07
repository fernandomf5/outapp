## Goal: Revamp Dashboard UI and Detailed Analytics

The current dashboard is reported as having a weak design and insufficient analytics. The goal is to improve the design/UX and implement a detailed analytics system where users can select specific resources from a dropdown to see specialized metrics.

### Design Improvements
- Redesign the Overview tab with a more "modern/beautiful" layout.
- Use better typography, spacing, and glassmorphism effects already present in parts of the app.
- Improve the visual hierarchy of the stats cards and resource grid.

### Analytics Implementation
- Create a new `src/components/dashboard/DetailedAnalytics.tsx` component.
- This component will feature a dropdown (Select) to choose between different resources (e.g., AI Agents, Cloned Pages, Short Links, Financials, etc.).
- When a resource is selected, it will display a specialized analytics panel for that resource, reusing existing analytics logic where possible but presenting it in a unified dashboard view.
- If a resource doesn't have existing analytics logic, I will implement basic metrics (counts, creation trends).

### Technical Tasks

1.  **Create DetailedAnalytics Component**:
    - Build a "Unified Analytics" view that allows selecting a feature.
    - Features to include: Chat Online (AI Agents), Clonador, Encurtador, Financeiro, CRM, Link na Bio.
    - Integration with existing components:
        - `AgentAnalyticsPanel` (for AI Agents)
        - `AnalyticsPanel` (for Cloner)
        - `FinancialAnalyticsPanel` (for Financials)
    - Create new mini-analytics views for others (Links, Bio, etc.).

2.  **Update Dashboard.tsx**:
    - Replace the basic stats cards with the new `DetailedAnalytics` component or integrate it as a prominent section.
    - Revamp the "All Resources Grid" to look more like a professional "Apps" or "Tools" marketplace within the platform.
    - Add a "Quick Actions" bar or section.

3.  **UI Refinement**:
    - Apply consistent gradients and shadows across dashboard cards.
    - Optimize mobile responsiveness for the new analytics view.

### Proposed UI Structure for Overview:
- **Header**: Personalized greeting + quick summary.
- **Top Section**: 4-5 key KPIs with mini-charts.
- **Middle Section**: Detailed Analytics selector and viewer.
- **Bottom Section**: Resource Grid (reformatted for better UX).

---
**Technical Note**: I will ensure that the feature access checks (`hasFeature`) are respected within the analytics dropdown.
