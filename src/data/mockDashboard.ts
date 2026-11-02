import type { DashboardContent } from '../types/dashboard'

// Stage one uses the Figma example content. Replace this data at the page boundary
// when backend endpoints become available; display components do not fetch data.
export const mockDashboard: DashboardContent = {
  header: {
    title: '安徽农业大学图书馆',
    subtitle: '大数据综合展示平台',
    logo: { id: 'university', src: '/assets/figma/university-logo.png', alt: '安徽农业大学 Anhui Agricultural University' },
    weather: { temperature: 24, description: '晴', airQuality: '空气优' },
  },
  books: {
    title: '图书借阅排行', unit: '借阅量',
    items: [
      { id: 'sapiens', name: '人类简史', value: 87 },
      { id: 'solitude', name: '百年孤独', value: 84 },
      { id: 'ordinary-world', name: '平凡的世界', value: 65 },
      { id: 'fortress', name: '围城', value: 42 },
      { id: 'moon', name: '月亮与六便士', value: 25 },
    ],
  },
  readers: {
    title: '读者借阅排行', unit: '借阅量',
    items: [
      { id: 'reader-1', name: '张三', value: 15, color: '#e71351' },
      { id: 'reader-2', name: '李四', value: 20, color: '#00174d' },
      { id: 'reader-3', name: '王五', value: 11, color: '#f6eac7' },
    ],
  },
  statistics: {
    title: '借阅及到馆趋势',
    items: [
      { id: 'weekly-loans', label: '本周借阅数', value: 24680, unit: '册', note: '+8.6%' },
      { id: 'weekly-visits', label: '本周到馆数', value: 31204, unit: '人', note: '+12.4%' },
      // Kept verbatim from Figma; confirm this metric label/unit with the data owner.
      { id: 'annual-total', label: '累计到馆数', value: 1268905, unit: '册', note: '年度累计', italic: true },
      { id: 'historical-visits', label: '历史到馆数', value: 3856291, unit: '人', note: '自2026年', italic: true },
    ],
  },
  hero: { id: 'spring', src: '/assets/figma/campus-spring.png', alt: '樱花盛开的安徽农业大学校园' },
  activity: {
    title: '活动展示',
    image: { id: 'reading', src: '/assets/figma/reading-activity.png', alt: '书韵流香，新书分享，读者荐购活动海报' },
  },
  searches: {
    title: '热门检索词',
    items: [
      { id: 'ai', name: '人工智能', value: 100, color: '#31590b' },
      { id: 'data', name: '数据分析', value: 86, color: '#16499a' },
      { id: 'literature', name: '古典文学', value: 76, color: '#0b7f92' },
      { id: 'python', name: 'Python', value: 70, color: '#7138a4' },
      { id: 'exam', name: '考研', value: 61, color: '#892811' },
      { id: 'agriculture', name: '智慧农业', value: 58, color: '#b46013' },
      { id: 'tea', name: '茶学', value: 55, color: '#118d83' },
      { id: 'sci', name: 'SCI', value: 52, color: '#892811' },
      { id: 'plants', name: '植物学', value: 48, color: '#0b7f92' },
      { id: 'economics', name: '经济学', value: 44, color: '#16499a' },
      { id: 'history', name: '中国历史', value: 40, color: '#31590b' },
      { id: 'environment', name: '生态环境', value: 37, color: '#7138a4' },
      { id: 'literature-search', name: '文献检索', value: 34, color: '#a32b64' },
      { id: 'novel', name: '百年孤独', value: 31, color: '#892811' },
      { id: 'english', name: '大学英语', value: 28, color: '#b46013' },
      { id: 'biology', name: '生物技术', value: 25, color: '#118d83' },
      { id: 'machine', name: '机器学习', value: 22, color: '#16499a' },
      { id: 'psychology', name: '心理学', value: 20, color: '#7138a4' },
      { id: 'soil', name: '土壤学', value: 18, color: '#31590b' },
      { id: 'food', name: '食品科学', value: 16, color: '#0b7f92' },
      { id: 'math', name: '高等数学', value: 14, color: '#a32b64' },
      { id: 'rural', name: '乡村振兴', value: 12, color: '#b46013' },
      { id: 'database', name: '数据库', value: 10, color: '#16499a' },
      { id: 'translation', name: '翻译', value: 8, color: '#31590b' },
    ],
  },
  newBooks: {
    title: '新书通报',
    // The design supplies a screenshot for this slot. Keep its original asset
    // in stage one; structured new-book records can replace it in a later task.
    image: { id: 'new-books', src: '/assets/figma/new-books.png', alt: '新书通报列表：中国特色建筑、软件项目管理、移动通信、Python算法入门与大型模型' },
  },
  notices: {
    title: '通知',
    background: { id: 'library-winter', src: '/assets/figma/notice-background.png', alt: '' },
    items: [
      { id: 'seats', content: '入馆请不要随意占座，随意在馆内留置个人物品，爱护图书馆公共设备设施' },
      { id: 'holidays', content: '寒暑假期间，图书馆会根据实际情况设置延期还书时限以方便读者' },
      { id: 'periodicals', content: '馆藏现刊、过刊、报纸，不提供外借服务，只能在馆内查阅' },
    ],
  },
}
