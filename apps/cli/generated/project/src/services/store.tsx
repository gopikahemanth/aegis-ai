import React from "react";

export function store(props: any) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
      <div className="text-xs text-slate-400 font-mono mb-1">src/services/store.tsx</div>
      {props?.children || props?.title || "store"}
    </div>
  );
}

export default store;
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});