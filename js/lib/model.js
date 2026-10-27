/* ============================================================
   model.js — Xiaomi SU7 Ultra, built entirely from Three.js
   primitives, lofted sections and runtime canvas textures.
   1 unit = 1.5 m. Car faces +X, +Y up, +Z right, ground Y = 0.
   ============================================================ */
(function () {
  'use strict';
  const B = window.THREE_BUNDLE;
  const THREE = B.THREE;
  const RoundedBoxGeometry = B.RoundedBoxGeometry;
  const T = window.SU7.textures;
  window.SU7 = window.SU7 || {};

  /* ---------- real-world dimensions -> model units (×1.5) ---------- */
  const S = 1.5;
  const LENGTH = 5.115 * S;                 // 7.6725
  const WIDTH = 1.970 * S;                  // 2.955
  const HEIGHT = 1.465 * S;                 // 2.1975
  const HALF_L = LENGTH / 2;                // 3.83625
  const WHEEL_R = 0.7189 / 2 * S;           // 0.5392
  const WHEEL_Y = 0.360 * S;                // 0.540
  const AXLE_F = 1.5575 * S;                // 2.3363
  const AXLE_R = -1.4425 * S;               // -2.1638
  const TRACK_F = 1.34;
  const TRACK_R = 1.35;
  const TIRE_W_F = 0.265 * S;
  const TIRE_W_R = 0.305 * S;

  /* ---------- part metadata ---------- */
  const META = [
    {
      id: 'body', name: '车身外壳', en: 'BODY SHELL', cat: 'STRUCTURE / 车身',
      accent: '#ffd23f', labelSpec: '5115×1970×1465 · 2360kg',
      desc: 'SU7 Ultra 的四门宽体车身，长达 5.115 米、轴距 3 米。低趴的车头、饱满的轮拱与溜背式车顶勾勒出 GT 跑车比例，车身多处使用碳纤维套件减重。',
      specs: [
        ['尺寸', '5115 × 1970 × 1465 mm'], ['轴距', '3000 mm'], ['整备质量', '2360 kg'],
        ['车身', '高强度钢铝混合车身'], ['碳纤维', '全车 17 处碳纤维部件'],
        ['颜色', '闪电黄 / 太空银 / 鹦鹉绿 / 曜石黑 / 珍珠白'], ['风阻', '约 0.2 Cd（媒体口径）']
      ],
      tags: ['四门溜背', '宽体车身', '碳纤维套件'],
      note: '车身覆盖件与结构件协同承载；侧裙、轮眉、前铲、尾翼等碳纤维件在赛道套装中进一步强化。',
      explode: [0, 0.2, 0], explodeRot: [0, 0, 0],
      view: { az: 0.88, el: 0.2, r: 14.5 }, labelDir: [-195, -120],
      anchorAbs: [0, 1.7, 0]
    },
    {
      id: 'carbonRoof', name: '碳纤维车顶', en: 'CARBON ROOF', cat: 'AERO / 轻量化',
      accent: '#c9d4df', labelSpec: '碳纤维 · 激光雷达',
      desc: '赛道专业套装中的碳纤维车顶，替代全景天幕以降低重心并减重。车顶前端集成激光雷达与感知硬件，兼顾空气动力学与智能驾驶。',
      specs: [
        ['材质', '碳纤维复合材料'], ['配置', '选装「赛道专业套装」'],
        ['替代', '全景天幕'], ['收益', '减重 / 降低重心'],
        ['车顶', '激光雷达 + 感知摄像头'], ['说明', '需与碳纤维套件搭配']
      ],
      tags: ['碳纤维车顶', '减重', '激光雷达'],
      note: '选装碳纤维车顶后会取消全景天幕；车顶中央黑色模块为激光雷达与感知传感器。',
      explode: [0, 1.6, -0.15], explodeRot: [0, 0, 0.02],
      view: { az: 0.7, el: 0.72, r: 9.5 }, labelDir: [-100, -205],
      anchorAbs: [0, 2.24, 0]
    },
    {
      id: 'hood', name: '前舱盖', en: 'FRONT HOOD', cat: 'AERO / 轻量化',
      accent: '#ffc21a', labelSpec: '双风道 · 碳纤维可选',
      desc: '低矮的机盖与车头形成下压姿态，可选碳纤维双风道前舱盖，利用气流带走前舱热量并产生前部下压力；中央镶嵌小米车标。',
      specs: [
        ['材质', '铝合金 / 碳纤维（选装）'], ['风道', '双风道设计'],
        ['功能', '前舱散热 + 前部下压力'], ['选装', '碳纤维前舱盖将取消前备箱'],
        ['车标', '24K 金碳纤维车标'], ['开启', '电动前备箱（不选碳纤盖）']
      ],
      tags: ['双风道', '碳纤维选装', '24K 车标'],
      note: '碳纤维双风道前舱盖属于赛道化选装件；选择后会取消前备箱以容纳风道结构。',
      explode: [1.6, 1.1, 0], explodeRot: [0, 0, -0.12],
      view: { az: 0.62, el: 0.45, r: 8.4 }, labelDir: [150, -170],
      anchorAbs: [2.75, 1.35, 0]
    },
    {
      id: 'frontFascia', name: '前保险杠 / 前铲', en: 'FRONT AERO', cat: 'AERO / 空气动力学',
      accent: '#ff9f1c', labelSpec: 'U型风刀 · 前铲',
      desc: 'Ultra 专属的激进前脸：超大尺寸前铲配合 U 型风刀与加大 10% 的进气格栅，在 350 km/h 时为整车贡献最高 285 kg 下压力。',
      specs: [
        ['组件', '前铲 + U 型风刀 + 大进气格栅'], ['格栅', '开口面积 +10%'],
        ['下压力', '整车最高 285 kg @ 350 km/h'], ['材质', '碳纤维 / 工程塑料'],
        ['功能', '前部下压力 + 散热'], ['说明', '部分组件需选装']
      ],
      tags: ['U 型风刀', '大前铲', '285kg 下压力'],
      note: '前铲和风刀把气流引向两侧与底部，降低前轴升力；格栅加大后可为电机/电池提供更多冷却空气。',
      explode: [3.0, 0.6, 0], explodeRot: [0, 0.1, 0.05],
      view: { az: 0.5, el: 0.14, r: 7.6 }, labelDir: [170, 60],
      anchorAbs: [3.78, 0.62, 0.7]
    },
    {
      id: 'rearFascia', name: '后保险杠 / 扩散器', en: 'REAR AERO', cat: 'AERO / 空气动力学',
      accent: '#ff7a1a', labelSpec: '主动扩散器 · 尾部',
      desc: '尾部扩散器与后轮拱风道共同整理车底气流，可升降尾翼版本配有主动式尾部扩散器。贯穿尾灯与「XIAOMI」字标构成 Ultra 的辨识度。',
      specs: [
        ['组件', '后保险杠 + 扩散器 + 尾部风道'], ['扩散器', '主动式 / 碳纤维'],
        ['标识', 'XIAOMI 字标 + SU7 Ultra 徽标'], ['牌照', 'SU7 Ultra 展示牌'],
        ['功能', '车底气流整理 / 尾部下压力'], ['说明', '固定尾翼与升降尾翼版本不同']
      ],
      tags: ['主动扩散器', '尾部风道', 'XIAOMI 字标'],
      note: '固定尾翼与主动升降尾翼为互斥配置；扩散器与尾翼共同决定尾部下压力平衡。',
      explode: [-3.0, 0.6, 0], explodeRot: [0, -0.1, -0.05],
      view: { az: 2.55, el: 0.18, r: 7.8 }, labelDir: [-190, 70],
      anchorAbs: [-3.78, 0.72, 0]
    },
    {
      id: 'glassCanopy', name: '玻璃座舱', en: 'GLASS CANOPY', cat: 'BODY / 玻璃',
      accent: '#7dd3fc', labelSpec: '四门隔音 · 溜背座舱',
      desc: '大面积前风挡、侧窗与后风挡构成溜背式玻璃座舱，配备四门隔音隔热玻璃与无框车门。车顶弧线从 A 柱一路滑向尾部，形成 Ultra 的 GT 轮廓。',
      specs: [
        ['玻璃', '四门隔音隔热玻璃'], ['结构', '前风挡 / 侧窗 / 后风挡'],
        ['车顶', '溜背式弧线'], ['车门', '无框车门'],
        ['功能', '隔音 / 隔热 / 视野'], ['说明', '碳纤维车顶将取消全景天幕']
      ],
      tags: ['无框车门', '隔音玻璃', '溜背轮廓'],
      note: '前后风挡与侧窗共同构成低风阻座舱；拆解时可单独分离玻璃与车顶碳纤维件。',
      explode: [0, 1.2, 0.2], explodeRot: [0, 0.02, 0],
      view: { az: 0.95, el: 0.48, r: 10.5 }, labelDir: [155, -180],
      anchorAbs: [0.2, 2.05, 0]
    },
    {
      id: 'leftDoors', name: '左侧车门', en: 'LEFT DOORS', cat: 'BODY / 车门',
      accent: '#fbbf24', labelSpec: '无框车门 · 隐藏把手',
      desc: '左侧前/后两扇无框车门，配备隐藏式门把手、碳纤维外后视镜壳与隔音玻璃。侧面大面积黑色拉花与「Ultra」字样是它的身份标识。',
      specs: [
        ['数量', '左前门 + 左后门'], ['结构', '无框车门'],
        ['把手', '隐藏式门把手'], ['后视镜', '碳纤维外壳'],
        ['玻璃', '隔音隔热玻璃'], ['装饰', '侧面 Ultra 拉花']
      ],
      tags: ['无框车门', '隐藏把手', '碳纤维后视镜'],
      note: '四门采用无框设计，门板与玻璃密封条共同保证风噪与密封表现。',
      explode: [0, 0.35, -2.15], explodeRot: [0, 0.08, 0],
      view: { az: -1.45, el: 0.16, r: 10.8 }, labelDir: [-180, 90],
      anchorAbs: [0.5, 1.2, -1.5]
    },
    {
      id: 'rightDoors', name: '右侧车门', en: 'RIGHT DOORS', cat: 'BODY / 车门',
      accent: '#f59e0b', labelSpec: '无框车门 · 隐藏把手',
      desc: '右侧前/后无框车门，与前门对称布置隐藏式门把手与碳纤维后视镜；打开后可直接看到 Alcantara 包覆的座舱与碳纤维门槛。',
      specs: [
        ['数量', '右前门 + 右后门'], ['结构', '无框车门'],
        ['把手', '隐藏式门把手'], ['后视镜', '碳纤维外壳'],
        ['玻璃', '隔音隔热玻璃'], ['装饰', '侧面 Ultra 拉花']
      ],
      tags: ['无框车门', '隐藏把手', '碳纤维后视镜'],
      note: '右侧车门同样集成隐藏式门把手与隔音玻璃；拆解后可见车门内部防撞梁与线束。',
      explode: [0, 0.35, 2.15], explodeRot: [0, -0.08, 0],
      view: { az: 1.45, el: 0.16, r: 10.8 }, labelDir: [185, 90],
      anchorAbs: [0.5, 1.2, 1.5]
    },
    {
      id: 'rearWing', name: '碳纤维尾翼', en: 'CARBON WING', cat: 'AERO / 空气动力学',
      accent: '#7dd3fc', labelSpec: '固定大尾翼 · 碳纤维',
      desc: '碳纤维固定大尾翼是 Ultra 最具攻击性的部件之一，提供高速下压力；另有 3 挡可调版本。翼片、端板与鹅颈支架全部为碳纤维材质。',
      specs: [
        ['材质', '碳纤维'], ['形式', '固定式大尾翼 / 3 挡可调'],
        ['翼展', '约 1450 mm（估算）'], ['作用', '尾部下压力'],
        ['下压力', '整车最高 285 kg @ 350 km/h'], ['互斥', '选装后取消主动升降尾翼']
      ],
      tags: ['碳纤维尾翼', '鹅颈支架', '整车 285kg 下压力'],
      note: '固定大尾翼与主动升降尾翼不能同时选装；285 kg 为整车空气动力学套件在 350 km/h 下的最大下压力，并非尾翼单独贡献。',
      explode: [-1.0, 1.4, 0], explodeRot: [0, 0, -0.06],
      view: { az: 2.3, el: 0.25, r: 9.0 }, labelDir: [-190, -130],
      anchorAbs: [-3.45, 2.1, 0]
    },
    {
      id: 'headlights', name: '矩阵大灯', en: 'HEADLIGHTS', cat: 'LIGHTING / 灯组',
      accent: '#dbeafe', labelSpec: 'LED · 自适应远光',
      desc: '两侧水滴形 LED 大灯，细长的日间行车灯带与金色饰条构成 Ultra 的前脸眼神；支持自动大灯与自适应远近光。',
      specs: [
        ['灯组', 'LED 矩阵大灯'], ['功能', '自动大灯 / 自适应远光'],
        ['日行灯', '细长 LED 灯带'], ['位置', '前脸两侧'],
        ['外壳', '深色灯腔'], ['说明', '造型依据官方产品图']
      ],
      tags: ['矩阵 LED', '日行灯', '自适应远光'],
      note: '灯腔内部以深色为主，日行灯带与大灯透镜分层布置；拆解后可见灯组支架与线束。',
      explode: [2.4, 1.2, 0], explodeRot: [0, 0.05, 0],
      view: { az: 0.5, el: 0.14, r: 7.0 }, labelDir: [170, -90],
      anchorAbs: [3.6, 1.3, 0.9]
    },
    {
      id: 'taillight', name: '贯穿尾灯', en: 'TAILLIGHT', cat: 'LIGHTING / 灯组',
      accent: '#ff4d5e', labelSpec: '贯穿式 · 1700mm',
      desc: '横贯车尾的 LED 尾灯带，宽度接近 1.7 米，点亮后形成极具辨识度的红色光带；两侧加宽的灯组与尾部扩散器形成宽体姿态。',
      specs: [
        ['形式', '贯穿式 LED 尾灯'], ['宽度', '约 1700 mm（估算）'],
        ['灯带高度', '约 60–90 mm（估算）'], ['功能', '制动 / 转向 / 示宽'],
        ['位置', '尾部中央'], ['材质', '红色光学级灯罩']
      ],
      tags: ['贯穿式尾灯', 'LED 光带', '宽体尾部'],
      note: '尾灯横贯尾部并与两侧灯组融合，是 SU7 家族最具辨识度的设计元素。',
      explode: [-2.4, 1.2, 0], explodeRot: [0, -0.05, 0],
      view: { az: 2.6, el: 0.15, r: 7.2 }, labelDir: [-170, -90],
      anchorAbs: [-3.8, 1.5, 0]
    },
    {
      id: 'wheels', name: '21" 锻造轮毂', en: 'FORGED WHEELS', cat: 'CHASSIS / 行走',
      accent: '#e5e7eb', labelSpec: '21" U型辐条 · P ZERO',
      desc: '21 英寸 U 型锻造轮毂，前 265/35 ZR21、后 305/30 ZR21 倍耐力 P ZERO 第五代高性能轮胎，可选同规格半热熔轮胎。',
      specs: [
        ['轮毂', '21 英寸 U 型锻造'], ['前胎', '265/35 ZR21'],
        ['后胎', '305/30 ZR21'], ['轮胎', '倍耐力 P ZERO 第五代'],
        ['选装', 'TROFEO RS 半热熔'], ['外径', '前 718.9 / 后 716.4 mm']
      ],
      tags: ['21 英寸锻造', 'U 型辐条', 'P ZERO'],
      note: '前后轮胎宽度不同（265/305），为后轴提供更强抓地力；轮毂采用轻量化锻造工艺。',
      explode: [0, 0.1, 0], explodeRot: [0, 0, 0],
      view: { az: 2.35, el: 0.16, r: 16.0 }, labelDir: [170, 110],
      anchorAbs: [AXLE_F, WHEEL_Y, TRACK_F]
    },
    {
      id: 'brakes', name: '碳陶瓷制动', en: 'CARBON CERAMIC BRAKES', cat: 'CHASSIS / 制动',
      accent: '#ffb703', labelSpec: '碳陶盘 · 前六后四',
      desc: '赛道级制动系统：超大尺寸碳陶制动盘搭配前六后四活塞固定卡钳，配合高功率电机动能回收，在连续赛道驾驶中保持稳定制动力。',
      specs: [
        ['制动盘', '碳陶瓷通风盘'], ['卡钳', '前六活塞 / 后四活塞固定卡钳'],
        ['前盘尺寸', '约 430 mm（媒体口径）'], ['卡钳颜色', '黄色'],
        ['回收', '高功率电机动能回收'], ['说明', '赛道专业套装含高性能刹车片']
      ],
      tags: ['碳陶盘', '前六后四', '黄色卡钳'],
      note: '碳陶盘耐高温、抗热衰减，配合大尺寸卡钳与动能回收，适合赛道连续重刹。',
      explode: [0, 0.1, 0], explodeRot: [0, 0, 0],
      view: { az: 2.2, el: 0.14, r: 14.0 }, labelDir: [185, 80],
      anchorAbs: [AXLE_F, WHEEL_Y, TRACK_F * 0.9]
    },
    {
      id: 'suspension', name: '空气悬架', en: 'AIR SUSPENSION', cat: 'CHASSIS / 悬架',
      accent: '#4ade80', labelSpec: '双腔空悬 · CDC',
      desc: '闭式双腔空气悬架系统配合 CDC 连续可变阻尼，兼顾日常舒适与赛道支撑；赛道专业套装还可换装倍适登 EVO R 绞牙减振器。',
      specs: [
        ['形式', '闭式双腔空气弹簧'], ['阻尼', 'CDC 连续可变阻尼'],
        ['结构', '前双叉臂 / 后多连杆'], ['赛道选装', '倍适登 EVO R 绞牙'],
        ['弹簧刚度', '最高 300 N/mm'], ['阻尼力', '最高 9000 N']
      ],
      tags: ['双腔空悬', 'CDC', '绞牙选装'],
      note: '空气悬架可随驾驶模式调节车身高度与软硬；赛道套装提供 10 段压缩/回弹可调绞牙。',
      explode: [0, 0.1, 0], explodeRot: [0, 0, 0],
      view: { az: -2.2, el: 0.15, r: 15.0 }, labelDir: [-170, 80],
      anchorAbs: [AXLE_F, 0.75, TRACK_F * 0.82]
    },
    {
      id: 'battery', name: '93.7kWh 电池', en: 'BATTERY PACK', cat: 'POWER / 三电',
      accent: '#ff8a1e', labelSpec: '93.7kWh · 麒麟II',
      desc: '赛道级高功率电池包，容量 93.7 kWh，采用宁德时代麒麟 II 电芯，峰值放电功率 1330 kW，支撑三电机连续高强度输出。',
      specs: [
        ['容量', '93.7 kWh'], ['电芯', '宁德时代麒麟 II'], ['架构', '897 V / CTB 一体化'],
        ['峰值放电', '1330 kW'], ['充电', '5.2C · 10–80% 约 11 min（媒体）'],
        ['CLTC', '630 / 600 / 555 / 520 km']
      ],
      tags: ['93.7kWh', '麒麟II', '1330kW 放电'],
      note: '电池包布置于座舱下方，兼顾低重心与车身刚性；897V/5.2C 等数据为媒体口径，官方未完整披露。',
      explode: [0, -0.55, 0], explodeRot: [0, 0, 0],
      view: { az: 0.55, el: -0.1, r: 9.0 }, labelDir: [-180, 120],
      anchorAbs: [0, 0.42, 0]
    },
    {
      id: 'motors', name: '三电机系统', en: 'TRI-MOTOR', cat: 'POWER / 三电',
      accent: '#ef4444', labelSpec: '1548PS · 三电机四驱',
      desc: '与原型车同源的超级三电机系统：前轴 V6s + 后轴双 V8s，三电机四驱输出 1548 PS，配合扭矩矢量控制实现 1.98 秒破百。',
      specs: [
        ['布局', '前 V6s + 后双 V8s 四驱'], ['综合功率', '1548 PS / 1138 kW'],
        ['V8s 单机', '425 kW'], ['峰值扭矩', '约 1770 N·m（媒体）'],
        ['0–100 km/h', '1.98 s（不含起步）'], ['极速', '350 km/h']
      ],
      tags: ['1548PS', '三电机四驱', 'V8s'],
      note: '后轴双 V8s 电机可实现左右轮扭矩矢量分配；0–100 成绩需搭配 TROFEO RS 半热熔轮胎。',
      explode: [0, -0.75, -0.35], explodeRot: [0, 0, 0],
      view: { az: 2.35, el: 0.02, r: 10.5 }, labelDir: [170, 120],
      anchorAbs: [-1.6, 0.55, 0]
    },
    {
      id: 'interior', name: '座舱与座椅', en: 'COCKPIT', cat: 'INTERIOR / 内饰',
      accent: '#e5e7eb', labelSpec: 'Alcantara · 碳纤维方向盘',
      desc: 'Alcantara 包覆的运动座舱：碳纤维运动方向盘带黄色回中标识，16.1 英寸中控屏 + 7.1 英寸仪表，25 扬声器音响与 HyperOS 智能座舱。',
      specs: [
        ['面料', '约 5 m² Alcantara'], ['方向盘', '碳纤维 + Alcantara'],
        ['中控屏', '16.1 英寸'], ['仪表', '7.1 英寸翻转仪表'],
        ['音响', '25 扬声器'], ['系统', 'Xiaomi HyperOS'],
        ['座椅', '豪华运动座椅 / 主动侧翼']
      ],
      tags: ['Alcantara', '碳纤维方向盘', 'HyperOS'],
      note: '内饰以黑色 Alcantara 与碳纤维为主，辅以黄色缝线、安全带与方向盘回中标识。',
      noGlow: true,
      hideWhileSelected: ['body', 'carbonRoof', 'hood', 'frontFascia', 'rearFascia',
        'glassCanopy', 'leftDoors', 'rightDoors', 'rearWing', 'headlights', 'taillight',
        'wheels', 'brakes', 'suspension', 'battery', 'motors', 'chassis'],
      explode: [0, 0.8, 0], explodeRot: [0, 0, 0.02],
      view: { az: 3.9, el: 0.28, r: 10.8 }, labelDir: [180, -100],
      anchorAbs: [0.3, 1.85, 0]
    },
    {
      id: 'chassis', name: '底盘与副车架', en: 'CHASSIS', cat: 'CHASSIS / 结构',
      accent: '#a3e635', labelSpec: '碳纤维底护板',
      desc: '高强度钢铝混合承载式车身，前双叉臂、后多连杆悬架安装于前后副车架；底部可加装碳纤维空气动力学底护板，进一步整理车底气流。',
      specs: [
        ['车身', '高强度钢铝混合'], ['前悬', '双叉臂'],
        ['后悬', '多连杆'], ['底护板', '碳纤维空气动力学底护板（选装）'],
        ['调校', '纽北赛道专项调校'], ['说明', '内部结构为示意级']
      ],
      tags: ['副车架', '碳纤维底护板', '纽北调校'],
      note: '底盘与副车架为示意级结构，用于展示悬架、电池、电机及空气动力学部件之间的安装关系。',
      explode: [0, -0.6, 0], explodeRot: [0, 0, 0],
      view: { az: 0.8, el: 0.02, r: 12.5 }, labelDir: [180, 130],
      anchorAbs: [0, 0.4, 0]
    }
  ];

  /* ---------- materials ---------- */
  function applyArchCut(mat) {
    const front = AXLE_F.toFixed(4);
    const rear = AXLE_R.toFixed(4);
    mat.onBeforeCompile = function (shader) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vArchWorld;')
        .replace('#include <project_vertex>',
          'vArchWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vArchWorld;')
        .replace('void main() {',
          'void main() {\n' +
          '  float archY = vArchWorld.y - 0.54;\n' +
          '  if (abs(vArchWorld.z) > 1.16) {\n' +
          '    float df = length(vec2(vArchWorld.x - ' + front + ', archY));\n' +
          '    float dr = length(vec2(vArchWorld.x - ' + rear + ', archY));\n' +
          '    if (df < 0.655 || dr < 0.655) discard;\n' +
          '  }\n');
    };
    mat.customProgramCacheKey = function () { return 'su7-archcut-v2'; };
    mat.userData.archCut = true;
    mat.needsUpdate = true;
  }

  let MAT = null;
  function makeMaterials() {
    const paint = new THREE.MeshPhysicalMaterial({
      color: 0xffb400, metalness: 0.32, roughness: 0.38,
      clearcoat: 0.65, clearcoatRoughness: 0.14,
      roughnessMap: T.paintFlake(), envMapIntensity: 0.6
    });
    paint.userData.archCut = true;
    applyArchCut(paint);
    const paintEdge = new THREE.MeshPhysicalMaterial({
      color: 0xf2b400, metalness: 0.35, roughness: 0.4,
      clearcoat: 0.65, clearcoatRoughness: 0.12, envMapIntensity: 0.8
    });
    const paintCap = paint.clone();
    paintCap.side = THREE.DoubleSide;
    const carbon = new THREE.MeshPhysicalMaterial({
      map: T.carbon(), color: 0xffffff, metalness: 0.18, roughness: 0.52,
      clearcoat: 0.55, clearcoatRoughness: 0.2, envMapIntensity: 0.7
    });
    const carbonMatte = new THREE.MeshPhysicalMaterial({
      map: T.carbon(), color: 0x9aa0a6, metalness: 0.1, roughness: 0.7,
      clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.5
    });
    const stripe = new THREE.MeshPhysicalMaterial({
      color: 0x7d848b, metalness: 0.38, roughness: 0.44,
      clearcoat: 0.45, clearcoatRoughness: 0.22, envMapIntensity: 0.7,
      side: THREE.DoubleSide
    });
    const blackGloss = new THREE.MeshPhysicalMaterial({
      color: 0x080a0c, metalness: 0.45, roughness: 0.14,
      clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6
    });
    const blackPlastic = new THREE.MeshStandardMaterial({
      color: 0x101216, metalness: 0.2, roughness: 0.62, envMapIntensity: 0.8
    });
    const tire = new THREE.MeshStandardMaterial({
      color: 0x101113, metalness: 0.02, roughness: 0.9,
      bumpMap: T.tyreTread(), bumpScale: 0.035, envMapIntensity: 0.3
    });
    tire.userData.noGlow = true;
    const rimMetal = new THREE.MeshStandardMaterial({
      color: 0x1e2227, metalness: 0.88, roughness: 0.34,
      roughnessMap: T.brushedMetal(), envMapIntensity: 0.9
    });
    const rimGold = new THREE.MeshStandardMaterial({
      color: 0xd9b04c, metalness: 1, roughness: 0.25, envMapIntensity: 1.4
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: 0xd9dfe5, metalness: 1, roughness: 0.16, envMapIntensity: 1.6
    });
    const gold = new THREE.MeshPhysicalMaterial({
      color: 0xd8b35a, metalness: 1, roughness: 0.2,
      clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.6
    });
    const glass = new THREE.MeshBasicMaterial({
      map: T.glassTint(), color: 0xffffff, transparent: true, opacity: 0.93,
      side: THREE.DoubleSide, depthWrite: false
    });
    const doorGlass = new THREE.MeshBasicMaterial({
      color: 0x07131c, side: THREE.DoubleSide
    });
    const lampGlass = new THREE.MeshPhysicalMaterial({
      color: 0xdfe8ef, metalness: 0.1, roughness: 0.08,
      transparent: true, opacity: 0.45, clearcoat: 1, clearcoatRoughness: 0.02,
      envMapIntensity: 1.4, depthWrite: false
    });
    const whiteLight = new THREE.MeshBasicMaterial({ color: 0xf4fbff, toneMapped: false });
    const amberLight = new THREE.MeshBasicMaterial({ color: 0xffb43c, toneMapped: false });
    const redLight = new THREE.MeshBasicMaterial({ color: 0xff1f2d, toneMapped: false });
    const brakeDisc = new THREE.MeshStandardMaterial({
      map: T.brakeDisc(), color: 0xffffff, metalness: 0.55, roughness: 0.5,
      envMapIntensity: 0.8
    });
    const caliper = new THREE.MeshPhysicalMaterial({
      color: 0xffc400, metalness: 0.45, roughness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2
    });
    const alcantara = new THREE.MeshStandardMaterial({
      color: 0x121518, metalness: 0.0, roughness: 0.95, envMapIntensity: 0.4
    });
    const yellowAccent = new THREE.MeshStandardMaterial({
      color: 0xffc400, metalness: 0.2, roughness: 0.55, envMapIntensity: 0.8
    });
    const interiorBlack = new THREE.MeshStandardMaterial({
      color: 0x08090b, metalness: 0.1, roughness: 0.86, envMapIntensity: 0.3
    });
    const copper = new THREE.MeshStandardMaterial({
      color: 0xb87345, metalness: 1, roughness: 0.34, envMapIntensity: 1.2
    });
    const aluminium = new THREE.MeshStandardMaterial({
      color: 0x9aa2a9, metalness: 1, roughness: 0.42, envMapIntensity: 1.2
    });
    const orange = new THREE.MeshStandardMaterial({
      color: 0xff7a1a, metalness: 0.25, roughness: 0.5, envMapIntensity: 0.9
    });
    const centerScreen = new THREE.MeshBasicMaterial({ map: T.centerScreen(), toneMapped: false });
    const clusterScreen = new THREE.MeshBasicMaterial({ map: T.clusterScreen(), toneMapped: false });
    const miBadge = new THREE.MeshStandardMaterial({
      map: T.miBadge(), transparent: true, alphaTest: 0.05, roughness: 0.45,
      metalness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2
    });
    const ultraBadge = new THREE.MeshStandardMaterial({
      map: T.ultraBadge(), transparent: true, alphaTest: 0.04, roughness: 0.4,
      metalness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2
    });
    const ultraScript = new THREE.MeshStandardMaterial({
      map: T.ultraScript(), transparent: true, alphaTest: 0.04, roughness: 0.5,
      metalness: 0.1, color: 0xd9d9cf, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2
    });
    const wordmark = new THREE.MeshStandardMaterial({
      map: T.xiaomiWordmark(), transparent: true, alphaTest: 0.04, roughness: 0.4,
      metalness: 0.5, color: 0xfff6de, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2
    });
    const plate = new THREE.MeshStandardMaterial({ map: T.plate(), roughness: 0.6, metalness: 0.05 });
    const batteryLabel = new THREE.MeshStandardMaterial({
      map: T.batteryLabel(), roughness: 0.55, metalness: 0.2
    });
    const motorLabel = new THREE.MeshStandardMaterial({
      map: T.motorLabel(), transparent: true, alphaTest: 0.04, roughness: 0.45,
      metalness: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2
    });
    return {
      paint, paintEdge, paintCap, carbon, carbonMatte, stripe, blackGloss, blackPlastic, tire,
      rimMetal, rimGold, chrome, gold, glass, doorGlass, lampGlass, whiteLight, amberLight,
      redLight, brakeDisc, caliper, alcantara, yellowAccent, interiorBlack,
      copper, aluminium, orange, centerScreen, clusterScreen, miBadge, ultraBadge,
      ultraScript, wordmark, plate, batteryLabel, motorLabel
    };
  }

  /* ---------- helpers ---------- */
  function superSection(w, yB, yT, n, exponent) {
    n = n || 36;
    exponent = exponent || 3.0;
    const pts = [];
    const yc = (yB + yT) / 2;
    const hy = (yT - yB) / 2;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      pts.push({
        z: w * Math.sign(c) * Math.pow(Math.abs(c), 2 / exponent),
        y: yc + hy * Math.sign(s) * Math.pow(Math.abs(s), 2 / exponent)
      });
    }
    return pts;
  }
  function fixWinding(geo) {
    const pos = geo.attributes.position;
    const idx = geo.index;
    if (!idx) { geo.computeVertexNormals(); return geo; }
    let volume = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const arr = idx.array;
    for (let i = 0; i < arr.length; i += 3) {
      a.fromBufferAttribute(pos, arr[i]);
      b.fromBufferAttribute(pos, arr[i + 1]);
      c.fromBufferAttribute(pos, arr[i + 2]);
      volume += a.dot(b.clone().cross(c));
    }
    if (volume < 0) {
      for (let i = 0; i < arr.length; i += 3) {
        const tmp = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = tmp;
      }
      idx.needsUpdate = true;
    }
    geo.computeVertexNormals();
    return geo;
  }
  function loftClosed(stations, capStart, capEnd) {
    const N = stations[0].pts.length;
    const positions = [], uvs = [], indices = [];
    stations.forEach(function (st, si) {
      st.pts.forEach(function (p, pi) {
        positions.push(st.x, p.y, p.z);
        uvs.push(pi / N, si / Math.max(1, stations.length - 1));
      });
    });
    for (let si = 0; si < stations.length - 1; si++) {
      for (let pi = 0; pi < N; pi++) {
        const a = si * N + pi;
        const b = si * N + (pi + 1) % N;
        const c = (si + 1) * N + pi;
        const d = (si + 1) * N + (pi + 1) % N;
        indices.push(a, c, b, b, c, d);
      }
    }
    function addCap(si, reverse) {
      const st = stations[si];
      let cy = 0, cz = 0;
      st.pts.forEach(function (p) { cy += p.y; cz += p.z; });
      cy /= N; cz /= N;
      const center = positions.length / 3;
      positions.push(st.x, cy, cz);
      uvs.push(0.5, 0.5);
      for (let pi = 0; pi < N; pi++) {
        const i0 = si * N + pi;
        const i1 = si * N + (pi + 1) % N;
        if (reverse) indices.push(center, i1, i0);
        else indices.push(center, i0, i1);
      }
    }
    if (capStart) addCap(0, true);
    if (capEnd) addCap(stations.length - 1, false);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return fixWinding(geo);
  }
  function loftCap(station, x) {
    const pts = station.pts;
    const n = pts.length;
    let cy = 0, cz = 0;
    pts.forEach(function (p) { cy += p.y; cz += p.z; });
    cy /= n; cz /= n;
    const positions = [x, cy, cz], indices = [];
    pts.forEach(function (p) { positions.push(x, p.y, p.z); });
    for (let i = 0; i < n; i++) {
      const a = 1 + i, b = 1 + (i + 1) % n;
      indices.push(0, a, b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
  function loftSurface(stations) {
    const M = stations[0].pts.length;
    const positions = [], uvs = [], indices = [];
    stations.forEach(function (st, si) {
      st.pts.forEach(function (p, pi) {
        positions.push(st.x, p.y, p.z);
        uvs.push(pi / (M - 1), si / (stations.length - 1));
      });
    });
    for (let si = 0; si < stations.length - 1; si++) {
      for (let pi = 0; pi < M - 1; pi++) {
        const a = si * M + pi;
        const b = si * M + pi + 1;
        const c = (si + 1) * M + pi;
        const d = (si + 1) * M + pi + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
  function loftPanel(stations, thickness) {
    // stations: {x, pts:[{z,y}]} top surface left→right; close with a lower surface
    const topN = stations[0].pts.length;
    const sections = stations.map(function (st) {
      const pts = [];
      for (let i = 0; i < topN; i++) pts.push({ z: st.pts[i].z, y: st.pts[i].y });
      for (let i = topN - 1; i >= 0; i--) pts.push({ z: st.pts[i].z, y: st.pts[i].y - thickness });
      return { x: st.x, pts: pts };
    });
    return loftClosed(sections, true, true);
  }
  function canopySection(w, beltY, topY, seg) {
    seg = seg || 22;
    const pts = [];
    const p = 2.1;
    for (let i = 0; i <= seg; i++) {
      const z = -w + (2 * w) * (i / seg);
      const t = Math.abs(z) / w;
      const y = beltY + (topY - beltY) * (1 - Math.pow(t, p));
      pts.push({ z: z, y: y });
    }
    return pts;
  }

  /* ---------- shared hood / roof profiles + racing stripes ---------- */
  const HOOD_PROFILE = [
    [1.52, 1.12, 1.503], [2.0, 1.17, 1.523], [2.55, 1.21, 1.530],
    [3.0, 1.22, 1.455], [3.38, 1.15, 1.315], [3.55, 0.98, 1.205]
  ];
  const ROOF_PROFILE = [
    [-1.45, 0.90, 2.08], [-1.3, 0.96, 2.13], [-0.95, 0.99, 2.18],
    [-0.55, 1.0, 2.20], [-0.18, 1.0, 2.19], [0.18, 0.98, 2.12]
  ];
  function profileAt(profile, x) {
    if (x <= profile[0][0]) return { w: profile[0][1], yc: profile[0][2] };
    const last = profile[profile.length - 1];
    if (x >= last[0]) return { w: last[1], yc: last[2] };
    for (let i = 0; i < profile.length - 1; i++) {
      const a = profile[i], b = profile[i + 1];
      if (x >= a[0] && x <= b[0]) {
        const t = (x - a[0]) / (b[0] - a[0]);
        return { w: a[1] + (b[1] - a[1]) * t, yc: a[2] + (b[2] - a[2]) * t };
      }
    }
    return { w: last[1], yc: last[2] };
  }
  function hoodTopY(x, z) {
    const p = profileAt(HOOD_PROFILE, x);
    const t = (z + p.w) / (2 * p.w);
    return p.yc + 0.028 * (1 - Math.pow(z / p.w, 2)) - 0.01 * Math.pow(t - 0.5, 2);
  }
  function roofTopY(x, z) {
    const p = profileAt(ROOF_PROFILE, x);
    return p.yc + 0.016 * (1 - Math.pow(z / p.w, 2));
  }
  function buildRibbon(g, xStart, xEnd, steps, zc, halfW, yFn, mat, offset) {
    const positions = [], indices = [], uvs = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = xStart + (xEnd - xStart) * t;
      [-halfW, halfW].forEach(function (dz) {
        const z = zc + dz;
        positions.push(x, yFn(x, z) + (offset || 0), z);
        uvs.push(t, dz > 0 ? 1 : 0);
      });
    }
    for (let i = 0; i < steps; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    add(g, geo, mat, 0, 0, 0);
  }

  function add(g, geo, mat, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    g.add(m);
    return m;
  }
  function box(g, w, h, d, mat, x, y, z, rx, ry, rz) {
    return add(g, new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
  }
  function rbox(g, w, h, d, radius, mat, x, y, z, rx, ry, rz) {
    return add(g, new RoundedBoxGeometry(w, h, d, 3, radius), mat, x, y, z, rx, ry, rz);
  }
  function cylZ(g, rTop, rBot, h, seg, mat, x, y, z, open) {
    return add(g, new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, !!open), mat, x, y, z, Math.PI / 2, 0, 0);
  }
  function cylX(g, rTop, rBot, h, seg, mat, x, y, z, open) {
    return add(g, new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, !!open), mat, x, y, z, 0, 0, Math.PI / 2);
  }
  function cylY(g, rTop, rBot, h, seg, mat, x, y, z, open) {
    return add(g, new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, !!open), mat, x, y, z);
  }
  function torus(g, radius, tube, mat, x, y, z, rx, ry, rz, seg) {
    return add(g, new THREE.TorusGeometry(radius, tube, 10, seg || 64), mat, x, y, z, rx, ry, rz);
  }
  function plane(g, w, h, mat, x, y, z, rx, ry, rz) {
    return add(g, new THREE.PlaneGeometry(w, h), mat, x, y, z, rx, ry, rz);
  }
  function tube(g, points, radius, mat, seg) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.4);
    return add(g, new THREE.TubeGeometry(curve, seg || 64, radius, 8, false), mat, 0, 0, 0);
  }

  /* ============================================================
     BODY + SHELL
     ============================================================ */
  function bodyStations() {
    const raw = [
      [3.86, 1.10, 0.40, 1.08],
      [3.83, 1.16, 0.38, 1.12],
      [3.72, 1.28, 0.30, 1.22],
      [3.35, 1.44, 0.25, 1.38],
      [3.00, 1.49, 0.23, 1.47],
      [2.60, 1.50, 0.22, 1.53],
      [AXLE_F, 1.50, 0.22, 1.55],
      [1.90, 1.49, 0.22, 1.54],
      [1.50, 1.46, 0.22, 1.50],
      [1.45, 1.46, 0.22, 1.24],
      [1.00, 1.46, 0.22, 1.22],
      [0.30, 1.46, 0.22, 1.20],
      [-0.50, 1.46, 0.22, 1.20],
      [-1.20, 1.46, 0.22, 1.21],
      [-1.65, 1.46, 0.22, 1.23],
      [-1.70, 1.49, 0.22, 1.55],
      [AXLE_R, 1.50, 0.23, 1.56],
      [-2.80, 1.47, 0.26, 1.56],
      [-3.40, 1.40, 0.30, 1.52],
      [-3.65, 1.30, 0.33, 1.48],
      [-3.82, 1.22, 0.36, 1.45],
      [-3.86, 1.16, 0.38, 1.44]
    ];
    return raw.map(function (r) {
      const ax = Math.abs(r[0]);
      const exp = ax > 3.78 ? 4.7 : ax > 3.2 ? 3.9 : ax > 2.9 ? 3.3 : 3.1;
      return { x: r[0], pts: superSection(r[1], r[2], r[3], 36, exp) };
    });
  }

  function buildBody(g) {
    const st = bodyStations();
    add(g, loftClosed(st, false, false), MAT.paint, 0, 0, 0);
    // double-sided end caps: the closed loft's own caps are hard to orient
    // consistently across the forward/rear stations.
    add(g, loftCap(st[0], st[0].x), MAT.paintCap, 0, 0, 0);
    add(g, loftCap(st[st.length - 1], st[st.length - 1].x), MAT.paintCap, 0, 0, 0);
    // wheel arch trims only — no exaggerated wide-body rings
    [[AXLE_F, TRACK_F, 1.56], [AXLE_F, -TRACK_F, 1.56],
     [AXLE_R, TRACK_R, 1.60], [AXLE_R, -TRACK_R, 1.60]].forEach(function (w) {
      const sign = w[1] > 0 ? 1 : -1;
      add(g, new THREE.TorusGeometry(0.63, 0.024, 8, 44, Math.PI), MAT.blackGloss,
        w[0], WHEEL_Y, sign * (w[2] + 0.015));
      add(g, new THREE.TorusGeometry(0.65, 0.012, 6, 44, Math.PI), MAT.blackGloss,
        w[0], WHEEL_Y, sign * (w[2] + 0.02));
      // dark wheel-well backing so the shader-cut arch does not look hollow
      const well = add(g, new THREE.CircleGeometry(0.66, 36), MAT.interiorBlack,
        w[0], WHEEL_Y, sign * 1.27);
      well.rotation.y = sign > 0 ? 0 : Math.PI;
    });
    // carbon side skirts
    [-1, 1].forEach(function (s) {
      rbox(g, 3.4, 0.14, 0.16, 0.05, MAT.carbon, 0.35, 0.29, s * 1.486);
      rbox(g, 0.5, 0.2, 0.05, 0.03, MAT.carbon, 1.58, 0.27, s * 1.51);
      rbox(g, 0.6, 0.18, 0.04, 0.03, MAT.carbon, -2.2, 0.3, s * 1.5);
      // side black stripe with Ultra script
      rbox(g, 2.8, 0.17, 0.018, 0.02, MAT.blackGloss, 0.15, 0.52, s * 1.498);
      plane(g, 0.8, 0.4, MAT.ultraScript, -0.25, 0.52, s * 1.506, 0, s > 0 ? 0 : Math.PI, 0);
      // SU7 Ultra fender badge
      plane(g, 0.55, 0.155, MAT.ultraBadge, 1.76, 0.93, s * 1.472, 0, s > 0 ? 0 : Math.PI, 0);
      // front fender vent
      rbox(g, 0.28, 0.5, 0.045, 0.03, MAT.blackGloss, 1.74, 0.93, s * 1.462);
      box(g, 0.035, 0.4, 0.012, MAT.aluminium, 1.57, 0.93, s * 1.48);
      box(g, 0.035, 0.4, 0.012, MAT.aluminium, 1.91, 0.93, s * 1.48);
      // carbon mirror base / side camera pod
      rbox(g, 0.18, 0.06, 0.16, 0.02, MAT.blackGloss, 1.35, 1.28, s * 1.48);
      // subtle shoulder crease running through the doors
      tube(g, [
        new THREE.Vector3(1.42, 1.02, s * 1.455),
        new THREE.Vector3(0.7, 1.04, s * 1.468),
        new THREE.Vector3(-0.1, 1.02, s * 1.468),
        new THREE.Vector3(-0.9, 1.04, s * 1.468),
        new THREE.Vector3(-1.62, 1.02, s * 1.458)
      ], 0.012, MAT.paintEdge, 40);
    });
    // rear haunch vent
    [-1, 1].forEach(function (s) {
      rbox(g, 0.3, 0.18, 0.03, 0.02, MAT.blackGloss, -1.6, 0.92, s * 1.485);
      // outer door shut lines
      [1.44, 0.04, -1.68].forEach(function (x) {
        box(g, 0.018, 0.92, 0.014, MAT.blackGloss, x, 0.8, s * 1.505);
      });
      // door cut lines
      [1.48, 0.04, -1.68].forEach(function (x) {
        box(g, 0.012, 1.16, 0.008, MAT.blackGloss, x, 0.91, s * 1.502);
      });
      box(g, 3.2, 0.012, 0.008, MAT.blackGloss, -0.1, 1.493, s * 1.502);
      box(g, 3.2, 0.012, 0.008, MAT.blackGloss, -0.1, 0.34, s * 1.502);
      // beltline trim
      rbox(g, 3.05, 0.025, 0.02, 0.008, MAT.blackGloss, -0.12, 1.52, s * 1.5);
      // B-pillar black trim visible above the doors
      rbox(g, 0.11, 0.3, 0.025, 0.01, MAT.blackGloss, -0.5, 1.47, s * 1.492);
      // subtle side crease
      tube(g, [
        new THREE.Vector3(1.4, 1.06, s * 1.499),
        new THREE.Vector3(0.0, 1.03, s * 1.505),
        new THREE.Vector3(-1.55, 1.08, s * 1.499)
      ], 0.006, MAT.blackGloss, 24);
    });
    // body top / cowl vent trim
    rbox(g, 0.9, 0.035, 0.1, 0.02, MAT.blackGloss, 1.55, 1.51, 0.0);
    // panel seams (thin black lines)
    [-1, 1].forEach(function (s) {
      box(g, 0.015, 0.85, 0.008, MAT.blackGloss, 1.48, 0.82, s * 1.494);
      box(g, 0.015, 0.85, 0.008, MAT.blackGloss, -0.02, 0.82, s * 1.494);
      box(g, 0.015, 0.85, 0.008, MAT.blackGloss, -1.68, 0.82, s * 1.494);
    });
    // front fender crest strips
    [-1, 1].forEach(function (s) {
      rbox(g, 0.9, 0.03, 0.12, 0.02, MAT.paintEdge, 2.0, 1.51, s * 1.05);
    });
  }

  /* ============================================================
     HOOD
     ============================================================ */
  function buildHood(g) {
    const stations = HOOD_PROFILE.map(function (r) {
      const x = r[0], w = r[1], yc = r[2];
      const pts = [];
      const seg = 10;
      for (let i = 0; i <= seg; i++) {
        const t = i / seg;
        const z = -w + 2 * w * t;
        const y = hoodTopY(x, z);
        pts.push({ z: z, y: y });
      }
      return { x: x, pts: pts };
    });
    add(g, loftPanel(stations, 0.035), MAT.paint, 0, 0, 0);
    // grey racing stripes over the yellow hood
    [-0.23, 0.23].forEach(function (zc) {
      buildRibbon(g, 1.57, 3.53, 36, zc, 0.072, hoodTopY, MAT.stripe, 0.022);
    });
    // center gap / subtle crease between the stripes
    rbox(g, 1.85, 0.01, 0.02, 0.005, MAT.paintEdge, 2.55, 1.572, 0);
    // hood perimeter seams
    [-1, 1].forEach(function (s) {
      tube(g, [
        new THREE.Vector3(1.52, 1.52, s * 1.13),
        new THREE.Vector3(2.5, 1.545, s * 1.22),
        new THREE.Vector3(3.45, 1.25, s * 1.0)
      ], 0.009, MAT.blackGloss, 28);
    });
    tube(g, [
      new THREE.Vector3(3.55, 1.21, -0.96), new THREE.Vector3(3.58, 1.22, 0), new THREE.Vector3(3.55, 1.21, 0.96)
    ], 0.009, MAT.blackGloss, 24);
  }

  /* ============================================================
     FRONT AERO
     ============================================================ */
  function buildFrontFascia(g) {
    // The nose itself stays body-coloured. Only the lower bumper openings,
    // splitter and U-shaped blades are black / carbon.
    rbox(g, 0.16, 0.34, 2.02, 0.06, MAT.blackGloss, 3.89, 0.39, 0);
    // central lower grille
    rbox(g, 0.04, 0.18, 0.74, 0.03, MAT.blackPlastic, 3.96, 0.4, 0);
    for (let i = 0; i < 5; i++) {
      box(g, 0.018, 0.16, 0.02, MAT.carbon, 3.978, 0.4, -0.24 + i * 0.12);
    }
    // angular side intakes + U-shaped air blades
    [-1, 1].forEach(function (s) {
      rbox(g, 0.08, 0.2, 0.3, 0.035, MAT.blackGloss, 3.95, 0.4, s * 0.78);
      rbox(g, 0.018, 0.15, 0.2, 0.015, MAT.carbonMatte, 3.995, 0.4, s * 0.78);
      box(g, 0.28, 0.035, 0.11, MAT.carbon, 3.98, 0.27, s * 0.56, 0.1, 0, 0);
      box(g, 0.026, 0.18, 0.09, MAT.carbon, 4.03, 0.2, s * 0.65, 0, 0, s * 0.16);
      // vertical air-curtain slot outboard of the intake
      rbox(g, 0.03, 0.13, 0.07, 0.01, MAT.blackGloss, 3.96, 0.36, s * 1.02);
      // carbon canard
      box(g, 0.26, 0.024, 0.32, MAT.carbon, 4.0, 0.19, s * 0.92, 0, 0.1 * s, 0);
    });
    // wide black air intake below the lights
    rbox(g, 0.05, 0.16, 1.72, 0.025, MAT.blackGloss, 3.9, 0.69, 0);
    for (let i = 0; i < 7; i++) {
      box(g, 0.02, 0.13, 0.018, MAT.carbon, 3.93, 0.69, -0.63 + i * 0.21);
    }
    // body-colour centre blade splits the intake into left/right sections
    rbox(g, 0.055, 0.19, 0.18, 0.012, MAT.paint, 3.905, 0.69, 0);
    // carbon splitter / front lip
    rbox(g, 0.5, 0.04, 1.92, 0.03, MAT.carbon, 3.93, 0.155, 0);
    rbox(g, 0.16, 0.025, 1.7, 0.02, MAT.blackGloss, 4.13, 0.17, 0);
    // thin black lower lip between the intakes
    rbox(g, 0.04, 0.035, 1.0, 0.018, MAT.blackGloss, 3.97, 0.25, 0);
    // display plate with a dark inset
    rbox(g, 0.05, 0.12, 0.45, 0.02, MAT.blackGloss, 4.02, 0.53, 0);
    plane(g, 0.36, 0.09, MAT.plate, 4.05, 0.53, 0, 0, Math.PI / 2, 0);
    // parking sensors
    [-0.55, 0, 0.55].forEach(function (z) {
      add(g, new THREE.CircleGeometry(0.014, 10), MAT.blackPlastic, 3.98, 0.55, z, 0, Math.PI / 2, 0);
    });
    // front Xiaomi badge
    plane(g, 0.16, 0.16, MAT.miBadge, 3.94, 1.02, 0, 0, Math.PI / 2, 0);
    // front tow hook
    rbox(g, 0.04, 0.04, 0.09, 0.015, MAT.redLight, 3.98, 0.24, 0.36);
  }

  /* ============================================================
     REAR AERO
     ============================================================ */
  function buildRearFascia(g) {
    // body-coloured rear with a compact black lower bumper / diffuser
    rbox(g, 0.16, 0.3, 2.02, 0.05, MAT.blackGloss, -3.89, 0.39, 0);
    // carbon diffuser
    rbox(g, 0.46, 0.04, 1.72, 0.03, MAT.carbon, -3.9, 0.17, 0);
    for (let i = 0; i < 7; i++) {
      box(g, 0.4, 0.15, 0.02, MAT.carbon, -3.94, 0.25, -0.66 + i * 0.22);
    }
    // side vents / reflectors
    [-1, 1].forEach(function (s) {
      rbox(g, 0.08, 0.18, 0.27, 0.03, MAT.blackPlastic, -3.9, 0.52, s * 0.9);
      box(g, 0.022, 0.035, 0.15, MAT.redLight, -4.0, 0.31, s * 0.79);
    });
    // XIAOMI lettering + SU7 Ultra badge on the body-coloured tail
    plane(g, 0.86, 0.13, MAT.wordmark, -3.875, 1.12, 0, 0, -Math.PI / 2, 0);
    plane(g, 0.4, 0.11, MAT.ultraBadge, -3.875, 1.08, -0.55, 0, -Math.PI / 2, 0);
    // plate
    rbox(g, 0.04, 0.1, 0.4, 0.015, MAT.blackGloss, -3.98, 0.55, 0);
    plane(g, 0.37, 0.092, MAT.plate, -4.005, 0.55, 0, 0, -Math.PI / 2, 0);
    // rear camera / sensors
    add(g, new THREE.CircleGeometry(0.022, 12), MAT.blackGloss, -3.9, 1.02, 0, 0, -Math.PI / 2, 0);
    [-0.48, 0.48].forEach(function (z) {
      add(g, new THREE.CircleGeometry(0.014, 10), MAT.blackPlastic, -3.96, 0.43, z, 0, -Math.PI / 2, 0);
    });
    // ducktail lip above the rear panel
    rbox(g, 0.2, 0.04, 1.62, 0.02, MAT.carbon, -3.66, 1.49, 0);
    // thin black trim under the light bar
    rbox(g, 0.04, 0.04, 2.12, 0.015, MAT.blackGloss, -3.87, 1.33, 0);
  }

  /* ============================================================
     GLASS CANOPY
     ============================================================ */
  function canopyStations() {
    const raw = [
      [1.50, 1.38, 1.56, 1.57],
      [1.22, 1.36, 1.57, 1.78],
      [0.88, 1.30, 1.57, 1.96],
      [0.50, 1.22, 1.57, 2.08],
      [0.05, 1.14, 1.58, 2.15],
      [-0.38, 1.10, 1.58, 2.17],
      [-0.85, 1.08, 1.59, 2.15],
      [-1.35, 1.10, 1.60, 2.07],
      [-1.75, 1.18, 1.60, 1.92],
      [-2.15, 1.26, 1.61, 1.73],
      [-2.45, 1.32, 1.62, 1.60]
    ];
    return raw.map(function (r) {
      return { x: r[0], w: r[1], belt: r[2], top: r[3], pts: canopySection(r[1], r[2], r[3], 22) };
    });
  }
  function buildGlassCanopy(g) {
    const st = canopyStations();
    add(g, loftSurface(st), MAT.glass, 0, 0, 0);
    // side rails / belt trim
    [-1, 1].forEach(function (s) {
      const pts = st.map(function (a) { return new THREE.Vector3(a.x, a.belt + 0.015, s * a.w); });
      tube(g, pts, 0.03, MAT.blackGloss, 80);
      // thicker A-pillar
      tube(g, [
        new THREE.Vector3(1.50, 1.58, s * 1.33),
        new THREE.Vector3(0.78, 1.86, s * 1.19),
        new THREE.Vector3(0.05, 2.13, s * 1.08)
      ], 0.055, MAT.blackGloss, 36);
      // B-pillar
      tube(g, [
        new THREE.Vector3(-0.42, 1.58, s * 1.04),
        new THREE.Vector3(-0.45, 1.86, s * 1.02),
        new THREE.Vector3(-0.48, 2.1, s * 1.01)
      ], 0.045, MAT.blackGloss, 24);
      // C-pillar
      tube(g, [
        new THREE.Vector3(-1.38, 2.06, s * 1.01),
        new THREE.Vector3(-1.82, 1.83, s * 1.12),
        new THREE.Vector3(-2.28, 1.6, s * 1.24)
      ], 0.055, MAT.blackGloss, 32);
      // side window lower trim / beltline
      box(g, 1.9, 0.03, 0.025, MAT.blackGloss, -0.2, 1.57, s * 1.22);
    });
    // windshield header / rear header
    tube(g, [
      new THREE.Vector3(0.05, 2.14, -1.08), new THREE.Vector3(0.05, 2.15, 0), new THREE.Vector3(0.05, 2.14, 1.08)
    ], 0.04, MAT.blackGloss, 32);
    tube(g, [
      new THREE.Vector3(-2.45, 1.6, -1.2), new THREE.Vector3(-2.45, 1.6, 0), new THREE.Vector3(-2.45, 1.6, 1.2)
    ], 0.032, MAT.blackGloss, 32);
    // wipers
    [-0.42, 0.35].forEach(function (z) {
      rbox(g, 0.38, 0.018, 0.025, 0.008, MAT.blackGloss, 0.65, 1.77, z, 0, 0, -0.16);
    });
    // interior mirror
    rbox(g, 0.12, 0.06, 0.24, 0.02, MAT.blackGloss, 0.12, 2.02, 0);
    // roof antenna / camera pod (rear)
    rbox(g, 0.2, 0.05, 0.3, 0.02, MAT.blackGloss, -1.55, 2.13, 0);
  }

  /* ============================================================
     CARBON ROOF + LiDAR
     ============================================================ */
  function buildCarbonRoof(g) {
    const st = ROOF_PROFILE.slice().sort(function (a, b) { return a[0] - b[0]; }).map(function (r) {
      const x = r[0], w = r[1], yc = r[2];
      const pts = [];
      const seg = 10;
      for (let i = 0; i <= seg; i++) {
        const t = i / seg;
        const z = -w + 2 * w * t;
        const y = roofTopY(x, z);
        pts.push({ z: z, y: y });
      }
      return { x: x, pts: pts };
    });
    add(g, loftPanel(st, 0.035), MAT.carbon, 0, 0, 0);
    // grey racing stripes continue over the carbon roof
    [-0.23, 0.23].forEach(function (zc) {
      buildRibbon(g, 0.12, -1.4, 28, zc, 0.062, roofTopY, MAT.stripe, 0.018);
    });
    // LiDAR pod
    rbox(g, 0.36, 0.12, 0.42, 0.05, MAT.blackGloss, 0.4, 2.19, 0);
    rbox(g, 0.24, 0.03, 0.3, 0.03, MAT.lampGlass, 0.4, 2.255, 0);
    add(g, new THREE.PlaneGeometry(0.2, 0.05), MAT.amberLight, 0.4, 2.257, 0.0, -Math.PI / 2, 0, 0);
    // roof sensor camera
    add(g, new THREE.CircleGeometry(0.032, 16), MAT.blackGloss, 0.22, 2.26, -0.17, -Math.PI / 2, 0, 0);
    // panel edge trim
    [-1, 1].forEach(function (s) {
      box(g, 1.55, 0.02, 0.012, MAT.blackGloss, -0.65, 2.19, s * 0.97);
    });
  }

  /* ============================================================
     DOORS
     ============================================================ */
  function doorShape(xA, xB, yB, yT) {
    const s = new THREE.Shape();
    const r = 0.04;
    s.moveTo(xA, yB + r);
    s.quadraticCurveTo(xA, yB, xA - r, yB);
    s.lineTo(xB + r, yB);
    s.quadraticCurveTo(xB, yB, xB, yB + r);
    s.lineTo(xB, yT - r);
    s.quadraticCurveTo(xB, yT, xB + r, yT);
    s.lineTo(xA - r, yT);
    s.quadraticCurveTo(xA, yT, xA, yT - r);
    s.lineTo(xA, yB + r);
    s.closePath();
    return s;
  }
  function buildDoorSide(g, side) {
    const z = side * 1.455;
    // front & rear doors
    [[1.44, 0.04], [0.04, -1.68]].forEach(function (r) {
      const shape = doorShape(r[0], r[1], 0.34, 1.5);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 16 });
      add(g, geo, MAT.paint, 0, 0, z);
    });
    // top black window trim
    rbox(g, 1.5, 0.035, 0.035, 0.01, MAT.blackGloss, 0.7, 1.51, z + side * 0.025);
    // outer side-window glass with tapered A/C-pillar shapes
    [
      [[1.38, 1.23], [1.22, 1.46], [0.12, 1.49], [0.10, 1.23]],
      [[0.02, 1.23], [-0.02, 1.475], [-1.42, 1.45], [-1.56, 1.23]]
    ].forEach(function (win) {
      const xs = win.map(function (p) { return p[0]; });
      const cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
      const shape = new THREE.Shape();
      win.forEach(function (p, i) {
        if (i === 0) shape.moveTo(p[0] - cx, p[1]);
        else shape.lineTo(p[0] - cx, p[1]);
      });
      shape.closePath();
      const geo = new THREE.ShapeGeometry(shape);
      const mesh = add(g, geo, MAT.doorGlass, cx, 0, side * 1.507, 0, side > 0 ? 0 : Math.PI, 0);
      mesh.renderOrder = 1;
      const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      box(g, x1 - x0, 0.022, 0.02, MAT.blackGloss, cx, 1.49, side * 1.509);
      box(g, x1 - x0, 0.022, 0.02, MAT.blackGloss, cx, 1.225, side * 1.509);
    });
    box(g, 0.022, 0.3, 0.02, MAT.blackGloss, 0.04, 1.36, side * 1.51);
    // flush handles
    [0.36, -1.05].forEach(function (x) {
      rbox(g, 0.25, 0.045, 0.025, 0.012, MAT.chrome, x, 0.94, z + side * 0.027);
    });
    // lower door black trim
    rbox(g, 2.8, 0.09, 0.025, 0.01, MAT.blackGloss, -0.15, 0.37, z + side * 0.025);
    // door seam
    box(g, 0.012, 1.1, 0.01, MAT.blackGloss, 0.04, 0.9, z + side * 0.026);
    // black upper window frame / beltline
    rbox(g, 1.5, 0.04, 0.03, 0.01, MAT.blackGloss, 0.72, 1.50, z + side * 0.03);
    rbox(g, 1.7, 0.04, 0.03, 0.01, MAT.blackGloss, -0.82, 1.50, z + side * 0.03);
    // inner door card (reads as an assembly when the door is exploded)
    rbox(g, 2.9, 0.9, 0.03, 0.02, MAT.interiorBlack, -0.12, 0.92, z - side * 0.03);
    rbox(g, 0.95, 0.08, 0.035, 0.01, MAT.carbon, 0.7, 0.63, z - side * 0.035);
    // carbon mirror
    const mz = z + side * 0.13;
    rbox(g, 0.18, 0.06, 0.12, 0.02, MAT.blackGloss, 1.38, 1.35, mz);
    rbox(g, 0.16, 0.1, 0.24, 0.04, MAT.carbon, 1.32, 1.43, mz + side * 0.08);
    rbox(g, 0.13, 0.02, 0.18, 0.01, MAT.chrome, 1.32, 1.47, mz + side * 0.08);
    box(g, 0.2, 0.035, 0.03, MAT.blackGloss, 1.25, 1.2, z + side * 0.025);
  }
  function buildLeftDoors(g) { buildDoorSide(g, -1); }
  function buildRightDoors(g) { buildDoorSide(g, 1); }

  /* ============================================================
     REAR WING
     ============================================================ */
  function buildRearWing(g) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.23, 0);
    shape.quadraticCurveTo(-0.12, 0.07, 0.12, 0.055);
    shape.quadraticCurveTo(0.28, 0.045, 0.25, 0.005);
    shape.quadraticCurveTo(0.12, -0.045, -0.23, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 2.06, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012,
      bevelSegments: 2, curveSegments: 18
    });
    geo.translate(0, 0, -1.03);
    add(g, geo, MAT.carbon, -3.48, 2.04, 0);
    // endplates
    [-1, 1].forEach(function (s) {
      const ep = new THREE.Shape();
      ep.moveTo(-0.28, 0);
      ep.lineTo(0.26, 0.02);
      ep.quadraticCurveTo(0.34, 0.18, 0.22, 0.3);
      ep.lineTo(-0.2, 0.3);
      ep.quadraticCurveTo(-0.32, 0.18, -0.28, 0);
      ep.closePath();
      add(g, new THREE.ExtrudeGeometry(ep, { depth: 0.035, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 1, curveSegments: 16 }),
        MAT.carbon, -3.48, 2.02, s * 1.02);
    });
    // swan-neck pylons
    [-0.58, 0.58].forEach(function (z) {
      rbox(g, 0.08, 0.42, 0.09, 0.02, MAT.carbon, -3.36, 1.84, z, 0, 0, -0.12);
      rbox(g, 0.06, 0.28, 0.06, 0.01, MAT.carbon, -3.55, 1.9, z, 0, 0, 0.2);
    });
    // wing adjustment bracket
    rbox(g, 0.16, 0.08, 0.1, 0.02, MAT.aluminium, -3.25, 2.08, 0.3);
  }

  /* ============================================================
     LIGHTS
     ============================================================ */
  function headlightShape(scale) {
    const s = new THREE.Shape();
    const w = 0.30 * scale, h = 0.052 * scale;
    s.moveTo(-w, 0);
    s.quadraticCurveTo(-w * 0.35, h, w * 0.55, h * 0.85);
    s.quadraticCurveTo(w, h * 0.4, w * 0.94, 0);
    s.quadraticCurveTo(w * 0.4, -h * 0.65, -w * 0.4, -h * 0.55);
    s.quadraticCurveTo(-w * 0.9, -h * 0.3, -w, 0);
    s.closePath();
    return s;
  }
  function buildHeadlights(g) {
    [-1, 1].forEach(function (s) {
      const z = s * 0.76;
      const y = 1.0;
      // teardrop LED headlamp set into the body-coloured nose
      const surroundGeo = new THREE.ExtrudeGeometry(headlightShape(1.5), {
        depth: 0.025, bevelEnabled: false, curveSegments: 18
      });
      surroundGeo.rotateY(Math.PI / 2);
      add(g, surroundGeo, MAT.blackPlastic, 3.85, y, z);
      const housingGeo = new THREE.ExtrudeGeometry(headlightShape(1.36), {
        depth: 0.035, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006,
        bevelSegments: 2, curveSegments: 18
      });
      housingGeo.rotateY(Math.PI / 2);
      add(g, housingGeo, MAT.blackGloss, 3.88, y, z);
      // bright inner LED lens (reads as silver when the car is off)
      const glowGeo = new THREE.ExtrudeGeometry(headlightShape(1.06), {
        depth: 0.008, bevelEnabled: false, curveSegments: 16
      });
      glowGeo.rotateY(Math.PI / 2);
      add(g, glowGeo, MAT.whiteLight, 3.925, y, z);
      // slim DRL bar along the top edge
      box(g, 0.016, 0.02, 0.4, MAT.whiteLight, 3.937, y + 0.032, z, 0, 0.04, 0);
      box(g, 0.012, 0.006, 0.25, MAT.amberLight, 3.939, y - 0.005, z, 0, 0.025, 0);
      // projectors
      add(g, new THREE.CircleGeometry(0.035, 20), MAT.chrome, 3.94, y - 0.01, z - s * 0.07, 0, Math.PI / 2, 0);
      add(g, new THREE.CircleGeometry(0.026, 18), MAT.whiteLight, 3.942, y - 0.01, z - s * 0.07, 0, Math.PI / 2, 0);
      // thin backing bracket
      rbox(g, 0.07, 0.1, 0.24, 0.02, MAT.blackPlastic, 3.82, y - 0.02, z * 0.97);
    });
  }
  function buildTaillight(g) {
    // slim black housing instead of a huge tail panel
    rbox(g, 0.05, 0.09, 2.28, 0.02, MAT.blackGloss, -3.86, 1.4, 0);
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const z = -1.28 + 2.56 * t;
      const x = -3.88 - 0.025 * Math.sin(Math.PI * t);
      pts.push(new THREE.Vector3(x, 1.42, z));
    }
    tube(g, pts, 0.045, MAT.blackGloss, 60);
    const pts2 = pts.map(function (p) { return new THREE.Vector3(p.x - 0.03, p.y, p.z); });
    tube(g, pts2, 0.022, MAT.redLight, 60);
    // widened end blocks
    [-1, 1].forEach(function (s) {
      rbox(g, 0.04, 0.08, 0.18, 0.02, MAT.redLight, -3.885, 1.42, s * 1.18);
      rbox(g, 0.05, 0.13, 0.24, 0.03, MAT.blackGloss, -3.86, 1.42, s * 1.2);
      rbox(g, 0.035, 0.24, 0.035, 0.01, MAT.redLight, -3.885, 1.28, s * 1.08);
    });
    // high-mount brake light
    rbox(g, 0.03, 0.02, 0.36, 0.01, MAT.redLight, -2.7, 1.57, 0);
  }

  /* ============================================================
     WHEELS
     ============================================================ */
  function wheelAssembly(front, x, z) {
    const width = front ? TIRE_W_F : TIRE_W_R;
    const g = new THREE.Group();
    g.position.set(x, WHEEL_Y, z);
    const side = z > 0 ? 1 : -1;
    // tread band
    const tread = new THREE.Mesh(
      new THREE.CylinderGeometry(WHEEL_R - 0.012, WHEEL_R - 0.012, width * 0.72, 64, 1, true),
      MAT.tire
    );
    tread.rotation.x = Math.PI / 2;
    g.add(tread);
    // rounded shoulders
    [-1, 1].forEach(function (s) {
      const shoulder = new THREE.Mesh(
        new THREE.TorusGeometry(WHEEL_R - width * 0.16, width * 0.16, 12, 64),
        MAT.tire
      );
      shoulder.position.z = s * width * 0.36;
      g.add(shoulder);
    });
    // rim barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, width * 0.44, 64, 1, true),
      MAT.rimMetal
    );
    barrel.rotation.x = Math.PI / 2;
    g.add(barrel);
    // rim outer lip
    [-1, 1].forEach(function (s) {
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.398, 0.018, 8, 64), MAT.chrome);
      lip.position.z = s * width * 0.22;
      g.add(lip);
      const goldRing = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.007, 6, 64), MAT.rimGold);
      goldRing.position.z = s * width * 0.225;
      g.add(goldRing);
      const sideRing = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.006, 6, 64), MAT.rimMetal);
      sideRing.position.z = s * width * 0.49;
      g.add(sideRing);
      const faceRing = new THREE.Mesh(new THREE.TorusGeometry(0.365, 0.012, 8, 48), MAT.chrome);
      faceRing.position.z = s * (width * 0.2 + 0.02);
      g.add(faceRing);
    });
    // 10 U-ish spokes (each pair forms a subtle Y)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.31, 0.045), MAT.rimMetal);
      spoke.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.19, width * 0.2);
      spoke.rotation.z = a - Math.PI / 2;
      g.add(spoke);
      // split branch
      [-0.16, 0.16].forEach(function (off) {
        const branch = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.15, 0.035), MAT.rimMetal);
        branch.position.set(Math.cos(a + off) * 0.32, Math.sin(a + off) * 0.32, width * 0.2);
        branch.rotation.z = a + off - Math.PI / 2;
        g.add(branch);
      });
    }
    // hub + centre cap
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 32), MAT.rimMetal);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = side * (width * 0.2 + 0.02);
    g.add(hub);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.085, 24), MAT.miBadge);
    cap.position.z = side * (width * 0.2 + 0.065);
    if (side < 0) cap.rotation.y = Math.PI;
    g.add(cap);
    return g;
  }
  function buildWheels(g) {
    const info = [
      { front: true, x: AXLE_F, z: -TRACK_F, off: [0.3, 0.2, -2.4] },
      { front: true, x: AXLE_F, z: TRACK_F, off: [0.3, 0.2, 2.4] },
      { front: false, x: AXLE_R, z: -TRACK_R, off: [-0.3, 0.2, -2.4] },
      { front: false, x: AXLE_R, z: TRACK_R, off: [-0.3, 0.2, 2.4] }
    ];
    info.forEach(function (it) {
      const wg = wheelAssembly(it.front, it.x, it.z);
      wg.userData.subExplode = it.off;
      g.add(wg);
    });
  }

  /* ============================================================
     BRAKES
     ============================================================ */
  function brakeAssembly(front, x, z) {
    const g = new THREE.Group();
    g.position.set(x, WHEEL_Y, z);
    const side = z > 0 ? 1 : -1;
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.035, 64, 1),
      [MAT.rimMetal, MAT.brakeDisc, MAT.brakeDisc]
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.z = -side * 0.055;
    g.add(disc);
    // caliper
    const cal = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.2, 0.12, 3, 0.04), MAT.caliper);
    cal.position.set(-0.05, 0.17, -side * 0.075);
    cal.rotation.z = -0.2;
    g.add(cal);
    // caliper text plate
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.045), MAT.blackGloss);
    cp.position.set(-0.05, 0.17, -side * (0.075 + 0.061));
    if (side < 0) cp.rotation.y = Math.PI;
    g.add(cp);
    // hat
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 32), MAT.blackGloss);
    hat.rotation.x = Math.PI / 2;
    hat.position.z = -side * 0.09;
    g.add(hat);
    return g;
  }
  function buildBrakes(g) {
    const info = [
      { front: true, x: AXLE_F, z: -TRACK_F, off: [0.3, 0.85, -2.2] },
      { front: true, x: AXLE_F, z: TRACK_F, off: [0.3, 0.85, 2.2] },
      { front: false, x: AXLE_R, z: -TRACK_R, off: [-0.3, 0.85, -2.2] },
      { front: false, x: AXLE_R, z: TRACK_R, off: [-0.3, 0.85, 2.2] }
    ];
    info.forEach(function (it) {
      const bg = brakeAssembly(it.front, it.x, it.z);
      bg.userData.subExplode = it.off;
      g.add(bg);
    });
  }

  /* ============================================================
     SUSPENSION
     ============================================================ */
  function springCurve(x, y0, y1, z, radius, turns) {
    const pts = [];
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(x + Math.cos(a) * radius, y0 + (y1 - y0) * t, z + Math.sin(a) * radius));
    }
    return pts;
  }
  function suspensionAssembly(front, x, z) {
    const g = new THREE.Group();
    const innerZ = z * 0.82;
    const baseY = 0.2;
    // lower arm
    rbox(g, 0.4, 0.07, 0.16, 0.02, MAT.aluminium, x - 0.2, 0.23, innerZ);
    rbox(g, 0.16, 0.07, 0.58, 0.02, MAT.aluminium, x - 0.35, 0.23, innerZ);
    // strut / spring
    tube(g, springCurve(x - 0.12, 0.32, 0.92, innerZ, 0.08, 6), 0.018, MAT.yellowAccent, 120);
    cylY(g, 0.035, 0.035, 0.9, 16, MAT.chrome, x - 0.12, 0.62, innerZ);
    rbox(g, 0.18, 0.08, 0.18, 0.03, MAT.blackGloss, x - 0.12, 1.02, innerZ);
    rbox(g, 0.22, 0.06, 0.22, 0.03, MAT.blackGloss, x - 0.12, 0.25, innerZ);
    // upright
    rbox(g, 0.12, 0.34, 0.14, 0.03, MAT.aluminium, x, 0.55, innerZ);
    return g;
  }
  function buildSuspension(g) {
    const info = [
      { front: true, x: AXLE_F, z: -TRACK_F, off: [0.2, 0.2, -1.5] },
      { front: true, x: AXLE_F, z: TRACK_F, off: [0.2, 0.2, 1.5] },
      { front: false, x: AXLE_R, z: -TRACK_R, off: [-0.2, 0.2, -1.5] },
      { front: false, x: AXLE_R, z: TRACK_R, off: [-0.2, 0.2, 1.5] }
    ];
    info.forEach(function (it) {
      const sg = suspensionAssembly(it.front, it.x, it.z);
      sg.userData.subExplode = it.off;
      g.add(sg);
    });
  }

  /* ============================================================
     BATTERY / MOTORS / CHASSIS
     ============================================================ */
  function buildBattery(g) {
    rbox(g, 3.7, 0.32, 1.72, 0.10, MAT.blackGloss, 0.0, 0.4, 0);
    rbox(g, 3.52, 0.03, 1.56, 0.05, MAT.orange, 0.0, 0.575, 0);
    // top label
    plane(g, 1.6, 0.8, MAT.batteryLabel, 0.25, 0.58, 0.0, -Math.PI / 2, 0, 0);
    // high-voltage connectors
    [-0.5, 0.5].forEach(function (z) {
      rbox(g, 0.22, 0.12, 0.16, 0.03, MAT.orange, 1.5, 0.48, z * 1.2);
      cylX(g, 0.055, 0.055, 0.28, 16, MAT.copper, 1.65, 0.48, z * 1.2);
    });
    // cooling plate
    rbox(g, 2.9, 0.04, 1.4, 0.05, MAT.aluminium, 0.0, 0.235, 0);
    // mounting ears
    [[-1.45, -0.65], [-1.45, 0.65], [1.45, -0.65], [1.45, 0.65]].forEach(function (p) {
      box(g, 0.1, 0.16, 0.1, MAT.aluminium, p[0], 0.34, p[1]);
    });
  }

  function motorUnit(g, x, z, label) {
    // motor body
    cylX(g, 0.28, 0.28, 0.48, 32, MAT.aluminium, x, 0.46, z);
    cylX(g, 0.3, 0.3, 0.06, 24, MAT.copper, x + 0.12, 0.46, z);
    cylX(g, 0.3, 0.3, 0.06, 24, MAT.copper, x - 0.12, 0.46, z);
    // inverter / gearbox
    rbox(g, 0.38, 0.3, 0.32, 0.04, MAT.blackGloss, x - 0.38, 0.46, z);
    rbox(g, 0.18, 0.14, 0.2, 0.03, MAT.aluminium, x + 0.35, 0.46, z);
    // label
    if (label) {
      const p = plane(g, 0.36, 0.12, MAT.motorLabel, x, 0.63, z, -Math.PI / 2, 0, 0);
    }
    // high-voltage cable
    tube(g, [
      new THREE.Vector3(x - 0.1, 0.6, z),
      new THREE.Vector3(x - 0.5, 0.62, z + 0.12),
      new THREE.Vector3(x - 0.9, 0.5, z + 0.25)
    ], 0.025, MAT.orange, 24);
  }
  function buildMotors(g) {
    motorUnit(g, 2.15, 0, true);
    motorUnit(g, -1.85, -0.48, true);
    motorUnit(g, -1.85, 0.48, true);
    // rear gearbox / torque vectoring housing
    rbox(g, 0.5, 0.26, 1.15, 0.05, MAT.blackGloss, -1.3, 0.46, 0);
    // drive shafts
    [-1, 1].forEach(function (s) {
      cylX(g, 0.06, 0.06, 1.05, 16, MAT.chrome, -0.55, 0.5, s * 0.65);
      cylX(g, 0.06, 0.06, 0.85, 16, MAT.chrome, 1.1, 0.5, s * 0.65);
    });
    // mounting cradle
    box(g, 3.8, 0.06, 0.08, MAT.aluminium, 0, 0.74, 0.0);
  }

  function buildChassis(g) {
    rbox(g, 4.8, 0.1, 1.82, 0.08, MAT.carbonMatte, 0.0, 0.27, 0);
    // longitudinal rails
    [-1, 1].forEach(function (s) {
      rbox(g, 4.9, 0.12, 0.11, 0.04, MAT.aluminium, 0, 0.34, s * 0.82);
      rbox(g, 3.6, 0.08, 0.12, 0.03, MAT.aluminium, 0, 0.17, s * 0.68);
      // subframe towers
      rbox(g, 0.22, 0.34, 0.2, 0.04, MAT.aluminium, AXLE_F - 0.1, 0.42, s * 0.9);
      rbox(g, 0.22, 0.34, 0.2, 0.04, MAT.aluminium, AXLE_R + 0.1, 0.42, s * 0.9);
    });
    // cross members
    [2.0, 0.5, -1.2, -2.1].forEach(function (x) {
      rbox(g, 0.14, 0.1, 1.85, 0.03, MAT.aluminium, x, 0.32, 0);
    });
    // carbon underbody
    rbox(g, 4.3, 0.025, 1.55, 0.05, MAT.carbon, 0.0, 0.205, 0);
    // brake lines
    [[-1, 1], [-1, -1], [1, 1], [1, -1]].forEach(function (s) {
      tube(g, [
        new THREE.Vector3(s[0] * 1.2, 0.37, s[1] * 0.6),
        new THREE.Vector3(s[0] * 2.0, 0.34, s[1] * 0.9),
        new THREE.Vector3(s[0] * 2.3, 0.5, s[1] * 1.05)
      ], 0.012, MAT.orange, 18);
    });
    // front / rear subframes
    rbox(g, 0.8, 0.14, 1.5, 0.05, MAT.aluminium, 2.15, 0.4, 0);
    rbox(g, 0.8, 0.14, 1.5, 0.05, MAT.aluminium, -1.9, 0.4, 0);
  }

  /* ============================================================
     INTERIOR
     ============================================================ */
  function bucketSeat(g, x, z, driver) {
    const baseY = 1.24;
    // carbon shell back
    rbox(g, 0.08, 0.7, 0.46, 0.03, MAT.carbon, x - 0.22, baseY + 0.42, z, 0, 0, 0.18);
    // cushion
    rbox(g, 0.48, 0.12, 0.48, 0.06, MAT.alcantara, x, baseY + 0.05, z);
    // backrest
    rbox(g, 0.16, 0.66, 0.44, 0.06, MAT.alcantara, x - 0.2, baseY + 0.42, z, 0, 0, 0.18);
    // side bolsters
    [-1, 1].forEach(function (s) {
      rbox(g, 0.36, 0.3, 0.06, 0.03, MAT.alcantara, x - 0.16, baseY + 0.32, z + s * 0.2, 0, 0, 0.12);
      rbox(g, 0.1, 0.38, 0.06, 0.02, MAT.alcantara, x - 0.2, baseY + 0.48, z + s * 0.21, 0, 0, 0.18);
      box(g, 0.012, 0.045, 0.42, MAT.yellowAccent, x + 0.02, baseY + 0.03, z + s * 0.2);
    });
    // yellow accent stripe
    rbox(g, 0.02, 0.45, 0.06, 0.01, MAT.yellowAccent, x - 0.21, baseY + 0.42, z - 0.22, 0, 0, 0.18);
    // headrest
    rbox(g, 0.28, 0.16, 0.3, 0.04, MAT.alcantara, x - 0.27, baseY + 0.73, z, 0, 0, 0.18);
    // seatbelt
    if (driver) {
      box(g, 0.02, 0.02, 0.38, MAT.yellowAccent, x - 0.25, baseY + 0.55, z + 0.14, 0.4, 0, 0.1);
    }
    // base rails
    rbox(g, 0.5, 0.035, 0.08, 0.01, MAT.aluminium, x, baseY - 0.01, z - 0.16);
    rbox(g, 0.5, 0.035, 0.08, 0.01, MAT.aluminium, x, baseY - 0.01, z + 0.16);
  }
  function rearSeat(g) {
    rbox(g, 0.9, 0.1, 1.35, 0.06, MAT.alcantara, -1.35, 1.28, 0);
    rbox(g, 0.12, 0.4, 1.3, 0.04, MAT.alcantara, -1.86, 1.46, 0, 0, 0, -0.16);
    [-1, 1].forEach(function (s) {
      rbox(g, 0.3, 0.12, 0.4, 0.04, MAT.alcantara, -1.35, 1.3, s * 0.35);
      box(g, 0.02, 0.02, 0.7, MAT.yellowAccent, -1.4, 1.47, s * 0.6, 0, 0, -0.2);
    });
  }
  function buildInterior(g) {
    // cockpit floor & tub
    rbox(g, 2.8, 0.04, 2.2, 0.08, MAT.interiorBlack, 0.0, 1.225, 0);
    rbox(g, 2.4, 0.16, 0.12, 0.03, MAT.carbon, -0.1, 1.3, -0.98);
    rbox(g, 2.4, 0.16, 0.12, 0.03, MAT.carbon, -0.1, 1.3, 0.98);
    // dashboard
    rbox(g, 0.4, 0.3, 2.06, 0.08, MAT.interiorBlack, 1.28, 1.53, 0);
    rbox(g, 0.18, 0.16, 1.8, 0.04, MAT.carbon, 1.2, 1.68, 0);
    // central 16.1" screen (faces driver, -X)
    const screen = plane(g, 0.82, 0.46, MAT.centerScreen, 1.05, 1.58, -0.12, 0, -Math.PI / 2, 0);
    screen.rotation.z = 0.02;
    rbox(g, 0.86, 0.5, 0.03, 0.02, MAT.blackGloss, 1.03, 1.58, -0.12, 0, 0, 0.02);
    // instrument cluster
    plane(g, 0.4, 0.18, MAT.clusterScreen, 1.18, 1.62, -0.54, 0, -Math.PI / 2, 0);
    // steering wheel
    const wheel = new THREE.Group();
    wheel.position.set(1.05, 1.62, -0.5);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.032, 10, 40), MAT.carbon);
    rim.rotation.y = Math.PI / 2;
    wheel.add(rim);
    const marker = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 12, 0.45), MAT.yellowAccent);
    marker.rotation.y = Math.PI / 2;
    marker.rotation.x = -0.2;
    wheel.add(marker);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 24), MAT.interiorBlack);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);
    const hubCap = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), MAT.blackGloss);
    hubCap.position.x = -0.035;
    hubCap.rotation.y = -Math.PI / 2;
    wheel.add(hubCap);
    g.add(wheel);
    // centre console
    rbox(g, 1.15, 0.24, 0.3, 0.06, MAT.carbon, 0.0, 1.32, 0);
    rbox(g, 0.2, 0.08, 0.16, 0.03, MAT.blackGloss, 0.25, 1.46, 0);
    add(g, new THREE.CircleGeometry(0.055, 20), MAT.redLight, 0.52, 1.44, 0, -Math.PI / 2, 0, 0);
    // seats (LHD driver on -Z side)
    bucketSeat(g, 0.25, -0.5, true);
    bucketSeat(g, 0.25, 0.5, false);
    rearSeat(g);
    // door cards / sills
    [-1, 1].forEach(function (s) {
      rbox(g, 1.4, 0.12, 0.08, 0.03, MAT.carbon, 0.2, 1.54, s * 0.98);
      rbox(g, 1.5, 0.05, 0.05, 0.02, MAT.yellowAccent, 0.2, 1.47, s * 0.96);
    });
    // pedals
    rbox(g, 0.06, 0.04, 0.22, 0.01, MAT.chrome, 1.22, 1.32, -0.65);
    rbox(g, 0.06, 0.04, 0.16, 0.01, MAT.chrome, 1.22, 1.28, -0.4);
  }

  /* ============================================================
     REGISTRATION
     ============================================================ */
  const BUILDERS = {
    body: buildBody,
    carbonRoof: buildCarbonRoof,
    hood: buildHood,
    frontFascia: buildFrontFascia,
    rearFascia: buildRearFascia,
    glassCanopy: buildGlassCanopy,
    leftDoors: buildLeftDoors,
    rightDoors: buildRightDoors,
    rearWing: buildRearWing,
    headlights: buildHeadlights,
    taillight: buildTaillight,
    wheels: buildWheels,
    brakes: buildBrakes,
    suspension: buildSuspension,
    battery: buildBattery,
    motors: buildMotors,
    interior: buildInterior,
    chassis: buildChassis
  };

  function registerPart(root, meta, content, parts, pickables) {
    content.updateMatrixWorld(true);
    const box3 = new THREE.Box3().setFromObject(content);
    const center = box3.getCenter(new THREE.Vector3());
    const size = box3.getSize(new THREE.Vector3());

    // sub-assemblies (four wheels / four brakes / four struts)
    const subParts = [];
    content.children.forEach(function (child) {
      if (child.userData && child.userData.subExplode) {
        subParts.push({
          obj: child,
          base: child.position.clone(),
          offset: new THREE.Vector3().fromArray(child.userData.subExplode)
        });
      }
    });

    content.children.forEach(function (child) {
      child.position.sub(center);
    });
    subParts.forEach(function (sp) { sp.base = sp.obj.position.clone(); });

    const pivot = new THREE.Group();
    pivot.name = 'part-' + meta.id;
    pivot.position.copy(center);
    pivot.add(content);
    root.add(pivot);

    const glowMats = [];
    const seen = new Set();
    content.traverse(function (o) {
      if (!o.isMesh) return;
      o.userData.partId = meta.id;
      o.material = Array.isArray(o.material)
        ? o.material.map(function (m) { return m.clone(); })
        : o.material.clone();
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach(function (m) {
        if (seen.has(m.uuid)) return;
        seen.add(m.uuid);
        if (m.userData && m.userData.archCut) applyArchCut(m);
        if (m.emissive && !o.userData.noGlow && !m.userData.noGlow) {
          m.userData.baseEmissive = m.emissive.clone();
          m.userData.baseEmissiveIntensity = m.emissiveIntensity;
          glowMats.push(m);
        }
      });
      pickables.push(o);
    });
    if (meta.noGlow) glowMats.length = 0;

    const anchor = new THREE.Object3D();
    const abs = meta.anchorAbs || [center.x, center.y + size.y * 0.35, center.z];
    if (subParts.length) {
      // let grouped sub-assemblies (e.g. the four wheels) carry the label so
      // that it follows a real corner when the assembly fans out.
      const host = subParts[0].obj;
      anchor.position.set(
        abs[0] - center.x - subParts[0].base.x,
        abs[1] - center.y - subParts[0].base.y,
        abs[2] - center.z - subParts[0].base.z
      );
      host.add(anchor);
    } else {
      anchor.position.set(abs[0] - center.x, abs[1] - center.y, abs[2] - center.z);
      content.add(anchor);
    }

    const part = {
      id: meta.id,
      meta: meta,
      pivot: pivot,
      content: content,
      center: center.clone(),
      size: size.clone(),
      anchor: anchor,
      glowMats: glowMats,
      subParts: subParts
    };
    parts.push(part);
    return part;
  }

  function createModel() {
    MAT = makeMaterials();
    const root = new THREE.Group();
    root.name = 'XiaomiSU7Ultra';
    const parts = [];
    const pickables = [];
    META.forEach(function (meta) {
      const content = new THREE.Group();
      content.name = 'content-' + meta.id;
      BUILDERS[meta.id](content);
      const part = registerPart(root, meta, content, parts, pickables);
      part.index = String(parts.length).padStart(2, '0');
    });
    const byId = {};
    parts.forEach(function (p) { byId[p.id] = p; });
    return {
      root: root,
      parts: parts,
      byId: byId,
      pickables: pickables,
      materials: MAT,
      dimensions: { length: LENGTH, width: WIDTH, height: HEIGHT },
      floorY: -0.035,
      deviceY: 0,
      explodedLift: 1.2,
      grounded: true
    };
  }

  window.SU7.createModel = createModel;
})();
