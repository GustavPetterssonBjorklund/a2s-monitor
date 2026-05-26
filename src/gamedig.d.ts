declare module 'gamedig' {
	type GameDigQueryOptions = {
		type: string;
		host: string;
		port?: number;
		givenPortOnly?: boolean;
		socketTimeout?: number;
		attemptTimeout?: number;
		requestPlayers?: boolean;
		requestRules?: boolean;
	};

	type GameDigQueryState = {
		name?: string;
		map?: string;
		game?: string;
		numplayers?: number;
		maxplayers?: number;
		raw?: {
			game?: string;
		};
	};

	export class GameDig {
		query(options: GameDigQueryOptions): Promise<GameDigQueryState>;
		static query(options: GameDigQueryOptions): Promise<GameDigQueryState>;
	}
}
