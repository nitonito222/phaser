import './style.css'
import Phaser from 'phaser'

const sizes = {
  width: 600,
  height: 700,
}

const speedDown = 200;

const startButton = document.querySelector("#startButton");

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.cursor;
    this.playerSpeed = speedDown + 85;
    this.target;
    this.points = 10;
    this.isGameOver = false; 
    this.textScore;
    this.targetFruit;
    this.targetFruitText;
    this.activeFruits = [];
    this.timer = 0;
  }

  preload() {
    this.load.image('bg', '/assets/bg.png');
    this.load.image('basket', '/assets/basket.png');
    this.load.image('apple', '/assets/apple.png');
    this.load.image('banana', '/assets/banana.png');
    this.load.image('orange', '/assets/orange.png');
    this.load.image('boom', '/assets/boom.png');
    this.load.audio('take', '/assets/take.mp3');
    this.load.audio('song', '/assets/song.mp3');
    this.load.audio('boom_song', '/assets/boom_song.mp3');
  }

  create() {
    this.scene.pause('scene-game');

    this.takeMusic = this.sound.add("take");
    this.takeMusic.setVolume(0.1);
    this.boomMusic = this.sound.add("boom_song");
    this.boomMusic.setVolume(0.2);
    this.songMusic = this.sound.add("song");
    this.songMusic.setVolume(0.1);
    this.songMusic.play();

    this.add.image(0, 0, "bg").setOrigin(0, 0);
    this.player = this.physics.add.image(0, sizes.height - 10, "basket").setOrigin(0, 0.9);
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.player.setCollideWorldBounds(true);
    this.player.setSize(128, 10).setOffset(0, 5);

    this.fruits = ['apple', 'banana', 'orange'];

    const fruits2 = ["яблоко", "банан", "апельсин"];
    
    this.targetFruit = Phaser.Utils.Array.GetRandom(this.fruits);
    let fruitRussian = fruits2[this.fruits.indexOf(this.targetFruit)];
    this.targetFruitText = this.add.text(10, 50, `Лови: ${fruitRussian}`, {
      font: "25px Arial",
      fill: "#000000",
    });

    const firstFruit = this.physics.add.image(this.getRandomX(), 0, Phaser.Utils.Array.GetRandom(this.fruits)).setOrigin(0, 0);
    firstFruit.setMaxVelocity(0, speedDown);
    this.activeFruits.push(firstFruit);
    
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.activeFruits.length < 5 && !this.isGameOver) {
          const newFruit = this.physics.add.image(this.getRandomX(), 0, Phaser.Utils.Array.GetRandom(this.fruits)).setOrigin(0, 0);
          newFruit.setMaxVelocity(0, speedDown);
          this.activeFruits.push(newFruit);
          this.physics.add.overlap(newFruit, this.player, () => this.targetHit(newFruit), null, this);
          
          if (Math.random() < 0.2) {
            const boom = this.physics.add.image(this.getRandomX(), 0, 'boom').setOrigin(0, 0);
            boom.setMaxVelocity(0, speedDown);
            this.activeFruits.push(boom);
            this.physics.add.overlap(boom, this.player, () => this.boomHit(boom), null, this);
          }
        }
      },
      callbackScope: this,
      loop: true
    });

    this.cursor = this.input.keyboard.createCursorKeys();

    this.textScore = this.add.text(sizes.width - 120, 10, "Счёт: 10", {
      font: "25px Arial",
      fill: "#000000",
    });

    this.timerText = this.add.text(10, 10, 'Время: 0', {
      font: "25px Arial",
      fill: "#000000",
    });

    this.time.addEvent({
      delay: 20000,
      callback: () => {
        this.targetFruit = Phaser.Utils.Array.GetRandom(this.fruits);
        let fruitRussian = fruits2[this.fruits.indexOf(this.targetFruit)];
        this.targetFruitText.setText(`Лови: ${fruitRussian}`);
      },
      callbackScope: this,
      loop: true
    });
  }

  update() {
    this.timer += this.game.loop.delta / 1000; 
    this.timerText.setText(`Время: ${Math.floor(this.timer)}`); 
    
    this.activeFruits.forEach((fruit, index) => {
      if (fruit.y >= sizes.height) {
        fruit.destroy();
        this.activeFruits.splice(index, 1);
      }
    });

    const { left, right } = this.cursor;

    if (left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.points <= 0) { 
      this.isGameOver = true; 
      this.showGameOver(); 
    }
  }

  getRandomX() {
    let x;
    let isValidPosition = false; 
    const minDistance = 100;
    let attempts = 0; 
    const maxAttempts = 10;
    
    while (!isValidPosition && attempts < maxAttempts) {
      x = Math.floor(Math.random() * 480);
      isValidPosition = true;
      
      for (const fruit of this.activeFruits) {
        if (Math.abs(fruit.x - x) < minDistance) {
          isValidPosition = false;
          break;
        }
      }
      attempts++;
    }
    
    return isValidPosition ? x : 0; 
  }

  targetHit(fruit) {
    this.takeMusic.play();
    
    if (fruit.texture.key === this.targetFruit) {
        this.points++;
    } else {
        this.points--; 
    }

    this.textScore.setText(`Счёт: ${this.points}`);
    fruit.destroy();
    this.activeFruits = this.activeFruits.filter(f => f !== fruit);
  }

  boomHit(boom) {
    this.boomMusic.play();

    this.points -= 10;
    this.textScore.setText(`Счёт: ${this.points}`);
    boom.destroy();
    this.activeFruits = this.activeFruits.filter(m => m !== boom);
  }

  showGameOver() {
    this.activeFruits.forEach(fruit => fruit.destroy()); 
    this.activeFruits = [];
    const gameOverText = this.add.text(sizes.width / 2, sizes.height / 2 - 20, 'Вы проиграли!', {
      font: "40px Arial",
      fill: "#ff0000",
    }).setOrigin(0.35);

    const restartButton = this.add.text(sizes.width / 2, sizes.height / 2 + 20, 'Ещё раз', {
      font: "30px Arial",
      fill: "#000000",
    }).setOrigin(0.2).setInteractive();

    restartButton.on('pointerdown', () => {
      window.location.reload(); 
      gameOverText.destroy(); 
      restartButton.destroy(); 
    });
  }
};


const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: speedDown },
      debug: false,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

startButton.addEventListener("click", () => {
  document.querySelector('main').style.display='none'
  game.scene.resume('scene-game');
});


document.getElementById('restartButton').addEventListener('click', () => {
  location.reload();
});
