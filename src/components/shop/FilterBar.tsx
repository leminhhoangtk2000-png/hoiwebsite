'use client'

import { ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";

interface FilterBarProps {
    categories: string[];
    onCategoryChange: (category: string) => void;
    selectedCategory: string;
}

export function FilterBar({ categories, onCategoryChange, selectedCategory }: FilterBarProps) {
    return (
        <div className="sticky top-0 z-40 bg-[#FFFDF5]/95 backdrop-blur-sm border-b border-[#990000]/10 px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300">
            <div className="flex items-center gap-6 md:gap-12 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold uppercase tracking-widest text-[#990000] shrink-0">Filters:</span>

                <FilterDropdown
                    label="Category"
                    options={['All', ...categories]}
                    onSelect={onCategoryChange}
                    selected={selectedCategory}
                />
                {/* Size and Color filters removed as per request */}
            </div>

        </div>
    );
}

function FilterDropdown({ label, options, onSelect, selected }: { label: string, options: string[], onSelect: (val: string) => void, selected: string }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-2 text-xs text-[#990000]/70 hover:text-[#990000] uppercase tracking-widest outline-none transition-colors shrink-0">
                {selected !== 'All' ? `${label}: ${selected}` : label} <ChevronDown className="w-3 h-3 opacity-50" />
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[160px] bg-[#FFFDF5] border border-[#990000]/10 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                    align="start"
                    sideOffset={8}
                >
                    {options.map((option) => (
                        <DropdownMenu.Item
                            key={option}
                            className="text-xs px-4 py-2 outline-none cursor-pointer hover:bg-[#FFB800]/10 focus:bg-[#FFB800]/10 transition-colors uppercase tracking-wide text-[#333333] focus:text-[#990000]"
                            onSelect={() => onSelect(option)}
                        >
                            {option}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
