import { IolError } from '../error';
import type { IolCountry, IolMarket } from '../values';
import {
  makeRequest,
  validateRequest,
  type Operation,
  type ReadRequest,
} from './allowlist';
import { parseWireJson, type Decoder } from './json';
import {
  accountState,
  instrument,
  portfolio,
  quoteDetail,
  type IolAccountState,
  type IolInstrument,
  type IolPortfolio,
  type IolQuoteDetail,
} from './models';
import type { IolTransport } from './transport';
import { payloadFailure, schemaFailure } from './schema-diagnostic';

export interface IolReadOnlyAdapter {
  getAccountState(): Promise<IolAccountState>;
  getPortfolio(country: IolCountry): Promise<IolPortfolio>;
  getInstrument(market: IolMarket, symbol: string): Promise<IolInstrument>;
  getQuoteDetail(market: IolMarket, symbol: string): Promise<IolQuoteDetail>;
}

/** Closure facade: no token, transport, raw URL or generic request on its public surface. */
export function createAdapter(transport: IolTransport): IolReadOnlyAdapter {
  async function read<T>(
    request: ReadRequest,
    decode: Decoder<T>,
    matchesRequest: (value: T) => boolean = () => true,
  ): Promise<T> {
    const operation = validateRequest(request);
    let body: string;
    try {
      body = await transport.read(request);
    } catch (error: unknown) {
      throw new IolError(
        error instanceof IolError ? error.code : 'network_failure',
      );
    }
    try {
      const value = decode(parseWireJson(body, operation), operation);
      if (!matchesRequest(value)) throw schemaFailure('malformed', operation);
      return value;
    } catch (error: unknown) {
      throw payloadFailure(error, operation);
    }
  }
  return Object.freeze({
    getAccountState: () => read(makeRequest('accountState'), accountState),
    getPortfolio: (country: IolCountry) =>
      read(
        makeRequest('portfolio', { pais: country }),
        portfolio,
        (value) => value.pais === country,
      ),
    getInstrument: (market: IolMarket, symbol: string) =>
      read(
        makeRequest('instrument', { mercado: market, simbolo: symbol }),
        instrument,
        (value) => value.mercado === market && value.simbolo === symbol,
      ),
    getQuoteDetail: (market: IolMarket, symbol: string) =>
      read(
        makeRequest('quoteDetail', { mercado: market, simbolo: symbol }),
        quoteDetail,
        (value) => value.mercado === market && value.simbolo === symbol,
      ),
  });
}

export type IolOfflineFixtures = Readonly<Partial<Record<Operation, string>>>;

export function createOfflineIolAdapter(
  fixtures: IolOfflineFixtures,
): IolReadOnlyAdapter {
  const snapshot = Object.freeze({ ...fixtures });
  return createAdapter({
    read: (request) => {
      const operation = validateRequest(request);
      const body = snapshot[operation];
      if (typeof body !== 'string')
        return Promise.reject(new IolError('offline_fixture_missing'));
      return Promise.resolve(body);
    },
  });
}
