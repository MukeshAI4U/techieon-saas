cd ~/techieon-saas

cat << 'EOF' > frontend/src/app/page.tsx
"use client";

import { useState } from "react";

interface Lead {
  name: string;
  phone: string;
  address: string;
  category: string;
  rating: number | string;
}

interface Stats {
  found: number;
  checked: number;
  pages: number;
}

export default function Dashboard() {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    setStats(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/api/leads/search`, {
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
      alert("Failed to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (results.length === 0) return;

    const headers = ["Business Name", "Phone Number", "Address", "Category", "Rating", "Website"];
    
    const rows = results.map((lead: Lead) => [
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.phone}"`,
      `"${lead.address.replace(/"/g, '""')}"`,
      `"${lead.category}"`,
      lead.rating,
      "No"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

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
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Find New Leads (No Website)</h2>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business Category</label>
              <input 
                type="text" 
                placeholder="e.g. Plumber, Dentist" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-lg h-[46px] min-w-[160px]"
            >
              {loading ? "Scanning..." : "Find Leads"}
            </button>
          </form>
        </div>

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
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Lead Database</h3>
            {results.length > 0 && (
              <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-md text-sm">
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
                </tr>
              </thead>
              <tbody>
                {results.length > 0 ? (
                  results.map((lead, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-6 py-4 font-medium">{lead.name}</td>
                      <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{lead.address}</td>
                      <td className="px-6 py-4">⭐ {lead.rating}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      {loading ? "Scanning..." : "No leads found yet."}
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
EOF