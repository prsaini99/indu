
import { useState, useEffect } from "react";

export interface ClassFiltersProps {
  deliveryMode: "online" | "offline";
  onDeliveryModeChange: (mode: "online" | "offline") => void;
  onlineFormat: "recorded" | "live";
  onOnlineFormatChange: (format: "recorded" | "live") => void;
  offlineFormat: "inbound" | "outbound";
  onOfflineFormatChange: (format: "inbound" | "outbound") => void;
  classSize: "group" | "one-on-one";
  onClassSizeChange: (size: "group" | "one-on-one") => void;
}

const ClassFilters: React.FC<ClassFiltersProps> = ({
  deliveryMode,
  onDeliveryModeChange,
  onlineFormat,
  onOnlineFormatChange,
  offlineFormat,
  onOfflineFormatChange,
  classSize,
  onClassSizeChange
}) => {
  return (
    <div className="space-y-4">
      {/* Primary filter tabs: Online vs Offline */}
      <div className="bg-gray-50 rounded-lg inline-flex p-1 w-full">
        <button
          className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
            deliveryMode === "online" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onDeliveryModeChange("online")}
        >
          Online Classes
        </button>
        <button
          className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
            deliveryMode === "offline" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
          onClick={() => onDeliveryModeChange("offline")}
        >
          Offline Classes
        </button>
      </div>

      {/* Secondary filter tabs: based on delivery mode */}
      {deliveryMode === "online" && (
        <div className="bg-gray-50 rounded-lg inline-flex p-1 w-full">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
              onlineFormat === "recorded" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => onOnlineFormatChange("recorded")}
          >
            Recorded Classes
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
              onlineFormat === "live" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => onOnlineFormatChange("live")}
          >
            Live Classes
          </button>
        </div>
      )}

      {/* Offline format tabs */}
      {deliveryMode === "offline" && (
        <div className="bg-gray-50 rounded-lg inline-flex p-1 w-full">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
              offlineFormat === "inbound" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => onOfflineFormatChange("inbound")}
          >
            Inbound Classes
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
              offlineFormat === "outbound" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => onOfflineFormatChange("outbound")}
          >
            Outbound Classes
          </button>
        </div>
      )}

      {/* Third filter level: Group vs 1-on-1 - Only show for online classes and offline outbound */}
      {(deliveryMode === "online" || (deliveryMode === "offline" && offlineFormat === "outbound")) && (
        <div className="bg-gray-50 rounded-lg inline-flex p-1 w-full">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
              classSize === "group" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => onClassSizeChange("group")}
          >
            Group Classes
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-sm font-medium flex-1 ${
              classSize === "one-on-one" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => onClassSizeChange("one-on-one")}
          >
            1-on-1 Classes
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassFilters;
