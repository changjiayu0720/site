class HanoiGame {
  constructor() {
    this.disksCount = 5;
    this.pegs = [[], [], []]; // 3个数组模拟3个栈（Peg A, Peg B, Peg C）
    this.moves = 0;
    this.isAutoSolving = false;
    this.selectedPegIndex = null; // 记录当前选中的柱子索引
    
    this.initDOM();
    this.reset(this.disksCount);
  }

  // 1. 初始化 DOM 事件监听器
  initDOM() {
    this.slider = document.getElementById('disk-slider');
    this.sliderVal = document.getElementById('disk-count-val');
    this.moveCounter = document.getElementById('move-count');
    this.msgArea = document.getElementById('message-area');
    this.resetBtn = document.getElementById('reset-btn');
    this.autoBtn = document.getElementById('auto-solve-btn');

    // 监听滑块变化重置棋盘
    this.slider.addEventListener('input', (e) => {
      this.disksCount = parseInt(e.target.value);
      this.sliderVal.textContent = this.disksCount;
      this.reset(this.disksCount);
    });

    // 绑定重置按钮
    this.resetBtn.addEventListener('click', () => {
      this.reset(this.disksCount);
    });

    // 绑定自动演示按钮
    this.autoBtn.addEventListener('click', () => {
      if (!this.isAutoSolving) {
        this.startAutoSolve();
      }
    });

    // 为每个柱子绑定点击事件（点击选择 + 点击放置模式）
    document.querySelectorAll('.peg').forEach(pegEl => {
      pegEl.addEventListener('click', () => {
        this.handlePegClick(parseInt(pegEl.dataset.index));
      });
    });
  }

  // 2. 重置游戏状态
  reset(count) {
    this.disksCount = count;
    this.moves = 0;
    this.selectedPegIndex = null;
    this.isAutoSolving = false;

    // 清空栈并重新初始化 Peg A
    this.pegs = [[], [], []];
    for (let i = count; i >= 1; i--) {
      this.pegs[0].push(i); // 最大的盘子（数字最大）放在栈底
    }

    this.toggleControls(true);
    this.updateUI();
    this.showMessage("游戏已重置", "info");
  }

  // 3. 处理柱子点击
  handlePegClick(pegIndex) {
    if (this.isAutoSolving) return; // 正在自动演示时禁用用户操作

    // 情况 A：还未选中任何柱子
    if (this.selectedPegIndex === null) {
      // 目标柱子无盘子
      if (this.pegs[pegIndex].length === 0) {
        this.showMessage("该柱子上没有可以移动的盘子！", "warning");
        return;
      }
      // 成功选定柱子
      this.selectedPegIndex = pegIndex;
      this.updateUI();
    } 
    // 情况 B：已经选定了一个柱子，准备把盘子放到新选的柱子上
    else {
      const from = this.selectedPegIndex;
      const to = pegIndex;

      // 如果点击的是同一个柱子，则取消选中
      if (from === to) {
        this.selectedPegIndex = null;
        this.updateUI();
        return;
      }

      // 验证移动规则
      if (this.isValidMove(from, to)) {
        this.executeMove(from, to);
        this.checkWin();
      } else {
        // 违规操作：大盘子放在小盘子上方
        this.showMessage("无效操作：大盘子不能放在小盘子上面！", "warning");
        this.triggerShakeEffect(to);
        this.selectedPegIndex = null;
        this.updateUI();
      }
    }
  }

  // 4. 判断移动是否符合规则
  isValidMove(from, to) {
    if (this.pegs[from].length === 0) return false;
    if (this.pegs[to].length === 0) return true;

    const diskToMove = this.pegs[from][this.pegs[from].length - 1];
    const topDiskAtTo = this.pegs[to][this.pegs[to].length - 1];

    return diskToMove < topDiskAtTo;
  }

  // 5. 执行移动
  executeMove(from, to) {
    const disk = this.pegs[from].pop(); // 弹出顶部元素
    this.pegs[to].push(disk);          // 压入新栈中
    this.moves++;
    this.selectedPegIndex = null;
    this.updateUI();
  }

  // 6. 渲染 UI (将数据栈数组同步渲染为真实的 DOM 盘子)
  updateUI() {
    this.moveCounter.textContent = this.moves;

    this.pegs.forEach((pegArray, pIndex) => {
      const disksContainer = document.querySelector(`#peg-${pIndex} .disks-container`);
      disksContainer.innerHTML = ''; // 清空内容

      // 遍历栈数组生成 DOM 盘子
      pegArray.forEach((diskSize, dIndex) => {
        const diskEl = document.createElement('div');
        diskEl.className = 'disk';

        // 动态计算尺寸（从 60px 递增至 136px）
        const width = 60 + (diskSize - 1) * (76 / (this.disksCount - 1 || 1));
        diskEl.style.width = `${width}px`;

        // 动态配置 HSL 彩虹光谱
        const hue = (diskSize * 42) % 360;
        diskEl.style.backgroundColor = `hsl(${hue}, 85%, 55%)`;

        // 选中效果
        if (this.selectedPegIndex === pIndex && dIndex === pegArray.length - 1) {
          diskEl.classList.add('selected');
        }

        disksContainer.appendChild(diskEl);
      });
    });
  }

  // 7. 递归自动演示逻辑
  async startAutoSolve() {
    this.reset(this.disksCount);
    this.isAutoSolving = true;
    this.toggleControls(false); // 禁用重置与滑杆
    this.showMessage("正在自动解题中...", "info");

    const movesList = [];
    
    // 递归求出所有的移动步骤
    const solveHanoi = (n, from, aux, to) => {
      if (n === 1) {
        movesList.push({ from, to });
        return;
      }
      solveHanoi(n - 1, from, to, aux);
      movesList.push({ from, to });
      solveHanoi(n - 1, aux, from, to);
    };

    solveHanoi(this.disksCount, 0, 1, 2);

    // 播放步骤
    for (const move of movesList) {
      if (!this.isAutoSolving) break; // 如果被手动中断则跳出循环
      await this.sleep(700); // 每次移动间隔 700 毫秒
      this.executeMove(move.from, move.to);
    }

    this.checkWin();
    this.toggleControls(true);
  }

  // 8. 胜利判定
  checkWin() {
    if (this.pegs[2].length === this.disksCount) {
      this.showMessage(`恭喜通关！总共用了 ${this.moves} 步。`, "success");
      this.isAutoSolving = false;
      this.toggleControls(true);
    }
  }

  // 辅助函数：操作弹窗提示
  showMessage(text, type) {
    clearTimeout(this.msgTimeout);
    this.msgArea.textContent = text;
    this.msgArea.className = `message ${type}`;
    this.msgTimeout = setTimeout(() => {
      this.msgArea.classList.add('hidden');
    }, 2200);
  }

  // 辅助函数：错误抖动效果
  triggerShakeEffect(pegIndex) {
    const pegEl = document.getElementById(`peg-${pegIndex}`);
    pegEl.classList.add('shake');
    setTimeout(() => pegEl.classList.remove('shake'), 400);
  }

  // 辅助函数：启用/禁用控件
  toggleControls(enable) {
    this.slider.disabled = !enable;
    this.autoBtn.disabled = !enable;
  }

  // 辅助函数：时间延迟
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 页面加载完成后，创建游戏对象实例
window.addEventListener('DOMContentLoaded', () => {
  window.game = new HanoiGame();
});
