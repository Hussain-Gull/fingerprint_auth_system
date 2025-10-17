import React from "react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  variant = "spinner",
  size = "md",
  className,
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const renderSpinner = () => (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  );

  const renderDots = () => (
    <div className={cn("flex space-x-1", className)}>
      <div
        className={cn(
          "animate-bounce rounded-full bg-primary",
          size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3"
        )}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn(
          "animate-bounce rounded-full bg-primary",
          size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3"
        )}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn(
          "animate-bounce rounded-full bg-primary",
          size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3"
        )}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        "animate-pulse rounded-full bg-primary/20",
        sizeClasses[size],
        className
      )}
    />
  );

  const renderSkeleton = () => (
    <div className={cn("animate-pulse", className)}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {renderLoadingContent()}
      {text && (
        <p className={cn("text-gray-600 font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Predefined loading components for common use cases
export const PageLoading: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex items-center justify-center h-64">
    <Loading variant="spinner" size="lg" text={text} />
  </div>
);

export const CardLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center h-32">
    <Loading variant="spinner" size="md" text={text} />
  </div>
);

export const ButtonLoading: React.FC<{ text?: string }> = ({ text }) => (
  <Loading variant="spinner" size="sm" text={text} />
);

export const TableLoading: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 p-6", className)}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="animate-pulse">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded w-1/4"></div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded w-1/4"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Loading;
