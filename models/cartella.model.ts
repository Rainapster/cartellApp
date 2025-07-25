import { Merce } from './merce.model';
import { Rate } from './rate.model';

export interface Cartella {
  _id?: string;
  nome: string;
  cognome: string;
  numeroCliente: number;
  tipoVia?: string;
  nomeVia?: string;
  numeroVia?: number;
  merce: Merce[];
  rate: Rate[];
  isPreventivo?: boolean;
}
