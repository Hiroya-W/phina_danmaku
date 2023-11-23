phina.globalize();

let SCREEN_PROPS = {
  width: 640,
  height: 960,
  fps: 60,
};
let PLAYER_PROPS = {
  speed: 10,
  hitboxRadius: 7,
};

let ASSETS = {
  image: {
    background:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/bg.png",
    player:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/player.png",
    enemy:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/enemy.png",
    bullet:
      "https://raw.githubusercontent.com/Hiroya-W/phina.js/assets/assets/images/shooting/bullets.png",
  },
};

var player;

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

    player = Player()
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(13))
      .setScale(0.7, 0.7);
    // 近い位置で軌道が変わるような弾幕
    // this.enemy = BentSpiralShooter(0, 0.015, 7, 1, 7, -0.003, 0)
    //   .addChildTo(this)
    //   .setPosition(this.gridX.center(), this.gridY.span(3))
    //   .setScale(0.7, 0.7);
    // 徐々に加速してくる弾幕
    // this.enemy = BentSpiralShooter(1, 0.015, 7, 1, 7, 0, 0.1)
    //   .addChildTo(this)
    //   .setPosition(this.gridX.center(), this.gridY.span(3))
    //   .setScale(0.7, 0.7);

    // 合わせてみれば
    this.enemy = BentSpiralShooter(1, 0.015, 7, 1, 7, -0.003, 0.1)
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(3))
      .setScale(0.7, 0.7);
  },
});

// Playerクラス
phina.define("Player", {
  superClass: "Sprite",
  init: function () {
    this.superInit("player", 64, 64);
    this.frameIndex = 0;

    this.coreShape = CircleShape({
      radius: PLAYER_PROPS.hitboxRadius,
      fill: "blue",
    }).addChildTo(this);

    this.invisible = false;
    // ダメージを受けた時、一時的に当たり判定をなくす
    this.damage = function () {
      this.invisible = true;
      this.tweener
        .clear()
        .wait(1000)
        .call(
          function () {
            this.invisible = false;
          }.bind(this)
        );
    };
  },

  update: function (app) {
    var key = app.keyboard;

    var current = {
      x: this.x,
      y: this.y,
    };

    let SPEED = key.getKey("shift")
      ? PLAYER_PROPS.speed / 2
      : PLAYER_PROPS.speed;

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
    if (this.x < 0 || SCREEN_PROPS.width < this.x) {
      this.x = current.x;
    }
    if (this.y < 0 || SCREEN_PROPS.height < this.y) {
      this.y = current.y;
    }

    // ダメージを受けた時の点滅
    if (this.invisible) {
      this.alpha = this.alpha === 0 ? 1 : 0;
    } else {
      this.alpha = 1;
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
  init: function (frameIndex, x, y, angle, angleRate, speed, speedRate) {
    this.superInit("bullet", 32);
    this.frameIndex = frameIndex;

    this.setPosition(x, y);
    this.rotation = angle;
    this.angleRate = angleRate;
    this.speed = speed;
    this.speedRate = speedRate;
  },

  update: function (app) {
    let rad = this.rotation * Math.PI * 2;
    this.x += this.speed * Math.cos(rad);
    this.y += this.speed * Math.sin(rad);
    this.rotation += this.angleRate;
    this.speed += this.speedRate;

    // プレイヤーの位置に円の判定を配置して、弾と当たっているかを判定する
    let circle = Circle(player.x, player.y, PLAYER_PROPS.hitboxRadius);
    if (!player.invisible && Collision.testCircleCircle(circle, this)) {
      player.damage();
      this.remove();
    }

    // 画面外に出たら削除
    if (this.x + 16 < 0 || SCREEN_PROPS.width + 16 < this.x) {
      this.remove();
    }
    if (this.y + 16 < 0 || SCREEN_PROPS.height + 16 < this.y) {
      this.remove();
    }
  },
});

phina.define("BentSpiralShooter", {
  superClass: "Enemy",
  init: function (
    angle,
    angleRate,
    speed,
    count,
    interval,
    bulletAngleRate,
    bulletSpeedRate
  ) {
    this.superInit();

    // 発射角度
    this.shotAngle = angle;
    // 発射角速度
    this.shotAngleRate = angleRate;
    // 発射速度
    this.shotSpeed = speed;
    // 発射数
    this.shotCount = count;
    // 発射間隔
    this.interval = interval;
    this.time = 0;
    // 弾の角速度
    this.bulletAngleRate = bulletAngleRate;
    // 弾の加速度
    this.bulletSpeedRate = bulletSpeedRate;
  },

  update: function (app) {
    if (this.time == 0) {
      for (let i = 0; i < this.shotCount; i++) {
        Bullet(
          0,
          this.x,
          this.y,
          this.shotAngle + i / this.shotCount,
          this.bulletAngleRate,
          this.shotSpeed,
          this.bulletSpeedRate
        ).addChildTo(this.parent);
      }
      this.shotAngle += this.shotAngleRate;
      // 0~1に収める
      this.shotAngle -= Math.floor(this.shotAngle);
    }
    this.time = (this.time + 1) % this.interval;
  },
});

/*
 * メイン処理
 */
phina.main(function () {
  var app = GameApp({
    startLabel: "main",
    width: SCREEN_PROPS.width,
    height: SCREEN_PROPS.height,
    fps: SCREEN_PROPS.fps,
    assets: ASSETS,
  });

  app.enableStats();

  // 実行
  app.run();
});
