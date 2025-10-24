// src/components/EditUserRoles.jsx
import { useState, useEffect } from "react";
import { updateUserRoles } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UserContext";

export default function EditUserRoles({ user, closeModal }) {
  const { token } = useAuth();
  const { fetchUsers } = useUsers();
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(user.roles.map((r) => r.id));
  const [loading, setLoading] = useState(false);

  // Fetch all available roles
  useEffect(() => {
    const fetchRoles = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoles(data);
    };
    fetchRoles();
  }, [token]);

  const handleSubmit = async () => {
    setLoading(true);
    await updateUserRoles(user.id, selectedRoles, token);
    await fetchUsers();
    setLoading(false);
    closeModal();
  };

  const toggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-lg font-bold mb-4">Edit Roles - {user.name}</h2>

        <div className="mb-4">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.id)}
                onChange={() => toggleRole(role.id)}
                className="mr-2"
              />
              {role.name}
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            className="px-4 py-2 mr-2 bg-gray-300 rounded"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
