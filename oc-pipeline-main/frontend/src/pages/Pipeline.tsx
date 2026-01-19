import { ModulePlaceholder } from './ModulePlaceholder';

export function Pipeline() {
  return (
    <ModulePlaceholder
      moduleName="Pipeline"
      description="Sales pipeline and opportunity management for federal contracts."
      features={[
        "Opportunity Tracking",
        "SAM.gov Integration",
        "Win Probability",
        "Pursuit Timeline",
        "Teaming Partners",
        "Go/No-Go Analysis"
      ]}
    />
  );
}
