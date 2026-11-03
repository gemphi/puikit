import React from 'react';
import { Box, Button, Image, Tag } from '@pui/components';
import { useCart } from '../cart';
import k from '@phi-kit/kit.module.scss';
import s from '../app.module.scss';
import { img, owned, usd, type DB } from '../data';
import type { Open } from '../panels';

/** Laura's Spark: collections → look tiles. Tile background = the look's own colour, same as its viewer. */
export const Shop: React.FC<{ db: DB; onOpen: (o: Open) => void }> = ({ db, onOpen }) => {
  const mine = owned();
  const { cart, offers } = useCart();
  const pend = offers.filter((o) => o.status === 'pending').length;
  return (
    <>
      <Box className={k.row} style={{ justifyContent: 'space-between' }}>
        <Box as="header"><Box as="h1" className={k.title}>{db.ls.store.name}</Box><Box as="p" className={k.sub}>{db.ls.store.tagline}</Box></Box>
        <Box className={k.row}>{pend ? <Tag minimal round>{pend} offer{pend === 1 ? '' : 's'} pending</Tag> : null}<Button variant="outline" onClick={() => onOpen({ kind: 'cart', id: '' })}>Cart · {cart.length}</Button></Box>
      </Box>
      {db.ls.collections.map((col) => (
        <Box as="section" key={col.id} className={k.block}>
          <Box as="h2" className={k.blockTitle}>{col.name} <Box as="span" className={k.small}>· {col.season}</Box></Box>
          <Box as="p" className={k.body} style={{ maxWidth: '60ch' }}>{col.desc}</Box>
          <Box className={k.grid}>
            {col.lookIds.map((id) => db.ls.looks.find((l) => l.id === id)).filter(Boolean).map((l) => (
              <Box as="article" key={l!.id} className={k.card + ' ' + k.cardBtn} role="button" tabIndex={0} onClick={() => onOpen({ kind: 'look', id: l!.id })} onKeyDown={(e) => e.key === 'Enter' && onOpen({ kind: 'look', id: l!.id })}>
                <Box className={s.look} style={{ background: 'color-mix(in oklch, ' + l!.hex + ' 22%, var(--phi-color-background))' }}>
                  <Image className={s.lookImg} src={img(l!.views.FRONT)} alt={l!.name} loading="lazy" />
                </Box>
                <Box className={k.row}><Tag minimal round>{l!.rarity}</Tag>{mine[l!.id] ? <Tag intent="success" minimal round>Owned</Tag> : null}</Box>
                <Box as="h3" className={k.cardTitle}>{l!.name}</Box>
                <Box as="span" className={k.small}>{usd(l!.usd)} · {l!.minted}/{l!.edition} minted</Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
};
