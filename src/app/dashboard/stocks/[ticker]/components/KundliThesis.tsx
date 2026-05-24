"use client";

import React from "react";

interface KundliThesisProps {
  reasoning: string;
}

const parseBoldText = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-white">{part}</strong>;
    }
    return part;
  });
};

const renderMarkdownReasoning = (text: string) => {
  if (!text) return null;
  
  const lines = text.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={index} className="text-sm font-bold text-white mt-5 mb-2 border-l-2 border-electric-500 pl-3">
          {trimmed.replace("### ", "").replace(/\*\*/g, "")}
        </h3>
      );
    }
    if (trimmed.startsWith("#### ")) {
      return (
        <h4 key={index} className="text-xs font-semibold text-electric-400 mt-4 mb-1 pl-3">
          {trimmed.replace("#### ", "").replace(/\*\*/g, "")}
        </h4>
      );
    }
    
    // Bullet points
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const cleanContent = trimmed.substring(2);
      return (
        <li key={index} className="text-xs text-gray-300 ml-4 list-disc mb-1 leading-relaxed">
          {parseBoldText(cleanContent)}
        </li>
      );
    }
    
    // Empty lines
    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }
    
    // Regular paragraphs
    return (
      <p key={index} className="text-xs text-gray-400 leading-relaxed mb-2">
        {parseBoldText(trimmed)}
      </p>
    );
  });
};

export default function KundliThesis({ reasoning }: KundliThesisProps) {
  return (
    <div className="glass-card p-6 relative">
      <h4 className="text-sm font-bold text-white mb-6 border-b border-white/5 pb-3 uppercase tracking-wide">
        AI Detailed Fundamental Thesis & Reasoning
      </h4>
      <div className="space-y-4 pr-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {renderMarkdownReasoning(reasoning)}
      </div>
    </div>
  );
}
