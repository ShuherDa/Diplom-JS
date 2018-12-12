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
		
        return this.right > actor.left &&
			this.left < actor.right &&
			this.top < actor.bottom &&
			this.bottom > actor.top;
	}
}

class Level{
	constructor(grid=[], actors=[]){
		this.actors = actors.slice();
		this.grid = grid.slice();
		this.height = this.grid.length;
		this.width = Math.max(0, ...grid.map(elem => elem.length));
		this.status = null;
		this.finishDelay = 1;
		this.player = this.actors.find(actor => actor.type === 'player');
	}
	
	isFinished(){
		return this.status != null && this.finishDelay < 0;
	}
	
	actorAt(actor){
		if(!(actor instanceof Actor)){
			throw new Error('Движущийся объект должен иметь тип Actor');
		}
		return this.actors.find(elem => elem.isIntersect(actor));
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
				 if (obstacle) {	
					return obstacle;
				}
			}
		}
	}
	
	removeActor(actor){
		const indexActor = this.actors.indexOf(actor);
		if(indexActor !== -1){
			this.actors.splice(indexActor, 1);
		}
	}
	
	noMoreActors(type){
		return !this.actors.some((actor) => actor.type === type)
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

const symbols = { 'x': 'wall', '!': 'lava' };

class LevelParser{
	constructor(dictionary = {}){
		this.dictionary = dictionary;
	}
	
	actorFromSymbol(symbol){
		return this.dictionary[symbol];
	}
	
	obstacleFromSymbol(symbol){
		return symbols[symbol];
	}
	
	createGrid(strings){
		return strings.map(line => line.split('')).map(line => line.map(line => this.obstacleFromSymbol(line)));
	}
	
	createActors(strings){
        return strings.reduce((rez, itemY, y) => {
            itemY.split('').forEach((itemX, x) => {
                const constructor = this.actorFromSymbol(itemX);
                if (typeof constructor === 'function') {
                    const actor = new constructor(new Vector(x, y));
                    if (actor instanceof Actor) {
                        rez.push(actor);
                    }
                }
            });
            return rez;
        }, []);
	}
	
	parse(strings){
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
	constructor(pos=new Vector(0,0)){
		super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2*Math.PI;
		this.startPos = this.pos;
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

	getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.startPos.plus(this.getSpringVector());
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