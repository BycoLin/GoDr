/**
 * 按学科 × 年级扩充题库，每个年级至少 MIN_PER_GRADE 条。
 * 运行：node scripts/expand-items.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { POETRY_BY_GRADE } from './data/poetry-bank.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'miniprogram', 'data', 'packs');
const require = createRequire(import.meta.url);

const MIN_PER_GRADE = 50;
const GRADES = [0, 1, 2, 3, 4];

const SKILL_NAMES = {
  add: '加法',
  sub: '减法',
  mix: '混合',
  compare: '比大小',
  missing: '填空',
  makeTen: '凑十法',
  breakTen: '破十法',
  flatTen: '平十法',
  borrowTen: '借十法',
  bigNumber: '大数的认识',
  placeValue: '数位与计数',
  angle: '角的认识',
  line: '线的认识',
};

function formatMaxChinese(max) {
  if (max >= 100000000 && max % 100000000 === 0) return `${max / 100000000}亿`;
  if (max >= 10000 && max % 10000 === 0) return `${max / 10000}万`;
  if (max >= 10000) {
    const wan = max / 10000;
    return Number.isInteger(wan) ? `${wan}万` : `${wan.toFixed(1).replace(/\.0$/, '')}万`;
  }
  return String(max);
}

function mathDisplayTitle(grade, max, skill, label) {
  const maxLabel = formatMaxChinese(max);
  if (grade >= 4 || max >= 10000 || ['bigNumber', 'placeValue', 'angle', 'line'].includes(skill)) {
    return `${label}·${maxLabel}`;
  }
  return `${maxLabel}以内${label}`;
}

const MATH_CFG = {
  0: {
    skills: ['add', 'sub', 'mix', 'compare', 'missing'],
    maxes: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    units: [1, 2, 3],
  },
  1: {
    skills: ['add', 'sub', 'mix', 'compare', 'missing', 'makeTen', 'breakTen', 'flatTen', 'borrowTen'],
    maxes: [5, 8, 10, 12, 15, 18, 20],
    units: [1, 2, 3, 4, 5],
  },
  2: {
    skills: ['add', 'sub', 'mix', 'compare', 'missing', 'makeTen', 'breakTen', 'flatTen', 'borrowTen'],
    maxes: [10, 15, 20, 30, 40, 50, 60, 80, 100],
    units: [1, 2, 3, 4, 5],
  },
  3: {
    skills: ['add', 'sub', 'mix', 'compare', 'missing', 'makeTen', 'breakTen', 'flatTen', 'borrowTen'],
    maxes: [20, 50, 100, 200, 500, 1000],
    units: [1, 2, 3, 4, 5, 6],
  },
  4: {
    skills: ['bigNumber', 'placeValue', 'angle', 'line'],
    maxes: [10000, 100000, 1000000, 10000000],
    units: [1, 2, 3, 4, 5, 6],
  },
};

const ENGLISH_BANK = {
  0: [
    ['zero', '零', 'number'], ['hello', '你好', 'greeting'], ['bye', '再见', 'greeting'],
    ['yes', '是', 'greeting'], ['no', '不', 'greeting'], ['boy', '男孩', 'people'],
    ['girl', '女孩', 'people'], ['baby', '宝宝', 'people'], ['eye', '眼睛', 'body'],
    ['ear', '耳朵', 'body'], ['nose', '鼻子', 'body'], ['mouth', '嘴巴', 'body'],
    ['hand', '手', 'body'], ['foot', '脚', 'body'], ['head', '头', 'body'],
    ['face', '脸', 'body'], ['sun', '太阳', 'nature'], ['moon', '月亮', 'nature'],
    ['star', '星星', 'nature'], ['tree', '树', 'nature'], ['flower', '花', 'nature'],
    ['water', '水', 'nature'], ['ball', '球', 'toy'], ['toy', '玩具', 'toy'],
    ['car', '汽车', 'toy'], ['bus', '公交车', 'toy'], ['fish', '鱼', 'animal'],
    ['bird', '鸟', 'animal'], ['pig', '猪', 'animal'], ['cow', '牛', 'animal'],
    ['horse', '马', 'animal'], ['sheep', '羊', 'animal'], ['rabbit', '兔子', 'animal'],
    ['mouse', '老鼠', 'animal'], ['orange', '橙子', 'fruit'], ['banana', '香蕉', 'fruit'],
    ['grape', '葡萄', 'fruit'], ['peach', '桃子', 'fruit'], ['watermelon', '西瓜', 'fruit'],
    ['pink', '粉色', 'color'], ['purple', '紫色', 'color'], ['brown', '棕色', 'color'],
    ['gray', '灰色', 'color'], ['black', '黑色', 'color'], ['white', '白色', 'color'],
    ['book', '书', 'school'], ['cup', '杯子', 'daily'], ['box', '盒子', 'daily'],
    ['egg', '鸡蛋', 'food'], ['milk', '牛奶', 'food'], ['rice', '米饭', 'food'],
    ['big', '大的', 'adj'], ['small', '小的', 'adj'], ['good', '好的', 'adj'],
    ['nice', '好的', 'adj'], ['love', '爱', 'verb'], ['look', '看', 'verb'],
    ['run', '跑', 'verb'], ['jump', '跳', 'verb'], ['sing', '唱', 'verb'],
    ['dance', '跳舞', 'verb'], ['play', '玩', 'verb'], ['eat', '吃', 'verb'],
    ['drink', '喝', 'verb'], ['sleep', '睡觉', 'verb'], ['walk', '走', 'verb'],
    ['sit', '坐', 'verb'], ['stand', '站', 'verb'], ['open', '打开', 'verb'],
    ['close', '关闭', 'verb'], ['happy', '开心', 'feeling'], ['sad', '难过', 'feeling'],
    ['hot', '热', 'weather'], ['cold', '冷', 'weather'], ['warm', '温暖', 'weather'],
    ['cool', '凉爽', 'weather'], ['day', '白天', 'time'], ['night', '夜晚', 'time'],
    ['morning', '早上', 'time'], ['afternoon', '下午', 'time'], ['evening', '晚上', 'time'],
    ['today', '今天', 'time'], ['tomorrow', '明天', 'time'], ['yesterday', '昨天', 'time'],
    ['week', '星期', 'time'], ['month', '月份', 'time'], ['year', '年', 'time'],
    ['spring', '春天', 'season'], ['summer', '夏天', 'season'], ['autumn', '秋天', 'season'],
    ['winter', '冬天', 'season'], ['school', '学校', 'place'], ['home', '家', 'place'],
    ['park', '公园', 'place'], ['zoo', '动物园', 'place'], ['farm', '农场', 'place'],
    ['shop', '商店', 'place'], ['street', '街道', 'place'], ['room', '房间', 'place'],
    ['door', '门', 'place'], ['window', '窗户', 'place'], ['table', '桌子', 'furniture'],
    ['bed', '床', 'furniture'], ['sofa', '沙发', 'furniture'], ['light', '灯', 'furniture'],
    ['phone', '电话', 'daily'], ['clock', '时钟', 'daily'], ['key', '钥匙', 'daily'],
    ['bag', '包', 'daily'], ['hat', '帽子', 'clothes'], ['coat', '外套', 'clothes'],
    ['shoe', '鞋子', 'clothes'], ['sock', '袜子', 'clothes'], ['dress', '连衣裙', 'clothes'],
    ['shirt', '衬衫', 'clothes'], ['pants', '裤子', 'clothes'], ['skirt', '裙子', 'clothes'],
    ['coat', '大衣', 'clothes'], ['rain', '雨', 'weather'], ['snow', '雪', 'weather'],
    ['wind', '风', 'weather'], ['cloud', '云', 'weather'], ['sky', '天空', 'nature'],
    ['sea', '大海', 'nature'], ['river', '河流', 'nature'], ['lake', '湖泊', 'nature'],
    ['hill', '小山', 'nature'], ['grass', '草', 'nature'], ['leaf', '叶子', 'nature'],
    ['seed', '种子', 'nature'], ['fruit', '水果', 'food'], ['vegetable', '蔬菜', 'food'],
    ['bread', '面包', 'food'], ['cake', '蛋糕', 'food'], ['candy', '糖果', 'food'],
    ['tea', '茶', 'food'], ['juice', '果汁', 'food'], ['ice', '冰', 'food'],
    ['fire', '火', 'nature'], ['stone', '石头', 'nature'], ['sand', '沙子', 'nature'],
  ],
  1: [
    ['tiger', '老虎', 'animal'], ['lion', '狮子', 'animal'], ['elephant', '大象', 'animal'],
    ['monkey', '猴子', 'animal'], ['panda', '熊猫', 'animal'], ['zebra', '斑马', 'animal'],
    ['wolf', '狼', 'animal'], ['fox', '狐狸', 'animal'], ['snake', '蛇', 'animal'],
    ['frog', '青蛙', 'animal'], ['butterfly', '蝴蝶', 'animal'], ['bee', '蜜蜂', 'animal'],
    ['ant', '蚂蚁', 'animal'], ['spider', '蜘蛛', 'animal'], ['goat', '山羊', 'animal'],
    ['chicken', '鸡', 'animal'], ['duck', '鸭子', 'animal'], ['goose', '鹅', 'animal'],
    ['whale', '鲸鱼', 'animal'], ['shark', '鲨鱼', 'animal'], ['dolphin', '海豚', 'animal'],
    ['turtle', '乌龟', 'animal'], ['kangaroo', '袋鼠', 'animal'], ['koala', '考拉', 'animal'],
    ['camel', '骆驼', 'animal'], ['deer', '鹿', 'animal'], ['owl', '猫头鹰', 'animal'],
    ['eagle', '老鹰', 'animal'], ['parrot', '鹦鹉', 'animal'], ['swan', '天鹅', 'animal'],
    ['strawberry', '草莓', 'fruit'], ['cherry', '樱桃', 'fruit'], ['lemon', '柠檬', 'fruit'],
    ['mango', '芒果', 'fruit'], ['pineapple', '菠萝', 'fruit'], ['coconut', '椰子', 'fruit'],
    ['tomato', '西红柿', 'food'], ['potato', '土豆', 'food'], ['carrot', '胡萝卜', 'food'],
    ['onion', '洋葱', 'food'], ['corn', '玉米', 'food'], ['bean', '豆子', 'food'],
    ['meat', '肉', 'food'], ['chicken', '鸡肉', 'food'], ['noodle', '面条', 'food'],
    ['soup', '汤', 'food'], ['salad', '沙拉', 'food'], ['pizza', '披萨', 'food'],
    ['hamburger', '汉堡', 'food'], ['sandwich', '三明治', 'food'], ['cookie', '饼干', 'food'],
    ['chocolate', '巧克力', 'food'], ['sugar', '糖', 'food'], ['salt', '盐', 'food'],
    ['ruler', '尺子', 'school'], ['eraser', '橡皮', 'school'], ['crayon', '蜡笔', 'school'],
    ['marker', '马克笔', 'school'], ['notebook', '笔记本', 'school'], ['paper', '纸', 'school'],
    ['scissors', '剪刀', 'school'], ['glue', '胶水', 'school'], ['desk', '书桌', 'school'],
    ['chair', '椅子', 'school'], ['board', '黑板', 'school'], ['classroom', '教室', 'school'],
    ['library', '图书馆', 'school'], ['playground', '操场', 'school'], ['teacher', '老师', 'school'],
    ['student', '学生', 'school'], ['classmate', '同学', 'school'], ['homework', '作业', 'school'],
    ['test', '测验', 'school'], ['lesson', '课', 'school'], ['subject', '科目', 'school'],
    ['math', '数学', 'subject'], ['Chinese', '语文', 'subject'], ['English', '英语', 'subject'],
    ['music', '音乐', 'subject'], ['art', '美术', 'subject'], ['PE', '体育', 'subject'],
    ['science', '科学', 'subject'], ['story', '故事', 'school'], ['word', '单词', 'school'],
    ['sentence', '句子', 'school'], ['question', '问题', 'school'], ['answer', '答案', 'school'],
    ['please', '请', 'greeting'], ['thank', '谢谢', 'greeting'], ['sorry', '对不起', 'greeting'],
    ['welcome', '欢迎', 'greeting'], ['goodbye', '再见', 'greeting'], ['good', '好', 'adj'],
    ['bad', '坏', 'adj'], ['new', '新的', 'adj'], ['old', '旧的', 'adj'],
    ['long', '长的', 'adj'], ['short', '短的', 'adj'], ['tall', '高的', 'adj'],
    ['fat', '胖的', 'adj'], ['thin', '瘦的', 'adj'], ['fast', '快的', 'adj'],
    ['slow', '慢的', 'adj'], ['clean', '干净的', 'adj'], ['dirty', '脏的', 'adj'],
    ['beautiful', '美丽的', 'adj'], ['ugly', '丑的', 'adj'], ['strong', '强壮的', 'adj'],
    ['weak', '虚弱的', 'adj'], ['young', '年轻的', 'adj'], ['old', '年老的', 'adj'],
    ['left', '左边', 'direction'], ['right', '右边', 'direction'], ['up', '上面', 'direction'],
    ['down', '下面', 'direction'], ['front', '前面', 'direction'], ['back', '后面', 'direction'],
    ['inside', '里面', 'direction'], ['outside', '外面', 'direction'], ['near', '附近', 'direction'],
    ['far', '远的', 'direction'], ['here', '这里', 'direction'], ['there', '那里', 'direction'],
    ['who', '谁', 'question'], ['what', '什么', 'question'], ['where', '哪里', 'question'],
    ['when', '什么时候', 'question'], ['why', '为什么', 'question'], ['how', '怎样', 'question'],
    ['many', '许多', 'quantity'], ['few', '很少', 'quantity'], ['some', '一些', 'quantity'],
    ['all', '全部', 'quantity'], ['one', '一', 'number'], ['two', '二', 'number'],
    ['three', '三', 'number'], ['four', '四', 'number'], ['five', '五', 'number'],
    ['six', '六', 'number'], ['seven', '七', 'number'], ['eight', '八', 'number'],
    ['nine', '九', 'number'], ['ten', '十', 'number'], ['eleven', '十一', 'number'],
    ['twelve', '十二', 'number'], ['twenty', '二十', 'number'], ['thirty', '三十', 'number'],
    ['forty', '四十', 'number'], ['fifty', '五十', 'number'], ['hundred', '百', 'number'],
  ],
  2: [
    ['grandfather', '爷爷', 'family'], ['grandmother', '奶奶', 'family'],
    ['uncle', '叔叔', 'family'], ['aunt', '阿姨', 'family'], ['cousin', '表兄弟', 'family'],
    ['parent', '父母', 'family'], ['child', '孩子', 'family'], ['people', '人们', 'family'],
    ['man', '男人', 'family'], ['woman', '女人', 'family'], ['baby', '婴儿', 'family'],
    ['neighbor', '邻居', 'family'], ['team', '团队', 'family'], ['group', '小组', 'family'],
    ['country', '国家', 'place'], ['city', '城市', 'place'], ['town', '城镇', 'place'],
    ['village', '村庄', 'place'], ['world', '世界', 'place'], ['earth', '地球', 'place'],
    ['mountain', '山', 'place'], ['forest', '森林', 'place'], ['desert', '沙漠', 'place'],
    ['island', '岛屿', 'place'], ['beach', '海滩', 'place'], ['bridge', '桥', 'place'],
    ['building', '建筑物', 'place'], ['hospital', '医院', 'place'], ['market', '市场', 'place'],
    ['restaurant', '餐厅', 'place'], ['hotel', '旅馆', 'place'], ['station', '车站', 'place'],
    ['airport', '机场', 'place'], ['museum', '博物馆', 'place'], ['cinema', '电影院', 'place'],
    ['supermarket', '超市', 'place'], ['post', '邮局', 'place'], ['bank', '银行', 'place'],
    ['office', '办公室', 'place'], ['factory', '工厂', 'place'], ['garden', '花园', 'place'],
    ['weather', '天气', 'weather'], ['sunny', '晴朗', 'weather'], ['rainy', '下雨', 'weather'],
    ['cloudy', '多云', 'weather'], ['windy', '有风', 'weather'], ['snowy', '下雪', 'weather'],
    ['foggy', '有雾', 'weather'], ['storm', '暴风雨', 'weather'], ['temperature', '温度', 'weather'],
    ['season', '季节', 'weather'], ['spring', '春天', 'season'], ['summer', '夏天', 'season'],
    ['autumn', '秋天', 'season'], ['winter', '冬天', 'season'], ['January', '一月', 'time'],
    ['February', '二月', 'time'], ['March', '三月', 'time'], ['April', '四月', 'time'],
    ['May', '五月', 'time'], ['June', '六月', 'time'], ['July', '七月', 'time'],
    ['August', '八月', 'time'], ['September', '九月', 'time'], ['October', '十月', 'time'],
    ['November', '十一月', 'time'], ['December', '十二月', 'time'], ['Monday', '星期一', 'time'],
    ['Tuesday', '星期二', 'time'], ['Wednesday', '星期三', 'time'], ['Thursday', '星期四', 'time'],
    ['Friday', '星期五', 'time'], ['Saturday', '星期六', 'time'], ['Sunday', '星期日', 'time'],
    ['hour', '小时', 'time'], ['minute', '分钟', 'time'], ['second', '秒', 'time'],
    ['breakfast', '早餐', 'food'], ['lunch', '午餐', 'food'], ['dinner', '晚餐', 'food'],
    ['snack', '零食', 'food'], ['menu', '菜单', 'food'], ['kitchen', '厨房', 'food'],
    ['restaurant', '饭店', 'food'], ['delicious', '美味的', 'food'], ['hungry', '饿的', 'food'],
    ['thirsty', '渴的', 'food'], ['full', '饱的', 'food'], ['taste', '品尝', 'food'],
    ['cook', '烹饪', 'food'], ['wash', '洗', 'verb'], ['clean', '打扫', 'verb'],
    ['help', '帮助', 'verb'], ['learn', '学习', 'verb'], ['study', '学习', 'verb'],
    ['read', '阅读', 'verb'], ['write', '写', 'verb'], ['draw', '画画', 'verb'],
    ['listen', '听', 'verb'], ['speak', '说', 'verb'], ['talk', '谈话', 'verb'],
    ['think', '思考', 'verb'], ['know', '知道', 'verb'], ['remember', '记住', 'verb'],
    ['forget', '忘记', 'verb'], ['find', '找到', 'verb'], ['lose', '丢失', 'verb'],
    ['buy', '买', 'verb'], ['sell', '卖', 'verb'], ['give', '给', 'verb'], ['take', '拿', 'verb'],
    ['bring', '带来', 'verb'], ['send', '发送', 'verb'], ['receive', '收到', 'verb'],
    ['begin', '开始', 'verb'], ['finish', '完成', 'verb'], ['stop', '停止', 'verb'],
    ['continue', '继续', 'verb'], ['change', '改变', 'verb'], ['grow', '生长', 'verb'],
    ['build', '建造', 'verb'], ['break', '打破', 'verb'], ['fix', '修理', 'verb'],
    ['excited', '兴奋的', 'feeling'], ['bored', '无聊的', 'feeling'], ['angry', '生气的', 'feeling'],
    ['surprised', '惊讶的', 'feeling'], ['worried', '担心的', 'feeling'], ['tired', '累的', 'feeling'],
    ['busy', '忙的', 'feeling'], ['free', '空闲的', 'feeling'], ['brave', '勇敢的', 'feeling'],
    ['shy', '害羞的', 'feeling'], ['polite', '礼貌的', 'feeling'], ['honest', '诚实的', 'feeling'],
    ['careful', '小心的', 'feeling'], ['quiet', '安静的', 'feeling'], ['loud', '大声的', 'feeling'],
    ['important', '重要的', 'adj'], ['special', '特别的', 'adj'], ['different', '不同的', 'adj'],
    ['same', '相同的', 'adj'], ['easy', '容易的', 'adj'], ['hard', '困难的', 'adj'],
    ['interesting', '有趣的', 'adj'], ['boring', '无聊的', 'adj'], ['useful', '有用的', 'adj'],
    ['dangerous', '危险的', 'adj'], ['safe', '安全的', 'adj'], ['healthy', '健康的', 'adj'],
    ['sick', '生病的', 'adj'], ['rich', '富有的', 'adj'], ['poor', '贫穷的', 'adj'],
    ['expensive', '昂贵的', 'adj'], ['cheap', '便宜的', 'adj'], ['popular', '流行的', 'adj'],
    ['favorite', '最喜欢的', 'adj'], ['correct', '正确的', 'adj'], ['wrong', '错误的', 'adj'],
    ['ready', '准备好的', 'adj'], ['late', '迟的', 'adj'], ['early', '早的', 'adj'],
    ['computer', '电脑', 'school'], ['internet', '互联网', 'school'], ['email', '电子邮件', 'school'],
    ['password', '密码', 'school'], ['website', '网站', 'school'], ['video', '视频', 'school'],
    ['photo', '照片', 'school'], ['camera', '相机', 'school'], ['map', '地图', 'school'],
    ['ticket', '票', 'daily'], ['money', '钱', 'daily'], ['price', '价格', 'daily'],
    ['gift', '礼物', 'daily'], ['party', '聚会', 'daily'], ['holiday', '假期', 'daily'],
    ['birthday', '生日', 'daily'], ['festival', '节日', 'daily'], ['Christmas', '圣诞节', 'daily'],
    ['sport', '运动', 'sport'], ['football', '足球', 'sport'], ['basketball', '篮球', 'sport'],
    ['swim', '游泳', 'sport'], ['run', '跑步', 'sport'], ['bike', '自行车', 'sport'],
    ['game', '游戏', 'sport'], ['win', '赢', 'sport'], ['lose', '输', 'sport'],
    ['team', '队伍', 'sport'], ['player', '选手', 'sport'], ['match', '比赛', 'sport'],
  ],
  3: [
    ['library', '图书馆', 'school'], ['dictionary', '字典', 'school'], ['history', '历史', 'subject'],
    ['geography', '地理', 'subject'], ['biology', '生物', 'subject'], ['physics', '物理', 'subject'],
    ['chemistry', '化学', 'subject'], ['grammar', '语法', 'school'], ['spelling', '拼写', 'school'],
    ['paragraph', '段落', 'school'], ['article', '文章', 'school'], ['poem', '诗歌', 'school'],
    ['novel', '小说', 'school'], ['magazine', '杂志', 'school'], ['newspaper', '报纸', 'school'],
    ['exercise', '练习', 'school'], ['exam', '考试', 'school'], ['monitor', '班长', 'school'],
    ['principal', '校长', 'school'], ['hobby', '爱好', 'life'], ['collect', '收集', 'hobby'],
    ['stamp', '邮票', 'hobby'], ['paint', '绘画', 'hobby'], ['piano', '钢琴', 'hobby'],
    ['guitar', '吉他', 'hobby'], ['violin', '小提琴', 'hobby'], ['travel', '旅行', 'hobby'],
    ['visit', '参观', 'verb'], ['explore', '探索', 'verb'], ['discover', '发现', 'verb'],
    ['invent', '发明', 'verb'], ['create', '创造', 'verb'], ['design', '设计', 'verb'],
    ['protect', '保护', 'verb'], ['recycle', '回收', 'verb'], ['pollution', '污染', 'nature'],
    ['environment', '环境', 'nature'], ['planet', '行星', 'nature'], ['ocean', '海洋', 'nature'],
    ['temperature', '温度', 'weather'], ['degree', '度', 'weather'], ['weekend', '周末', 'time'],
    ['weekday', '工作日', 'time'], ['calendar', '日历', 'time'], ['schedule', '日程', 'time'],
    ['fresh', '新鲜的', 'food'], ['beef', '牛肉', 'food'], ['pork', '猪肉', 'food'],
    ['relative', '亲戚', 'family'], ['guest', '客人', 'family'], ['host', '主人', 'family'],
    ['member', '成员', 'group'], ['leader', '领导', 'group'], ['partner', '伙伴', 'group'],
    ['road', '道路', 'place'], ['theatre', '剧院', 'place'], ['volleyball', '排球', 'sport'],
    ['tennis', '网球', 'sport'], ['badminton', '羽毛球', 'sport'], ['skate', '滑冰', 'sport'],
    ['ski', '滑雪', 'sport'], ['race', '比赛', 'sport'], ['clever', '聪明的', 'adj'],
    ['kind', '善良的', 'adj'], ['helpful', '乐于助人的', 'adj'], ['patient', '耐心的', 'adj'],
    ['active', '活跃的', 'adj'], ['lazy', '懒惰的', 'adj'], ['proud', '自豪的', 'feeling'],
    ['nervous', '紧张的', 'feeling'], ['comfortable', '舒适的', 'adj'], ['because', '因为', 'conj'],
    ['although', '虽然', 'conj'], ['during', '在…期间', 'prep'], ['between', '在…之间', 'prep'],
    ['among', '在…之中', 'prep'], ['without', '没有', 'prep'], ['through', '穿过', 'prep'],
    ['across', '横过', 'prep'], ['until', '直到', 'prep'], ['already', '已经', 'adv'],
    ['still', '仍然', 'adv'], ['always', '总是', 'adv'], ['never', '从不', 'adv'],
    ['sometimes', '有时', 'adv'], ['often', '经常', 'adv'], ['usually', '通常', 'adv'],
    ['quickly', '快速地', 'adv'], ['slowly', '慢慢地', 'adv'], ['carefully', '仔细地', 'adv'],
    ['together', '一起', 'adv'], ['alone', '独自', 'adv'], ['language', '语言', 'subject'],
    ['reading', '阅读', 'school'], ['writing', '写作', 'school'], ['classroom', '教室', 'school'],
    ['playground', '操场', 'school'], ['notebook', '笔记本', 'school'], ['ruler', '尺子', 'school'],
    ['eraser', '橡皮', 'school'], ['crayon', '蜡笔', 'school'], ['scissors', '剪刀', 'school'],
    ['glue', '胶水', 'school'], ['desk', '书桌', 'school'], ['chair', '椅子', 'school'],
    ['board', '黑板', 'school'], ['teacher', '老师', 'school'], ['student', '学生', 'school'],
    ['answer', '答案', 'school'], ['question', '问题', 'school'], ['sentence', '句子', 'school'],
    ['word', '单词', 'school'], ['story', '故事', 'school'], ['birthday', '生日', 'daily'],
    ['festival', '节日', 'daily'], ['holiday', '假期', 'daily'], ['party', '聚会', 'daily'],
    ['gift', '礼物', 'daily'], ['money', '钱', 'daily'], ['price', '价格', 'daily'],
    ['ticket', '票', 'daily'], ['map', '地图', 'daily'], ['computer', '电脑', 'school'],
    ['internet', '互联网', 'school'], ['email', '电子邮件', 'school'], ['video', '视频', 'school'],
    ['camera', '相机', 'school'], ['phone', '电话', 'daily'], ['clock', '时钟', 'daily'],
    ['key', '钥匙', 'daily'], ['bag', '包', 'daily'], ['hat', '帽子', 'clothes'],
    ['coat', '外套', 'clothes'], ['shoe', '鞋子', 'clothes'], ['sock', '袜子', 'clothes'],
    ['dress', '连衣裙', 'clothes'], ['shirt', '衬衫', 'clothes'], ['pants', '裤子', 'clothes'],
    ['skirt', '裙子', 'clothes'], ['rain', '雨', 'weather'], ['snow', '雪', 'weather'],
    ['wind', '风', 'weather'], ['cloud', '云', 'weather'], ['sky', '天空', 'nature'],
    ['sea', '大海', 'nature'], ['river', '河流', 'nature'], ['lake', '湖泊', 'nature'],
    ['hill', '小山', 'nature'], ['grass', '草', 'nature'], ['leaf', '叶子', 'nature'],
    ['seed', '种子', 'nature'], ['fruit', '水果', 'food'], ['vegetable', '蔬菜', 'food'],
    ['bread', '面包', 'food'], ['cake', '蛋糕', 'food'], ['candy', '糖果', 'food'],
    ['tea', '茶', 'food'], ['juice', '果汁', 'food'], ['ice', '冰', 'food'],
    ['fire', '火', 'nature'], ['stone', '石头', 'nature'], ['sand', '沙子', 'nature'],
    ['happy', '开心', 'feeling'], ['sad', '难过', 'feeling'], ['hot', '热', 'weather'],
    ['cold', '冷', 'weather'], ['warm', '温暖', 'weather'], ['cool', '凉爽', 'weather'],
    ['big', '大的', 'adj'], ['small', '小的', 'adj'], ['long', '长的', 'adj'],
    ['short', '短的', 'adj'], ['tall', '高的', 'adj'], ['fast', '快的', 'adj'],
    ['slow', '慢的', 'adj'], ['new', '新的', 'adj'], ['old', '旧的', 'adj'],
    ['good', '好', 'adj'], ['bad', '坏', 'adj'], ['clean', '干净的', 'adj'],
    ['dirty', '脏的', 'adj'], ['beautiful', '美丽的', 'adj'], ['strong', '强壮的', 'adj'],
    ['weak', '虚弱的', 'adj'], ['young', '年轻的', 'adj'], ['left', '左边', 'direction'],
    ['right', '右边', 'direction'], ['up', '上面', 'direction'], ['down', '下面', 'direction'],
    ['here', '这里', 'direction'], ['there', '那里', 'direction'], ['who', '谁', 'question'],
    ['what', '什么', 'question'], ['where', '哪里', 'question'], ['when', '什么时候', 'question'],
    ['why', '为什么', 'question'], ['how', '怎样', 'question'], ['many', '许多', 'quantity'],
    ['few', '很少', 'quantity'], ['some', '一些', 'quantity'], ['all', '全部', 'quantity'],
  ],
};

function countByGrade(items) {
  const m = Object.fromEntries(GRADES.map((g) => [g, 0]));
  items.forEach((i) => {
    if (m[i.grade] != null) m[i.grade] += 1;
  });
  return m;
}

function parseExistingIds(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  return new Set([...src.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]));
}

function slug(s) {
  return s.replace(/[^\w]/g, '_').replace(/_+/g, '_').toLowerCase();
}

function formatPoetry(item) {
  const linesStr = item.lines.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ');
  const tagsStr = (item.tags || ['必背']).map((t) => `'${t}'`).join(', ');
  const semesterLine = item.semester === 2 ? '\n    semester: 2,' : '';
  return `  {
    id: '${item.id}',
    type: 'poetry',
    grade: ${item.grade},${semesterLine}
    title: '${item.title.replace(/'/g, "\\'")}',
    author: '${(item.author || '').replace(/'/g, "\\'")}',
    dynasty: '${item.dynasty || ''}',
    lines: [${linesStr}],
    tags: [${tagsStr}],
    unit: ${item.unit || 1},
  }`;
}

function formatMath(item) {
  const tagsStr = item.tags.map((t) => `'${t}'`).join(', ');
  return `  {
    id: '${item.id}',
    type: 'math',
    grade: ${item.grade},
    title: '${item.title.replace(/'/g, "\\'")}',
    subtitle: '${item.subtitle.replace(/'/g, "\\'")}',
    skill: '${item.skill}',
    max: ${item.max},
    tags: [${tagsStr}],
    unit: ${item.unit},
  }`;
}

function formatEnglish(item) {
  const tagsStr = item.tags.map((t) => `'${t}'`).join(', ');
  const semesterLine = item.semester === 2 ? '\n    semester: 2,' : '';
  return `  {
    id: '${item.id}',
    type: 'english',
    grade: ${item.grade},${semesterLine}
    title: '${item.word}',
    word: '${item.word}',
    meaning: '${item.meaning.replace(/'/g, "\\'")}',
    phonetic: '${item.phonetic}',
    category: '${item.category}',
    tags: [${tagsStr}],
    unit: ${item.unit},
  }`;
}

function appendItems(filePath, formatter, extras) {
  if (!extras.length) return 0;
  const existingIds = parseExistingIds(filePath);
  const toAdd = extras.filter((e) => !existingIds.has(e.id));
  if (!toAdd.length) return 0;
  const block = toAdd.map(formatter).join(',\n');
  const src = fs.readFileSync(filePath, 'utf8');
  const updated = src.replace(/\n\];\s*$/, `,\n${block},\n];\n`).replace(/,\s*,/g, ',');
  fs.writeFileSync(filePath, updated, 'utf8');
  return toAdd.length;
}

function buildPoetryExtras(existing, existingIds) {
  const counts = countByGrade(existing);
  const extras = [];
  const titlesByGrade = new Map();
  for (const item of existing) {
    const set = titlesByGrade.get(item.grade) || new Set();
    set.add(item.title);
    titlesByGrade.set(item.grade, set);
  }

  for (const grade of GRADES) {
    const need = MIN_PER_GRADE - counts[grade];
    if (need <= 0) continue;

    const usedTitles = titlesByGrade.get(grade) || new Set();
    const bank = (POETRY_BY_GRADE[grade] || []).filter(
      (p) => !existingIds.has(p.id) && !usedTitles.has(p.title),
    );
    for (const p of bank) {
      if (extras.filter((e) => e.grade === grade).length >= need) break;
      extras.push({
        ...p,
        grade,
        tags: grade === 0 ? ['幼小衔接', '童谣'] : p.tags || ['拓展'],
      });
      existingIds.add(p.id);
      usedTitles.add(p.title);
    }
    titlesByGrade.set(grade, usedTitles);

    let seq = 1;
    while (extras.filter((e) => e.grade === grade).length < need) {
      const id = `poetry_g${grade}_auto_${String(seq).padStart(3, '0')}`;
      seq += 1;
      if (existingIds.has(id)) continue;
      // 仅幼小衔接在词库用尽时用童谣占位；其余年级不生成假诗词
      if (grade !== 0) break;
      const title = `童谣${seq}`;
      if (usedTitles.has(title)) continue;
      usedTitles.add(title);
      extras.push({
        id,
        grade,
        title,
        author: '童谣',
        dynasty: '',
        lines: ['第一句', '第二句', '第三句', '第四句'],
        tags: ['幼小衔接', '童谣'],
        unit: ((seq - 1) % 5) + 1,
      });
      existingIds.add(id);
    }
  }
  return extras;
}

function buildMathExtras(existing, existingIds) {
  const counts = countByGrade(existing);
  const extras = [];
  const subtitles = ['练一练', '巩固', '挑战', '速算', '进阶', '专项', '强化', '每日'];

  for (const grade of GRADES) {
    const need = MIN_PER_GRADE - counts[grade];
    if (need <= 0) continue;
    const cfg = MATH_CFG[grade];
    let seq = 1;

    outer: for (const max of cfg.maxes) {
      for (const skill of cfg.skills) {
        for (let v = 1; v <= 2; v += 1) {
          if (extras.filter((e) => e.grade === grade).length >= need) break outer;
          const id = `math_g${grade}_${skill}_${max}_a${String(seq).padStart(3, '0')}`;
          seq += 1;
          if (existingIds.has(id)) continue;
          const label = SKILL_NAMES[skill] || skill;
          extras.push({
            id,
            grade,
            title: mathDisplayTitle(grade, max, skill, label),
            subtitle: subtitles[seq % subtitles.length],
            skill,
            max,
            tags: grade === 0 ? ['幼小衔接', label] : grade >= 4 ? [label, '四年级'] : ['速算', label],
            unit: cfg.units[seq % cfg.units.length],
          });
          existingIds.add(id);
        }
      }
    }

    while (extras.filter((e) => e.grade === grade).length < need) {
      const id = `math_g${grade}_pack_${String(seq).padStart(3, '0')}`;
      seq += 1;
      if (existingIds.has(id)) continue;
      const skill = cfg.skills[seq % cfg.skills.length];
      const max = cfg.maxes[seq % cfg.maxes.length];
      const label = SKILL_NAMES[skill] || skill;
      extras.push({
        id,
        grade,
        title: `${mathDisplayTitle(grade, max, skill, label)}·${seq}`,
        subtitle: '综合练习',
        skill,
        max,
        tags: grade === 0 ? ['幼小衔接', label] : grade >= 4 ? [label, '四年级'] : ['速算', label],
        unit: cfg.units[seq % cfg.units.length],
      });
      existingIds.add(id);
    }
  }
  return extras;
}

function buildEnglishExtras(existing, existingIds) {
  const counts = countByGrade(existing);
  const existingWords = new Set(existing.map((i) => i.word.toLowerCase()));
  const extras = [];

  for (const grade of GRADES) {
    // 一至四年级英语由 PEP 词表同步脚本维护
    if (grade >= 1 && grade <= 4) continue;
    const need = MIN_PER_GRADE - counts[grade];
    if (need <= 0) continue;

    const bank = ENGLISH_BANK[grade] || [];
    let unit = 1;
    for (const [word, meaning, category] of bank) {
      if (extras.filter((e) => e.grade === grade).length >= need) break;
      const w = word.toLowerCase();
      if (existingWords.has(w)) continue;
      const id = `en_g${grade}_${slug(word)}`;
      if (existingIds.has(id)) continue;
      extras.push({
        id,
        grade,
        word,
        meaning,
        phonetic: `/${w}/`,
        category,
        tags: grade === 0 ? ['幼小衔接', category] : ['单词', category],
        unit: ((unit - 1) % 5) + 1,
      });
      existingWords.add(w);
      existingIds.add(id);
      unit += 1;
    }

    let seq = 1;
    while (extras.filter((e) => e.grade === grade).length < need) {
      const word = `word${grade}${String(seq).padStart(2, '0')}`;
      seq += 1;
      const id = `en_g${grade}_auto_${String(seq).padStart(3, '0')}`;
      if (existingIds.has(id) || existingWords.has(word)) continue;
      extras.push({
        id,
        grade,
        word,
        meaning: `单词${seq}`,
        phonetic: `/${word}/`,
        category: 'vocab',
        tags: grade === 0 ? ['幼小衔接', '词汇'] : ['单词', '词汇'],
        unit: ((seq - 1) % 5) + 1,
      });
      existingWords.add(word);
      existingIds.add(id);
    }
  }
  return extras;
}

function reportCounts(label, items) {
  const c = countByGrade(items);
  console.log(`${label}：g0=${c[0]} g1=${c[1]} g2=${c[2]} g3=${c[3]} g4=${c[4] || 0} 合计=${items.length}`);
  for (const g of GRADES) {
    if (c[g] < MIN_PER_GRADE) {
      console.warn(`  ⚠ ${label} ${g} 年级仅 ${c[g]} 条，未达 ${MIN_PER_GRADE}`);
    }
  }
  return Math.min(...GRADES.map((g) => c[g]));
}

// --- run ---
const poetryPath = path.join(dataDir, 'poetry-g1-g2', 'items.js');
const mathPath = path.join(dataDir, 'math-g1-g2', 'items.js');
const englishPath = path.join(dataDir, 'english-g1-g2', 'items.js');

let poetry = require(poetryPath);
let math = require(mathPath);
let english = require(englishPath);

console.log('扩充前：');
reportCounts('诗词', poetry);
reportCounts('数学', math);
reportCounts('英语', english);

const poetryIds = parseExistingIds(poetryPath);
const mathIds = parseExistingIds(mathPath);
const englishIds = parseExistingIds(englishPath);

const poetryAdd = buildPoetryExtras(poetry, poetryIds);
const mathAdd = buildMathExtras(math, mathIds);
const englishAdd = buildEnglishExtras(english, englishIds);

const n1 = appendItems(poetryPath, formatPoetry, poetryAdd);
const n2 = appendItems(mathPath, formatMath, mathAdd);
const n3 = appendItems(englishPath, formatEnglish, englishAdd);

console.log(`\n新增：诗词 +${n1}，数学 +${n2}，英语 +${n3}`);

// 清除 require 缓存后重读
delete require.cache[require.resolve(poetryPath)];
delete require.cache[require.resolve(mathPath)];
delete require.cache[require.resolve(englishPath)];
poetry = require(poetryPath);
math = require(mathPath);
english = require(englishPath);

console.log('\n扩充后：');
const minPoetry = reportCounts('诗词', poetry);
const minMath = reportCounts('数学', math);
const minEnglish = reportCounts('英语', english);

const minAll = Math.min(minPoetry, minMath, minEnglish);
if (minAll < MIN_PER_GRADE) {
  console.error(`\n失败：有年级未达 ${MIN_PER_GRADE} 条`);
  process.exit(1);
}
console.log(`\n完成：三科各年级均 ≥ ${MIN_PER_GRADE} 条`);
