import React from 'react';

export interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    children?: Category[];
}

interface CategoryDropdownProps {
    categories: Category[];
    onCategoryClick: (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => void;
}

export default function CategoryDropdown({ categories, onCategoryClick }: CategoryDropdownProps) {
    // 1. Flatten the tree: [Parent A, Child A1, Child A2, Parent B, ...]
    // Sort parents alphabetically
    const flattenedCategories = categories
        .filter(c => !c.parent_id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .flatMap(parent => {
            // Find children for this parent and sort them
            const children = categories
                .filter(c => c.parent_id === parent.id)
                .sort((a, b) => a.name.localeCompare(b.name));

            // Return [Parent, ...Children]
            return [parent, ...children];
        });

    if (flattenedCategories.length === 0) return null;

    return (
        // Theme: Yellow BG (#FFB800), Red Text (#990000)
        <div className="p-6 bg-[#FFB800] shadow-xl rounded-b-sm border-t border-[#990000]/20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-rows-3 grid-flow-col gap-x-12 gap-y-3 w-max max-w-[90vw] overflow-x-auto">
                {flattenedCategories.map((cat) => (
                    <a
                        key={cat.id}
                        href="#"
                        onClick={(e) => onCategoryClick(e, cat.name)} // Pass Name instead of Slug for simpler filtering
                        className={`
              block text-sm transition-colors truncate
              ${!cat.parent_id
                                ? 'font-bold text-[#990000] uppercase tracking-wide hover:text-white'
                                : 'text-[#990000] pl-[10px] font-normal hover:text-white hover:underline'
                            }
            `}
                        title={cat.name}
                    >
                        {cat.name}
                    </a>
                ))}
            </div>
        </div>
    );
}
