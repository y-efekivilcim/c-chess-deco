export class GameParser {
    constructor() {
        this.pgnData = { white: "PLAYER 1", black: "PLAYER 2", date: "NEW MATCH", result: "*" };
        this.parsedHistory = [];
        this.fullMoveString = "";
    }

    parse(pgnString) {
        if (!pgnString.trim()) {
            this.pgnData = { white: "PLAYER 1", black: "PLAYER 2", date: "NEW MATCH", result: "*" };
            this.parsedHistory = [];
            this.fullMoveString = "";
            return true;
        }

        const chess = new window.Chess();
        if (!chess.load_pgn(pgnString)) {
            return false;
        }

        this.pgnData = {
            white: chess.header().White || 'White',
            black: chess.header().Black || 'Black',
            date: chess.header().Date || 'Unknown Date',
            result: chess.header().Result || '*'
        };

        const rawHistory = chess.history({ verbose: true });
        this.parsedHistory = rawHistory.filter((move, i) => {
            if (i < 12) return true;
            if (move.flags.includes('c') || move.flags.includes('e')) return true;
            if (move.san.includes('+') || move.san.includes('#')) return true;
            if (move.piece !== 'p') return true;
            return Math.random() > 0.65;
        });

        const historySan = chess.history();
        let moveString = '';
        for(let i=0; i<historySan.length; i+=2) {
            moveString += `${(i/2)+1}. ${historySan[i]} ${historySan[i+1] || ''}  `;
        }
        this.fullMoveString = moveString;

        return true;
    }
}
