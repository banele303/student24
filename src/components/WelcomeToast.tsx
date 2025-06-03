"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

export default function WelcomeToast() {
  useEffect(() => {
    // Show welcome toast when component mounts
    const toastId = toast(
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1">
          <p className="font-medium text-white">Welcome to our updated site</p>
        </div>
        <button 
          onClick={() => toast.dismiss(toastId)} 
          className="p-1 rounded-full hover:bg-blue-600/20 transition-colors"
        >
          <X size={18} className="text-white" />
        </button>
      </div>,
      {
        position: "top-center",
        duration: 60000, // 1 minute
        className: "bg-blue-500 border border-blue-600 shadow-lg",
        style: {
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          maxWidth: "400px",
          margin: "0 auto",
        },
      }
    );

    // Cleanup function to dismiss toast if component unmounts
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  return null; // This component doesn't render anything
}
