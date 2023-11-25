phina.globalize();

const SCREEN_PROPS = {
  width: 640,
  height: 960,
  fps: 60,
};
const PLAYER_PROPS = {
  speed: 10,
  hitboxRadius: 7,
};
const ENEMY_TYPE = {
  DEFAULT: 0,
  TRANSPARENT: 1,
};
const BULLET_TYPE = {
  PINK: 0,
  BLUE: 1,
};

const ASSETS = {
  image: {
    background:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/bg.png",
    player:
      "https://raw.githubusercontent.com/phinajs/phina.js/develop/assets/images/shooting/player.png",
    enemy:
      "https://raw.githubusercontent.com/Hiroya-W/phina.js/assets/assets/images/shooting/enemies.png",
    bullet:
      "https://raw.githubusercontent.com/Hiroya-W/phina.js/assets/assets/images/shooting/bullets.png",
  },
};

let player;

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

    // 方向弾
    /*
    DirectionalShooter(BULLET_TYPE.PINK, 0.25, 20)
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(3))
      .setScale(0.7, 0.7);
    */

    // 渦巻弾
    SpiralShooter(BULLET_TYPE.PINK, 0, 0.03, 10)
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(3))
      .setScale(0.7, 0.7);

    /*
    WasherSpiralShooter(ENEMY_TYPE.DEFAULT, this, 0.02, 0.0015)
      .addChildTo(this)
      .setScale(0.7, 0.7)
      .setPosition(this.gridX.center(), this.gridY.span(3));
    */
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

    this.isInvisible = false;
  },

  damage: function () {
    // ダメージを受けた時、一時的に当たり判定をなくす
    this.isInvisible = true;
    this.tweener
      .clear()
      .wait(1000)
      .call(
        function () {
          this.isInvisible = false;
        }.bind(this)
      );
  },

  update: function (app) {
    const key = app.keyboard;

    const current = {
      x: this.x,
      y: this.y,
    };

    const SPEED = key.getKey("shift")
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
    if (this.isInvisible) {
      this.alpha = this.alpha === 0 ? 1 : 0;
    } else {
      this.alpha = 1;
    }
  },
});

phina.define("Enemy", {
  superClass: "Sprite",
  init: function (frameIndex = ENEMY_TYPE.DEFAULT) {
    this.superInit("enemy", 64);
    this.frameIndex = frameIndex;
  },
});

phina.define("Bullet", {
  superClass: "Sprite",
  // angle(0.0: right, 0.25: down, 0.5: left, 0.75: up, 1.0: right)
  init: function (frameIndex, x, y, angle, angleRate, speed, speedRate) {
    this.superInit("bullet", 32);
    this.frameIndex = frameIndex;

    this.setPosition(x, y); // 初期位置
    this.rotation = angle; // 発射角度(0.0 ~ 1.0)
    this.angleRate = angleRate; // 弾の進行方向の変化量
    this.speed = speed; // 弾の初速
    this.speedRate = speedRate; // 弾の加速度
  },

  update: function (app) {
    const rad = this.rotation * Math.PI * 2;
    this.x += this.speed * Math.cos(rad); // 移動方向
    this.y += this.speed * Math.sin(rad);
    this.rotation += this.angleRate; // 弾の進行方向を変化
    this.speed += this.speedRate; // 弾の速さを変化

    // プレイヤーの位置に円の判定を配置して、弾と当たっているかを判定する
    const circle = Circle(player.x, player.y, PLAYER_PROPS.hitboxRadius);
    if (!player.isInvisible && Collision.testCircleCircle(circle, this)) {
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

// 方向弾
phina.define("DirectionalShooter", {
  superClass: "Enemy",
  init: function (frameIndex, angle, speed) {
    this.superInit(frameIndex);

    // 発射角度
    this.shotAngle = angle;
    // 発射速度
    this.shotSpeed = speed;
  },

  update: function (app) {
    Bullet(
      BULLET_TYPE.PINK,
      this.x,
      this.y,
      this.shotAngle,
      0,
      this.shotSpeed,
      0
    ).addChildTo(this.parent);
  },
});

// 渦巻弾
phina.define("SpiralShooter", {
  superClass: "Enemy",
  init: function (frameIndex, angle, angleRate, speed) {
    this.superInit(frameIndex);

    // 発射角度
    this.shotAngle = angle;
    // 発射角速度
    this.shotAngleRate = angleRate;
    // 発射速度
    this.shotSpeed = speed;
  },

  update: function (app) {
    Bullet(
      BULLET_TYPE.PINK,
      this.x,
      this.y,
      this.shotAngle,
      0,
      this.shotSpeed,
      0
    ).addChildTo(this.parent);
    this.shotAngle += this.shotAngleRate;
    // 0~1に収める
    this.shotAngle -= Math.floor(this.shotAngle);
    console.log(this.shotAngle)
  },
});

phina.define("WasherSpiralShooter", {
  superClass: "Enemy",
  init: function (frameIndex, scene, maxShotAngleRate, maxBulletAngleRate) {
    this.superInit(frameIndex);

    this.maxShotAngleRate = maxShotAngleRate;
    this.maxBulletAngleRate = maxBulletAngleRate;

    this.biDirectinal = BiDirectionalSpiralShooter(
      ENEMY_TYPE.TRANSPARENT,
      0,
      [0.015, -0.01],
      7,
      4,
      7
    )
      .addChildTo(scene)
      .setPosition(this.x, this.y);

    this.bent = BentSpiralShooter(
      ENEMY_TYPE.TRANSPARENT,
      0,
      0,
      3,
      9,
      10,
      0,
      0.05
    )
      .addChildTo(scene)
      .setPosition(this.x, this.y);

    // パラメータは埋め込でしまったが、別に引数から渡せるようにしてもいい
    this.enemies = [this.biDirectinal, this.bent];
  },

  setPosition: function (x, y) {
    this.superMethod("setPosition", x, y);
    this.enemies.forEach((element) => {
      element.setPosition(x, y);
    });
  },

  update: function (app) {
    const time = app.frame % 600;

    // 右巻き
    if (time < 250) {
      this.bent.shotAngleRate = this.maxShotAngleRate;
      this.bent.bulletAngleRate = -this.maxBulletAngleRate;
    }
    // 右巻きから左巻きへなめらかに変化させる
    else if (time < 300) {
      this.bent.shotAngleRate = (this.maxShotAngleRate * (275 - time)) / 25;
      this.bent.bulletAngleRate = (this.maxBulletAngleRate * (275 - time)) / 25;
    }
    // 左巻き
    else if (time < 550) {
      this.bent.shotAngleRate = -this.maxShotAngleRate;
      this.bent.bulletAngleRate = this.maxBulletAngleRate;
    }
    // 左巻きから右巻きへなめらかに変化させる
    else {
      this.bent.shotAngleRate = (-this.maxShotAngleRate * (575 - time)) / 25;
      this.bent.bulletAngleRate = (this.maxBulletAngleRate * (575 - time)) / 25;
    }
  },
});

phina.define("BiDirectionalSpiralShooter", {
  superClass: "Enemy",
  init: function (frameIndex, angle, angleRate, speed, count, interval) {
    this.superInit(frameIndex);

    // 発射角度
    this.shotAngle = [angle, angle];
    // 発射角速度
    this.shotAngleRate = angleRate;
    // 発射速度
    this.shotSpeed = speed;
    // 発射数
    this.shotCount = count;
    // 発射間隔
    this.interval = interval;
    this.time = 0;
  },

  update: function (app) {
    if (this.time == 0) {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < this.shotCount; i++) {
          Bullet(
            BULLET_TYPE.PINK,
            this.x,
            this.y,
            this.shotAngle[j] + i / this.shotCount,
            0,
            this.shotSpeed,
            0
          ).addChildTo(this.parent);
        }
        this.shotAngle[j] += this.shotAngleRate[j];
        // 0~1に収める
        this.shotAngle[j] -= Math.floor(this.shotAngle[j]);
      }
    }
    this.time = (this.time + 1) % this.interval;
  },
});

phina.define("BentSpiralShooter", {
  superClass: "Enemy",
  init: function (
    frameIndex,
    angle,
    angleRate,
    speed,
    count,
    interval,
    bulletAngleRate,
    bulletSpeedRate
  ) {
    this.superInit(frameIndex);

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
          BULLET_TYPE.BLUE,
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
