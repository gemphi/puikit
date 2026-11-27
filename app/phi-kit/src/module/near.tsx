import React from 'react';
import { Button, Stack, Tag, Text } from '@pui/components';
import type { NearConnector } from '@hot-labs/near-connect';
import { registerModule, type ModuleProps } from './index';
import near from '../near.json';
import words from '../words.json';

/**
 * NEAR sign-in and the EGG balance, as a block (`{ "kind": "near" }`; `network` picks one, else near.json's).
 * Signing in goes through NEAR Connect (@hot-labs/near-connect, what NEAR's docs name now that Wallet Selector is
 * archived) and asks for no key: it reads the account, nothing more. The balance is a view call on the RPC, so it
 * needs no signature. Nothing here sends a transaction, signs a message or creates an account.
 *
 * The wallet package lives in the one host (app/phi), so the host registers this module (src/main.tsx) and an app
 * with its own build never has to resolve it.
 */
type Net = 'testnet' | 'mainnet';
const W = words.near;
const say = (w: string, slots: Record<string, string>) => w.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? '');

/** One connector per network for the page: the wallet picker, and the account it remembers between visits. */
const connectors: Partial<Record<Net, Promise<NearConnector>>> = {};
const connectorFor = (network: Net) => (connectors[network] ??= import('@hot-labs/near-connect')
  .then((m) => new m.NearConnector({ network, features: { signInWithoutAddKey: true } })));

/** A read-only contract call over RPC (`call_function`): the answer, parsed. */
const view = async <T,>(rpc: string, contract: string, method: string, args: Record<string, unknown>): Promise<T> => {
  const r = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    jsonrpc: '2.0', id: 'phi', method: 'query',
    params: { request_type: 'call_function', finality: 'final', account_id: contract, method_name: method, args_base64: btoa(JSON.stringify(args)) },
  }) }).then((x) => x.json());
  if (!r.result?.result) throw new Error(r.error?.cause?.name ?? 'No answer');
  return JSON.parse(new TextDecoder().decode(new Uint8Array(r.result.result))) as T;
};

/** A token amount in its smallest units as whole tokens, grouped (100,000,000,000,000). */
const whole = (units: string, decimals: number) => (BigInt(units) / 10n ** BigInt(decimals)).toLocaleString('en-US');

export const Near: React.FC<ModuleProps> = ({ b }) => {
  const network = ((b.network as string) ?? near.network) as Net;
  const { rpc, explorer } = near.net[network];
  const contract = near.token[network];
  const symbol = near.token.symbol;
  const [account, setAccount] = React.useState('');
  const [balance, setBalance] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  // The account the wallet remembers, and every sign-in and sign-out after.
  React.useEffect(() => {
    let live = true;
    const signedIn = (t: { accounts: { accountId: string }[] }) => { if (live) setAccount(t.accounts[0]?.accountId ?? ''); };
    const signedOut = () => { if (live) setAccount(''); };
    const c = connectorFor(network);
    void c.then((x) => {
      x.on('wallet:signIn', signedIn); x.on('wallet:signOut', signedOut);
      return x.getConnectedWallet().then(signedIn, () => undefined);
    });
    return () => { live = false; void c.then((x) => { x.off('wallet:signIn', signedIn); x.off('wallet:signOut', signedOut); }); };
  }, [network]);

  // EGG held by the account, once there is a contract to ask.
  React.useEffect(() => {
    setBalance('');
    if (!account || !contract) return;
    let live = true;
    Promise.all([view<{ decimals: number }>(rpc, contract, 'ft_metadata', {}), view<string>(rpc, contract, 'ft_balance_of', { account_id: account })])
      .then(([m, units]) => { if (live) setBalance(whole(units, m.decimals)); }, () => undefined);
    return () => { live = false; };
  }, [account, contract, rpc]);

  const connect = () => {
    setBusy(true); setError('');
    connectorFor(network).then((c) => c.connect()).then((w) => w.getAccounts()).then((a) => setAccount(a[0]?.accountId ?? ''))
      // Closing the picker is a choice, not a failure ("User rejected"): it says nothing.
      .catch((e: Error) => { if (!/rejected/i.test(e?.message ?? '')) setError(W.failed); }).finally(() => setBusy(false));
  };
  const disconnect = () => { void connectorFor(network).then((c) => c.disconnect()).then(() => setAccount('')); };

  return (
    <Stack direction="column" gap={3} surface="card" maxWidth="520px">
      <Stack direction="row" gap={2} align="center" wrap>
        <Tag minimal round size="sm">{say(W.network, { network })}</Tag>
        {account ? <Text as="span" size="sm" weight="medium">{say(W.signed, { account })}</Text> : null}
      </Stack>
      {account ? (
        <Stack direction="column" gap={1}>
          <Text as="span" size="xs" intent="muted">{say(W.balance, { symbol })}</Text>
          {contract
            ? <Text as="span" font="heading" size="3xl" lineHeight={1}>{balance || W.reading}</Text>
            : <Text as="span" size="sm" intent="secondary">{say(W.none, { symbol })}</Text>}
        </Stack>
      ) : null}
      <Stack direction="row" gap={2} align="center" wrap>
        {account
          ? <><Button variant="glass" href={explorer + account}>{W.explore}</Button><Button variant="ghost" onClick={disconnect}>{W.disconnect}</Button></>
          : <Button variant="glass" onClick={connect} disabled={busy}>{busy ? W.connecting : W.connect}</Button>}
      </Stack>
      <Text as="span" size="xs" intent="muted">{W.note}</Text>
      {error ? <Text as="span" size="sm" intent="danger" role="status">{error}</Text> : null}
    </Stack>
  );
};

registerModule('near', Near);
