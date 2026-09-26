import React from 'react';
import { Box } from '@pui/components';
import s from './code.module.scss';

/**
 * A code sample. It scrolls inside its own box rather than widening the page,
 * and takes its surface from the tokens like everything else.
 */
export const Code: React.FC<{ children: string }> = ({ children }) => (
  <Box as="pre" className={s.code}>
    <code>{children}</code>
  </Box>
);
