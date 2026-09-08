import './styles/global.css';
import { WonderlandsRuntime, installRuntime } from './application/runtime/runtimeBridge';
import { startDevelopmentHarness } from './app/startDevelopmentHarness';
import { startWonderlands } from './app/startWonderlands';

installRuntime(new WonderlandsRuntime());
const game = startWonderlands('game-root');
startDevelopmentHarness(game);
