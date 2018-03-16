import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

class Cell extends React.Component {
	constructor(props) {
		super(props);
	}
	shouldComponentUpdate(nextProps, nextState) {
		if (this.props.cell !== nextProps.cell) {
			return true;
		}
		return false;
	}
	render() {
		let value;
		let nameClass;
		const contents = this.props.cell;
		if (contents === "flag") {
			nameClass = "cell flag";
			value = null;
		} else if (contents === "mine") {
			nameClass = "cell open mine";
			value = null;
		} else if (contents !== null) {
			value = this.props.cell === 0 ? null : this.props.cell;
			nameClass = "cell open";
		} else {
			value = null;
			nameClass = "cell";
		}
		return (
			<button className={nameClass} onClick={this.props.onClick} onContextMenu={(e) => this.props.onRightClick(e)}>
				{value}
			</button>
		);
	}
}

function Controls(props) {
	return (
		<div className="controls">
			<button onClick={(e) => props.onClick()}>New Game</button>
			<button onClick={(e) => props.onClick(9, 9, 10)}>Easy</button>
			<button onClick={(e) => props.onClick(16, 16, 40)}>Medium</button>
			<button onClick={(e) => props.onClick(16, 30, 99)}>Expert</button>
		</div>
	);
}

function GameInfo(props) {
	let value;
	if (props.victory) {
		value = "YOU WIN";
	} else if (props.gameover) {
		value = "YOU LOSE";
	} else {
		value = `Mines Remaining: ${props.userMinesRemaining}`;
	}
	return (
		<div className="gameinfo">
			{value}
		</div>
	);
}

class Board extends React.Component {
	renderCell(row, col, cell) {
		return (
			<Cell 
				key={row * col + col} 
				cell={cell}
				onClick={() => this.props.onClick(row, col)} 
				onRightClick={(e) => this.props.onRightClick(e, row, col)} 
			/>
		);
	}
	render() {
		const board = [];
		let colNum;
		// console.dir(this.props.cells);
		this.props.cells.map((row, rowNum) => {
			const cellRow = [];
			// console.dir("row " + rowNum + ": " + row);
			row.map((cell, col) => {
				colNum = col;
				cellRow.push(this.renderCell(rowNum, colNum, cell));
			});
			// console.log(cellRow);
			board.push(<div key={rowNum * colNum + colNum} className="board-row">{cellRow}</div>);
		});
		return (
			<div>
				{board}
			</div>
		);
	}

} 

class MineSweeper extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			mines: 10,
			rows: 9,
			cols: 9,
			mineLocations: [],
		};
	}
	handleRightClick(e, row, col) {
		e.preventDefault();
		if (this.state.gameover || (this.isOpen(row, col, this.state.cells) && this.state.cells[row][col] !== "flag")) return;
		const cells = this.cloneCells();
		let userMinesRemaining = this.state.userMinesRemaining;
		cells[row][col] = cells[row][col] === "flag" ? null : "flag";
		if (cells[row][col] === "flag") {
			userMinesRemaining--;
		} else {
			userMinesRemaining++;
		}
		this.setState({
			cells,
			userMinesRemaining
		});
	}
	isMine(row, col, mineLocations) {
		return mineLocations.some(location => location[0] === row && location[1] === col);
	}
	isOpen(row, col, cells) {
		return cells[row][col] !== null;
	}
	handleClick(row, col) {
		if (this.state.gameover || this.isOpen(row, col, this.state.cells)) return;
		let newCells = this.cloneCells();
		if (this.isMine(row, col, this.state.mineLocations)) {
			newCells = this.showAllMines(newCells);
			console.log("YOU LOSE");
			this.setState({gameover: true});	
		} else {
			newCells[row][col] = this.countMinesAround(row, col);
			if (newCells[row][col] === 0) {
				this.propagateEmptySpace(row, col, newCells);
			}
		}
		this.setState({
			cells: newCells
		});
		if (this.checkVictory(newCells)) {
			console.log("YOU WIN!");
			this.setState({
				gameover: true,
				victory: true
			});
		}
	}
	showAllMines(cells) {
		this.state.mineLocations.forEach(location => {
			cells[location[0]][location[1]] = "mine";
		});
		return cells;
	}
	checkVictory(cells) {
		for (let i = 0; i < this.state.rows; i++) {
			for (let j = 0; j < this.state.cols; j++) {
				if ((!this.isOpen(i, j, cells) || cells[i][j] === "flag") && !this.isMine(i, j, this.state.mineLocations)) {
					console.log("not open or mine: " + i, j);
					return false;
				}
			}
		}
		return true;
	}
	propagateEmptySpace(row, col, cells) {
		const [minRow, maxRow, minCol, maxCol] = this.minMaxRowCol(row, col);
		for (let i = minRow; i < maxRow + 1; i++) {
			for (let j = minCol; j < maxCol + 1; j++) {
				if (!this.isOpen(i, j, cells) && !this.isMine(i, j, this.state.mineLocations)) {
					cells[i][j] = this.countMinesAround(i, j);
					if (cells[i][j] === 0) {
						this.propagateEmptySpace(i, j, cells);
					}
				}
			}
		}
	}	
	minMaxRowCol(row, col) {
		return [
			row > 1 ? row - 1 : 0,
			row < this.state.rows - 1 ? row + 1 : row,
			col > 1 ? col - 1 : 0,
			col < this.state.cols - 1 ? col + 1 : col
		];
	}
	countMinesAround(row, col) {
		let minesFound = 0;
		const [minRow, maxRow, minCol, maxCol] = this.minMaxRowCol(row, col);
		for (let i = minRow; i < maxRow + 1; i++) {
			for (let j = minCol; j < maxCol + 1; j++) {
				if (this.isMine(i, j, this.state.mineLocations)) {
					minesFound++;
				}
			}
		}
		return minesFound;
	}
	newGame(rows = this.state.rows, cols = this.state.cols, mines = this.state.mines) {
		console.log(`rows: ${rows}, cols: ${cols}, mines: ${mines}`);
		let minesRemaining = mines;
		const mineLocations = [];

		while (minesRemaining) {
			let randomRow = Math.floor(Math.random() * rows);
			let randomCol = Math.floor(Math.random() * cols);

			if (!this.isMine(randomRow, randomCol, mineLocations)) {
				mineLocations.push([randomRow, randomCol]);
				minesRemaining--;
			}
		}
		this.setState({
			rows,
			cols,
			mines,
			mineLocations,
			gameover: false,
			victory: false,
			userMinesRemaining: mines,
			cells: Array(rows).fill(Array(cols).fill(null))
		});
	}
	cloneCells() {
		const newCells = [];
		this.state.cells.map(row => {
			newCells.push(row.slice());
		});
		return newCells;
	}
	componentWillMount() {
		this.newGame(this.state.rows, this.state.cols, this.state.mines);
	}
	render() {
		return (
			<div>
				<Controls
					onClick={(rows, cols, mines) => this.newGame(rows, cols, mines)} 
				/>
				<Board 
					cells={this.state.cells}
					onClick={(row, col) => this.handleClick(row, col)} 
					onRightClick={(e, row, col) => this.handleRightClick(e, row, col)} 
				/>
				<GameInfo 
					gameover={this.state.gameover} 
					victory={this.state.victory} 
					userMinesRemaining={this.state.userMinesRemaining} 
				/>
			</div>
		);
	}
}

ReactDOM.render(
	<MineSweeper />, document.getElementById("app")
);

module.hot.accept();