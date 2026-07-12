export interface StandardTableColumn {
    key: string;
    label: string;
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
    defaultVisible?: boolean;
    hideable?: boolean;
    resizable?: boolean;
    fixed?: 'left' | 'right';
    order?: number;
}

export interface StandardTableColumnState extends StandardTableColumn {
    visible: boolean;
    width?: number;
    order: number;
}
