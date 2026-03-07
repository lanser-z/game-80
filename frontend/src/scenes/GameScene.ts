import Phaser from 'phaser';
import { Wall } from '../entities/Wall';
import { Block } from '../entities/Block';
import { GravityCalculator } from '../physics/GravityCalculator';
import { BudgetManager } from '../managers/BudgetManager';
import { AudioManager } from '../managers/AudioManager';
import { HUD } from '../ui/HUD';
import { GAME_CONFIG, BLOCK_TYPES } from '../config';
import { LevelConfig, BlockData } from '../types';

interface GameSceneData {
  level: number;
}

export class GameScene extends Phaser.Scene {
  private wall!: Wall;
  private budgetManager!: BudgetManager;
  private audioManager!: AudioManager;
  private hud!: HUD;
  private currentLevel!: number;
  private levelConfig!: LevelConfig;
  private isCollapsing: boolean = false;
  private gravityLensActive: boolean = false;
  private gravityIndicator!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.currentLevel = data.level || 1;
    // 重置状态
    this.isCollapsing = false;
    this.gravityLensActive = true;  // 默认显示重心
  }

  create(): void {
    // 加载关卡配置
    this.levelConfig = this.getLevelConfig(this.currentLevel);

    // 初始化预算管理
    this.budgetManager = new BudgetManager(
      this.levelConfig.budget,
      GAME_CONFIG.hitCost
    );

    // 初始化音效管理
    this.audioManager = new AudioManager(this);
    this.audioManager.playBGM();

    // 创建背景
    this.add.image(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, 'bg_gradient');

    // 创建重心指示器（必须在创建墙体之前）
    this.gravityIndicator = this.add.graphics();

    // 创建墙体
    this.createWall();

    // 创建 HUD
    this.hud = new HUD(this, this.budgetManager);

    // 添加输入监听
    this.input.on('pointerdown', this.handlePointerDown, this);

    // 注册键盘事件（用于道具）
    this.input.keyboard?.on('keydown-G', () => {
      this.toggleGravityLens();
    });
  }

  private getLevelConfig(levelId: number): LevelConfig {
    // 生成关卡配置
    const blockSize = GAME_CONFIG.blockSize;
    const supportY = GAME_CONFIG.height - 100;

    // 动态生成关卡
    const config = this.generateLevel(levelId, supportY, blockSize);

    return {
      levelId,
      name: `第${levelId}关`,
      budget: GAME_CONFIG.initialBudget,
      wallConfig: config,
      gravity: 500,
      supportY
    };
  }

  /**
   * 动态生成关卡
   * 关卡越高，墙越大，材质越硬，砖块大小越不规则
   */
  private generateLevel(levelId: number, supportY: number, blockSize: number): { width: number; height: number; blocks: BlockData[] } {
    // 根据关卡计算墙的大小 (3-8 列)
    const wallWidth = Math.min(4 + Math.floor((levelId - 1) / 2), 8);
    const wallHeight = Math.min(4 + Math.floor((levelId - 1) / 3), 7);

    const blocks: BlockData[] = [];
    let blockId = 0;

    // 计算墙体总宽度，用于居中
    let totalWidth = 0;

    // 先生成砖块布局
    const layout: { col: number; row: number; width: number; height: number; type: any }[] = [];

    for (let row = 0; row < wallHeight; row++) {
      let col = 0;
      while (col < wallWidth) {
        // 随机决定砖块宽度 (1-2 格)
        const widthUnits = levelId <= 2 ? 1 : (Math.random() < 0.4 ? 2 : 1);
        // 随机决定砖块高度 (1-2 格)
        const heightUnits = levelId <= 3 ? 1 : (Math.random() < 0.3 ? 2 : 1);

        // 确保不超出墙宽
        const actualWidthUnits = Math.min(widthUnits, wallWidth - col);

        const blockWidth = actualWidthUnits * blockSize;
        const blockHeight = heightUnits * blockSize;

        const blockType = this.getBlockTypeForLevel(levelId, row, wallHeight);

        layout.push({
          col,
          row,
          width: blockWidth,
          height: blockHeight,
          type: blockType
        });

        col += actualWidthUnits;
        totalWidth = Math.max(totalWidth, col * blockSize);
      }
    }

    // 计算起始 X 位置（居中）
    const startX = (GAME_CONFIG.width - totalWidth) / 2 + blockSize / 2;

    // 根据布局创建砖块数据
    let currentX = startX;
    let currentRow = 0;
    let rowX = startX;

    layout.forEach((item, index) => {
      if (item.row !== currentRow) {
        currentRow = item.row;
        rowX = startX;
      }

      const x = rowX + item.width / 2;
      const y = supportY - (item.row + 0.5) * item.height - (item.height > blockSize ? 0 : 0);

      blocks.push({
        id: `block_${blockId++}`,
        type: item.type,
        x: x,
        y: y,
        width: item.width,
        height: item.height,
        currentHealth: item.type.health
      });

      rowX += item.width;
    });

    return { width: wallWidth, height: wallHeight, blocks };
  }

  /**
   * 根据关卡和行位置决定积木类型
   */
  private getBlockTypeForLevel(levelId: number, row: number, totalRows: number): any {
    // 关卡 1-2: 只有泥土和瓷砖
    // 关卡 3-5: 加入大理石
    // 关卡 6+: 加入金属

    const topRows = Math.ceil(totalRows / 3);  // 顶部 1/3

    if (levelId <= 2) {
      // 简单关卡
      return row < topRows ? BLOCK_TYPES.TILE : BLOCK_TYPES.DIRT;
    } else if (levelId <= 5) {
      // 中等难度
      if (row === 0) return BLOCK_TYPES.MARBLE;
      if (row < topRows) return BLOCK_TYPES.TILE;
      return BLOCK_TYPES.DIRT;
    } else {
      // 高难度
      if (row === 0) return BLOCK_TYPES.METAL;
      if (row < 2) return BLOCK_TYPES.MARBLE;
      if (row < topRows) return BLOCK_TYPES.TILE;
      return BLOCK_TYPES.DIRT;
    }
  }

  private createWall(): void {
    this.wall = new Wall(this, this.levelConfig.wallConfig);

    // 初始显示重心
    if (this.gravityLensActive) {
      const remainingBlocks = this.wall.getRemainingBlocks();
      if (remainingBlocks.length > 0) {
        const cog = GravityCalculator.calculateCenterOfGravity(remainingBlocks);
        this.showGravityIndicator(cog);
      }
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    console.log('=== 点击事件触发 ===');
    console.log('点击位置:', pointer.x, pointer.y);
    console.log('isCollapsing:', this.isCollapsing);

    if (this.isCollapsing) return;

    // 检查是否点击到积木块
    const clickedBlock = this.wall.getBlockAtPosition(pointer.x, pointer.y);
    console.log('点击到的积木块:', clickedBlock ? clickedBlock.getId() : 'null');

    if (clickedBlock) {
      this.hitBlock(clickedBlock);
    }
  }

  private hitBlock(block: Block): void {
    console.log('=== hitBlock 被调用 ===');
    console.log('积木块ID:', block.getId());

    // 检查预算
    const canHit = this.budgetManager.canHit();
    console.log('能否砸击:', canHit);

    if (!canHit) {
      // 预算不足，触发失败
      this.showBudgetWarning();
      this.time.delayedCall(1500, () => {
        this.showGameOver();
      });
      return;
    }

    // 消耗预算
    this.budgetManager.spendBudget();
    this.hud.updateBudget(this.budgetManager.getRemainingBudget());
    console.log('剩余预算:', this.budgetManager.getRemainingBudget());

    // 砸积木块
    const destroyed = this.wall.hitBlock(block);
    console.log('积木块是否被摧毁:', destroyed);

    if (destroyed) {
      // 播放砸墙特效
      this.createHitEffect(block.x, block.y);

      // 播放砸墙音效
      this.audioManager.playHitSound();

      // 检查墙体是否倒塌
      this.checkCollapse();
    }

    // 检查预算是否用完
    if (this.budgetManager.getRemainingBudget() <= 0) {
      this.checkFailed();
    }
  }

  private createHitEffect(x: number, y: number): void {
    // 简单的砸墙特效 - 生成一些碎片粒子
    const particles = this.add.particles(x, y, 'block_dirt', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      lifespan: 500,
      gravityY: 200,
      quantity: 10,
      blendMode: 'ADD'
    });

    this.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  private checkCollapse(): void {
    if (this.isCollapsing) return;

    // 计算重心和支撑状态
    const remainingBlocks = this.wall.getRemainingBlocks();

    if (remainingBlocks.length === 0) {
      // 所有积木都没了，肯定倒塌
      this.onWallCollapse();
      return;
    }

    const centerOfGravity = GravityCalculator.calculateCenterOfGravity(remainingBlocks);
    const isSupported = GravityCalculator.isSupported(centerOfGravity, remainingBlocks, this.levelConfig.supportY);

    // 如果重心分析镜激活，显示重心
    if (this.gravityLensActive) {
      this.showGravityIndicator(centerOfGravity);
    }

    if (!isSupported) {
      this.onWallCollapse();
    }
  }

  private showGravityIndicator(cog: Phaser.Math.Vector2): void {
    this.gravityIndicator.clear();

    // 绘制重心点
    this.gravityIndicator.fillStyle(0xff0000, 1);
    this.gravityIndicator.fillCircle(cog.x, cog.y, 8);

    // 绘制到支撑线的垂直线
    this.gravityIndicator.lineStyle(2, 0xff0000, 0.5);
    this.gravityIndicator.lineBetween(cog.x, cog.y, cog.x, this.levelConfig.supportY);

    // 绘制支撑区域
    this.gravityIndicator.lineStyle(2, 0x00ff00, 0.8);
    this.gravityIndicator.strokeRect(0, this.levelConfig.supportY - 2, GAME_CONFIG.width, 4);
  }

  private toggleGravityLens(): void {
    this.gravityLensActive = !this.gravityLensActive;

    if (!this.gravityLensActive) {
      this.gravityIndicator.clear();
    } else {
      const remainingBlocks = this.wall.getRemainingBlocks();
      if (remainingBlocks.length > 0) {
        const cog = GravityCalculator.calculateCenterOfGravity(remainingBlocks);
        this.showGravityIndicator(cog);
      }
    }
  }

  private onWallCollapse(): void {
    this.isCollapsing = true;

    // 播放倒塌音效
    this.audioManager.playCollapseSound();

    // 播放倒塌动画
    this.wall.collapse(() => {
      // 倒塌完成后显示结果
      this.showLevelComplete();
    });
  }

  private showBudgetWarning(): void {
    const warningText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      '预算不足！',
      {
        font: 'bold 24px Arial',
        color: '#ff0000',
        align: 'center'
      }
    ).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      warningText.destroy();
    });
  }

  private checkFailed(): void {
    console.log('=== checkFailed 被调用 ===');
    console.log('isCollapsing:', this.isCollapsing);

    if (this.isCollapsing) return;  // 如果正在倒塌就不处理失败

    // 检查墙体是否已经倒塌
    const remainingBlocks = this.wall.getRemainingBlocks();
    console.log('剩余积木块数量:', remainingBlocks.length);

    const centerOfGravity = GravityCalculator.calculateCenterOfGravity(remainingBlocks);
    const isSupported = GravityCalculator.isSupported(centerOfGravity, remainingBlocks, this.levelConfig.supportY);
    console.log('重心是否有支撑:', isSupported);

    if (isSupported && remainingBlocks.length > 0) {
      // 预算用完但墙没倒，失败
      console.log('触发失败！');
      this.time.delayedCall(500, () => {
        this.showGameOver();
      });
    }
  }

  private showLevelComplete(): void {
    const remainingBudget = this.budgetManager.getRemainingBudget();

    // 计算星星评价
    let stars = 1;
    if (remainingBudget > 500) stars = 2;
    if (remainingBudget > 800) stars = 3;

    // 更新游戏状态
    const data = this.registry;
    data.set('totalMoney', data.get('totalMoney') + remainingBudget);

    // 显示结果面板
    const container = this.add.container(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-200, -150, 400, 300, 20);

    const title = this.add.text(0, -100, '闯关成功！', {
      font: 'bold 32px Arial',
      color: '#00ff00'
    }).setOrigin(0.5);

    const budgetText = this.add.text(0, -40, `剩余预算：¥${remainingBudget}`, {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const starsText = this.add.text(0, 0, `评价：${'★'.repeat(stars)}`, {
      font: '24px Arial',
      color: '#ffff00'
    }).setOrigin(0.5);

    // 创建按钮容器
    const buttonContainer = this.add.container(0, 105);
    const nextButtonBg = this.add.graphics();
    nextButtonBg.fillStyle(0x00aa00, 1);
    nextButtonBg.fillRoundedRect(-80, -25, 160, 50, 10);
    buttonContainer.add(nextButtonBg);

    const nextButtonText = this.add.text(0, 0, '下一关', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    buttonContainer.add(nextButtonText);

    container.add([bg, title, budgetText, starsText, buttonContainer]);

    // 按钮交互
    buttonContainer.setSize(160, 50);
    const hitArea = new Phaser.Geom.Rectangle(0, 0, 160, 50);
    buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    buttonContainer.on('pointerover', () => {
      nextButtonBg.clear();
      nextButtonBg.fillStyle(0x00cc00, 1);
      nextButtonBg.fillRoundedRect(-80, -25, 160, 50, 10);
    });

    buttonContainer.on('pointerout', () => {
      nextButtonBg.clear();
      nextButtonBg.fillStyle(0x00aa00, 1);
      nextButtonBg.fillRoundedRect(-80, -25, 160, 50, 10);
    });

    buttonContainer.on('pointerdown', () => {
      nextButtonBg.clear();
      nextButtonBg.fillStyle(0x008800, 1);
      nextButtonBg.fillRoundedRect(-80, -25, 160, 50, 10);
      this.audioManager?.playUISound();
    });

    buttonContainer.on('pointerup', () => {
      nextButtonBg.clear();
      nextButtonBg.fillStyle(0x00aa00, 1);
      nextButtonBg.fillRoundedRect(-80, -25, 160, 50, 10);
      this.goToNextLevel();
    });

    // 保存关卡进度
    const levelKey = `level_${this.currentLevel}`;
    const currentRecord = data.get(levelKey);
    if (!currentRecord || remainingBudget > currentRecord.remainingBudget) {
      data.set(levelKey, {
        isCompleted: true,
        remainingBudget,
        stars
      });
    }
  }

  private showGameOver(): void {
    const container = this.add.container(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-200, -150, 400, 300, 20);

    const title = this.add.text(0, -100, '闯关失败', {
      font: 'bold 32px Arial',
      color: '#ff0000'
    }).setOrigin(0.5);

    const message = this.add.text(0, -40, '预算花光了，\n但墙还没有倒塌...', {
      font: '18px Arial',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);

    // 倒计时文本
    const countdownText = this.add.text(0, 50, '3 秒后返回主页', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, title, message, countdownText]);

    // 3秒倒计时
    let countdown = 3;
    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          countdownText.setText(`${countdown} 秒后返回主页`);
        } else {
          countdownText.setText('正在返回...');
          this.scene.start('MenuScene');
        }
      },
      repeat: 2
    });
  }

  private goToNextLevel(): void {
    const data = this.registry;
    const nextLevel = this.currentLevel + 1;

    if (nextLevel > data.get('unlockedLevels')) {
      data.set('unlockedLevels', nextLevel);
    }
    data.set('currentLevel', nextLevel);

    this.scene.start('GameScene', { level: nextLevel });
  }

  update(): void {
    // 每帧更新
  }
}
