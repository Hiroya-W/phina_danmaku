phina.globalize();

let SCREEN_X = 640;
let SCREEN_Y = 960;
let PLAYER_SPEED = 10;

let ASSETS = {
  image: {
    background:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/bg.png",
    player:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/player.png",
    enemy:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/enemy.png",
    bullet:
      "https://raw.githubusercontent.com/Hiroya-W/phina.js/assets/assets/images/shooting/enemy_bullet2.png",
  },
};

/*
 * メインシーン
 */
phina.define("MainScene", {
  superClass: "DisplayScene",
  init: function () {
    this.superInit();
    Sprite("background")
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.center())
      .setScale(2, 2);

    this.player = Player()
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(15))
      .setScale(0.7, 0.7);
    this.enemy = DirectionalShooter(0.25, 20)
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(1))
      .setScale(0.7, 0.7);
  },
});

// Playerクラス
phina.define("Player", {
  superClass: "Sprite",
  init: function () {
    this.superInit("player", 64, 64);
    this.frameIndex = 0;
  },

  update: function (app) {
    var key = app.keyboard;

    var current = {
      x: this.x,
      y: this.y,
    };

    var SPEED = key.getKey("shift") ? PLAYER_SPEED / 2 : PLAYER_SPEED;

    // 上下
    if (key.getKey("up")) {
      this.y -= SPEED;
      this.frameIndex = 0;
    } else if (key.getKey("down")) {
      this.y += SPEED;
      this.frameIndex = 0;
    }

    // 左右
    if (key.getKey("right")) {
      this.x += SPEED;
      this.frameIndex = 2;
    } else if (key.getKey("left")) {
      this.x -= SPEED;
      this.frameIndex = 1;
    } else {
      this.frameIndex = 0;
    }

    // はみ出し
    if (this.x < 0 || SCREEN_X < this.x) {
      this.x = current.x;
    }
    if (this.y < 0 || SCREEN_Y < this.y) {
      this.y = current.y;
    }
  },
});

phina.define("Enemy", {
  superClass: "Sprite",
  init: function () {
    this.superInit("enemy");
  },
});

phina.define("Bullet", {
  superClass: "Sprite",
  // angle(0.0: right, 0.25: down, 0.5: left, 0.75: up, 1.0: right)
  init: function (x, y, angle, angle_rate, speed, speed_rate) {
    this.superInit("bullet");

    this.setPosition(x, y);
    this.rotation = angle;
    this.angle_rate = angle_rate;
    this.speed = speed;
    this.speed_rate = speed_rate;
  },

  update: function (app) {
    let rad = this.rotation * Math.PI * 2;
    this.x += this.speed * Math.cos(rad);
    this.y += this.speed * Math.sin(rad);
    this.rotation += this.angle_rate;
    this.speed += this.speed_rate;
  },
});

phina.define("DirectionalShooter", {
  superClass: "Enemy",
  init: function (angle, speed) {
    this.superInit();

    // 発射角度
    this.shot_angle = angle;
    // 発射速度
    this.shot_speed = speed;
  },

  update: function (app) {
    Bullet(0, 0, this.shot_angle, 0, this.shot_speed, 0).addChildTo(this);
  },
});

/*
 * メイン処理
 */
phina.main(function () {
  var app = GameApp({
    startLabel: "main",
    width: SCREEN_X,
    height: SCREEN_Y,
    assets: ASSETS,
  });

  app.enableStats();

  // 実行
  app.run();
});
