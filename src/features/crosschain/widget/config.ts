import { ChainKey, Token } from '../constants';
import { Shape } from '@material-ui/core/styles/shape';
import { PaletteMode, PaletteOptions } from '@mui/material';
import { TypographyOptions } from '@mui/material/styles/createTypography';
import { Signer } from 'ethers';
// import { CSSProperties } from 'react';
export declare type Appearance = PaletteMode | 'auto';

export declare type ThemeConfig = {
    palette?: Pick<PaletteOptions, 'primary' | 'secondary'>;
    shape?: Shape;
    typography?: TypographyOptions;
};
export interface WidgetWalletManagement {
    connect(): Promise<Signer>;
    disconnect(): Promise<void>;
    switchChain?(chainId: number): Promise<Signer>;
    addToken?(token: Token, chainId: number): Promise<void>;
    addChain?(chainId: number): Promise<boolean>;
    signer?: Signer;
}
interface WidgetConfigBase {
    fromAmount?: number;
    disabledChains?: number[];
    // containerStyle?: CSSProperties;
    theme?: ThemeConfig;
    appearance?: Appearance;
    disableAppearance?: boolean;
    disableTelemetry?: boolean;
    walletManagement?: WidgetWalletManagement;
    integrator?: string;
}
declare type WidgetFromTokenConfig = {
    fromChain: `${ChainKey}` | number;
    fromToken?: string;
} | {
    fromChain?: never;
    fromToken?: never;
};
declare type WidgetToTokenConfig = {
    toChain: `${ChainKey}` | number;
    toToken?: string;
} | {
    toChain?: never;
    toToken?: never;
};
export declare type WidgetConfig = WidgetConfigBase & WidgetFromTokenConfig & WidgetToTokenConfig;
export {};
