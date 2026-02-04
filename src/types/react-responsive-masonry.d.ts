declare module 'react-responsive-masonry' {
    import * as React from 'react';

    export interface MasonryProps {
        children: React.ReactNode;
        gutter?: string;
        columnsCount?: number;
        className?: string;
        style?: React.CSSProperties;
    }

    export default class Masonry extends React.Component<MasonryProps> { }

    export interface ResponsiveMasonryProps {
        children: React.ReactNode;
        columnsCountBreakPoints?: { [key: number]: number };
        className?: string;
        style?: React.CSSProperties;
    }

    export class ResponsiveMasonry extends React.Component<ResponsiveMasonryProps> { }
}
