import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const DeviceContext = createContext(null);

function normalizeDeviceName(val) {
  if (!val) return "ACE";
  const v = val.toLowerCase().trim();
  if (v.includes("ace")) return "ACE";
  if (v.includes("mini")) return "MINI";
  if (v.includes("go")) return "GO";
  if (v.includes("fast") || v.includes("scan")) return "FAST SCAN";
  return "ACE";
}

function normalizeDeviceStatus(val) {
  const status = String(val || "Available").trim();
  if (/critical|maintenance/i.test(status)) return "Available";
  return status || "Available";
}

export function DeviceProvider({ children }) {
 const [deviceList, setDeviceList] = useState([]);
 const [loading, setLoading] = useState(true);

 const fetchDevices = async () => {
 try {
 const data = await api.devices.getAll();
 const normalized = (data || []).map(d => {
   const normName = normalizeDeviceName(d.type || d.name);
   return {
     ...d,
     name: normName,
     type: normName,
     status: normalizeDeviceStatus(d.status)
   };
 });
 setDeviceList(normalized);
 } catch (err) {
 console.error("Failed to fetch devices:", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchDevices();
 }, []);

  const addDevice = async (newDevice) => {
    try {
      const normName = normalizeDeviceName(newDevice.type || newDevice.name);
      const toCreate = {
        ...newDevice,
        name: normName,
        type: normName,
        status: normalizeDeviceStatus(newDevice.status)
      };
      const created = await api.devices.create(toCreate);
      const normalizedCreated = {
        ...created,
        name: normName,
        type: normName,
        status: normalizeDeviceStatus(created.status || toCreate.status)
      };
      setDeviceList((prev) => [normalizedCreated, ...prev]);
    } catch (err) {
      console.error("Failed to add device:", err);
    }
  };

  const updateDevice = async (id, updatedFields) => {
    try {
      const existing = deviceList.find(d => d.id === id);
      if (!existing) return;
      
      const normName = updatedFields.type || updatedFields.name 
        ? normalizeDeviceName(updatedFields.type || updatedFields.name)
        : existing.type;

      const merged = { 
        ...existing, 
        ...updatedFields,
        name: normName,
        type: normName,
        status: normalizeDeviceStatus(updatedFields.status || existing.status)
      };
      const response = await api.devices.update(id, merged);
      
      setDeviceList((prev) =>
        prev.map((d) => (d.id === id ? { 
          ...d, 
          ...response,
          name: normName,
          type: normName,
          status: normalizeDeviceStatus(response.status || merged.status)
        } : d))
      );
    } catch (err) {
      console.error("Failed to update device:", err);
    }
  };

  const deleteDevice = async (id) => {
    try {
      await api.devices.delete(id);
      setDeviceList((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete device:", err);
      throw err;
    }
  };

  const assignDevice = async (id, payload) => {
    try {
      const response = await api.devices.assign(id, payload);
      setDeviceList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...response } : d))
      );
      return response;
    } catch (err) {
      console.error("Failed to assign device:", err);
      throw err;
    }
  };

  const returnDevice = async (id, payload) => {
    try {
      const response = await api.devices.return(id, payload);
      setDeviceList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...response } : d))
      );
      return response;
    } catch (err) {
      console.error("Failed to return device:", err);
      throw err;
    }
  };

  const requestMaintenance = async (id, payload) => {
    try {
      const response = await api.devices.maintenance(id, payload);
      await fetchDevices();
      return response;
    } catch (err) {
      console.error("Failed to request maintenance:", err);
      throw err;
    }
  };

  const completeMaintenance = async (logId, payload) => {
    try {
      const response = await api.devices.completeMaintenance(logId, payload);
      await fetchDevices();
      return response;
    } catch (err) {
      console.error("Failed to complete maintenance:", err);
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      devices: deviceList,
      loading,
      addDevice,
      updateDevice,
      deleteDevice,
      assignDevice,
      returnDevice,
      requestMaintenance,
      completeMaintenance,
      refreshDevices: fetchDevices,
      setDevices: setDeviceList,
    }),
    [deviceList, loading]
  );

 return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
 const ctx = useContext(DeviceContext);
 if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
 return ctx;
}
