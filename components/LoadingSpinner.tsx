import React from "react";

const LoadingSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}> = ({ size = "md", fullScreen = false }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-4",
  } as const;

  const spinner = (
    <div
      className={`${sizes[size]} border-slate-900 border-t-transparent rounded-full animate-spin`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default LoadingSpinner;
