export default function GraphLegend() {
  const languages = [
    { name: 'TypeScript', color: '#3178c6' },
    { name: 'JavaScript', color: '#f7df1e' },
    { name: 'React', color: '#61dafb' },
    { name: 'CSS', color: '#264de4' },
    { name: 'JSON', color: '#5e5c5c' },
    { name: 'Markdown', color: '#083fa1' },
    { name: 'HTML', color: '#e34c26' },
  ];

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-10 max-w-xs">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
      <div className="space-y-2">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: lang.color }}
            />
            <span className="text-xs text-gray-700">{lang.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click a node to view details
        </p>
      </div>
    </div>
  );
}
