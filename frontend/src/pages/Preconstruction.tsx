import { useNavigate } from 'react-router-dom';
import { ModulePlaceholder } from './ModulePlaceholder';

export function Preconstruction() {
  const navigate = useNavigate();
  return (
    <ModulePlaceholder
      moduleName="Preconstruction"
      description="Complete preconstruction management including estimating, pursuits, bid management, and proposals."
      features={[
        "Opportunity Tracking",
        "Cost Estimating",
        "Bid Management",
        "Subcontractor Prequalification",
        "Proposal Generation",
        "Risk Assessment",
        "AI-Driven Apps Intelligence",
      ]}
      extraActions={[
        {
          label: "Top 11 AI Preconstruction Apps",
          onClick: () => navigate('/preconstruction/ai-apps'),
        },
      ]}
    />
  );
}
