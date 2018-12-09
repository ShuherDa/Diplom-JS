'use strict';

class Vector{
	constructor(x = 0,y = 0){
		this.x = x;
		this.y = y;
	}
	
	plus(vector){
		if(!(vector instanceof Vector)){
			throw  new Error('Можно прибавлять к вектору только вектор типа Vector');
		}
		return new Vector(this.x + vector.x, this.y + vector.y);
	}
	
	times(factor){
		return new Vector(this.x * factor, this.y * factor);
	}
}

class Actor{
	constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)){
		if (!(pos instanceof Vector)){
			throw new Error('Должно быть определено свойство pos, в котором размещен Vector');
		}
		
		if (!(size instanceof Vector)){
			throw new Error('Должно быть определено свойство size, в котором размещен Vector');
		}
		
		if (!(speed instanceof Vector)){
			throw new Error('Должно быть определено свойство speed, в котором размещен Vector');
		}
		
		this.pos = pos;
		this.size = size;
		this.speed = speed;	
	}
	
	get type(){
		return 'actor';
	}
	
	act(){}
	
	get left(){
		return this.pos.x;
	}
	
	get right(){
		return this.pos.x + this.size.x;
	}
	
	get top(){
		return this.pos.y;
	}
	
	get bottom(){
		return this.pos.y + this.size.y;
	}
	
	isIntersect(actor){
		if(!(actor instanceof Actor)){
			throw new Error(`Переменная actor должна быть типа Actor: ${actor}`);
		}
		
		if(this === actor){
			return false;
		}
		
		// дальше слишком много условий
		// тут простой алгоритм:
		// если переданный объект выше, ниже, левее или правее данного,
		// то они не пересекаются
		if(actor.size.x < 0 || actor.size.y < 0){
			return false;
		}
		
		if((this.pos.x === actor.pos.x + actor.size.x)||(actor.pos.x === this.pos.x + actor.size.x)||
		(this.pos.y === actor.pos.y + actor.size.y)||(actor.pos.y === this.pos.y + actor.size.y)){
			return false;
		}
		 
		 return (this.pos.x <= actor.pos.x + actor.size.x && this.pos.x >= actor.pos.x && 
		 this.pos.y <= actor.pos.y + actor.size.y && this.pos.y >= actor.pos.y) ||
		 (this.pos.x <= actor.pos.x + actor.size.x && this.pos.x >= actor.pos.x && 
		 this.pos.y + this.size.y <= actor.pos.y + actor.size.y && this.pos.y + this.size.y >= actor.pos.y) ||
		 (this.pos.x + this.size.x <= actor.pos.x + actor.size.x && this.pos.x + this.size.x >= actor.pos.x && 
		 this.pos.y <= actor.pos.y + actor.size.y && this.pos.y >= actor.pos.y) ||
		 (this.pos.x + this.size.x <= actor.pos.x + actor.size.x && this.pos.x + this.size.x >= actor.pos.x && 
		 this.pos.y + this.size.y <= actor.pos.y + actor.size.y && this.pos.y + this.size.y >= actor.pos.y) ||
		 (actor.pos.x <= this.pos.x + this.size.x && actor.pos.x >= this.pos.x && 
		 actor.pos.y <= this.pos.y + this.size.y && actor.pos.y >= this.pos.y) ||
		 (actor.pos.x <= this.pos.x + this.size.x && actor.pos.x >= this.pos.x && 
		 actor.pos.y + actor.size.y <= this.pos.y + this.size.y && actor.pos.y + actor.size.y >= this.pos.y) ||
		 (actor.pos.x + actor.size.x <= this.pos.x + this.size.x && actor.pos.x + actor.size.x >= this.pos.x && 
		 actor.pos.y <= this.pos.y + this.size.y && actor.pos.y >= this.pos.y) ||
		 (actor.pos.x + actor.size.x <= this.pos.x + this.size.x && actor.pos.x + actor.size.x >= this.pos.x && 
		 actor.pos.y + actor.size.y <= this.pos.y + this.size.y && actor.pos.y + actor.size.y >= this.pos.y);
	}
}

class Level{
	constructor(grid=[], actors=[]){
		// для поиска объектов в массиве есть специальный метод
		for(const actor of actors){
			if(actor.type === 'player'){
				this.player = actor;
				break;
			}
		}
	
		this.grid = grid;
		this.actors = actors;
		this.height = grid.length;
		this.width = 0;
		
		// максимальную длину лучше найти с помощью reduce или map + Math.max
		if(grid.length !== 0){
			for(const arr of this.grid){
				if(typeof arr != 'undefined'){
					if(this.width < arr.length){
						this.width = arr.length;
					}
				}
			}
		}
		
		this.status = null;
		this.finishDelay = 1;
	}
	
	isFinished(){
		// скобки можно убрать
		return(this.status != null && this.finishDelay < 0);
	}
	
	actorAt(actor){
		if(!(actor instanceof Actor)){
			throw new Error('Движущийся объект должен иметь тип Actor');
		}
		
		// если this.grid не будет заполнено работать ничего не будет,
		// поэтому лучше сделать эту проверку один раз в конструкторе
		// (или использовать значение по-умолчанию),
		// а не проверять перед каждым использованием
		if(this.grid === undefined ){
			return undefined;
		}
		
		// для поиска обхекта в массиве есть специальный метод
		for(const act of this.actors){
			if (typeof act !='undefined' && actor.isIntersect(act)){
				return act;
			}
		}
		// эта строчка ничего не делает,
		// функция и так возвращает undefined, если не указано иное
		return undefined;
	}
	
	obstacleAt(pos, size){
		if(!(pos instanceof Vector)){
			throw 'pos должен иметь тип Vector';
		}
		
		if(!(size instanceof Vector)){
			throw 'size должен иметь тип Vector';
		}
		
		const xStart = Math.floor(pos.x);
		const xEnd = Math.ceil(pos.x + size.x);
		const yStart = Math.floor(pos.y);
		const yEnd = Math.ceil(pos.y + size.y);

		if (xStart < 0 || xEnd > this.width || yStart < 0) {
			return 'wall';
		}

		if (yEnd > this.height) {
			return 'lava';
		}

		for (let y = yStart; y < yEnd; y++) {
			for (let x = xStart; x < xEnd; x++) {
				const obstacle = this.grid[y][x];
				// я бы проверил задесь просто if (obstacle) {
				if (typeof obstacle !== 'undefined') {
					return obstacle;
				}
			}
		}
		// строчка ничего не делает
		return undefined;
	}
	
	removeActor(actor){
		const indexActor = this.actors.indexOf(actor);
		// используйте !== и === для сравнения
		if(indexActor != -1){
			this.actors.splice(indexActor, 1);
		}
	}
	
	noMoreActors(type){
		// лучше проверить в конструкторе
		if(this.actors){
			// вместо for of лучше использовать for или .forEach
			// тут нужно использовать метод массивв
			for(const actor of this.actors){
				if(actor.type === type){
					return false;
				}
			}
		}
		return true;
	}
	
	playerTouched(type, actor){
		if(this.status != null){
			return;
		}
		
		if(type === 'lava' || type === 'fireball'){
			this.status = 'lost';
		}
		
		if(type === 'coin' && actor.type === 'coin'){
			this.removeActor(actor);
			if(this.noMoreActors('coin')){
				this.status = 'won';
			}
		}
	}
}

class LevelParser{
	constructor(dictionary){
		this.dictionary = dictionary;
	}
	
	actorFromSymbol(symbol){
		// эта проверка лишняя
		if(typeof symbol === 'undefined'){
			return undefined;
		}
		
		// проверка в конструкторе / значение по-умолчанию
		if(typeof this.dictionary ===  'undefined'){
			return undefined;
		}
		
		return this.dictionary[symbol];
	}
	
	obstacleFromSymbol(symbol){
		const symbols = { 'x': 'wall', '!': 'lava' };
		return symbols[symbol];
	}
	
	createGrid(strings){
		// этот метод лучше переписать с использованием map
		const array = [];
		let i = 0;
		
		for(const string of strings){
			array[i] = [];
			for(let j = 0; j < string.length; j++){
				const symbol = string.charAt(j);
				// эти проверки тут ненужны,
				// если появится больше препятствий
				// и вы добавите их в symbols из obstacleFromSymbol
				// то работать они не будут, пока вы не исправите условия здесь
				if(symbol === 'o' || symbol === 'x' || symbol === '!'){
					array[i].push(this.obstacleFromSymbol(symbol));
				}else{
					array[i].push(undefined);
				}
			}
			
			i++;
		}
		
		return array;
	}
	
	createActors(strings){
		const array = [];
		let j = 0;
		
		for(let k = 0; k < strings.length; k++ ){
			const string = strings[k];
			for(let i = 0; i < string.length; i++){
				const symbol = string.charAt(i);
				const actorCtr = this.actorFromSymbol(symbol);
				if(typeof actorCtr === 'function'){
					const actor = new actorCtr();
					if(actor instanceof Actor){
						// обхект создаётся второй раз
						array[j] = new actorCtr();
						// pos должно задаваться в конструкторе
						array[j].pos = new Vector(i,k);
						// если использовать push, то эту переменную можно убрать
						j++;
					}
				}
			}
		}
		
		return array;
	}
	
	parse(strings){
		// форматирование
	return new Level(this.createGrid(strings), this.createActors(strings));
	}
}

class Fireball extends Actor{
	constructor(pos  = new Vector(0,0),speed = new Vector(0,0)){	
		super(pos, new Vector(1,1), speed);
	}
	
	get type(){
		return 'fireball';
	}

	getNextPosition(time = 1){
		return this.pos.plus(this.speed.times(time));
	}

	handleObstacle(){
		this.speed = this.speed.times(-1);
	}

	act(time, level){
		const nextPos = this.getNextPosition(time);
		if(level.obstacleAt(nextPos, this.size)){
			this.handleObstacle();
		}else{
			this.pos = nextPos;
		}
	}
}

class HorizontalFireball extends Fireball{
	constructor(pos = new Vector(0,0)){
		super(pos,new Vector(2,0));
	}
}

class VerticalFireball extends Fireball{
	constructor(pos = new Vector(0,0)){
		super(pos, new Vector(0,2));
	}
}

class FireRain extends Fireball{
	constructor(pos = new Vector(0,0)){
	super(pos, new Vector(0,3));
		this.initPos = pos;
	}
	
	get type(){
		return 'firerain';
	}

	handleObstacle(){
		this.pos = this.initPos;
	}
}

class Coin extends Actor{
	constructor(pos=new Vector(1,1)){
		// лучше использовать метод класса Vector
		super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6,0.6));
		this.initPos = pos;
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2*Math.PI
	}
	
	get type(){
		return 'coin';
	}
	
	updateSpring(time = 1){
			this.spring += this.springSpeed*time;
		}
		
	getSpringVector(){
		return new Vector(0,Math.sin(this.spring)*this.springDist);
	}
	
	getNextPosition(time = 1){
		this.updateSpring(time);
		const springVector = this.getSpringVector();
		return new Vector(this.pos.x,this.pos.y + springVector.y*time);
	}
	
	act(time){
		this.pos = this.getNextPosition(time);
	}	
}

class Player extends Actor{
	constructor(pos=new Vector(1,1)){
		super(new Vector(pos.x, pos.y - 0.5), new Vector(0.8,1.5));	
	}
	
	get type(){
		return 'player';
	}
}

const schemas = [
  [
    '         ',
    '   h     ',
    '         ',
    '       o ',
    '@     xxx',
    '         ',
    'xxx      ',
    '         '
  ],
  [
    '   v     ',
    '         ',
    '         ',
    '@       o',
    '        x',
    '    x    ',
    'x        ',
    '         '
  ],
   [
    '            ',
    '      v     ',
    '           o',
    '@       o  x',
    '    o   x   ',
    '    x       ',
    'x           ',
    '            '
  ],
   [
    ' v           ',
    '             ',
    '             ',
    '@   h    o   ',
    '        xx   ',
    '    xx       ',
    'xx         o ',
    '           xx'
  ]
];

const actorDict = {
  '@': Player,
  'v': VerticalFireball,
  'o': Coin,
  'h': HorizontalFireball,
  'f': FireRain
}

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));