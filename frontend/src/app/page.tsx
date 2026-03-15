"use client";

import { useState } from "react";

export default function Dashboard() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    setStats(null);

    try {
      const response = await fetch(${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/leads/search` `, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, city }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.leads);
        setStats({
          found: data.leadsFound,
          checked: data.totalPlacesChecked,
          pages: data.pagesChecked
        });
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to connect to the backend server. Is it running on port 5001?");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW FEATURE: Download CSV ---
  const downloadCSV = () => {
    if (results.length === 0) return;

    // 1. Create CSV Headers
    const headers = ["Business Name", "Phone Number", "Address", "Category", "Rating", "Website"];
    
    // 2. Map the data into rows
    const rows = results.map(lead => [
      `"${lead.name.replace(/"/g, '""')}"`, // Escape quotes for CSV
      `"${lead.phone}"`,
      `"${lead.address.replace(/"/g, '""')}"`,
      `"${lead.category}"`,
      lead.rating,
      "No"
    ]);

    // 3. Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // 4. Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Techieon_Leads_${category}_${city}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">T</div>
          <h1 className="text-xl font-bold text-gray-800">Techieon CRM</h1>
        </div>
        <div className="text-sm font-medium text-gray-500">AI Powered Digital Marketing</div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Search Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Find New Leads (No Website)</h2>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business Category</label>
              <input 
                type="text" 
                placeholder="e.g. Plumber, Dentist, Auto Repair" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Target City / Location</label>
              <input 
                type="text" 
                placeholder="e.g. Toronto, Canada" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-[46px] min-w-[160px]"
            >
              {loading ? "Scanning Maps..." : "Find Leads"}
            </button>
          </form>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="flex gap-4 mb-6">
            <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm flex-1">
              <div className="text-sm text-gray-500 font-medium">Leads Found</div>
              <div className="text-2xl font-bold text-green-600">{stats.found}</div>
            </div>
            <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm flex-1">
              <div className="text-sm text-gray-500 font-medium">Businesses Scanned</div>
              <div className="text-2xl font-bold text-gray-800">{stats.checked}</div>
            </div>
            <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm flex-1">
              <div className="text-sm text-gray-500 font-medium">Google Pages Checked</div>
              <div className="text-2xl font-bold text-gray-800">{stats.pages}</div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Lead Database</h3>
            
            {/* NEW EXPORT BUTTON */}
            {results.length > 0 && (
              <button 
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-md text-sm transition-all shadow-sm"
              >
                📥 Download CSV
              </button>
            )}
            
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-sm text-gray-500">
                  <th className="px-6 py-3 font-semibold">Business Name</th>
                  <th className="px-6 py-3 font-semibold">Phone Number</th>
                  <th className="px-6 py-3 font-semibold">Address</th>
                  <th className="px-6 py-3 font-semibold">Rating</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.length > 0 ? (
                  results.map((lead, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate" title={lead.address}>{lead.address}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-bold">
                          ⭐ {lead.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">New Lead</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {loading ? "Scanning Google Maps... This can take up to 20 seconds." : "No leads found yet. Try searching!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}