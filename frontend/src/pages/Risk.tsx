// frontend/src/pages/Risk.tsx

import React, { useState } from "react";
import {
  askRiskAgent,
  RiskAgentResponse,
  RiskItem,
} from "@/services/riskAgent";

const RiskPage: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: later, pull this from selected project or URL
  const projectId: string | undefined = undefined;

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis("");
    setRisks([]);

    try {
      const result: RiskAgentResponse = await askRiskAgent({
        question,
        projectId,
      });

      setAnalysis(result.analysis_markdown || "");
      setRisks(result.risks || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Risk agent request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Pipeline Risk Agent</h1>

      <p className="text-sm text-gray-600 mb-4">
        Ask a risk question about this project. The agent will generate a
        narrative analysis and a structured risk register.
      </p>

      <label className="block text-sm font-medium mb-2">Question</label>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={4}
        className="w-full border rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Example: List the top 10 construction and schedule risks for the VA Cincinnati MICU/SICU renovation..."
      />

      <button
        onClick={handleAsk}
        disabled={loading || !question.trim()}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-black text-white disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask Risk Agent"}
      </button>

      {error && (
        <div className="mt-4 text-sm text-red-600 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Narrative analysis */}
      {analysis && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Analysis</h2>
          <div className="text-sm whitespace-pre-wrap">{analysis}</div>
        </div>
      )}

      {/* Structured risk table */}
      {risks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Risk Register</h2>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">ID</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Title</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Likelihood
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Impact</th>
                  <th className="px-3 py-2 text-left font-semibold">Phase</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Mitigation
                  </th>
                </tr>
              </thead>
              <tbody>
                {risks.map((risk) => (
                  <tr key={risk.id} className="border-t align-top">
                    <td className="px-3 py-2 whitespace-nowrap">{risk.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {risk.category}
                    </td>
                    <td className="px-3 py-2 min-w-[180px]">{risk.title}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {risk.likelihood}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {risk.impact}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {risk.phase}
                    </td>
                    <td className="px-3 py-2 min-w-[220px]">
                      {risk.mitigation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskPage;
