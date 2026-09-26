'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { TreeNode } from './types';
import styles from './styles.module.scss';

export interface TreeNodeItemProps {
  node: TreeNode;
  path: number[];
  depth: number;
  onNodeClick?: (node: TreeNode, nodePath: number[]) => void;
  onNodeCollapse?: (node: TreeNode, nodePath: number[]) => void;
  onNodeExpand?: (node: TreeNode, nodePath: number[]) => void;
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  path,
  depth,
  onNodeClick,
  onNodeCollapse,
  onNodeExpand,
}) => {
  const hasChildren = Boolean(node.childNodes && node.childNodes.length > 0);
  const [expanded, setExpanded] = useState<boolean>(node.isExpanded ?? true);

  const handleCaretClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasChildren) return;
    const next = !expanded;
    setExpanded(next);
    if (next) {
      onNodeExpand?.(node, path);
    } else {
      onNodeCollapse?.(node, path);
    }
  };

  return (
    <li className={cn(styles.treeItem, node.isDisabled && styles.disabled)}>
      <Box
        className={cn(styles.treeRow, node.isSelected && styles.selected, node.isDisabled && styles.disabledRow)}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => !node.isDisabled && onNodeClick?.(node, path)}
      >
        <span className={styles.treeCaret} onClick={handleCaretClick}>
          {hasChildren ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className={styles.caretSpacer} />
          )}
        </span>
        <span className={styles.treeIcon}>
          {node.icon ? node.icon : hasChildren ? <Folder size={15} className={styles.folderIcon} /> : <File size={14} className={styles.fileIcon} />}
        </span>
        <span className={styles.treeLabel}>{node.label}</span>
        {node.secondaryLabel && <span className={styles.treeSecondaryLabel}>{node.secondaryLabel}</span>}
      </Box>

      {hasChildren && expanded && (
        <ul className={styles.treeSublist}>
          {node.childNodes!.map((child, idx) => (
            <TreeNodeItem
              key={child.id ?? idx}
              node={child}
              path={[...path, idx]}
              depth={depth + 1}
              onNodeClick={onNodeClick}
              onNodeCollapse={onNodeCollapse}
              onNodeExpand={onNodeExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
