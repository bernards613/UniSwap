import { useState, useEffect } from "react";

export default function PurchaseHistory({ token }) {
  const [purchases, setPurchases] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPurchases() {
      try {
        const res = await fetch("http://localhost:8000/transactions/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Purchase history fetch failed:", await res.text());
          setPurchases([]); 
          setLoading(false);
          return;
        }

        const data = await res.json();
        setPurchases(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    loadPurchases();
  }, [token]);

  if (loading) return <p>Loading...</p>;

  if (!purchases || purchases.length === 0)
    return <p>You haven't purchased anything yet.</p>;

  return (
    <div className="listings-container">
      <h2>Purchase History</h2>
      {purchases.map((item) => (
        <div key={item.itemid} className="listing-card">
          <img src={item.photo} alt="" />
          <p>{item.description}</p>
          <p>${item.price}</p>
        </div>
      ))}
    </div>
  );
}