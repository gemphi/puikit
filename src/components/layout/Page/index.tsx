import React from 'react';
import { cn } from '../../../utils/cn';
import { Box } from '../../layout/Box';
import { Section } from '../../layout/Section';
import { Stack, type StackProps } from '../../layout/Stack';
import styles from './styles.module.scss';

type PageSectionProps = Omit<React.ComponentProps<typeof Section>, 'as' | 'children'>;

export type PageProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'align'> & {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  direction?: StackProps['direction'];
  gap?: StackProps['gap'];
  mainProps?: PageSectionProps;
  /**
   * How wide the page runs. `full` (default) fills the screen beside the sidebar; `feed` is one centred column, a feed
   * and its slim side column (a social feed reads best narrow, never edge to edge); `reading` is a centred column for
   * long text. The widths are tokens (--pui-page-feed, --pui-page-reading), so an app or look can retune them.
   */
  width?: 'full' | 'feed' | 'reading';
  className?: string;
  children?: React.ReactNode;
};

export const Page = ({ header, sidebar, footer, direction = 'row', gap = 2, mainProps, width = 'full', className = '', children, ...props }: PageProps) => {
  const { className: mainClassName, ...mainSectionProps } = mainProps ?? {};

  return (
    <Stack direction={direction} gap={gap} className={cn('pui-page', styles.page, width === 'feed' && styles.feedWidth, width === 'reading' && styles.readingWidth, className)} data-width={width} {...props}>
      {/* `Box`, not `Section`: Section sets `width: 100%`, which inside this flex
          row resolves against the whole page and pushes the content column
          off-screen. The rail must size to its own content. */}
      {/* A plain wrapper, not an `<aside>`: the rail it holds is itself an
          `<aside>`, and two nested complementary landmarks confuse a screen
          reader about where the navigation actually is. */}
      {sidebar && <Box className={styles.sidebarWrapper}>{sidebar}</Box>}
      <Stack direction="column" className={cn('pui-page-content', styles.contentWrapper)}>
        {header && <Section as="header" className={styles.header}>{header}</Section>}
        <Section as="main" {...mainSectionProps} className={cn(styles.main, mainClassName)}>{children}</Section>
        {footer && <Section as="footer" className={styles.footer}>{footer}</Section>}
      </Stack>
    </Stack>
  );
};
