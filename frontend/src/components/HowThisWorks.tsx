const steps = [
  {
    number: 1,
    title: "You enter a medication name",
    description: "Type in any medication or treatment you're curious about. The system uses it as a search query to find relevant information from two different types of sources.",
  },
  {
    number: 2,
    title: "We search two worlds simultaneously",
    description: "The system performs two parallel searches using Exa, a specialized AI search engine:",
    items: [
      "Academic/Research: Peer-reviewed papers, clinical trials, medical journals, and research databases",
      "Social/Real-world: Forums, patient communities, reviews, and personal experiences",
    ],
  },
  {
    number: 3,
    title: "AI analyzes and compares the findings",
    description: "The gathered information is sent to a large language model (LLM) which performs two key analyses:",
    items: [
      "Summary Generation: Creates a plain-language overview explaining what the research says versus what patients report",
      "Comparison Matrix: Identifies specific aspects (efficacy, side effects, cost, etc.) and scores how well research aligns with real-world experience",
    ],
  },
  {
    number: 4,
    title: "You see the results",
    description: "The final output includes:",
    items: [
      "Overall Alignment Score: A percentage showing how closely research matches reality",
      "Comparison Matrix: Detailed breakdowns of each aspect with academic vs. real-world perspectives",
      "Deep Dive option: Click any row to get deeper analysis on specific aspects",
      "Source links: All the research and social sources used, so you can verify information yourself",
    ],
  },
];

const dataSources = [
  {
    name: "Exa Search",
    description: "AI-powered search engine that finds relevant academic papers and social content",
  },
  {
    name: "Large Language Model",
    description: "AI model that analyzes the collected information and generates summaries and comparisons",
  },
  {
    name: "SQLite Database",
    description: "Your search history is stored locally for future reference",
  },
];

export default function HowThisWorks() {

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-3">How This Works</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          A step-by-step breakdown of how we compare clinical research to real-world experiences
        </p>
      </div>

      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/10 text-green-600 flex items-center justify-center font-bold text-lg">
              {step.number}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600 mb-3">{step.description}</p>
              {step.items && (
                <ul className="space-y-2">
                  {step.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="text-green-600 mt-1.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">What powers this?</h3>
        <div className="grid gap-4">
          {dataSources.map((source) => (
            <div key={source.name} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
              <div>
                <span className="font-medium text-slate-700">{source.name}</span>
                <span className="text-slate-500"> — {source.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> This tool is for informational purposes only. 
          The AI-generated content should not replace professional medical advice. 
          Always consult healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
}