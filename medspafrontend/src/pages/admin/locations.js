"use client";

import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        setError("Unable to load locations. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user]);

  if (loading) return <p>Loading locations...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Locations</h1>
      {locations.length === 0 ? (
        <p>No locations found.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>ZIP</th>
              <th>Timezone</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td>{loc.id}</td>
                <td>{loc.name}</td>
                <td>{loc.address}</td>
                <td>{loc.city}</td>
                <td>{loc.state}</td>
                <td>{loc.zip}</td>
                <td>{loc.timezone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
