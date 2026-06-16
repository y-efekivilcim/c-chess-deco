export class ChessRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.W = 1200;
        this.H = 1600;
        this.PADDING_X = 220;
        this.BOARD_SIZE = this.W - (this.PADDING_X * 2);
        this.SQ = this.BOARD_SIZE / 8;
        this.TENSION = 0.30;
        this.WEIGHT = 2.0;
        this.NODE_SIZE = 3.5;

        this.THEMES = {
            walnut: { bg: '#2b1a10', grid: '#422a1b', border: '#ffffff', text: '#ffffff', whiteMove: '#00d4ff', blackMove: '#ff003c', capture: '#ffffff' },
            aegean: { bg: '#10253f', grid: '#1a3b63', border: '#ffffff', text: '#edf2f7', whiteMove: '#b83200', blackMove: '#b500ff', capture: '#ffffff' }
        };
    }

    getBoardStartY(showMoves) {
        let startY = (this.H - this.BOARD_SIZE) / 2;
        if (showMoves) startY -= 90;
        return startY;
    }

    getCoords(square, boardStartY, isFlipped) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const file = files.indexOf(square[0]);
        const rank = 8 - parseInt(square[1]);
        
        let xIndex = isFlipped ? 7 - file : file;
        let yIndex = isFlipped ? 7 - rank : rank;
        return { 
            x: this.PADDING_X + (xIndex * this.SQ) + (this.SQ / 2), 
            y: boardStartY + (yIndex * this.SQ) + (this.SQ / 2) 
        };
    }

    drawDecoBorders(palette) {
        const m1 = 50, m2 = 70, m3 = 85;
        this.ctx.strokeStyle = palette.border;
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(m1, m1, this.W - m1*2, this.H - m1*2);
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(m2, m2, this.W - m2*2, this.H - m2*2);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(m3, m3, this.W - m3*2, this.H - m3*2);

        const cornerSize = 40;
        this.ctx.fillStyle = palette.border;
        const corners = [[m1, m1], [this.W - m1 - cornerSize, m1], [m1, this.H - m1 - cornerSize], [this.W - m1 - cornerSize, this.H - m1 - cornerSize]];
        corners.forEach(([cx, cy]) => {
            this.ctx.fillRect(cx, cy, cornerSize, cornerSize);
            this.ctx.fillStyle = palette.bg;
            this.ctx.fillRect(cx + 12, cy + 12, cornerSize - 24, cornerSize - 24);
            this.ctx.fillStyle = palette.border;
        });
    }

    drawTypography(palette, boardStartY, pgnData, isFlipped) {
        let topPlayer = isFlipped ? pgnData.white : pgnData.black;
        let bottomPlayer = isFlipped ? pgnData.black : pgnData.white;
        const maxLen = 18;
        if (topPlayer.length > maxLen) topPlayer = topPlayer.substring(0, maxLen) + '...';
        if (bottomPlayer.length > maxLen) bottomPlayer = bottomPlayer.substring(0, maxLen) + '...';

        let topPrefix = "", botPrefix = "";
        if (pgnData.result === '1-0') {
            topPrefix = isFlipped ? "[W] - " : "[L] - ";
            botPrefix = isFlipped ? "[L] - " : "[W] - ";
        } else if (pgnData.result === '0-1') {
            topPrefix = isFlipped ? "[L] - " : "[W] - ";
            botPrefix = isFlipped ? "[W] - " : "[L] - ";
        } else if (pgnData.result === '1/2-1/2') {
            topPrefix = "[D] - ";
            botPrefix = "[D] - ";
        }

        const formattedTopName = (topPrefix + topPlayer).toUpperCase();
        const formattedBotName = (botPrefix + bottomPlayer).toUpperCase();

        this.ctx.fillStyle = palette.text;
        this.ctx.textAlign = 'center';
        this.ctx.font = '400 20px "Fascinate Inline"';
        this.ctx.letterSpacing = '8px';
        this.ctx.fillText(pgnData.date.replace(/\./g, ' - '), this.W / 2, boardStartY - 150);
        this.ctx.letterSpacing = '0px';
        this.ctx.font = '400 36px "Fascinate Inline"';
        const spacedTop = formattedTopName.split('').join(String.fromCharCode(8202));
        const spacedBot = formattedBotName.split('').join(String.fromCharCode(8202));
        this.ctx.fillText(spacedTop, this.W / 2, boardStartY - 90);
        this.ctx.fillText(spacedBot, this.W / 2, boardStartY + this.BOARD_SIZE + 90);
    }

    drawGameText(palette, boardStartY, moveString) {
        if (!moveString) return;
        this.ctx.fillStyle = palette.text;
        this.ctx.font = '400 16px "Josefin Sans"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        const maxWidth = this.BOARD_SIZE + 100;
        const words = moveString.split(' ');
        let line = '', y = boardStartY + this.BOARD_SIZE + 180, linesDrawn = 0;
        const maxLines = 6;

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                if (linesDrawn >= maxLines - 1) {
                    this.ctx.fillText(line + "...", this.W / 2, y);
                    return;
                }
                this.ctx.fillText(line, this.W / 2, y);
                line = words[n] + ' ';
                y += 28;
                linesDrawn++;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, this.W / 2, y);
    }

    drawBackground(theme, state, pgnData, moveString) {
        const palette = this.THEMES[theme];
        this.ctx.fillStyle = palette.bg;
        this.ctx.fillRect(0, 0, this.W, this.H);
        this.drawDecoBorders(palette);
        
        const boardStartY = this.getBoardStartY(state.showMoves);
        this.ctx.strokeStyle = palette.grid;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 0;

        for(let i=0; i<=8; i++) {
            const posX = this.PADDING_X + (i * this.SQ);
            const posY = boardStartY + (i * this.SQ);
            this.ctx.beginPath(); 
            this.ctx.moveTo(posX, boardStartY); 
            this.ctx.lineTo(posX, boardStartY + this.BOARD_SIZE); 
            this.ctx.stroke();
            
            this.ctx.beginPath(); 
            this.ctx.moveTo(this.PADDING_X, posY); 
            this.ctx.lineTo(this.PADDING_X + this.BOARD_SIZE, posY); 
            this.ctx.stroke();
        }

        if (state.showText) {
            this.drawTypography(palette, boardStartY, pgnData, state.flipSides);
        }
        if (state.showMoves) {
            this.drawGameText(palette, boardStartY, moveString);
        }
    }

    drawCurve(move, progress, theme, showMoves, isFlipped) {
        const palette = this.THEMES[theme];
        const boardStartY = this.getBoardStartY(showMoves);
        const from = this.getCoords(move.from, boardStartY, isFlipped);
        const to = this.getCoords(move.to, boardStartY, isFlipped);
        
        const isWhite = move.color === 'w';
        const baseColor = isWhite ? palette.whiteMove : palette.blackMove;
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16), g = parseInt(hex.substring(2,4), 16), b = parseInt(hex.substring(4,6), 16);
        const alpha = 0.35 + (progress * 0.65);
        const dx = to.x - from.x, dy = to.y - from.y;
        
        const cp1X = from.x + (dx * this.TENSION) - (dy * this.TENSION);
        const cp1Y = from.y + (dy * this.TENSION) + (dx * this.TENSION);
        const cp2X = to.x - (dx * this.TENSION) - (dy * this.TENSION);
        const cp2Y = to.y - (dy * this.TENSION) + (dx * this.TENSION);
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, to.x, to.y);
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 1)`;
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        this.ctx.lineWidth = this.WEIGHT * 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, to.x, to.y);
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.3})`;
        this.ctx.lineWidth = this.WEIGHT * 0.5;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        if (move.flags.includes('c') || move.san.includes('#')) {
            this.ctx.fillStyle = palette.capture;
            this.ctx.strokeStyle = palette.bg;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(to.x, to.y, this.NODE_SIZE, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }
}
