import { startApiGateway } from './api-gateway/index';
import { startGameService } from './game-service/index';
import { startScoreboardService } from './scoreboard-service/index';
import { startTournamentService } from './tournament-service/index';

const startAll = async () => {
  startGameService();
  startScoreboardService();
  startTournamentService();
  startApiGateway();
};

startAll();
