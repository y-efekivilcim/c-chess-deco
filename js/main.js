import { GameParser } from './GameParser.js';
import { ChessRenderer } from './ChessRenderer.js';

const SAMPLES = {
    century: `[Event "Third Rosenwald Trophy"]\n[Site "New York, NY USA"]\n[Date "1956.10.17"]\n[Round "?"]\n[White "Donald Byrne"]\n[WhiteFideId "0"]\n[Black "Bobby Fischer"]\n[BlackFideId "0"]\n[Result "0-1"]\n[WhiteElo "?"]\n[BlackElo "?"]\n[ECO "D92"]\n[Opening "Gruenfeld Defence"]\n\n1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Rfe8 16. O-O Rxe7 17. Qxe7 Bxf3 18. gxf3 Nxc3 19. Qxf7+ Kh8 20. Rde1 Rf8 21. Re8 Nd5 22. Rxf8+ Bxf8 23. Qxf8# 0-1`,
    maru: `[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2026.01.26"]\n[White "Pasha"]\n[Black "Kobayashi Maru"]\n[Result "1-0"]\n[TimeControl "600"]\n[WhiteElo "1768"]\n[BlackElo "1579"]\n[EndTime "18:45:50 GMT+0000"]\n\n1. e4 e5 2. Nf3 Nc6 3. d3 Bc5 4. Nxe5 Bxf2+ 5. Kxf2 Nxe5 6. d4 Qf6+ 7. Kg1 Ng6 8. e5 Qb6 9. c4 N8e7 10. c5 Qb4 11. a3 Qa5 12. b4 Qa6 13. Bxa6 bxa6 14. Nc3 Bb7 15. Bg5 Nf5 16. Qg4 Nh6 17. Bxh6 gxh6 18. Ra2 Rg8 19. h4 O-O-O 20. Qf5 h5 21. Qxf7 Rdf8 22. Qxh7 Nf4 23. Rh2 Rg4 24. Rf2 Rfg8 25. Rxf4 Rxg2+ 26. Rxg2 Rxg2+ 27. Kf1 1-0`,
    wabi: `[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2026.02.04"]\n[White "Wabi-sabi"]\n[Black "Pasha"]\n[Result "0-1"]\n[TimeControl "600"]\n[WhiteElo "1747"]\n[BlackElo "1844"]\n[EndTime "23:18:52 GMT+0000"]\n\n1. e4 a5 2. Nf3 Nf6 3. Nc3 d5 4. exd5 Nxd5 5. Bc4 e6 6. d3 Nb6 7. Bb5+ c6 8. Bc4 Nxc4 9. dxc4 Qb6 10. O-O Nd7 11. Na4 Qa6 12. b3 b5 13. cxb5 cxb5 14. Nc3 b4 15. Na4 Bb7 16. Bb2 h5 17. Nh4 g6 18. Bxh8 Be7 19. Nf3 Rd8 20. Bd4 Nf8 21. Ne5 f6 22. Nxg6 Nxg6 23. Qxh5 Be4 24. Bb6 Rd5 25. Qg4 Bf5 26. Qg3 Bxc2 27. Rac1 Bf5 28. Qb8+ Kf7 29. Rc7 Qe2 30. Nc5 Rd1 31. Rxe7+ Nxe7 32. h3 Qxf1+ 33. Kh2 Qh1+ 34. Kg3 Rg1 35. Qb7 Rxg2+ 36. Qxg2 Qxg2+ 37. Kxg2 Bb1 38. Bxa5 Nd5 39. Kg3 e5 40. Kf3 Ke7 41. Kg4 Bxa2 42. Kf5 Bb1+ 43. Ne4 Kf7 44. h4 Ne7+ 45. Kg4 f5+ 46. Kg5 fxe4 47. Bxb4 Nd5 48. Bc5 Ke6 49. b4 Bd3 50. h5 Nf6 51. h6 Nh7+ 52. Kg6 e3+ 53. Kg7 e2 54. f3 e1=Q 0-1`
};

const SIDEBAR_COLORS = { walnut: '#1c2e22', aegean: '#9e4624' };

class App {
    constructor() {
        this.parser = new GameParser();
        const canvas = document.getElementById('poster');
        this.renderer = new ChessRenderer(canvas);
        
        this.state = {
            activeTheme: 'walnut',
            showText: true,
            showMoves: false,
            flipSides: false,
            isAnimating: false,
            currentMoveIndex: 0
        };

        this.animationId = null;
        this.gifWorkerBlobUrl = null;

        this.bindEvents();
        this.setTheme('walnut');
    }

    bindEvents() {
        document.querySelectorAll('.sample-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.getAttribute('data-sample');
                this.loadSample(key);
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });

        ['flipSides', 'showText', 'showMoves'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                this.state[id] = e.target.checked;
                if (!this.state.isAnimating) this.drawFullBoard();
            });
        });

        document.getElementById('playBtn').addEventListener('click', () => this.playGame());
        document.getElementById('exportGifBtn').addEventListener('click', () => this.exportGIF());
        document.getElementById('exportPosterBtn').addEventListener('click', () => this.exportPoster());
    }

    showToast(message, type = 'error') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        const borderColor = type === 'error' ? '#a32c28' : '#ffffff';
        toast.className = `toast px-5 py-3 text-[12px] uppercase tracking-widest text-[var(--deco-cream)] font-semibold flex items-center gap-3`;
        toast.style.borderLeftColor = borderColor;
        toast.style.borderLeftWidth = '4px';
        toast.innerHTML = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    setTheme(theme) {
        this.state.activeTheme = theme;
        const sidebar = document.getElementById('sidebar');
        const canvasWrapper = document.getElementById('canvasWrapper');
        sidebar.style.backgroundColor = SIDEBAR_COLORS[theme];
        canvasWrapper.style.backgroundColor = SIDEBAR_COLORS[theme];
        
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.theme-btn[data-theme="${theme}"]`).classList.add('active');
        
        if (!this.state.isAnimating) this.drawFullBoard();
    }

    loadSample(key) {
        document.getElementById('pgn').value = SAMPLES[key];
        this.showToast(`Loaded Sample`, 'success');
        this.playGame();
    }

    drawFullBoard() {
        const pgnInput = document.getElementById('pgn').value;
        if (!this.parser.parse(pgnInput)) {
            this.showToast("Invalid PGN format.");
            return;
        }

        this.renderer.drawBackground(this.state.activeTheme, this.state, this.parser.pgnData, this.parser.fullMoveString);
        
        this.parser.parsedHistory.forEach((move, i) => {
            const progress = i / this.parser.parsedHistory.length;
            this.renderer.drawCurve(move, progress, this.state.activeTheme, this.state.showMoves, this.state.flipSides);
        });
    }

    playGame() {
        if (this.state.isAnimating) cancelAnimationFrame(this.animationId);
        
        const pgnInput = document.getElementById('pgn').value;
        if (!this.parser.parse(pgnInput)) {
            this.showToast("Invalid PGN format.");
            return;
        }

        this.state.isAnimating = true;
        this.state.currentMoveIndex = 0;
        this.renderer.drawBackground(this.state.activeTheme, this.state, this.parser.pgnData, this.parser.fullMoveString);

        const renderFrame = () => {
            if (this.state.currentMoveIndex < this.parser.parsedHistory.length) {
                const move = this.parser.parsedHistory[this.state.currentMoveIndex];
                const progress = this.state.currentMoveIndex / this.parser.parsedHistory.length;
                this.renderer.drawCurve(move, progress, this.state.activeTheme, this.state.showMoves, this.state.flipSides);
                
                this.state.currentMoveIndex++;
                this.animationId = requestAnimationFrame(renderFrame);
            } else {
                this.state.isAnimating = false;
                this.showToast("Rendering Complete", "success");
            }
        };

        if (this.parser.parsedHistory.length > 0) renderFrame();
        else this.state.isAnimating = false;
    }

    exportPoster() {
        if (this.state.isAnimating) { 
            this.showToast("Wait for rendering to finish."); 
            return; 
        }
        const link = document.createElement('a');
        link.download = `ChessDeco_${this.parser.pgnData.white}_vs_${this.parser.pgnData.black}.png`;
        link.href = this.renderer.canvas.toDataURL('image/png');
        link.click();
    }

    async initGifWorker() {
        if (this.gifWorkerBlobUrl) return this.gifWorkerBlobUrl;
        try {
            const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
            const text = await res.text();
            const blob = new Blob([text], {type: 'application/javascript'});
            this.gifWorkerBlobUrl = URL.createObjectURL(blob);
            return this.gifWorkerBlobUrl;
        } catch (e) {
            console.error("Failed to load GIF worker", e);
            this.showToast("Failed to load GIF encoder.", "error");
            return null;
        }
    }

    async exportGIF() {
        if (this.state.isAnimating) { 
            this.showToast("Wait for current rendering to finish."); 
            return; 
        }
        const pgnInput = document.getElementById('pgn').value;
        if (!this.parser.parse(pgnInput) || this.parser.parsedHistory.length === 0) { 
            this.showToast("Nothing to record."); 
            return; 
        }
        
        this.showToast("Generating GIF... This may take a minute.", "success");
        const workerUrl = await this.initGifWorker();
        if (!workerUrl) return;

        const gifWidth = this.renderer.W * 0.75;
        const gifHeight = this.renderer.H * 0.75;

        const gif = new window.GIF({
            workers: 2,
            quality: 10,
            workerScript: workerUrl,
            width: gifWidth,
            height: gifHeight
        });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gifWidth;
        tempCanvas.height = gifHeight;
        const tCtx = tempCanvas.getContext('2d');

        this.renderer.drawBackground(this.state.activeTheme, this.state, this.parser.pgnData, this.parser.fullMoveString);
        this.state.currentMoveIndex = 0;

        const recordFrame = () => {
            if (this.state.currentMoveIndex < this.parser.parsedHistory.length) {
                const move = this.parser.parsedHistory[this.state.currentMoveIndex];
                const progress = this.state.currentMoveIndex / this.parser.parsedHistory.length;
                this.renderer.drawCurve(move, progress, this.state.activeTheme, this.state.showMoves, this.state.flipSides);
                
                tCtx.drawImage(this.renderer.canvas, 0, 0, this.renderer.W, this.renderer.H, 0, 0, gifWidth, gifHeight);
                gif.addFrame(tempCanvas, {copy: true, delay: 50});
                
                this.state.currentMoveIndex++;
                requestAnimationFrame(recordFrame);
            } else {
                tCtx.drawImage(this.renderer.canvas, 0, 0, this.renderer.W, this.renderer.H, 0, 0, gifWidth, gifHeight);
                gif.addFrame(tempCanvas, {copy: true, delay: 2000});
                this.showToast("Encoding GIF frames... Please wait.", "success");
                
                gif.on('finished', (blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ChessDeco_Seq_${this.parser.pgnData.white}_vs_${this.parser.pgnData.black}.gif`;
                    a.click();
                    this.showToast("GIF Exported!", "success");
                });
                gif.render();
            }
        };
        recordFrame();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
