// src/components/dashboard/KPICards.tsx
import React from "react";

export type TrendType = "up" | "down" | "neutral";

export interface KPICardsProps {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  budget: number;
  budget_change?: number;
  budget_trend?: TrendType;
  revenue: number;
  revenue_change?: number;
  revenue_trend?: TrendType;
  profit: number;
  profit_change?: number;
  profit_trend?: TrendType;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalProjects,
  activeProjects,
  completedProjects,
  budget,
  budget_change,
  budget_trend,
  revenue,
  revenue_change,
  revenue_trend,
  profit,
  profit_change,
  profit_trend,
}) => {
  const renderTrend = (trend?: TrendType) => {
    if (!trend) return null;
    if (trend === "up")
      return <span className="text-green-600 ml-1">▲</span>;
    if (trend === "down")
      return <span className="text-red-600 ml-1">▼</span>;
    return <span className="text-gray-400 ml-1">–</span>;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Projects */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-sm text-gray-500">Total Projects</h3>
        <p className="text-2xl font-semibold text-gray-800">{totalProjects}</p>
      </div>

      {/* Active Projects */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-sm text-gray-500">Active Projects</h3>
        <p className="text-2xl font-semibold text-gray-800">{activeProjects}</p>
      </div>

      {/* Completed Projects */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-sm text-gray-500">Completed Projects</h3>
        <p className="text-2xl font-semibold text-gray-800">{completedProjects}</p>
      </div>

      {/* Budget */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-sm text-gray-500">Budget</h3>
        <p className="text-2xl font-semibold text-gray-800">${budget.toLocaleString()}</p>
        {budget_change !== undefined && (
          <p
            className={`text-sm ${
              budget_change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {budget_change}% {renderTrend(budget_trend)}
          </p>
        )}
      </div>

      {/* Revenue */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-sm text-gray-500">Revenue</h3>
        <p className="text-2xl font-semibold text-gray-800">${revenue.toLocaleString()}</p>
        {revenue_change !== undefined && (
          <p
            className={`text-sm ${
              revenue_change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {revenue_change}% {renderTrend(revenue_trend)}
          </p>
        )}
      </div>

      {/* Profit */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-sm text-gray-500">Profit</h3>
        <p className="text-2xl font-semibold text-gray-800">${profit.toLocaleString()}</p>
        {profit_change !== undefined && (
          <p
            className={`text-sm ${
              profit_change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {profit_change}% {renderTrend(profit_trend)}
          </p>
        )}
      </div>
    </div>
  );
};

export default KPICards;
